import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, messages, visitorName, visitorEmail } = await request.json();

    if (!workspaceId || !messages?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch workspace settings
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('name, ai_tone, ai_system_prompt, ai_offer_details, ai_pricing_info, ai_objection_handling, booking_link')
      .eq('id', workspaceId)
      .single();

    if (error || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const toneMap: Record<string, string> = {
      professional: 'Be professional, courteous, and business-focused.',
      friendly: 'Be warm, approachable, and conversational.',
      casual: 'Be relaxed and casual. Use conversational language.',
      aggressive: 'Be direct, assertive, and action-oriented. Create urgency.',
    };
    const tone = toneMap[workspace.ai_tone] || toneMap.friendly;

    const systemPrompt = `You are an AI assistant for ${workspace.name}. Your role is to engage with potential clients, qualify leads, and guide them to book appointments.

TONE: ${tone}

${workspace.ai_system_prompt || ''}

OFFER DETAILS:
${workspace.ai_offer_details || 'We offer premium services tailored to your needs.'}

PRICING:
${workspace.ai_pricing_info || 'Contact us for a custom quote.'}

OBJECTION HANDLING:
${workspace.ai_objection_handling || 'Emphasize value, create gentle urgency, offer flexible scheduling.'}

BOOKING LINK: ${workspace.booking_link || 'Ask the team for scheduling options.'}

VISITOR: ${visitorName || 'Visitor'}${visitorEmail ? ` (${visitorEmail})` : ''}

RULES:
1. Keep responses concise (2-4 sentences max).
2. Ask qualifying questions naturally.
3. When they want to book, always include the booking link.
4. Never be pushy or spammy.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const reply = completion.choices[0]?.message?.content || "I'm here to help! What can I assist you with today?";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('AI chat error:', err);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
