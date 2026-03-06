import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Building2,
  MessageSquare,
  Calendar,
  DollarSign,
  TrendingUp,
  Mail,
  Shield,
} from 'lucide-react';

// Admin emails - add your email here
const ADMIN_EMAILS = [
  'infohissecretvault23@gmail.com',
  // Add more admin emails as needed
];

async function getAdminStats() {
  const supabase = createServerSupabaseClient();

  // Total users
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Total workspaces
  const { count: totalWorkspaces } = await supabase
    .from('workspaces')
    .select('*', { count: 'exact', head: true });

  // Total leads across all workspaces
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  // Total messages
  const { count: totalMessages } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true });

  // Total appointments
  const { count: totalAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true });

  // Newsletter subscribers
  const { count: newsletterSubs } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Recent users
  const { data: recentUsers } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Recent workspaces with subscription info
  const { data: recentWorkspaces } = await supabase
    .from('workspaces')
    .select(`
      *,
      users!workspaces_owner_id_fkey (email, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  // Subscription stats
  const { data: subscriptionStats } = await supabase
    .from('workspaces')
    .select('subscription_status, subscription_plan')
    .not('subscription_status', 'is', null);

  const planCounts = {
    starter: 0,
    growth: 0,
    scale: 0,
    trialing: 0,
  };

  subscriptionStats?.forEach((ws) => {
    if (ws.subscription_status === 'trialing') {
      planCounts.trialing++;
    } else if (ws.subscription_plan) {
      planCounts[ws.subscription_plan as keyof typeof planCounts]++;
    }
  });

  return {
    totalUsers: totalUsers || 0,
    totalWorkspaces: totalWorkspaces || 0,
    totalLeads: totalLeads || 0,
    totalMessages: totalMessages || 0,
    totalAppointments: totalAppointments || 0,
    newsletterSubs: newsletterSubs || 0,
    recentUsers: recentUsers || [],
    recentWorkspaces: recentWorkspaces || [],
    planCounts,
  };
}

export default async function AdminPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  if (!ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard');
  }

  const stats = await getAdminStats();

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'primary' },
    { label: 'Workspaces', value: stats.totalWorkspaces, icon: Building2, color: 'emerald' },
    { label: 'Total Leads', value: stats.totalLeads, icon: TrendingUp, color: 'blue' },
    { label: 'Messages Sent', value: stats.totalMessages, icon: MessageSquare, color: 'purple' },
    { label: 'Appointments', value: stats.totalAppointments, icon: Calendar, color: 'amber' },
    { label: 'Newsletter Subs', value: stats.newsletterSubs, icon: Mail, color: 'pink' },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Admin Header */}
      <header className="bg-dark-900 border-b border-dark-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-dark-400">Vault AI Platform Management</p>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm text-dark-400 hover:text-white transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-dark-900 rounded-xl border border-dark-800 p-4">
              <div className={`w-10 h-10 bg-${stat.color}-500/10 rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-dark-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Subscription Stats */}
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Subscription Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-amber-400">{stats.planCounts.trialing}</div>
              <div className="text-sm text-dark-400">Trialing</div>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{stats.planCounts.starter}</div>
              <div className="text-sm text-dark-400">Starter ($97/mo)</div>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{stats.planCounts.growth}</div>
              <div className="text-sm text-dark-400">Growth ($197/mo)</div>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">{stats.planCounts.scale}</div>
              <div className="text-sm text-dark-400">Scale ($497/mo)</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Users</h2>
            <div className="space-y-3">
              {stats.recentUsers.length > 0 ? (
                stats.recentUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 font-semibold">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-dark-400">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-dark-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-dark-400 text-center py-4">No users yet</p>
              )}
            </div>
          </div>

          {/* Recent Workspaces */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Workspaces</h2>
            <div className="space-y-3">
              {stats.recentWorkspaces.length > 0 ? (
                stats.recentWorkspaces.map((ws: any) => (
                  <div key={ws.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-white">{ws.name}</p>
                      <p className="text-sm text-dark-400">{ws.users?.email || 'Unknown owner'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        ws.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                        ws.subscription_status === 'trialing' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-dark-700 text-dark-400'
                      }`}>
                        {ws.subscription_plan || 'trial'}
                      </span>
                      <p className="text-xs text-dark-500 mt-1">
                        {ws.messages_used}/{ws.messages_limit} msgs
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-dark-400 text-center py-4">No workspaces yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="mt-8 bg-dark-900 rounded-xl border border-dark-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/users"
              className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
            >
              <Users className="w-6 h-6 text-primary-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">Manage Users</p>
            </Link>
            <Link
              href="/admin/newsletter"
              className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
            >
              <Mail className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">Send Newsletter</p>
            </Link>
            <Link
              href="/admin/analytics"
              className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
            >
              <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">View Analytics</p>
            </Link>
            <Link
              href="/admin/settings"
              className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
            >
              <Shield className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">Platform Settings</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
