-- ============================================
-- VAULT AI - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ ENUMS ============

CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'appointment_scheduled',
  'booked',
  'closed_won',
  'closed_lost',
  'unresponsive'
);

CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_channel AS ENUM ('sms', 'email');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');
CREATE TYPE subscription_plan AS ENUM ('starter', 'growth', 'scale');

CREATE TYPE ai_tone AS ENUM ('professional', 'friendly', 'casual', 'aggressive');

CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');

-- ============ TABLES ============

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces (tenants)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logo_url TEXT,
  business_type TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Twilio settings
  twilio_phone_number TEXT,
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,

  -- SendGrid settings
  sendgrid_api_key TEXT,
  sendgrid_from_email TEXT,

  -- Booking settings
  booking_link TEXT,

  -- AI settings
  ai_enabled BOOLEAN DEFAULT TRUE,
  ai_tone ai_tone DEFAULT 'professional',
  ai_system_prompt TEXT,
  ai_offer_details TEXT,
  ai_pricing_info TEXT,
  ai_objection_handling TEXT,

  -- Subscription
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status subscription_status DEFAULT 'trialing',
  subscription_plan subscription_plan DEFAULT 'starter',
  messages_used INTEGER DEFAULT 0,
  messages_limit INTEGER DEFAULT 500,
  current_period_end TIMESTAMPTZ
);

-- Workspace members
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role workspace_role DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_interested TEXT,
  notes TEXT,
  source TEXT,
  status lead_status DEFAULT 'new',
  assigned_to UUID REFERENCES users(id),
  last_contacted_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  followup_count INTEGER DEFAULT 0,
  is_qualified BOOLEAN DEFAULT FALSE,
  qualification_score INTEGER DEFAULT 0,
  estimated_value DECIMAL(10,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation messages
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel message_channel NOT NULL,
  direction message_direction NOT NULL,
  content TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT FALSE,
  status message_status DEFAULT 'pending',
  external_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation memory (AI context per lead)
CREATE TABLE conversation_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE UNIQUE,
  summary TEXT,
  key_points TEXT[] DEFAULT '{}',
  objections TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status appointment_status DEFAULT 'scheduled',
  calendly_event_id TEXT,
  meeting_link TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-up sequences
CREATE TABLE followup_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  steps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-up queue
CREATE TABLE followup_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES followup_sequences(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  next_send_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============

CREATE INDEX idx_leads_workspace ON leads(workspace_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_next_followup ON leads(next_followup_at) WHERE next_followup_at IS NOT NULL;

CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_conversations_workspace ON conversations(workspace_id);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);

CREATE INDEX idx_appointments_workspace ON appointments(workspace_id);
CREATE INDEX idx_appointments_lead ON appointments(lead_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE INDEX idx_followup_queue_next ON followup_queue(next_send_at) WHERE is_active = TRUE;
CREATE INDEX idx_followup_queue_lead ON followup_queue(lead_id);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

CREATE INDEX idx_analytics_workspace ON analytics_events(workspace_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

-- ============ ROW LEVEL SECURITY ============

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Workspace policies
CREATE POLICY "Users can read workspaces they belong to" ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Owners can update workspaces" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Workspace members policies
CREATE POLICY "Members can read their workspace memberships" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Leads policies
CREATE POLICY "Users can read leads in their workspaces" ON leads
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert leads in their workspaces" ON leads
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update leads in their workspaces" ON leads
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete leads in their workspaces" ON leads
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Conversations policies
CREATE POLICY "Users can read conversations in their workspaces" ON conversations
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert conversations in their workspaces" ON conversations
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Conversation memory policies
CREATE POLICY "Users can read memory in their workspaces" ON conversation_memory
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage memory in their workspaces" ON conversation_memory
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Appointments policies
CREATE POLICY "Users can manage appointments in their workspaces" ON appointments
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Follow-up sequences policies
CREATE POLICY "Users can manage sequences in their workspaces" ON followup_sequences
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Follow-up queue policies
CREATE POLICY "Users can manage queue in their workspaces" ON followup_queue
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Analytics policies
CREATE POLICY "Users can read analytics in their workspaces" ON analytics_events
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- ============ FUNCTIONS ============

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_followup_sequences_updated_at
  BEFORE UPDATE ON followup_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new auth users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to create default workspace for new user
CREATE OR REPLACE FUNCTION create_default_workspace()
RETURNS TRIGGER AS $$
DECLARE
  workspace_id UUID;
  workspace_slug TEXT;
BEGIN
  -- Generate slug from email
  workspace_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  workspace_slug := workspace_slug || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);

  -- Create workspace
  INSERT INTO workspaces (name, slug, owner_id)
  VALUES (
    'My Workspace',
    workspace_slug,
    NEW.id
  )
  RETURNING id INTO workspace_id;

  -- Add owner as member
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (workspace_id, NEW.id, 'owner');

  -- Create default follow-up sequence
  INSERT INTO followup_sequences (workspace_id, name, steps)
  VALUES (
    workspace_id,
    'Default Follow-up',
    '[
      {"delay_hours": 24, "channel": "sms", "template": "Hi {name}! Just checking in about your inquiry. Any questions I can help with?"},
      {"delay_hours": 48, "channel": "email", "subject": "Following up on your inquiry", "template": "Hi {name},\n\nWanted to make sure you saw my last message. We have limited availability this week - shall I save a spot for you?\n\nBest regards"},
      {"delay_hours": 72, "channel": "sms", "template": "Hey {name}, this is my last follow-up. If you are still interested, I would love to help. Otherwise, no worries!"}
    ]'::JSONB
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create workspace on user creation
CREATE TRIGGER on_user_created_create_workspace
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_default_workspace();

-- Function to increment messages used
CREATE OR REPLACE FUNCTION increment_messages_used(p_workspace_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE workspaces
  SET messages_used = messages_used + 1
  WHERE id = p_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset messages used (for billing cycle)
CREATE OR REPLACE FUNCTION reset_messages_used(p_workspace_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE workspaces
  SET messages_used = 0
  WHERE id = p_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ NEWSLETTER ============

-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'active',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  last_email_sent TIMESTAMPTZ
);

-- Newsletter campaigns (for tracking)
CREATE TABLE newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- RLS for newsletter (public insert, admin-only read)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can manage subscribers"
  ON newsletter_subscribers FOR ALL
  USING (auth.role() = 'service_role');

-- ============ INITIAL DATA ============

-- This will be populated when users sign up
-- No seed data needed for production
