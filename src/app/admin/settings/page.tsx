import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, Shield, Database, Key, Globe } from 'lucide-react';

const ADMIN_EMAILS = ['infohissecretvault23@gmail.com'];

export default async function AdminSettingsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-dark-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-dark-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Platform Settings</h1>
            <p className="text-sm text-dark-400">Configure global platform settings</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          {/* Environment Info */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-primary-400" />
              <h2 className="font-semibold text-white">Environment</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">Supabase URL</span>
                <span className="text-dark-300 truncate max-w-[200px]">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0]}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Environment</span>
                <span className="text-emerald-400">Production</span>
              </div>
            </div>
          </div>

          {/* API Keys Status */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-6 h-6 text-amber-400" />
              <h2 className="font-semibold text-white">API Keys Status</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-dark-400">OpenAI API</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  process.env.OPENAI_API_KEY ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {process.env.OPENAI_API_KEY ? 'Configured' : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400">SendGrid API</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  process.env.SENDGRID_API_KEY ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {process.env.SENDGRID_API_KEY ? 'Configured' : 'Optional'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Stripe API</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  process.env.STRIPE_SECRET_KEY ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {process.env.STRIPE_SECRET_KEY ? 'Configured' : 'Optional'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Twilio</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  process.env.TWILIO_ACCOUNT_SID ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Optional'}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Access */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-red-400" />
              <h2 className="font-semibold text-white">Admin Access</h2>
            </div>
            <div className="space-y-2">
              {ADMIN_EMAILS.map((email) => (
                <div key={email} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                  <span className="text-white">{email}</span>
                  <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">Admin</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-dark-500 mt-4">
              To add more admins, edit the ADMIN_EMAILS array in the codebase.
            </p>
          </div>

          {/* Quick Links */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-blue-400" />
              <h2 className="font-semibold text-white">Quick Links</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
              >
                <span className="text-sm text-white">Supabase Dashboard</span>
              </a>
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
              >
                <span className="text-sm text-white">Vercel Dashboard</span>
              </a>
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
              >
                <span className="text-sm text-white">Stripe Dashboard</span>
              </a>
              <a
                href="https://platform.openai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
              >
                <span className="text-sm text-white">OpenAI Platform</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
