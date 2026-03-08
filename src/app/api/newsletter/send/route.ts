export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin, getServiceClient } from '@/lib/admin/auth';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'infohissecretvault23@gmail.com';

export async function POST(request: NextRequest) {
  try {
    // Admin-only endpoint
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, html_content, preview_text, category } = await request.json();

    if (!subject || !html_content) {
      return NextResponse.json(
        { error: 'subject and html_content are required' },
        { status: 400 }
      );
    }

    if (!SENDGRID_API_KEY) {
      return NextResponse.json(
        { error: 'SendGrid not configured' },
        { status: 500 }
      );
    }

    // Use service role client to read subscribers without RLS restriction
    const supabase = getServiceClient();

    // Fetch all active subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, name')
      .eq('status', 'active');

    if (fetchError) {
      console.error('Failed to fetch subscribers:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No active subscribers' });
    }

    let sentCount = 0;
    const errors: string[] = [];

    // Send to each subscriber individually
    for (const subscriber of subscribers) {
      // Personalize unsubscribe link per subscriber
      const personalizedHtml = html_content.replace(
        /{{email}}/g,
        encodeURIComponent(subscriber.email)
      );

      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: subscriber.email }] }],
            from: { email: FROM_EMAIL, name: 'His Secret Vault' },
            subject,
            content: [{ type: 'text/html', value: personalizedHtml }],
          }),
        });

        if (response.ok) {
          sentCount++;
        } else {
          const errorBody = await response.text();
          console.error(`SendGrid error for ${subscriber.email}:`, errorBody);
          errors.push(subscriber.email);
        }
      } catch (err) {
        console.error(`Failed to send to ${subscriber.email}:`, err);
        errors.push(subscriber.email);
      }
    }

    // Record the campaign regardless of partial failures
    const { error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .insert({
        subject,
        html_content,
        preview_text: preview_text || null,
        category: category || 'general',
        sent_at: new Date().toISOString(),
        subscriber_count: sentCount,
      });

    if (campaignError) {
      console.error('Failed to record campaign:', campaignError);
      // Non-fatal — emails were already sent
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: errors.length,
      total: subscribers.length,
    });
  } catch (error) {
    console.error('Newsletter send error:', error);
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 });
  }
}
