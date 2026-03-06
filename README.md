# Vault AI - 24/7 Revenue Automation System

A production-ready SaaS platform that captures leads, responds instantly with AI, qualifies prospects, and books appointments automatically.

## Features

- **Instant AI Response**: Respond to leads via SMS and email within seconds
- **Smart Qualification**: AI asks the right questions and identifies hot leads
- **Auto-Booking**: Automatically sends booking links when leads are ready
- **Follow-up Automation**: Customizable follow-up sequences
- **Full CRM Dashboard**: Track leads, conversations, and metrics
- **Multi-Tenant**: Each business gets isolated workspace
- **Subscription Billing**: Stripe integration with usage-based limits

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o
- **SMS**: Twilio
- **Email**: SendGrid
- **Payments**: Stripe
- **Hosting**: Vercel

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-repo/vault-ai.git
cd vault-ai
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Get your project URL and keys from Settings > API

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=your-random-secret
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/vault-ai.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and import your repository
2. Add all environment variables from `.env.local`
3. Deploy!

### 3. Configure Webhooks

After deployment, configure these webhook URLs:

**Twilio SMS Webhook:**
```
https://your-app.vercel.app/api/webhooks/twilio/sms
```

**Stripe Webhook:**
```
https://your-app.vercel.app/api/webhooks/stripe
```

### 4. Set Up Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/followups",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## Service Setup Guides

### Twilio Setup

1. Create account at [twilio.com](https://twilio.com)
2. Buy a phone number with SMS capability
3. Get Account SID and Auth Token from Console
4. Set webhook URL for incoming SMS:
   - Go to Phone Numbers > Your Number > Configure
   - Set "A Message Comes In" webhook to: `https://your-app.vercel.app/api/webhooks/twilio/sms`

### SendGrid Setup

1. Create account at [sendgrid.com](https://sendgrid.com)
2. Verify your sending domain
3. Create API key with "Mail Send" permission
4. Add key to environment variables

### Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Create Products and Prices:
   - Starter: $97/month
   - Growth: $197/month
   - Scale: $497/month
3. Get API keys from Developers section
4. Set up webhook:
   - Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
5. Add webhook secret to environment variables

### OpenAI Setup

1. Create account at [platform.openai.com](https://platform.openai.com)
2. Generate API key
3. Ensure you have GPT-4 access (or modify code to use gpt-3.5-turbo)

---

## Database Schema

The schema creates these tables:

- **users**: User profiles (extends Supabase auth)
- **workspaces**: Tenant workspaces with settings
- **workspace_members**: User-workspace relationships
- **leads**: Captured leads with status tracking
- **conversations**: SMS/email message history
- **conversation_memory**: AI context per lead
- **appointments**: Scheduled appointments
- **followup_sequences**: Automated follow-up templates
- **followup_queue**: Pending follow-up messages
- **webhook_logs**: Incoming webhook history
- **analytics_events**: Event tracking

See `supabase/schema.sql` for complete schema with RLS policies.

---

## API Endpoints

### Public Endpoints

```
POST /api/leads
  - Create new lead (from embed form)
  - Body: { workspaceId, name, email, phone, service_interested?, notes?, source? }

GET /embed/form/[workspaceId]
  - Embeddable lead capture form
```

### Protected Endpoints (require auth)

```
GET /api/leads?workspaceId=xxx
  - List leads for workspace

GET /api/billing?workspaceId=xxx
  - Get billing portal URL

POST /api/billing
  - Create checkout session
  - Body: { workspaceId, plan }
```

### Webhooks

```
POST /api/webhooks/twilio/sms
  - Receive incoming SMS

POST /api/webhooks/stripe
  - Handle Stripe events

GET /api/cron/followups
  - Process follow-up queue (requires CRON_SECRET)
```

---

## Embedding on Your Website

### Option 1: Iframe

```html
<iframe
  src="https://your-app.vercel.app/embed/form/YOUR_WORKSPACE_ID"
  width="100%"
  height="500"
  frameborder="0"
></iframe>
```

### Option 2: API Integration

```javascript
fetch('https://your-app.vercel.app/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workspaceId: 'YOUR_WORKSPACE_ID',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+15551234567',
    service_interested: 'Business Credit'
  })
});
```

---

## Customization

### AI Personality

Configure in Dashboard > Settings > AI Configuration:

- **Tone**: Professional, Friendly, Casual, or Aggressive
- **Offer Details**: What you offer to clients
- **Pricing Info**: How to handle pricing questions
- **Objection Handling**: Scripts for common objections
- **Booking Link**: Your Calendly or booking page URL

### Follow-up Sequences

Default sequence (3 steps over 5 days):
1. 24 hours: SMS check-in
2. 48 hours: Email with urgency
3. 72 hours: Final SMS follow-up

Customize in the database or add a UI for sequence editing.

---

## Troubleshooting

### Common Issues

**SMS not sending:**
- Verify Twilio credentials
- Check phone number format (must include country code)
- Ensure Twilio account has funds

**AI not responding:**
- Verify OpenAI API key
- Check message limits in workspace
- Review error logs in Vercel

**Webhooks not working:**
- Verify webhook URLs are correct
- Check webhook secrets match
- Review webhook logs in database

### Logs

- Vercel: Dashboard > Project > Logs
- Supabase: Dashboard > Logs
- Check `webhook_logs` table for incoming events

---

## License

MIT License - feel free to use for commercial projects.

---

## Support

For issues and feature requests, open a GitHub issue.
