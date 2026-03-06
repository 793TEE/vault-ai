import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, MessageSquare, Calendar, DollarSign } from 'lucide-react';

const ADMIN_EMAILS = ['infohissecretvault23@gmail.com'];

export default async function AdminAnalyticsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard');
  }

  // Fetch platform-wide stats
  const [
    { count: totalUsers },
    { count: totalLeads },
    { count: totalMessages },
    { count: totalAppointments },
    { data: workspaces },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase.from('workspaces').select('subscription_status, subscription_plan, messages_used'),
  ]);

  // Calculate revenue (estimated)
  const planPrices = { starter: 97, growth: 197, scale: 497 };
  let monthlyRevenue = 0;
  workspaces?.forEach((ws: any) => {
    if (ws.subscription_status === 'active' && ws.subscription_plan) {
      monthlyRevenue += planPrices[ws.subscription_plan as keyof typeof planPrices] || 0;
    }
  });

  const totalMessagesUsed = workspaces?.reduce((acc: number, ws: any) => acc + (ws.messages_used || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-dark-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-dark-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Platform Analytics</h1>
            <p className="text-sm text-dark-400">Overview of all platform activity</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4 sm:p-6">
            <Users className="w-8 h-8 text-primary-400 mb-3" />
            <div className="text-3xl font-bold text-white">{totalUsers || 0}</div>
            <div className="text-sm text-dark-400">Total Users</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4 sm:p-6">
            <TrendingUp className="w-8 h-8 text-emerald-400 mb-3" />
            <div className="text-3xl font-bold text-white">{totalLeads || 0}</div>
            <div className="text-sm text-dark-400">Total Leads</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4 sm:p-6">
            <MessageSquare className="w-8 h-8 text-blue-400 mb-3" />
            <div className="text-3xl font-bold text-white">{totalMessages || 0}</div>
            <div className="text-sm text-dark-400">Messages Sent</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4 sm:p-6">
            <DollarSign className="w-8 h-8 text-amber-400 mb-3" />
            <div className="text-3xl font-bold text-white">${monthlyRevenue}</div>
            <div className="text-sm text-dark-400">Monthly Revenue</div>
          </div>
        </div>

        {/* More Stats */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <h3 className="font-semibold text-white mb-4">Platform Usage</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Total Workspaces</span>
                <span className="text-white font-medium">{workspaces?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400">AI Messages Used</span>
                <span className="text-white font-medium">{totalMessagesUsed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Appointments Booked</span>
                <span className="text-white font-medium">{totalAppointments || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <h3 className="font-semibold text-white mb-4">Subscription Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Starter Plan</span>
                <span className="text-white font-medium">
                  {workspaces?.filter((w: any) => w.subscription_plan === 'starter').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Growth Plan</span>
                <span className="text-white font-medium">
                  {workspaces?.filter((w: any) => w.subscription_plan === 'growth').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Scale Plan</span>
                <span className="text-white font-medium">
                  {workspaces?.filter((w: any) => w.subscription_plan === 'scale').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Trialing</span>
                <span className="text-white font-medium">
                  {workspaces?.filter((w: any) => w.subscription_status === 'trialing').length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
