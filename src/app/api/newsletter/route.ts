import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SendGrid for welcome emails
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@vaultai.com';

async function sendWelcomeEmail(email: string, name?: string) {
  if (!SENDGRID_API_KEY) return false;

  const greeting = name ? `Hi ${name},` : 'Hi there,';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-align: center;">Vault AI</h1>
      </div>
      <div style="background: #1a1a2e; padding: 30px; border: 1px solid #333;">
        <p style="font-size: 18px; color: #fff;">${greeting}</p>
        <p style="color: #a0a0a0;">Thank you for subscribing! You'll receive:</p>
        <ul style="line-height: 1.8; color: #a0a0a0;">
          <li>Weekly AI automation tips</li>
          <li>Lead conversion strategies</li>
          <li>Product updates and new features</li>
          <li>Exclusive offers</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://vaultai.com" style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Get Started</a>
        </div>
      </div>
      <div style="background: #111; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          <a href="https://vaultai.com/api/newsletter/unsubscribe?email=${email}" style="color: #666;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: FROM_EMAIL },
        subject: 'Welcome to Vault AI Newsletter!',
        content: [{ type: 'text/html', value: htmlContent }],
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, source = 'website' } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check if subscriber exists
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Resubscribe
        await supabase
          .from('newsletter_subscribers')
          .update({ status: 'active', subscribed_at: new Date().toISOString() })
          .eq('email', email.toLowerCase());

        await sendWelcomeEmail(email, name);
        return NextResponse.json({ status: 'resubscribed', message: 'Welcome back!' });
      }
      return NextResponse.json({ status: 'exists', message: 'Already subscribed' });
    }

    // Create newsletter_subscribers table if it doesn't exist
    // (This should be done via migration, but for safety)

    // Insert new subscriber
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: email.toLowerCase(),
        name: name || null,
        source,
        status: 'active',
      });

    if (error) {
      // Table might not exist, try to create it
      if (error.code === '42P01') {
        console.error('newsletter_subscribers table does not exist');
        return NextResponse.json({ error: 'Newsletter system not configured' }, { status: 500 });
      }
      throw error;
    }

    // Send welcome email
    await sendWelcomeEmail(email, name);

    return NextResponse.json({ status: 'subscribed', message: 'Successfully subscribed!' });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const action = searchParams.get('action');

  if (action === 'unsubscribe' && email) {
    await supabase
      .from('newsletter_subscribers')
      .update({ status: 'unsubscribed' })
      .eq('email', email.toLowerCase());

    return new NextResponse(`
      <html>
      <head><title>Unsubscribed</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px; background: #1a1a2e; color: white;">
        <h1>You've been unsubscribed</h1>
        <p>You will no longer receive our newsletter.</p>
        <a href="https://vaultai.com" style="color: #6366f1;">Return to Vault AI</a>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
