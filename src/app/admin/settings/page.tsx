'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Settings,
  Shield,
  Database,
  Key,
  Globe,
  Users,
  Trash2,
  Mail,
  Edit2,
  Save,
  X,
  Loader2,
  Building2,
  RefreshCw,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  subscription_status: string;
  messages_used: number;
  messages_limit: number;
  ai_enabled: boolean;
  created_at: string;
  users?: {
    email: string;
    full_name: string | null;
  };
}

const ADMIN_EMAILS = ['davistejuan341@gmail.com'];

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'workspaces' | 'settings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, workspacesRes] = await Promise.all([
        fetch('/api/admin?action=users'),
        fetch('/api/admin?action=workspaces'),
      ]);

      const usersData = await usersRes.json();
      const workspacesData = await workspacesRes.json();

      if (usersRes.ok) setUsers(usersData.users || []);
      if (workspacesRes.ok) setWorkspaces(workspacesData.workspaces || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_user', userId, data }),
      });

      if (!res.ok) throw new Error('Failed to update user');

      toast.success('User updated');
      setEditingUser(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user', userId }),
      });

      if (!res.ok) throw new Error('Failed to delete user');

      toast.success('User deleted');
      setDeleteConfirm(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', email }),
      });

      if (!res.ok) throw new Error('Failed to send reset email');

      toast.success('Password reset email sent');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateWorkspace = async (workspaceId: string, data: Partial<Workspace>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_workspace', workspaceId, data }),
      });

      if (!res.ok) throw new Error('Failed to update workspace');

      toast.success('Workspace updated');
      setEditingWorkspace(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-dark-800 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-dark-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Settings</h1>
              <p className="text-sm text-dark-400">Manage users, workspaces, and platform settings</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'users'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('workspaces')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'workspaces'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Workspaces ({workspaces.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Platform Settings
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-dark-900 rounded-xl border border-dark-800 p-4"
              >
                {editingUser?.id === user.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-dark-400">Full Name</label>
                      <input
                        type="text"
                        value={editingUser.full_name || ''}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, full_name: e.target.value })
                        }
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-dark-400">Email</label>
                      <input
                        type="email"
                        value={editingUser.email}
                        disabled
                        className="input mt-1 opacity-50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleUpdateUser(user.id, { full_name: editingUser.full_name })
                        }
                        disabled={saving}
                        className="btn btn-primary btn-sm"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="btn btn-secondary btn-sm"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                        <span className="text-primary-400 font-semibold text-lg">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{user.full_name || 'No name'}</p>
                          {ADMIN_EMAILS.includes(user.email) && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-dark-400">{user.email}</p>
                        <p className="text-xs text-dark-500">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user.email);
                          toast.success('Email copied!');
                        }}
                        className="p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white"
                        title="Copy Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.email)}
                        className="p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white"
                        title="Send Password Reset"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      {!ADMIN_EMAILS.includes(user.email) && (
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-dark-400 hover:text-red-400"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Delete Confirmation */}
                {deleteConfirm === user.id && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">Delete this user?</span>
                    </div>
                    <p className="text-sm text-dark-400 mb-4">
                      This will permanently delete the user, their workspace, and all associated data.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={saving}
                        className="btn btn-danger btn-sm"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12 text-dark-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No users found</p>
              </div>
            )}
          </div>
        )}

        {/* Workspaces Tab */}
        {activeTab === 'workspaces' && (
          <div className="space-y-4">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="bg-dark-900 rounded-xl border border-dark-800 p-4"
              >
                {editingWorkspace?.id === ws.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-dark-400">Workspace Name</label>
                      <input
                        type="text"
                        value={editingWorkspace.name}
                        onChange={(e) =>
                          setEditingWorkspace({ ...editingWorkspace, name: e.target.value })
                        }
                        className="input mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-dark-400">Plan</label>
                        <select
                          value={editingWorkspace.subscription_plan}
                          onChange={(e) =>
                            setEditingWorkspace({ ...editingWorkspace, subscription_plan: e.target.value })
                          }
                          className="input mt-1"
                        >
                          <option value="starter">Starter</option>
                          <option value="growth">Growth</option>
                          <option value="scale">Scale</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-dark-400">Status</label>
                        <select
                          value={editingWorkspace.subscription_status}
                          onChange={(e) =>
                            setEditingWorkspace({ ...editingWorkspace, subscription_status: e.target.value })
                          }
                          className="input mt-1"
                        >
                          <option value="trialing">Trialing</option>
                          <option value="active">Active</option>
                          <option value="canceled">Canceled</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-dark-400">Messages Used</label>
                        <input
                          type="number"
                          value={editingWorkspace.messages_used}
                          onChange={(e) =>
                            setEditingWorkspace({ ...editingWorkspace, messages_used: parseInt(e.target.value) })
                          }
                          className="input mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-dark-400">Messages Limit</label>
                        <input
                          type="number"
                          value={editingWorkspace.messages_limit}
                          onChange={(e) =>
                            setEditingWorkspace({ ...editingWorkspace, messages_limit: parseInt(e.target.value) })
                          }
                          className="input mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="ai_enabled"
                        checked={editingWorkspace.ai_enabled}
                        onChange={(e) =>
                          setEditingWorkspace({ ...editingWorkspace, ai_enabled: e.target.checked })
                        }
                        className="rounded"
                      />
                      <label htmlFor="ai_enabled" className="text-sm text-dark-300">AI Enabled</label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleUpdateWorkspace(ws.id, {
                            name: editingWorkspace.name,
                            subscription_plan: editingWorkspace.subscription_plan,
                            subscription_status: editingWorkspace.subscription_status,
                            messages_used: editingWorkspace.messages_used,
                            messages_limit: editingWorkspace.messages_limit,
                            ai_enabled: editingWorkspace.ai_enabled,
                          })
                        }
                        disabled={saving}
                        className="btn btn-primary btn-sm"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </button>
                      <button
                        onClick={() => setEditingWorkspace(null)}
                        className="btn btn-secondary btn-sm"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{ws.name}</p>
                      <p className="text-sm text-dark-400">{ws.users?.email || 'Unknown owner'}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          ws.subscription_status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ws.subscription_status === 'trialing'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-dark-700 text-dark-400'
                        }`}>
                          {ws.subscription_plan} • {ws.subscription_status}
                        </span>
                        <span className="text-xs text-dark-500">
                          {ws.messages_used}/{ws.messages_limit} messages
                        </span>
                        {ws.ai_enabled && (
                          <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full text-xs">
                            AI On
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingWorkspace(ws)}
                      className="p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {workspaces.length === 0 && (
              <div className="text-center py-12 text-dark-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No workspaces found</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Environment Info */}
            <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-primary-400" />
                <h2 className="font-semibold text-white">Environment</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-dark-800/50 rounded-lg">
                  <span className="text-dark-400">Platform</span>
                  <span className="text-white">Vault AI</span>
                </div>
                <div className="flex justify-between p-3 bg-dark-800/50 rounded-lg">
                  <span className="text-dark-400">Environment</span>
                  <span className="text-emerald-400">Production</span>
                </div>
                <div className="flex justify-between p-3 bg-dark-800/50 rounded-lg">
                  <span className="text-dark-400">Total Users</span>
                  <span className="text-white">{users.length}</span>
                </div>
                <div className="flex justify-between p-3 bg-dark-800/50 rounded-lg">
                  <span className="text-dark-400">Total Workspaces</span>
                  <span className="text-white">{workspaces.length}</span>
                </div>
              </div>
            </div>

            {/* Admin Access */}
            <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-amber-400" />
                <h2 className="font-semibold text-white">Admin Emails</h2>
              </div>
              <div className="space-y-2">
                {ADMIN_EMAILS.map((email) => (
                  <div key={email} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                    <span className="text-white">{email}</span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">Admin</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-dark-500 mt-4">
                To add more admins, update the ADMIN_EMAILS array in the codebase and redeploy.
              </p>
            </div>

            {/* Quick Links */}
            <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-blue-400" />
                <h2 className="font-semibold text-white">External Dashboards</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
                >
                  <Database className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <span className="text-sm text-white">Supabase</span>
                </a>
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
                >
                  <Globe className="w-6 h-6 text-white mx-auto mb-2" />
                  <span className="text-sm text-white">Vercel</span>
                </a>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
                >
                  <Key className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <span className="text-sm text-white">Stripe</span>
                </a>
                <a
                  href="https://platform.openai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors text-center"
                >
                  <Settings className="w-6 h-6 text-teal-400 mx-auto mb-2" />
                  <span className="text-sm text-white">OpenAI</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
