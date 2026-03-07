export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  PLANS,
} from '@/lib/stripe';
import type { SubscriptionPlan } from '@/types/database';

// POST /api/billing - Create checkout session
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, plan } = await request.json();

    if (!workspaceId || !plan || !PLANS[plan as SubscriptionPlan]) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get workspace
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = workspace.stripe_customer_id;

    if (!customerId) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      const customer = await createCustomer(
        user.email!,
        userData?.full_name || undefined
      );
      customerId = customer.id;

      await supabase
        .from('workspaces')
        .update({ stripe_customer_id: customerId })
        .eq('id', workspaceId);
    }

    // Create checkout session
    const session = await createCheckoutSession(
      customerId,
      plan as SubscriptionPlan,
      workspaceId
    );

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Billing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/billing - Get billing portal URL
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const session = await createPortalSession(workspace.stripe_customer_id);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Billing portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
