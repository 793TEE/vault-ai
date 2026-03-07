'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Search, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadWorkspaces();
  }, [page, search, planFilter, statusFilter]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(planFilter !== 'all' && { plan: planFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/workspaces?${params}`);
      const data = await res.json();

      if (res.ok) {
        setWorkspaces(data.workspaces || []);
        setTotal(data.total || 0);
      } else {
        toast.error(data.error || 'Failed to load workspaces');
      }
    } catch (error) {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-dark-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Workspace Management</h1>
            <p className="text-sm text-dark-400">{total} total workspaces</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-white focus:border-primary-500 focus:outline-none"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="scale">Scale</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-white focus:border-primary-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {/* Workspaces Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-12 text-center">
            <Building2 className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No workspaces found</h3>
            <p className="text-dark-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800/50 border-b border-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Workspace</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Owner</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Plan</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Messages</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Stats</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-dark-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {workspaces.map((ws) => {
                    const owner = ws.users;
                    const usagePercent = (ws.messages_used / ws.messages_limit) * 100;
                    return (
                      <tr key={ws.id} className="hover:bg-dark-800/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{ws.name}</p>
                          <p className="text-xs text-dark-400">
                            Created {new Date(ws.created_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white">{owner?.full_name || 'No name'}</p>
                          <p className="text-xs text-dark-400">{owner?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            ws.subscription_plan === 'scale' ? 'bg-emerald-500/20 text-emerald-400' :
                            ws.subscription_plan === 'growth' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {ws.subscription_plan || 'starter'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            ws.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                            ws.subscription_status === 'trialing' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {ws.subscription_status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden min-w-[60px]">
                              <div
                                className={`h-full ${
                                  usagePercent > 90 ? 'bg-red-500' :
                                  usagePercent > 70 ? 'bg-amber-500' : 'bg-primary-500'
                                }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-dark-400 whitespace-nowrap">
                              {ws.messages_used}/{ws.messages_limit}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-dark-400">
                            <div>{ws.stats?.leads || 0} leads</div>
                            <div>{ws.stats?.conversations || 0} convos</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/workspaces/${ws.id}`}
                            className="text-sm text-primary-400 hover:text-primary-300"
                          >
                            Manage
                          </Link>
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
    </div>
  );
}
