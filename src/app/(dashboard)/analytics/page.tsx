'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, MessageSquare, Calendar, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AnalyticsData {
  totalLeads: number;
  newLeadsThisWeek: number;
  totalConversations: number;
  messagesThisWeek: number;
  totalAppointments: number;
  appointmentsThisWeek: number;
  conversionRate: number;
  responseRate: number;
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  dailyLeads: { date: string; count: number }[];
  dailyMessages: { date: string; count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const supabase = createClient();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .limit(1)
      .single();

    if (!membership) {
      setLoading(false);
      return;
    }

    const workspaceId = membership.workspace_id;
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = subDays(new Date(), daysAgo);

    // Fetch all data in parallel
    const [
      { count: totalLeads },
      { count: newLeadsThisWeek },
      { count: totalConversations },
      { count: messagesThisWeek },
      { count: totalAppointments },
      { count: appointmentsThisWeek },
      { data: leads },
      { data: conversations },
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).gte('created_at', startDate.toISOString()),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).gte('created_at', startDate.toISOString()),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).gte('created_at', startDate.toISOString()),
      supabase.from('leads').select('status, source, created_at').eq('workspace_id', workspaceId).gte('created_at', startDate.toISOString()),
      supabase.from('conversations').select('created_at').eq('workspace_id', workspaceId).gte('created_at', startDate.toISOString()),
    ]);

    // Calculate metrics
    const leadsByStatus: Record<string, number> = {};
    const leadsBySource: Record<string, number> = {};
    const dailyLeadCounts: Record<string, number> = {};
    const dailyMessageCounts: Record<string, number> = {};

    leads?.forEach((lead) => {
      leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
      const source = lead.source || 'Direct';
      leadsBySource[source] = (leadsBySource[source] || 0) + 1;
      const date = format(new Date(lead.created_at), 'yyyy-MM-dd');
      dailyLeadCounts[date] = (dailyLeadCounts[date] || 0) + 1;
    });

    conversations?.forEach((conv) => {
      const date = format(new Date(conv.created_at), 'yyyy-MM-dd');
      dailyMessageCounts[date] = (dailyMessageCounts[date] || 0) + 1;
    });

    // Build daily arrays
    const dailyLeads = [];
    const dailyMessages = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyLeads.push({ date, count: dailyLeadCounts[date] || 0 });
      dailyMessages.push({ date, count: dailyMessageCounts[date] || 0 });
    }

    // Calculate rates
    const bookedLeads = leadsByStatus['booked'] || 0 + leadsByStatus['closed_won'] || 0;
    const conversionRate = totalLeads ? ((bookedLeads / (totalLeads || 1)) * 100) : 0;
    const responseRate = totalLeads ? (((totalConversations || 0) / (totalLeads || 1)) * 100) : 0;

    setData({
      totalLeads: totalLeads || 0,
      newLeadsThisWeek: newLeadsThisWeek || 0,
      totalConversations: totalConversations || 0,
      messagesThisWeek: messagesThisWeek || 0,
      totalAppointments: totalAppointments || 0,
      appointmentsThisWeek: appointmentsThisWeek || 0,
      conversionRate: Math.min(conversionRate, 100),
      responseRate: Math.min(responseRate, 100),
      leadsByStatus,
      leadsBySource,
      dailyLeads,
      dailyMessages,
    });

    setLoading(false);
  };

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    trend
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dark-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-dark-400'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : null}
              {change > 0 ? '+' : ''}{change} this period
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary-400" />
        </div>
      </div>
    </div>
  );

  const statusLabels: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    appointment_scheduled: 'Appointment Set',
    booked: 'Booked',
    closed_won: 'Closed Won',
    closed_lost: 'Closed Lost',
    unresponsive: 'Unresponsive',
  };

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500',
    contacted: 'bg-cyan-500',
    qualified: 'bg-emerald-500',
    appointment_scheduled: 'bg-violet-500',
    booked: 'bg-green-500',
    closed_won: 'bg-emerald-600',
    closed_lost: 'bg-red-500',
    unresponsive: 'bg-dark-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-dark-400 mt-1">Track your performance and growth</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Leads"
          value={data?.totalLeads || 0}
          change={data?.newLeadsThisWeek}
          icon={Users}
          trend={data?.newLeadsThisWeek && data.newLeadsThisWeek > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Messages"
          value={data?.totalConversations || 0}
          change={data?.messagesThisWeek}
          icon={MessageSquare}
          trend={data?.messagesThisWeek && data.messagesThisWeek > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Appointments"
          value={data?.totalAppointments || 0}
          change={data?.appointmentsThisWeek}
          icon={Calendar}
          trend={data?.appointmentsThisWeek && data.appointmentsThisWeek > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Conversion Rate"
          value={`${(data?.conversionRate || 0).toFixed(1)}%`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Leads by Status */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Leads by Status</h3>
          <div className="space-y-3">
            {Object.entries(data?.leadsByStatus || {}).map(([status, count]) => {
              const total = Object.values(data?.leadsByStatus || {}).reduce((a, b) => a + b, 0);
              const percentage = total ? (count / total) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-dark-300">{statusLabels[status] || status}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${statusColors[status] || 'bg-primary-500'} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(data?.leadsByStatus || {}).length === 0 && (
              <p className="text-dark-400 text-center py-4">No lead data yet</p>
            )}
          </div>
        </div>

        {/* Leads by Source */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Leads by Source</h3>
          <div className="space-y-3">
            {Object.entries(data?.leadsBySource || {}).map(([source, count]) => {
              const total = Object.values(data?.leadsBySource || {}).reduce((a, b) => a + b, 0);
              const percentage = total ? (count / total) * 100 : 0;
              return (
                <div key={source}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-dark-300">{source}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(data?.leadsBySource || {}).length === 0 && (
              <p className="text-dark-400 text-center py-4">No source data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Daily Activity Chart (Simple) */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Daily Activity</h3>
        <div className="flex items-end gap-1 h-48">
          {data?.dailyLeads.map((day, idx) => {
            const maxCount = Math.max(...(data?.dailyLeads.map(d => d.count) || [1]), 1);
            const height = (day.count / maxCount) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div className="w-full flex flex-col items-center justify-end h-40">
                  <div
                    className="w-full bg-primary-500/60 rounded-t hover:bg-primary-500 transition-colors cursor-pointer"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${day.count} leads on ${format(new Date(day.date), 'MMM d')}`}
                  />
                </div>
                <span className="text-[10px] text-dark-500 mt-1 rotate-45 origin-left">
                  {format(new Date(day.date), 'M/d')}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-500 rounded" />
            <span className="text-dark-400">New Leads</span>
          </div>
        </div>
      </div>
    </div>
  );
}
