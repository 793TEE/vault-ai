import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Mail, Calendar, Shield } from 'lucide-react';

const ADMIN_EMAILS = ['infohissecretvault23@gmail.com'];

export default async function AdminUsersPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard');
  }

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-dark-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-dark-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Manage Users</h1>
            <p className="text-sm text-dark-400">{users?.length || 0} total users</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
          {/* Mobile View */}
          <div className="sm:hidden divide-y divide-dark-800">
            {users?.map((u: any) => (
              <div key={u.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                    <span className="text-primary-400 font-semibold">
                      {u.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{u.full_name || 'No name'}</p>
                    <p className="text-sm text-dark-400 truncate">{u.email}</p>
                    <p className="text-xs text-dark-500 mt-1">
                      Joined {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {ADMIN_EMAILS.includes(u.email) && (
                    <Shield className="w-4 h-4 text-amber-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Joined</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Role</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((u: any) => (
                  <tr key={u.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                          <span className="text-primary-400 font-semibold">
                            {u.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-white">{u.full_name || 'No name'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-dark-300">{u.email}</td>
                    <td className="py-3 px-4 text-dark-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {ADMIN_EMAILS.includes(u.email) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-dark-400 text-sm">User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!users || users.length === 0) && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">No users yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
