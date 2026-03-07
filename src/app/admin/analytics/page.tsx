'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, ChevronLeft, Loader2, DollarSign, Users, MessageSquare, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const data = await res.json();

      if (res.ok) {
        setAnalytics(data);
      } else {
        toast.error(data.error || 'Failed to load analytics');
      }
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Failed to load analytics</h2>
          <Link href="/admin" className="text-primary-400 hover:text-primary-300">
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-dark-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Platform Analytics</h1>
              <p className="text-sm text-dark-400">Revenue and usage insights</p>
            </div>
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Revenue Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <DollarSign className="w-8 h-8 text-emerald-400 mb-3" />
            <div className="text-3xl font-bold text-white">${analytics.revenue.mrr}</div>
            <div className="text-sm text-dark-400">Monthly Recurring Revenue</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <DollarSign className="w-8 h-8 text-blue-400 mb-3" />
            <div className="text-3xl font-bold text-white">${analytics.revenue.arr}</div>
            <div className="text-sm text-dark-400">Annual Recurring Revenue</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <Users className="w-8 h-8 text-purple-400 mb-3" />
            <div className="text-3xl font-bold text-white">{analytics.users.total}</div>
            <div className="text-sm text-dark-400">Total Users</div>
            <div className="text-xs text-emerald-400 mt-1">+{analytics.users.new} in {period}d</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <Building2 className="w-8 h-8 text-amber-400 mb-3" />
            <div className="text-3xl font-bold text-white">{analytics.workspaces.total}</div>
            <div className="text-sm text-dark-400">Total Workspaces</div>
            <div className="text-xs text-emerald-400 mt-1">{analytics.workspaces.active} active</div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Revenue by Plan</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-dark-800/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {analytics.revenue.planBreakdown.starter}
              </div>
              <div className="text-sm text-dark-400">Starter</div>
              <div className="text-xs text-dark-500 mt-1">
                ${analytics.revenue.planBreakdown.starter * 97}/mo
              </div>
            </div>
            <div className="text-center p-4 bg-dark-800/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                {analytics.revenue.planBreakdown.growth}
              </div>
              <div className="text-sm text-dark-400">Growth</div>
              <div className="text-xs text-dark-500 mt-1">
                ${analytics.revenue.planBreakdown.growth * 197}/mo
              </div>
            </div>
            <div className="text-center p-4 bg-dark-800/50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-400">
                {analytics.revenue.planBreakdown.scale}
              </div>
              <div className="text-sm text-dark-400">Scale</div>
              <div className="text-xs text-dark-500 mt-1">
                ${analytics.revenue.planBreakdown.scale * 497}/mo
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Usage Stats */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Platform Usage</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-dark-400">Message Usage</span>
                  <span className="text-white font-medium">
                    {analytics.messages.used.toLocaleString()} / {analytics.messages.limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500"
                    style={{ width: `${analytics.messages.usage}%` }}
                  />
                </div>
                <p className="text-xs text-dark-500 mt-1">{analytics.messages.usage}% used</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-800">
                <div>
                  <div className="text-2xl font-bold text-white">{analytics.leads.total}</div>
                  <div className="text-sm text-dark-400">Total Leads</div>
                  <div className="text-xs text-emerald-400 mt-1">+{analytics.leads.new} in {period}d</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{analytics.conversations.total}</div>
                  <div className="text-sm text-dark-400">Conversations</div>
                  <div className="text-xs text-emerald-400 mt-1">+{analytics.conversations.recent} in {period}d</div>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Stats */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Workspace Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                  <span className="text-white">Active Subscriptions</span>
                </div>
                <span className="font-semibold text-white">{analytics.workspaces.active}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-amber-400 rounded-full" />
                  <span className="text-white">Trialing</span>
                </div>
                <span className="font-semibold text-white">{analytics.workspaces.trialing}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Workspaces */}
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Workspaces by Usage</h2>
          <div className="space-y-3">
            {analytics.topWorkspaces.slice(0, 10).map((ws: any, i: number) => (
              <div key={ws.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 font-semibold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{ws.name}</p>
                    <p className="text-xs text-dark-400">{ws.users?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {ws.messages_used} / {ws.messages_limit} msgs
                  </p>
                  <p className="text-xs text-dark-400">{ws.subscription_plan || 'trial'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
