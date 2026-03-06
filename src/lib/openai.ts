import OpenAI from 'openai';
import type { Workspace, Lead, ConversationMemory, AITone } from '@/types/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIContext {
  workspace: Workspace;
  lead: Lead;
  memory: ConversationMemory | null;
  recentMessages: { role: 'user' | 'assistant'; content: string }[];
}

function getToneInstructions(tone: AITone): string {
  const tones = {
    professional: 'Be professional, courteous, and business-focused. Use proper grammar and maintain a respectful tone.',
    friendly: 'Be warm, approachable, and conversational. Use a friendly tone while staying professional.',
    casual: 'Be relaxed and casual. Use conversational language, contractions, and a laid-back style.',
    aggressive: 'Be direct, assertive, and action-oriented. Create urgency and push for decisions without being rude.',
  };
  return tones[tone] || tones.professional;
}

function buildSystemPrompt(workspace: Workspace): string {
  const toneInstructions = getToneInstructions(workspace.ai_tone);

  let basePrompt = `You are an AI assistant for ${workspace.name}. Your role is to engage with potential clients, qualify leads, handle objections, and guide them to book appointments.

TONE: ${toneInstructions}

BOOKING LINK: ${workspace.booking_link || '[Ask admin to set booking link]'}

${workspace.ai_system_prompt || ''}

OFFER DETAILS:
${workspace.ai_offer_details || 'We offer premium services tailored to your needs.'}

PRICING INFORMATION:
${workspace.ai_pricing_info || 'Contact us for a custom quote based on your specific requirements.'}

OBJECTION HANDLING GUIDELINES:
${workspace.ai_objection_handling || `
- If they say it's too expensive: Emphasize the value and ROI they'll receive
- If they need to think about it: Create gentle urgency and offer to answer any questions
- If they're not interested: Ask what would make our service valuable to them
- If they're busy: Offer flexible scheduling options
`}

CONVERSATION RULES:
1. Always be helpful and focused on solving their problems
2. Ask qualifying questions naturally (budget, timeline, decision-maker)
3. When they show interest in booking, immediately provide the booking link
4. Keep messages concise - under 160 characters for SMS, 2-3 paragraphs max for email
5. If they express clear interest (words like "yes", "book", "interested", "schedule"), provide the booking link
6. Track and remember key details they share
7. Never be pushy or spammy
8. If they ask to stop or unsubscribe, acknowledge and stop immediately

IMPORTANT: When the conversation indicates they want to book, ALWAYS include the booking link in your response.`;

  return basePrompt;
}

export async function generateAIResponse(
  context: AIContext,
  userMessage: string,
  channel: 'sms' | 'email'
): Promise<{
  response: string;
  action: 'book' | 'qualify' | 'followup' | 'escalate' | 'stop' | null;
  bookingSuggested: boolean;
}> {
  const { workspace, lead, memory, recentMessages } = context;

  const systemPrompt = buildSystemPrompt(workspace);

  // Build context about the lead
  let leadContext = `
LEAD INFORMATION:
- Name: ${lead.name}
- Email: ${lead.email}
- Phone: ${lead.phone}
- Service Interested In: ${lead.service_interested || 'Not specified'}
- Notes: ${lead.notes || 'None'}
- Status: ${lead.status}
- Follow-up Count: ${lead.followup_count}
`;

  if (memory) {
    leadContext += `
CONVERSATION MEMORY:
- Summary: ${memory.summary}
- Key Points: ${memory.key_points.join(', ')}
- Objections Raised: ${memory.objections.join(', ') || 'None'}
- Interests: ${memory.interests.join(', ') || 'Not clear yet'}
`;
  }

  // Channel-specific instructions
  const channelInstructions = channel === 'sms'
    ? '\n\nIMPORTANT: This is an SMS conversation. Keep your response under 160 characters if possible, max 320 characters. Be concise and direct.'
    : '\n\nThis is an email conversation. You can be more detailed but still keep it focused and scannable.';

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt + leadContext + channelInstructions },
    ...recentMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: channel === 'sms' ? 100 : 500,
      response_format: { type: 'json_object' },
    });

    // Parse structured response
    const responseText = completion.choices[0]?.message?.content || '';

    // Try to parse as JSON for structured actions
    try {
      const parsed = JSON.parse(responseText);
      return {
        response: parsed.message || parsed.response || responseText,
        action: parsed.action || null,
        bookingSuggested: parsed.booking_suggested || responseText.toLowerCase().includes(workspace.booking_link || 'book'),
      };
    } catch {
      // If not JSON, use plain text response
      const bookingKeywords = ['book', 'schedule', 'appointment', 'calendar', workspace.booking_link || ''].filter(Boolean);
      const bookingSuggested = bookingKeywords.some(kw => responseText.toLowerCase().includes(kw.toLowerCase()));

      // Detect action from content
      let action: 'book' | 'qualify' | 'followup' | 'escalate' | 'stop' | null = null;
      if (bookingSuggested) action = 'book';
      else if (responseText.includes('?')) action = 'qualify';

      return {
        response: responseText,
        action,
        bookingSuggested,
      };
    }
  } catch (error) {
    console.error('OpenAI Error:', error);
    throw new Error('Failed to generate AI response');
  }
}

