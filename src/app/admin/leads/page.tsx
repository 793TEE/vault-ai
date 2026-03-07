'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Search, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    loadLeads();
  }, [page, search, statusFilter]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();

      if (res.ok) {
        setLeads(data.leads || []);
        setTotal(data.total || 0);
      } else {
        toast.error(data.error || 'Failed to load leads');
      }
    } catch (error) {
      toast.error('Failed to load leads');
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
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">All Leads</h1>
            <p className="text-sm text-dark-400">{total} total leads across all workspaces</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-white focus:border-primary-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {/* Leads Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-12 text-center">
            <TrendingUp className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No leads found</h3>
            <p className="text-dark-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800/50 border-b border-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Lead</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Workspace</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Source</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {leads.map((lead) => {
                    const workspace = lead.workspace;
                    return (
                      <tr key={lead.id} className="hover:bg-dark-800/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{lead.name}</p>
                          {lead.service_interested && (
                            <p className="text-xs text-dark-400">Interested: {lead.service_interested}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white">{lead.email}</p>
                          <p className="text-xs text-dark-400">{lead.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white">{workspace?.name || 'Unknown'}</p>
                          <p className="text-xs text-dark-400">{workspace?.users?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            lead.status === 'converted' ? 'bg-emerald-500/20 text-emerald-400' :
                            lead.status === 'qualified' ? 'bg-blue-500/20 text-blue-400' :
                            lead.status === 'contacted' ? 'bg-purple-500/20 text-purple-400' :
                            lead.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-400">{lead.source || 'manual'}</td>
                        <td className="px-4 py-3 text-sm text-dark-400">
                          {new Date(lead.created_at).toLocaleDateString()}
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
