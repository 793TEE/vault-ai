# Vault AI Admin Panel Documentation

## Overview

A comprehensive admin panel built for Vault AI, modeled after the hissecretvault.net admin structure. This panel provides complete control over users, workspaces, leads, conversations, referral codes, and platform analytics.

## Admin Access

Admin access is controlled by email verification against the `ADMIN_EMAILS` array:

```typescript
const ADMIN_EMAILS = ['infohissecretvault23@gmail.com'];
```

To add more admins, update this array in `C:\Users\KOLD WORLD\Desktop\vault-ai\src\lib\admin\auth.ts`.

## Admin API Routes

All admin API routes use the service role Supabase client to bypass Row Level Security (RLS) and are protected by admin authentication.

### Base Admin Route

**File:** `src/app/api/admin/route.ts`

- `GET /api/admin?action=stats` - Dashboard statistics (users, workspaces, leads, revenue, MRR)
- `GET /api/admin?action=users` - List all users
- `GET /api/admin?action=workspaces` - List all workspaces
- `POST /api/admin` with `action: update_user` - Update user details
- `POST /api/admin` with `action: delete_user` - Delete user and their data
- `POST /api/admin` with `action: update_workspace` - Update workspace settings
- `POST /api/admin` with `action: reset_password` - Send password reset email

### User Management

**Files:**
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/route.ts`

**Endpoints:**

- `GET /api/admin/users` - List all users with pagination
  - Query params: `page`, `limit`, `search`, `sortBy`, `sortOrder`
  - Returns users with workspace details

- `POST /api/admin/users` - Create new user
  - Body: `{ email, password, full_name }`
  - Creates auth user and database record

- `DELETE /api/admin/users?ids=1,2,3` - Delete multiple users
  - Deletes users, workspaces, and all associated data

- `GET /api/admin/users/[id]` - Get single user details
  - Returns user with workspace stats

- `PATCH /api/admin/users/[id]` - Update user
  - Body: `{ email, full_name, avatar_url }`
  - Updates both database and auth metadata

- `DELETE /api/admin/users/[id]` - Delete single user

### Workspace Management

**Files:**
- `src/app/api/admin/workspaces/route.ts`
- `src/app/api/admin/workspaces/[id]/route.ts`

**Endpoints:**

- `GET /api/admin/workspaces` - List all workspaces with stats
  - Query params: `page`, `limit`, `search`, `plan`, `status`
  - Returns workspaces with owner info and lead/conversation counts

- `POST /api/admin/workspaces` - Create new workspace
  - Body: `{ owner_id, name, subscription_plan, messages_limit }`

- `GET /api/admin/workspaces/[id]` - Get workspace details
  - Returns workspace with stats, members, and recent leads

- `PATCH /api/admin/workspaces/[id]` - Update workspace
  - Body: `{ name, subscription_plan, subscription_status, messages_limit, messages_used, trial_ends_at, current_period_end }`

- `DELETE /api/admin/workspaces/[id]` - Delete workspace

### Leads Management

**File:** `src/app/api/admin/leads/route.ts`

**Endpoints:**

- `GET /api/admin/leads` - List all leads across workspaces
  - Query params: `page`, `limit`, `search`, `status`, `workspaceId`
  - Returns leads with workspace and owner information

- `PATCH /api/admin/leads` - Update lead
  - Body: `{ id, ...updateData }`

- `DELETE /api/admin/leads?ids=1,2,3` - Delete multiple leads

### Conversations Management

**File:** `src/app/api/admin/conversations/route.ts`

**Endpoints:**

- `GET /api/admin/conversations` - List all conversations
  - Query params: `page`, `limit`, `workspaceId`, `leadId`
  - Returns conversations with lead and workspace info, plus message counts

- `DELETE /api/admin/conversations?ids=1,2,3` - Delete conversations

### Referral Codes Management

**File:** `src/app/api/admin/referral-codes/route.ts`

**Endpoints:**

- `GET /api/admin/referral-codes` - List all referral codes
  - Returns all active and inactive codes

- `POST /api/admin/referral-codes` - Create referral code
  - Body: `{ code, discount_percent, discount_months, max_uses, expires_at }`

- `PATCH /api/admin/referral-codes` - Update referral code
  - Body: `{ id, ...updateData }`

- `DELETE /api/admin/referral-codes?id=xxx` - Delete referral code

### Analytics

**File:** `src/app/api/admin/analytics/route.ts`

**Endpoints:**

- `GET /api/admin/analytics` - Comprehensive platform analytics
  - Query params: `period` (days, default: 30)
  - Returns:
    - Revenue (MRR, ARR, plan breakdown)
    - User growth
    - Workspace stats
    - Lead and conversation metrics
    - Message usage
    - Daily stats for charts (last 30 days)
    - Top workspaces by activity

## Admin Pages

All admin pages are client-side React components using the dark theme with card components.

### Main Dashboard

**File:** `src/app/admin/page.tsx`
**Route:** `/admin`

Features:
- Real-time statistics (users, workspaces, leads, messages, appointments, newsletter)
- Subscription breakdown (trialing, starter, growth, scale)
- Recent users and workspaces
- Quick action links to all admin sections

### User Management

**File:** `src/app/admin/users/page.tsx`
**Route:** `/admin/users`

Features:
- List all users with pagination
- Search by email or name
- Bulk selection and deletion
- View workspace and subscription info
- Shield icon for admin users
- Link to view user's workspace

### Workspace Management

**Files:**
- `src/app/admin/workspaces/page.tsx` - List view
- `src/app/admin/workspaces/[id]/page.tsx` - Detail view

**Routes:**
- `/admin/workspaces` - List
- `/admin/workspaces/[id]` - Detail

Features:
- Filter by plan and status
- Search workspaces
- View message usage with progress bars
- See lead and conversation counts
- Individual workspace editor:
  - Update name, plan, status
  - Adjust message limits and usage
  - View detailed stats
  - See recent leads
  - View workspace owner info

### Leads Management

**File:** `src/app/admin/leads/page.tsx`
**Route:** `/admin/leads`

Features:
- View all leads across all workspaces
- Filter by status (new, contacted, qualified, converted, lost)
- Search by name, email, or phone
- See workspace and owner for each lead
- Color-coded status badges

### Conversations Management

**File:** `src/app/admin/conversations/page.tsx`
**Route:** `/admin/conversations`

Features:
- View all conversations platform-wide
- See lead info, workspace, and owner
- Channel type indicators (chat, SMS, email)
- Message counts per conversation
- Start date and last activity tracking

### Referral Codes Management

**File:** `src/app/admin/referral-codes/page.tsx`
**Route:** `/admin/referral-codes`

Features:
- Create referral codes (e.g., VAULT2024, HSVPREMIUM)
- Set discount percentage and duration
- Optional max uses and expiry dates
- Toggle codes active/inactive
- View usage statistics
- Edit and delete codes

### Analytics Dashboard

**File:** `src/app/admin/analytics/page.tsx`
**Route:** `/admin/analytics`

Features:
- MRR and ARR calculations
- Revenue breakdown by plan
- User growth metrics
- Workspace status overview
- Message usage platform-wide
- Lead and conversation stats
- Top 10 workspaces by usage
- Time period selector (7, 30, 90 days)

### Platform Settings

**File:** `src/app/admin/settings/page.tsx`
**Route:** `/admin/settings`

Features:
- User management (edit, delete, reset password)
- Workspace management (edit plans, limits, status)
- Environment information
- Admin email list
- External dashboard links (Supabase, Vercel, Stripe, OpenAI)

## Authentication Helper

**File:** `src/lib/admin/auth.ts`

Provides centralized admin authentication utilities:

```typescript
import { isAdmin, getServiceClient, getAuthClient } from '@/lib/admin/auth';

