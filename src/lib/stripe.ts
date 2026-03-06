import Stripe from 'stripe';
import type { SubscriptionPlan } from '@/types/database';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const PLANS: Record<
  SubscriptionPlan,
  {
    name: string;
    priceId: string;
    price: number;
    messagesLimit: number;
    features: string[];
  }
> = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER || '',
    price: 97,
    messagesLimit: 500,
    features: [
      '500 AI messages/month',
      '1 workspace',
      'Lead capture forms',
      'Basic CRM',
      'Email support',
    ],
  },
  growth: {
    name: 'Growth',
    priceId: process.env.STRIPE_PRICE_GROWTH || '',
    price: 197,
    messagesLimit: 2000,
    features: [
      '2,000 AI messages/month',
      '3 workspaces',
      'Advanced automation',
      'Custom AI prompts',
      'Priority support',
      'Analytics dashboard',
    ],
  },
  scale: {
    name: 'Scale',
    priceId: process.env.STRIPE_PRICE_SCALE || '',
    price: 497,
    messagesLimit: 10000,
    features: [
      '10,000 AI messages/month',
      'Unlimited workspaces',
      'Custom integrations',
      'White-label options',
      'Dedicated support',
      'API access',
      'Custom reporting',
    ],
  },
};

export async function createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'vault-ai',
    },
  });
}

export async function createCheckoutSession(
  customerId: string,
  plan: SubscriptionPlan,
  workspaceId: string
): Promise<Stripe.Checkout.Session> {
  const planConfig = PLANS[plan];

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: planConfig.priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
    metadata: {
      workspaceId,
      plan,
    },
    subscription_data: {
      metadata: {
        workspaceId,
        plan,
      },
    },
    allow_promotion_codes: true,
  });
}

export async function createPortalSession(customerId: string): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  });
}

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

export async function updateSubscription(
  subscriptionId: string,
  newPlan: SubscriptionPlan
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const planConfig = PLANS[newPlan];

  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: planConfig.priceId,
      },
    ],
    proration_behavior: 'create_prorations',
    metadata: {
      plan: newPlan,
    },
  });
}

export async function createUsageRecord(
  subscriptionItemId: string,
  quantity: number
): Promise<Stripe.UsageRecord> {
  return stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp: Math.floor(Date.now() / 1000),
    action: 'increment',
  });
}

export function constructWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
