import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

async function ensureWorkspaceExists(userId: string, userEmail: string) {
  const supabase = createServiceRoleClient();

  // Check if user exists in users table
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  // If user doesn't exist, create them
  if (!existingUser) {
    await supabase.from('users').insert({
      id: userId,
      email: userEmail,
    });
  }

  // Check if workspace exists
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (membership) {
    return membership.workspace_id;
  }

  // Create new workspace
  const slug = `${userEmail.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${userId.substring(0, 8)}`;

  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({
      name: 'My Workspace',
      slug,
      owner_id: userId,
      subscription_status: 'trialing',
      subscription_plan: 'starter',
      messages_limit: 500,
    })
    .select()
    .single();

  if (wsError || !workspace) {
    console.error('Failed to create workspace:', wsError);
    return null;
  }

  // Add user as owner
  await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'owner',
  });

  // Create default follow-up sequence
  await supabase.from('followup_sequences').insert({
    workspace_id: workspace.id,
    name: 'Default Follow-up',
    steps: [
      { delay_hours: 24, channel: 'email', subject: 'Following up', template: 'Hi {name}! Just checking in about your inquiry.' },
      { delay_hours: 48, channel: 'email', subject: 'Quick follow-up', template: 'Hi {name}, Wanted to make sure you saw my last message.' },
    ],
  });

  return workspace.id;
}

async function getStats(workspaceId: string) {
  const supabase = createServerSupabaseClient();
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Total leads
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  // New leads today
  const { count: newLeadsToday } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', startOfDay);

  // Booked appointments
  const { count: bookedAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'scheduled');

  // Messages sent this month
  const { count: messagesSent } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('direction', 'outbound')
    .gte('created_at', startOfMonth);

  // Conversion rate (booked / total)
  const { count: bookedLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'booked');

  const conversionRate = totalLeads ? ((bookedLeads || 0) / totalLeads * 100).toFixed(1) : 0;

  // Recent leads
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Recent conversations
  const { data: recentConversations } = await supabase
    .from('conversations')
    .select(`
      *,
      leads (name, email)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    totalLeads: totalLeads || 0,
    newLeadsToday: newLeadsToday || 0,
    bookedAppointments: bookedAppointments || 0,
    messagesSent: messagesSent || 0,
    conversionRate,
    recentLeads: recentLeads || [],
    recentConversations: recentConversations || [],
  };
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Ensure workspace exists (creates one if missing)
  const workspaceId = await ensureWorkspaceExists(user.id, user.email || '');

  if (!workspaceId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center px-4">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Setup Required</h2>
        <p className="text-dark-400 mb-4 max-w-md">
          We couldn't set up your workspace. This usually means the database schema needs to be configured.
        </p>
        <p className="text-dark-500 text-sm">
          Please make sure you've run the database schema in Supabase SQL Editor.
        </p>
      </div>
    );
  }

  const stats = await getStats(workspaceId);

  const statCards = [
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      change: `+${stats.newLeadsToday} today`,
      trend: 'up',
      icon: Users,
    },
    {
      label: 'Messages Sent',
      value: stats.messagesSent,
      change: 'This month',
      trend: 'up',
      icon: MessageSquare,
    },
    {
      label: 'Appointments',
      value: stats.bookedAppointments,
      change: 'Scheduled',
      trend: 'up',
      icon: Calendar,
    },
    {
      label: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      change: 'Lead to booking',
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary-400" />
              </div>
              <span className={`flex items-center text-sm ${
                stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                {stat.change}
              </span>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Leads</h2>
            <Link href="/leads" className="text-sm text-primary-400 hover:text-primary-300">
              View all
            </Link>
          </div>

          {stats.recentLeads.length > 0 ? (
            <div className="space-y-4">
              {stats.recentLeads.map((lead: any) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{lead.name}</p>
                      <p className="text-sm text-dark-400">{lead.email}</p>
                    </div>
                  </div>
                  <span className={`badge ${
                    lead.status === 'new' ? 'badge-info' :
                    lead.status === 'contacted' ? 'badge-warning' :
                    lead.status === 'qualified' ? 'badge-primary' :
                    lead.status === 'booked' ? 'badge-success' :
                    'badge-danger'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">No leads yet</p>
              <p className="text-dark-500 text-sm mt-1">
                Leads will appear here when captured
              </p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/conversations" className="text-sm text-primary-400 hover:text-primary-300">
              View all
            </Link>
          </div>

          {stats.recentConversations.length > 0 ? (
            <div className="space-y-4">
              {stats.recentConversations.map((conv: any) => (
                <div
                  key={conv.id}
                  className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-lg"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    conv.direction === 'outbound'
                      ? 'bg-primary-500/20'
                      : 'bg-emerald-500/20'
                  }`}>
                    {conv.ai_generated ? (
                      <Zap className={`w-4 h-4 ${
                        conv.direction === 'outbound' ? 'text-primary-400' : 'text-emerald-400'
                      }`} />
                    ) : (
                      <MessageSquare className={`w-4 h-4 ${
                        conv.direction === 'outbound' ? 'text-primary-400' : 'text-emerald-400'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-white text-sm">
                        {conv.leads?.name || 'Unknown'}
                      </p>
                      <span className="text-xs text-dark-500">•</span>
                      <span className="text-xs text-dark-500">
                        {conv.channel.toUpperCase()}
                      </span>
                      {conv.ai_generated && (
                        <>
                          <span className="text-xs text-dark-500">•</span>
                          <span className="badge badge-primary text-xs">AI</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-dark-300 truncate">
                      {conv.content}
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-dark-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(conv.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">No conversations yet</p>
              <p className="text-dark-500 text-sm mt-1">
                Conversations will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/settings/embed"
            className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
          >
            <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Zap className="w-5 h-5 text-primary-400" />
            </div>
            <p className="text-sm font-medium text-white">Get Embed Code</p>
            <p className="text-xs text-dark-400 mt-1">Add to your website</p>
          </Link>

          <Link
            href="/settings/ai"
            className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
          >
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-white">Configure AI</p>
            <p className="text-xs text-dark-400 mt-1">Customize responses</p>
          </Link>

          <Link
            href="/settings/integrations"
            className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
          >
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-white">Connect Calendar</p>
            <p className="text-xs text-dark-400 mt-1">Sync bookings</p>
          </Link>

          <Link
            href="/settings/billing"
            className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
          >
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-white">Upgrade Plan</p>
            <p className="text-xs text-dark-400 mt-1">More messages</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
