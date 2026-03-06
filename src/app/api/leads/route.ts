import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { sendSMS } from '@/lib/twilio';
import { sendWelcomeEmail } from '@/lib/sendgrid';
import { generateAIResponse } from '@/lib/openai';
import type { LeadCapturePayload, Workspace } from '@/types/database';

// GET /api/leads - Get leads for workspace
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: leads, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ leads, total: count });
  } catch (error: any) {
    console.error('Get leads error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/leads - Create new lead (public endpoint for form submissions)
export async function POST(request: NextRequest) {
  try {
    const body: LeadCapturePayload & { workspaceId: string } = await request.json();
    const { workspaceId, name, email, phone, service_interested, notes, source } = body;

    if (!workspaceId || !name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, name, email, phone' },
        { status: 400 }
      );
    }

    // Use service role client for public endpoint
    const supabase = createServiceRoleClient();

    // Get workspace
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Invalid workspace' }, { status: 404 });
    }

    // Check message limits
    if (workspace.messages_used >= workspace.messages_limit) {
      return NextResponse.json({ error: 'Message limit reached' }, { status: 429 });
    }

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        workspace_id: workspaceId,
        name,
        email,
        phone,
        service_interested,
        notes,
        source: source || 'website_form',
        status: 'new',
      })
      .select()
      .single();

    if (leadError) throw leadError;

    // Send immediate AI response (Email only - FREE mode)
    if (workspace.ai_enabled) {
      // Send welcome email (FREE with SendGrid)
      await sendWelcomeEmail(workspace, { name, email });

      // Log email
      await supabase.from('conversations').insert({
        workspace_id: workspaceId,
        lead_id: lead.id,
        channel: 'email',
        direction: 'outbound',
        content: 'Welcome email sent',
        ai_generated: true,
        status: 'sent',
      });

      // Update lead status
      await supabase
        .from('leads')
        .update({
          status: 'contacted',
          last_contacted_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      // Increment messages used
      await supabase.rpc('increment_messages_used', { p_workspace_id: workspaceId });

      // Schedule follow-up
      const { data: defaultSequence } = await supabase
        .from('followup_sequences')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (defaultSequence) {
        const firstStep = defaultSequence.steps[0];
        const nextSendAt = new Date();
        nextSendAt.setHours(nextSendAt.getHours() + (firstStep?.delay_hours || 24));

        await supabase.from('followup_queue').insert({
          workspace_id: workspaceId,
          lead_id: lead.id,
          sequence_id: defaultSequence.id,
          current_step: 0,
          next_send_at: nextSendAt.toISOString(),
        });
      }
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      workspace_id: workspaceId,
      event_type: 'lead_captured',
      event_data: {
        lead_id: lead.id,
        source: source || 'website_form',
        service: service_interested,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! We will be in touch shortly.',
      lead_id: lead.id,
    });
  } catch (error: any) {
    console.error('Create lead error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateInitialMessage(workspace: Workspace, lead: any): Promise<string> {
  // Create a simple welcome message
  const businessName = workspace.name;
  const leadName = lead.name.split(' ')[0]; // First name only

  // Use AI to generate personalized message
  try {
    const context = {
      workspace,
      lead,
      memory: null,
      recentMessages: [],
    };

    const result = await generateAIResponse(
      context,
      `New lead just submitted a form. Their name is ${lead.name} and they're interested in: ${lead.service_interested || 'your services'}. Send a warm, brief welcome SMS.`,
      'sms'
    );

    return result.response;
  } catch (error) {
    // Fallback message
    return `Hi ${leadName}! Thanks for reaching out to ${businessName}. We received your inquiry and will be in touch shortly. Feel free to reply with any questions!`;
  }
}
