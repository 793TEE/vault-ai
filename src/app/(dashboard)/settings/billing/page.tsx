'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Check, Zap, MessageSquare, Users, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const plans = [
  {
    name: 'Starter',
    price: 97,
    description: 'Perfect for getting started',
    features: [
      '500 AI messages/month',
      'Unlimited leads',
      'Email follow-ups',
      'Basic analytics',
      'Email support',
    ],
    value: 'starter',
  },
  {
    name: 'Growth',
    price: 197,
    description: 'For growing businesses',
    features: [
      '2,000 AI messages/month',
      'Unlimited leads',
      'Email + SMS follow-ups',
      'Advanced analytics',
      'Priority support',
      'Custom AI training',
    ],
    value: 'growth',
    popular: true,
  },
  {
    name: 'Scale',
    price: 497,
    description: 'For high-volume businesses',
    features: [
      '10,000 AI messages/month',
      'Unlimited leads',
      'All channels',
      'Full analytics suite',
      'Dedicated support',
      'Custom integrations',
      'White-label options',
    ],
    value: 'scale',
  },
];

export default function BillingPage() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    try {
      // Use API endpoint to bypass RLS issues
      const res = await fetch('/api/workspace/settings');
      const data = await res.json();

      if (res.ok && data.workspace) {
        setWorkspace(data.workspace);
      } else {
        console.error('Failed to load workspace:', data);
      }
    } catch (error) {
      console.error('Error loading workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const [upgrading, setUpgrading] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    if (!workspace?.id) {
      toast.error('Workspace not found');
      return;
    }

    setUpgrading(plan);

    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          plan: plan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout');
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!workspace?.id) {
      toast.error('Workspace not found');
      return;
    }

    try {
      const res = await fetch(`/api/billing?workspaceId=${workspace.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const currentPlan = workspace?.subscription_plan || 'starter';
  const messagesUsed = workspace?.messages_used || 0;
  const messagesLimit = workspace?.messages_limit || 500;
  const usagePercentage = Math.min((messagesUsed / messagesLimit) * 100, 100);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Billing & Plans</h1>
        <p className="text-dark-400 mt-1">Manage your subscription and usage</p>
      </div>

      {/* Current Usage */}
      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-semibold text-white">Current Usage</h2>
            <p className="text-sm text-dark-400">
              {workspace?.subscription_status === 'trialing' ? '14-day free trial' : `${currentPlan} plan`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{messagesUsed.toLocaleString()}</p>
            <p className="text-sm text-dark-400">of {messagesLimit.toLocaleString()} messages</p>
          </div>
        </div>

        <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usagePercentage > 90 ? 'bg-red-500' :
              usagePercentage > 70 ? 'bg-amber-500' : 'bg-primary-500'
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>

        {usagePercentage > 80 && (
          <p className="text-sm text-amber-400 mt-3">
            You're running low on messages. Consider upgrading your plan.
          </p>
        )}
      </div>

      {/* Plans */}
      <h3 className="text-lg font-semibold text-white mb-4">Choose Your Plan</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.value}
            className={`card relative ${
              plan.popular ? 'border-primary-500 ring-1 ring-primary-500' : ''
            } ${currentPlan === plan.value ? 'bg-primary-500/5' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-dark-400 text-sm">{plan.description}</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-white">${plan.price}</span>
              <span className="text-dark-400">/month</span>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-dark-300">{feature}</span>
                </li>
              ))}
            </ul>

            {currentPlan === plan.value ? (
              <button disabled className="btn btn-secondary w-full">
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade(plan.value)}
                disabled={upgrading !== null}
                className={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
              >
                {upgrading === plan.value ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : plans.findIndex(p => p.value === currentPlan) < plans.findIndex(p => p.value === plan.value)
                  ? 'Upgrade'
                  : 'Switch Plan'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Payment Method */}
      <div className="card mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-dark-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Payment Method</h3>
              <p className="text-sm text-dark-400">
                {workspace?.stripe_customer_id ? 'Card on file' : 'No payment method added'}
              </p>
            </div>
          </div>
          {workspace?.stripe_customer_id && (
            <button
              onClick={handleManageBilling}
              className="btn btn-secondary btn-sm"
            >
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Success/Cancel Messages */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success') && (
        <div className="card mt-4 bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-emerald-400">
            Payment successful! Your plan has been upgraded.
          </p>
        </div>
      )}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('canceled') && (
        <div className="card mt-4 bg-amber-500/10 border border-amber-500/20">
          <p className="text-amber-400">
            Payment was canceled. You can try again anytime.
          </p>
        </div>
      )}
    </div>
  );
}
