'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Loader2, Trash2, Edit, ChevronLeft, ChevronRight, Plus, Mail, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editUser, setEditUser] = useState<any>(null);
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const limit = 20;

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      } else {
        toast.error(data.error || 'Failed to load users');
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;

    if (!confirm(`Delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?ids=${selectedUsers.join(',')}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Deleted ${data.deleted} user(s)`);
        setSelectedUsers([]);
        loadUsers();
      } else {
        toast.error(data.error || 'Failed to delete users');
      }
    } catch (error) {
      toast.error('Failed to delete users');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-dark-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">User Management</h1>
              <p className="text-sm text-dark-400">{total} total users</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          {selectedUsers.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedUsers.length})
            </button>
          )}
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-12 text-center">
            <Users className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
            <p className="text-dark-400">Try adjusting your search</p>
          </div>
        ) : (
          <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800/50 border-b border-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(users.map((u) => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                        className="rounded border-dark-600"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Workspace</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Plan</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Joined</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-dark-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {users.map((user) => {
                    const workspace = user.workspace_members?.[0]?.workspace;
                    return (
                      <tr key={user.id} className="hover:bg-dark-800/30">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded border-dark-600"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 font-semibold">
                              {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white">{user.full_name || 'No name'}</p>
                                {(['infohissecretvault23@gmail.com', 'davistejuan341@gmail.com'].includes(user.email)) && (
                                  <Shield className="w-4 h-4 text-amber-400" />
                                )}
                              </div>
                              <p className="text-sm text-dark-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {workspace ? (
                            <div>
                              <p className="text-sm text-white">{workspace.name}</p>
                              <p className="text-xs text-dark-400">
                                {workspace.messages_used}/{workspace.messages_limit} messages
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-dark-500">No workspace</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {workspace ? (
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              workspace.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                              workspace.subscription_status === 'trialing' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-dark-700 text-dark-400'
                            }`}>
                              {workspace.subscription_plan || 'trial'}
                            </span>
                          ) : (
                            <span className="text-sm text-dark-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                const ws = user.workspace_members?.[0]?.workspace;
                                setEditUser(user);
                                setEditPlan(ws?.subscription_plan || 'starter');
                                setEditStatus(ws?.subscription_status || 'trialing');
                              }}
                              className="text-sm text-primary-400 hover:text-primary-300"
                            >
                              Manage
                            </button>
                            <button
                              onClick={() => {
                                const ws = user.workspace_members?.[0]?.workspace;
                                if (ws) window.location.href = `/admin/workspaces/${ws.id}`;
                              }}
                              className="text-sm text-blue-400 hover:text-blue-300"
                              disabled={!user.workspace_members?.[0]?.workspace}
                            >
                              View WS
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-dark-800 flex items-center justify-between">
                <p className="text-sm text-dark-400">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed text-dark-400"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-white">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed text-dark-400"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Manage User</h3>
              <button onClick={() => setEditUser(null)} className="text-dark-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-2 text-sm text-dark-400">{editUser.email}</div>
            <div className="mb-4">
              <label className="block text-sm text-dark-400 mb-2">Subscription Plan</label>
              <select
                value={editPlan}
                onChange={e => setEditPlan(e.target.value)}
                className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="starter">Starter — 500 messages</option>
                <option value="growth">Growth — 2,000 messages</option>
                <option value="scale">Scale — Unlimited</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm text-dark-400 mb-2">Status</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="trialing">Free Trial</option>
                <option value="active">Active (Paid)</option>
                <option value="cancelled">Cancelled</option>
                <option value="past_due">Past Due</option>
              </select>
            </div>
            <button
              onClick={async () => {
                setSaving(true);
                try {
                  const res = await fetch(`/api/admin/users/${editUser.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan: editPlan, subscription_status: editStatus }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    toast.success('User updated!');
                    setEditUser(null);
                    loadUsers();
                  } else {
                    toast.error(data.error || 'Failed to update');
                  }
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="w-full py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