// Check if current user is admin
const adminStatus = await isAdmin();

// Get service role client (bypasses RLS)
const supabase = getServiceClient();

// Get authenticated user client
const authClient = getAuthClient();
```

## Database Schema Requirements

The admin panel works with the existing Supabase schema:

### Required Tables:
- `users` - User accounts
- `workspaces` - Workspace records
- `workspace_members` - Workspace membership
- `leads` - Lead data
- `conversations` - Conversation records
- `messages` - Message data
- `appointments` - Scheduled appointments
- `followup_sequences` - Follow-up sequences
- `followup_queue` - Follow-up queue
- `newsletter_subscribers` - Newsletter subscribers

### Optional Table:
- `referral_codes` - Promotional codes (create if using referral feature)

## Revenue Calculation

Revenue is calculated based on active subscriptions:

```typescript
const planPricing = {
  starter: 97,   // $97/month
  growth: 197,   // $197/month
  scale: 497,    // $497/month
};

// MRR = sum of all active subscriptions
// ARR = MRR * 12
```

## Security

- All admin routes check `ADMIN_EMAILS` before processing
- Service role client is used to bypass RLS for admin operations
- User auth client is used to verify admin identity
- Sensitive operations (delete user/workspace) require confirmation
- Admin emails are hardcoded and require code changes to update

## Styling

The admin panel uses the dark theme from Vault AI:

- Background: `bg-dark-950`
- Cards: `bg-dark-900` with `border-dark-800`
- Text: `text-white` (headings), `text-dark-400` (secondary)
- Primary color: `primary-500` (red/pink)
- Status colors:
  - Active: `emerald-500`
  - Trialing: `amber-500`
  - Inactive: `red-500`

## Quick Action Links

From the main dashboard, users can access:

1. Users - `/admin/users`
2. Workspaces - `/admin/workspaces`
3. Leads - `/admin/leads`
4. Conversations - `/admin/conversations`
5. Referral Codes - `/admin/referral-codes`
6. Analytics - `/admin/analytics`
7. Newsletter - `/admin/newsletter` (existing)
8. Settings - `/admin/settings`

## Next Steps

1. Deploy the application
2. Test all admin routes with admin email
3. Create referral_codes table in Supabase if using referral codes:

```sql
CREATE TABLE referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL,
  discount_months INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);
```

4. Add more admin emails as needed in `src/lib/admin/auth.ts`
5. Consider adding email notifications for critical admin actions

## Support

For questions or issues with the admin panel, contact the platform administrator.
