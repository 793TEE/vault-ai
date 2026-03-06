'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Lead, LeadStatus } from '@/types/database';

const statusColors: Record<LeadStatus, string> = {
  new: 'badge-info',
  contacted: 'badge-warning',
  qualified: 'badge-primary',
  appointment_scheduled: 'badge-primary',
  booked: 'badge-success',
  closed_won: 'badge-success',
  closed_lost: 'badge-danger',
  unresponsive: 'badge-danger',
};

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  appointment_scheduled: 'Scheduled',
  booked: 'Booked',
  closed_won: 'Won',
  closed_lost: 'Lost',
  unresponsive: 'Unresponsive',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const supabase = createClient();
  const limit = 20;

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (workspaceId) {
      loadLeads();
    }
  }, [workspaceId, page, statusFilter]);

  const loadWorkspace = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (membership) {
      setWorkspaceId(membership.workspace_id);
    }
  };

  const loadLeads = async () => {
    if (!workspaceId) return;
    setLoading(true);

    try {
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setLeads(data || []);
      setTotal(count || 0);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
      toast.success('Status updated');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Leads</h1>
          <p className="text-dark-400 mt-1">
            {total} total leads
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadLeads()}
              className="input pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-dark-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="input w-40"
            >
              <option value="all">All Status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-dark-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No leads found</h3>
            <p className="text-dark-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Leads will appear here when captured from your forms'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Contact</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Follow-ups</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{lead.name}</p>
                            <p className="text-sm text-dark-400">{lead.source || 'Direct'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-dark-500" />
                            <span className="text-dark-300">{lead.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-dark-500" />
                            <span className="text-dark-300">{lead.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-dark-300">{lead.service_interested || '-'}</span>
                      </td>
                      <td>
                        <select
                          value={lead.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateLeadStatus(lead.id, e.target.value as LeadStatus);
                          }}
                          className={`badge ${statusColors[lead.status]} cursor-pointer bg-transparent border-none`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className="text-dark-400">{lead.followup_count} sent</span>
                      </td>
                      <td>
                        <span className="text-dark-400">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Send message
                            }}
                            className="p-2 hover:bg-dark-700 rounded-lg"
                          >
                            <MessageSquare className="w-4 h-4 text-dark-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // More actions
                            }}
                            className="p-2 hover:bg-dark-700 rounded-lg"
                          >
                            <MoreVertical className="w-4 h-4 text-dark-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-dark-800">
                <p className="text-sm text-dark-400">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary btn-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-dark-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-secondary btn-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lead Detail Modal - Simplified */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{selectedLead.name}</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-dark-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <p className="text-white">{selectedLead.email}</p>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <p className="text-white">{selectedLead.phone}</p>
                </div>
                <div>
                  <label className="label">Service Interest</label>
                  <p className="text-white">{selectedLead.service_interested || '-'}</p>
                </div>
                <div>
                  <label className="label">Status</label>
                  <span className={`badge ${statusColors[selectedLead.status]}`}>
                    {statusLabels[selectedLead.status]}
                  </span>
                </div>
              </div>
              {selectedLead.notes && (
                <div>
                  <label className="label">Notes</label>
                  <p className="text-dark-300">{selectedLead.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
