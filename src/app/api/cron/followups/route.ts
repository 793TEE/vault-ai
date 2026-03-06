import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendSMS } from '@/lib/twilio';
import { sendEmail } from '@/lib/sendgrid';
import { generateFollowUpMessage } from '@/lib/openai';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// This endpoint should be called by Vercel Cron or similar
// Add to vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/cron/followups",
//       "schedule": "*/5 * * * *"
//     }
//   ]
// }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const now = new Date().toISOString();

    // Get due follow-ups
    const { data: dueFollowups, error } = await supabase
      .from('followup_queue')
      .select(`
        *,
        leads (*),
        followup_sequences (*),
        workspaces:workspace_id (*)
      `)
      .eq('is_active', true)
      .lte('next_send_at', now)
      .limit(50);

    if (error) throw error;

    console.log(`Processing ${dueFollowups?.length || 0} follow-ups`);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      completed: 0,
    };

    for (const followup of dueFollowups || []) {
      results.processed++;

      try {
        const workspace = followup.workspaces;
        const lead = followup.leads;
        const sequence = followup.followup_sequences;
        const steps = sequence.steps as any[];
        const currentStep = steps[followup.current_step];

        if (!currentStep || !workspace || !lead) {
          // No more steps or missing data, mark as completed
          await supabase
            .from('followup_queue')
            .update({
              is_active: false,
              completed_at: now,
            })
            .eq('id', followup.id);
          results.completed++;
          continue;
        }

        // Check message limits
        if (workspace.messages_used >= workspace.messages_limit) {
          console.log(`Workspace ${workspace.id} hit message limit`);
          continue;
        }

        // Generate message
        const message = await generateFollowUpMessage(
          workspace,
          lead,
          followup.current_step + 1,
          currentStep.channel
        );

        // Replace template variables
        const personalizedMessage = message
          .replace(/{name}/g, lead.name.split(' ')[0])
          .replace(/{full_name}/g, lead.name)
          .replace(/{service}/g, lead.service_interested || 'our services')
          .replace(/{booking_link}/g, workspace.booking_link || '');

        // Send via email only (FREE mode - no SMS costs)
        let success = false;

        const result = await sendEmail({
          workspace,
          to: lead.email,
          subject: currentStep.subject || `Following up - ${workspace.name}`,
          text: personalizedMessage,
        });
        success = result.success;

        // Log conversation
        await supabase.from('conversations').insert({
          workspace_id: workspace.id,
          lead_id: lead.id,
          channel: 'email',
          direction: 'outbound',
          content: personalizedMessage,
          ai_generated: true,
          status: success ? 'sent' : 'failed',
        });

        if (success) {
          results.sent++;

          // Increment messages used
          await supabase.rpc('increment_messages_used', {
            p_workspace_id: workspace.id,
          });

          // Update lead
          await supabase
            .from('leads')
            .update({
              last_contacted_at: now,
              followup_count: lead.followup_count + 1,
            })
            .eq('id', lead.id);
        } else {
          results.failed++;
        }

        // Schedule next step or complete
        const nextStepIndex = followup.current_step + 1;
        if (nextStepIndex < steps.length) {
          const nextStep = steps[nextStepIndex];
          const nextSendAt = new Date();
          nextSendAt.setHours(nextSendAt.getHours() + nextStep.delay_hours);

          await supabase
            .from('followup_queue')
            .update({
              current_step: nextStepIndex,
              next_send_at: nextSendAt.toISOString(),
            })
            .eq('id', followup.id);
        } else {
          // Sequence complete
          await supabase
            .from('followup_queue')
            .update({
              is_active: false,
              completed_at: now,
            })
            .eq('id', followup.id);

          // Mark lead as unresponsive if no booking
          if (lead.status !== 'booked' && lead.status !== 'qualified') {
            await supabase
              .from('leads')
              .update({ status: 'unresponsive' })
              .eq('id', lead.id);
          }

          results.completed++;
        }
      } catch (err) {
        console.error(`Error processing followup ${followup.id}:`, err);
        results.failed++;
      }
    }

    console.log('Follow-up results:', results);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Cron followups error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
