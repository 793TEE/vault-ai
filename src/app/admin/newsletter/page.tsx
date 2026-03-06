import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Users, Send } from 'lucide-react';

const ADMIN_EMAILS = ['infohissecretvault23@gmail.com'];

export default async function AdminNewsletterPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard');
  }

  const { data: subscribers } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false });

  const activeCount = subscribers?.filter(s => s.status === 'active').length || 0;

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-dark-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-dark-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Newsletter</h1>
            <p className="text-sm text-dark-400">{activeCount} active subscribers</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
            <Users className="w-6 h-6 text-primary-400 mb-2" />
            <div className="text-2xl font-bold text-white">{subscribers?.length || 0}</div>
            <div className="text-sm text-dark-400">Total Subscribers</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
            <Mail className="w-6 h-6 text-emerald-400 mb-2" />
            <div className="text-2xl font-bold text-white">{activeCount}</div>
            <div className="text-sm text-dark-400">Active</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4 col-span-2 sm:col-span-1">
            <Send className="w-6 h-6 text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-sm text-dark-400">Emails Sent</div>
          </div>
        </div>

        {/* Subscribers List */}
        <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
          <div className="p-4 border-b border-dark-800">
            <h2 className="font-semibold text-white">Subscribers</h2>
          </div>

          <div className="divide-y divide-dark-800">
            {subscribers?.map((sub: any) => (
              <div key={sub.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{sub.email}</p>
                  <p className="text-sm text-dark-400">
                    {sub.name || 'No name'} • {sub.source}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  sub.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-dark-700 text-dark-400'
                }`}>
                  {sub.status}
                </span>
              </div>
            ))}
          </div>

          {(!subscribers || subscribers.length === 0) && (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">No subscribers yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
