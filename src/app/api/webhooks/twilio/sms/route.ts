import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendSMS } from '@/lib/twilio';
import { generateAIResponse, updateConversationMemory } from '@/lib/openai';
import twilio from 'twilio';

// Twilio signature validation
const validateTwilioSignature = (request: NextRequest, body: string): boolean => {
  const signature = request.headers.get('X-Twilio-Signature');
  const url = request.url;

  if (!signature || !process.env.TWILIO_AUTH_TOKEN) {
    return false;
  }

  // Parse body as URLSearchParams
  const params: Record<string, string> = {};
  new URLSearchParams(body).forEach((value, key) => {
    params[key] = value;
  });

  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    url,
    params
  );
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Validate Twilio signature in production
    if (process.env.NODE_ENV === 'production') {
      const isValid = validateTwilioSignature(request, body);
      if (!isValid) {
        console.error('Invalid Twilio signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    const params = new URLSearchParams(body);
    const from = params.get('From');
    const to = params.get('To');
    const messageBody = params.get('Body');
    const messageSid = params.get('MessageSid');

    if (!from || !messageBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Find workspace by Twilio number
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('twilio_phone_number', to)
      .single();

    if (wsError || !workspace) {
      // Try default number
      if (to !== process.env.TWILIO_PHONE_NUMBER) {
        console.error('Workspace not found for number:', to);
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
      // Handle default number differently if needed
    }

    // Find lead by phone
    const cleanPhone = from.replace(/\D/g, '');
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', workspace?.id)
      .or(`phone.ilike.%${cleanPhone.slice(-10)}%,phone.ilike.%${cleanPhone}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (leadError || !lead) {
      console.log('Lead not found for phone:', from);
      // Could create a new lead here if desired
      return NextResponse.json({ message: 'Lead not found, ignoring' });
    }

    // Log inbound message
    await supabase.from('conversations').insert({
      workspace_id: workspace!.id,
      lead_id: lead.id,
      channel: 'sms',
      direction: 'inbound',
      content: messageBody,
      ai_generated: false,
      status: 'delivered',
      external_id: messageSid,
    });

    // Check for opt-out
    const optOutKeywords = ['stop', 'unsubscribe', 'cancel', 'quit'];
    if (optOutKeywords.some(kw => messageBody.toLowerCase().includes(kw))) {
      // Mark lead as unresponsive and stop follow-ups
      await supabase
        .from('leads')
        .update({ status: 'unresponsive' })
        .eq('id', lead.id);

      await supabase
        .from('followup_queue')
        .update({ is_active: false })
        .eq('lead_id', lead.id);

      await sendSMS({
        workspace: workspace!,
        to: from,
        message: 'You have been unsubscribed. Reply START to re-subscribe.',
      });

      return NextResponse.json({ message: 'User opted out' });
    }

    // Check for booking intent
    const bookingKeywords = ['yes', 'book', 'interested', 'schedule', 'appointment', 'call'];
    const hasBookingIntent = bookingKeywords.some(kw =>
      messageBody.toLowerCase().includes(kw)
    );

    // Get conversation memory
    const { data: memory } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('lead_id', lead.id)
      .single();

    // Get recent messages for context
    const { data: recentMessages } = await supabase
      .from('conversations')
      .select('direction, content')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Generate AI response
    if (workspace!.ai_enabled) {
      try {
        const context = {
          workspace: workspace!,
          lead,
          memory: memory || null,
          recentMessages: (recentMessages || [])
            .reverse()
            .map(m => ({
              role: m.direction === 'inbound' ? 'user' as const : 'assistant' as const,
              content: m.content,
            })),
        };

        const aiResult = await generateAIResponse(context, messageBody, 'sms');

        // Send response
        const smsResult = await sendSMS({
          workspace: workspace!,
          to: from,
          message: aiResult.response,
        });

        // Log outbound message
        await supabase.from('conversations').insert({
          workspace_id: workspace!.id,
          lead_id: lead.id,
          channel: 'sms',
          direction: 'outbound',
          content: aiResult.response,
          ai_generated: true,
          status: smsResult.success ? 'sent' : 'failed',
          external_id: smsResult.messageId,
        });

        // Update memory
        const updatedMemory = await updateConversationMemory(
          memory || null,
          messageBody,
          aiResult.response,
          lead
        );

        await supabase.from('conversation_memory').upsert({
          workspace_id: workspace!.id,
          lead_id: lead.id,
          ...updatedMemory,
          updated_at: new Date().toISOString(),
        });

        // Update lead status based on action
        if (aiResult.bookingSuggested || hasBookingIntent) {
          await supabase
            .from('leads')
            .update({
              status: 'qualified',
              is_qualified: true,
            })
            .eq('id', lead.id);

          // Stop follow-ups
          await supabase
            .from('followup_queue')
            .update({ is_active: false })
            .eq('lead_id', lead.id);
        }

        // Increment messages used
        await supabase.rpc('increment_messages_used', {
          p_workspace_id: workspace!.id,
        });

        // Update last contacted
        await supabase
          .from('leads')
          .update({ last_contacted_at: new Date().toISOString() })
          .eq('id', lead.id);
      } catch (error) {
        console.error('AI response error:', error);
        // Send fallback message
        await sendSMS({
          workspace: workspace!,
          to: from,
          message: 'Thanks for your message! A team member will get back to you shortly.',
        });
      }
    }

    // Log webhook
    await supabase.from('webhook_logs').insert({
      workspace_id: workspace!.id,
      source: 'twilio',
      event_type: 'sms_received',
      payload: { from, to, body: messageBody, messageSid },
      processed: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Twilio webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