export async function generateFollowUpMessage(
  workspace: Workspace,
  lead: Lead,
  followUpNumber: number,
  channel: 'sms' | 'email'
): Promise<string> {
  const systemPrompt = `You are writing follow-up message #${followUpNumber} for ${workspace.name}.

Lead: ${lead.name}
Service Interest: ${lead.service_interested || 'General inquiry'}
Previous Contact Attempts: ${followUpNumber - 1}

${getToneInstructions(workspace.ai_tone)}

BOOKING LINK: ${workspace.booking_link || '[No link set]'}

Write a ${channel === 'sms' ? 'brief SMS (under 160 chars)' : 'short email'} follow-up that:
${followUpNumber === 1 ? '- Politely checks in and reiterates value' : ''}
${followUpNumber === 2 ? '- Creates mild urgency, mentions limited availability' : ''}
${followUpNumber === 3 ? '- Final gentle follow-up, offers easy next step' : ''}
${followUpNumber >= 4 ? '- Brief check-in, respects their time' : ''}

Keep it natural and not pushy.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.8,
      max_tokens: channel === 'sms' ? 80 : 300,
    });

    return completion.choices[0]?.message?.content || 'Hi! Just following up on your inquiry. Let me know if you have any questions!';
  } catch (error) {
    console.error('OpenAI Follow-up Error:', error);
    // Fallback messages
    const fallbacks = {
      1: `Hi ${lead.name}! Just checking in about your inquiry. Any questions I can help with?`,
      2: `Hey ${lead.name}! Wanted to make sure you saw my last message. Spots are filling up - shall I save one for you?`,
      3: `Hi ${lead.name}, this is my last follow-up. If you're still interested, I'd love to help. Otherwise, no worries!`,
    };
    return fallbacks[followUpNumber as keyof typeof fallbacks] || fallbacks[3];
  }
}

export async function updateConversationMemory(
  currentMemory: ConversationMemory | null,
  newMessage: string,
  aiResponse: string,
  lead: Lead
): Promise<Partial<ConversationMemory>> {
  const prompt = `Analyze this conversation exchange and update the memory.

Previous Memory:
${currentMemory ? JSON.stringify(currentMemory) : 'No previous memory'}

New User Message: "${newMessage}"
AI Response: "${aiResponse}"

Return JSON with:
{
  "summary": "Updated brief summary of the conversation so far",
  "key_points": ["Array of important details mentioned"],
  "objections": ["Any objections or concerns raised"],
  "interests": ["What they're interested in"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Memory update error:', error);
  }

  return {
    summary: `Lead ${lead.name} - ${lead.service_interested || 'general inquiry'}`,
    key_points: [],
    objections: [],
    interests: [lead.service_interested || 'unknown'],
  };
}
