export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { isAdmin } from '@/lib/admin/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Category =
  | 'credit_repair'
  | 'business_credit'
  | 'llc_formation'
  | 'business_funding'
  | 'vault_ai'
  | 'general';

const CATEGORY_GUIDANCE: Record<Category, string> = {
  credit_repair:
    'Credit repair tips, new FCRA laws, credit bureau updates, dispute strategies, data breaches affecting credit scores, consumer protection news.',
  business_credit:
    'Business credit building strategies, new business credit products and cards, Dun & Bradstreet updates, PAYDEX score tips, vendor tradelines.',
  llc_formation:
    'LLC news and formation tips, state law changes affecting small businesses, tax advantages for LLC owners, registered agent updates, compliance deadlines.',
  business_funding:
    'SBA loan updates, new business funding programs, grant opportunities for entrepreneurs, alternative lending news, revenue-based financing options.',
  vault_ai:
    'Vault AI platform updates and new features, AI automation tips for business owners, lead conversion strategies, CRM best practices, chatbot optimization.',
  general:
    'A curated mix of credit repair tips, business credit advice, LLC/business formation news, funding opportunities, and AI automation insights.',
};

const SYSTEM_PROMPT = `You are a newsletter writer for His Secret Vault, a premium credit repair and business services company. Write engaging, valuable newsletter content. Return JSON with: { "subject": "compelling subject line", "preview_text": "short preview (50 chars)", "html_content": "full HTML email body" }

The HTML should be styled dark theme, professional, mobile-friendly. Include:
- Header with His Secret Vault branding (dark background #1a1a2e, gold accent #c9a227)
- Main content section
- A call to action button linking to https://hissecretvault.net
- Unsubscribe link: https://my-vaultais.vercel.app/api/newsletter?action=unsubscribe&email={{email}}
- Footer with company info`;

export async function POST(request: NextRequest) {
  try {
    // Admin-only endpoint
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category = 'general', topic = '' } = await request.json();

    const guidance = CATEGORY_GUIDANCE[category as Category] || CATEGORY_GUIDANCE.general;

    const topicLine = topic
      ? `\n\nSpecific topic to cover: ${topic}`
      : '';

    const userPrompt = `Write a newsletter email for the following category: ${guidance}${topicLine}

Make it informative, actionable, and engaging. Include 2-3 main content sections with real, helpful information. The tone should be professional yet approachable — like a trusted advisor sharing insider knowledge.

Return valid JSON only.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.75,
      max_tokens: 2500,
    });

    const raw = completion.choices[0]?.message?.content || '{}';

    let parsed: { subject?: string; preview_text?: string; html_content?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('OpenAI returned invalid JSON:', raw);
      return NextResponse.json({ error: 'AI returned malformed response' }, { status: 500 });
    }

    if (!parsed.subject || !parsed.html_content) {
      return NextResponse.json(
        { error: 'AI response missing required fields' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subject: parsed.subject,
      preview_text: parsed.preview_text || '',
      html_content: parsed.html_content,
    });
  } catch (error) {
    console.error('Newsletter generate error:', error);
    return NextResponse.json({ error: 'Failed to generate newsletter' }, { status: 500 });
  }
}
