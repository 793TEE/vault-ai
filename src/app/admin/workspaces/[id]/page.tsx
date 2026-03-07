'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, ChevronLeft, Loader2, Save, TrendingUp, MessageSquare, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';

export default function AdminWorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<any>(null);
  const [workspaceStats, setWorkspaceStats] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    subscription_plan: '',
    subscription_status: '',
    messages_limit: 0,
    messages_used: 0,
  });

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/workspaces/${workspaceId}`);
      const data = await res.json();

      if (res.ok) {
        setWorkspace(data.workspace);
        setWorkspaceStats(data.stats);
        setRecentLeads(data.recentLeads || []);
        setFormData({
          name: data.workspace.name,
          subscription_plan: data.workspace.subscription_plan || '',
          subscription_status: data.workspace.subscription_status || '',
          messages_limit: data.workspace.messages_limit || 0,
          messages_used: data.workspace.messages_used || 0,
        });
      } else {
        toast.error(data.error || 'Failed to load workspace');
      }
    } catch (error) {
      toast.error('Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Workspace updated successfully');
        loadWorkspace();
      } else {
        toast.error(data.error || 'Failed to update workspace');
      }
    } catch (error) {
      toast.error('Failed to update workspace');
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

  if (!workspace) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Workspace not found</h2>
          <Link href="/admin/workspaces" className="text-primary-400 hover:text-primary-300">
            Back to Workspaces
          </Link>
        </div>
      </div>
    );
  }

  const owner = workspace.users;

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/admin/workspaces" className="text-dark-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{workspace.name}</h1>
            <p className="text-sm text-dark-400">Workspace Details</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
            <TrendingUp className="w-8 h-8 text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-white">{workspaceStats?.leads || 0}</div>
            <div className="text-sm text-dark-400">Total Leads</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
            <MessageSquare className="w-8 h-8 text-purple-400 mb-2" />
            <div className="text-2xl font-bold text-white">{workspaceStats?.conversations || 0}</div>
            <div className="text-sm text-dark-400">Conversations</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
            <Calendar className="w-8 h-8 text-amber-400 mb-2" />
            <div className="text-2xl font-bold text-white">{workspaceStats?.appointments || 0}</div>
            <div className="text-sm text-dark-400">Appointments</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
            <MessageSquare className="w-8 h-8 text-emerald-400 mb-2" />
            <div className="text-2xl font-bold text-white">{workspaceStats?.messages || 0}</div>
            <div className="text-sm text-dark-400">Total Messages</div>
          </div>
        </div>

        {/* Workspace Settings */}
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Workspace Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Workspace Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Subscription Plan</label>
                <select
                  value={formData.subscription_plan}
                  onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Select Plan</option>
                  <option value="starter">Starter ($97/mo)</option>
                  <option value="growth">Growth ($197/mo)</option>
                  <option value="scale">Scale ($497/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Subscription Status</label>
                <select
                  value={formData.subscription_status}
                  onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Select Status</option>
                  <option value="trialing">Trialing</option>
                  <option value="active">Active</option>
                  <option value="canceled">Canceled</option>
                  <option value="past_due">Past Due</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Messages Limit</label>
                <input
                  type="number"
                  value={formData.messages_limit}
                  onChange={(e) => setFormData({ ...formData, messages_limit: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Messages Used</label>
                <input
                  type="number"
                  value={formData.messages_used}
                  onChange={(e) => setFormData({ ...formData, messages_used: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>

        {/* Owner Info */}
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Workspace Owner</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 font-semibold text-lg">
              {owner?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-white">{owner?.full_name || 'No name'}</p>
              <p className="text-sm text-dark-400">{owner?.email}</p>
            </div>
          </div>
        </div>

        {/* Recent Leads */}
        {recentLeads.length > 0 && (
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Leads</h2>
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                  <div>
                    <p className="font-medium text-white">{lead.name}</p>
                    <p className="text-sm text-dark-400">{lead.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    lead.status === 'converted' ? 'bg-emerald-500/20 text-emerald-400' :
                    lead.status === 'contacted' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
