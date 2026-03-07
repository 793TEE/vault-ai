export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { constructWebhookEvent, PLANS } from '@/lib/stripe';
import type { SubscriptionPlan, SubscriptionStatus } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const event = constructWebhookEvent(body, signature);
    const supabase = createServiceRoleClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const { workspaceId, plan } = session.metadata;

        await supabase
          .from('workspaces')
          .update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_status: 'active' as SubscriptionStatus,
            subscription_plan: plan as SubscriptionPlan,
            messages_limit: PLANS[plan as SubscriptionPlan].messagesLimit,
            current_period_end: new Date(session.expires_at * 1000).toISOString(),
          })
          .eq('id', workspaceId);

        console.log(`Subscription activated for workspace ${workspaceId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const workspaceId = subscription.metadata.workspaceId;
        const plan = subscription.metadata.plan as SubscriptionPlan;

        let status: SubscriptionStatus = 'active';
        if (subscription.cancel_at_period_end) {
          status = 'cancelled';
        } else if (subscription.status === 'past_due') {
          status = 'past_due';
        } else if (subscription.status === 'trialing') {
          status = 'trialing';
        }

        await supabase
          .from('workspaces')
          .update({
            subscription_status: status,
            subscription_plan: plan,
            messages_limit: PLANS[plan].messagesLimit,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', workspaceId);

        console.log(`Subscription updated for workspace ${workspaceId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const workspaceId = subscription.metadata.workspaceId;

        await supabase
          .from('workspaces')
          .update({
            subscription_status: 'cancelled' as SubscriptionStatus,
            subscription_plan: 'starter' as SubscriptionPlan,
            messages_limit: PLANS.starter.messagesLimit,
          })
          .eq('id', workspaceId);

        console.log(`Subscription cancelled for workspace ${workspaceId}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;

        // Reset messages used on new billing period
        if (invoice.billing_reason === 'subscription_cycle') {
          const subscription = await fetch(
            `https://api.stripe.com/v1/subscriptions/${invoice.subscription}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
              },
            }
          ).then((r) => r.json());

          const workspaceId = subscription.metadata?.workspaceId;
          if (workspaceId) {
            await supabase.rpc('reset_messages_used', { p_workspace_id: workspaceId });
            console.log(`Messages reset for workspace ${workspaceId}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        console.log(`Payment failed for customer ${invoice.customer}`);
        // Could send notification email here
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log webhook
    await supabase.from('webhook_logs').insert({
      workspace_id: null,
      source: 'stripe',
      event_type: event.type,
      payload: event.data.object,
      processed: true,
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
