// Vault AI Database Types
// These match the Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============ ENUMS ============

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'appointment_scheduled'
  | 'booked'
  | 'closed_won'
  | 'closed_lost'
  | 'unresponsive';

export type MessageDirection = 'inbound' | 'outbound';
export type MessageChannel = 'sms' | 'email';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';
export type SubscriptionPlan = 'starter' | 'growth' | 'scale';

export type AITone = 'professional' | 'friendly' | 'casual' | 'aggressive';

// ============ TABLES ============

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
  business_type: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
  // Settings
  twilio_phone_number: string | null;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  sendgrid_api_key: string | null;
  sendgrid_from_email: string | null;
  booking_link: string | null;
  // AI Settings
  ai_enabled: boolean;
  ai_tone: AITone;
  ai_system_prompt: string | null;
  ai_offer_details: string | null;
  ai_pricing_info: string | null;
  ai_objection_handling: string | null;
  // Subscription
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  messages_used: number;
  messages_limit: number;
  current_period_end: string | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface Lead {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  phone: string;
  service_interested: string | null;
  notes: string | null;
  source: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  followup_count: number;
  is_qualified: boolean;
  qualification_score: number;
  estimated_value: number;
  tags: string[];
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  lead_id: string;
  channel: MessageChannel;
  direction: MessageDirection;
  content: string;
  ai_generated: boolean;
  status: MessageStatus;
  external_id: string | null;
  metadata: Json;
  created_at: string;
}

export interface ConversationMemory {
  id: string;
  workspace_id: string;
  lead_id: string;
  summary: string;
  key_points: string[];
  objections: string[];
  interests: string[];
  updated_at: string;
}

export interface Appointment {
  id: string;
  workspace_id: string;
  lead_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  calendly_event_id: string | null;
  meeting_link: string | null;
  reminder_sent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUpSequence {
  id: string;
  workspace_id: string;
  name: string;
  is_active: boolean;
  steps: FollowUpStep[];
  created_at: string;
  updated_at: string;
}

export interface FollowUpStep {
  delay_hours: number;
  channel: MessageChannel;
  template: string;
  subject?: string; // For email
}

export interface FollowUpQueue {
  id: string;
  workspace_id: string;
  lead_id: string;
  sequence_id: string;
  current_step: number;
  next_send_at: string;
  is_active: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface WebhookLog {
  id: string;
  workspace_id: string;
  source: string;
  event_type: string;
  payload: Json;
  processed: boolean;
  error: string | null;
  created_at: string;
}

// ============ API TYPES ============

export interface LeadCapturePayload {
  name: string;
  email: string;
  phone: string;
  service_interested?: string;
  notes?: string;
  source?: string;
}

export interface AIConversationRequest {
  lead_id: string;
  message: string;
  channel: MessageChannel;
}

export interface AIConversationResponse {
  response: string;
  action?: 'book' | 'qualify' | 'followup' | 'escalate';
  booking_suggested: boolean;
}

export interface DashboardStats {
  total_leads: number;
  new_leads_today: number;
  booked_appointments: number;
  conversion_rate: number;
  response_rate: number;
  messages_sent: number;
  revenue_this_month: number;
}

export interface LeadWithConversations extends Lead {
  conversations: Conversation[];
  appointments: Appointment[];
  memory: ConversationMemory | null;
}
