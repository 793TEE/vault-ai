'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, Loader2, ChevronLeft, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReferralCodesPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discount_percent: 20,
    discount_months: 3,
    max_uses: null as number | null,
    expires_at: null as string | null,
  });

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/referral-codes');
      const data = await res.json();

      if (res.ok) {
        setCodes(data.codes || []);
      } else {
        toast.error(data.error || 'Failed to load referral codes');
      }
    } catch (error) {
      toast.error('Failed to load referral codes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/admin/referral-codes`
        : '/api/admin/referral-codes';

      const body = editingId
        ? { id: editingId, ...formData }
        : formData;

      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(editingId ? 'Code updated successfully' : 'Code created successfully');
        setShowForm(false);
        setEditingId(null);
        setFormData({
          code: '',
          discount_percent: 20,
          discount_months: 3,
          max_uses: null,
          expires_at: null,
        });
        loadCodes();
      } else {
        toast.error(data.error || 'Failed to save code');
      }
    } catch (error) {
      toast.error('Failed to save code');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this referral code?')) return;

    try {
      const res = await fetch(`/api/admin/referral-codes?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Code deleted');
        loadCodes();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete code');
      }
    } catch (error) {
      toast.error('Failed to delete code');
    }
  };

  const handleToggleActive = async (code: any) => {
    try {
      const res = await fetch('/api/admin/referral-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: code.id,
          active: !code.active,
        }),
      });

      if (res.ok) {
        toast.success(`Code ${!code.active ? 'activated' : 'deactivated'}`);
        loadCodes();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update code');
      }
    } catch (error) {
      toast.error('Failed to update code');
    }
  };

  const startEdit = (code: any) => {
    setEditingId(code.id);
    setFormData({
      code: code.code,
      discount_percent: code.discount_percent,
      discount_months: code.discount_months,
      max_uses: code.max_uses,
      expires_at: code.expires_at,
    });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-dark-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Referral Codes</h1>
              <p className="text-sm text-dark-400">Manage promotional referral codes</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Code
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingId ? 'Edit Referral Code' : 'Create Referral Code'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VAULT2024"
                  required
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Discount Percent</label>
                  <input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) })}
                    min="1"
                    max="100"
                    required
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Discount Months</label>
                  <input
                    type="number"
                    value={formData.discount_months}
                    onChange={(e) => setFormData({ ...formData, discount_months: parseInt(e.target.value) })}
                    min="1"
                    required
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Max Uses (optional)</label>
                  <input
                    type="number"
                    value={formData.max_uses || ''}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                    min="1"
                    placeholder="Unlimited"
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Expires At (optional)</label>
                  <input
                    type="date"
                    value={formData.expires_at || ''}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value || null })}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update Code' : 'Create Code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      code: '',
                      discount_percent: 20,
                      discount_months: 3,
                      max_uses: null,
                      expires_at: null,
                    });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Codes List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : codes.length === 0 ? (
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-12 text-center">
            <DollarSign className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No referral codes</h3>
            <p className="text-dark-400">Create your first referral code to get started</p>
          </div>
        ) : (
          <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800/50 border-b border-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Discount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Usage</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Expires</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-dark-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {codes.map((code) => (
                    <tr key={code.id} className="hover:bg-dark-800/30">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-white">{code.code}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        {code.discount_percent}% off for {code.discount_months} months
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-400">
                        {code.current_uses || 0}
                        {code.max_uses ? ` / ${code.max_uses}` : ' / ∞'}
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-400">
                        {code.expires_at
                          ? new Date(code.expires_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(code)}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                            code.active
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {code.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {code.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(code)}
                            className="text-primary-400 hover:text-primary-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(code.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
