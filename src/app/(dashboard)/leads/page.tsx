'use client';

import { useEffect, useState } from 'react';
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
  X,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'appointment_scheduled' | 'booked' | 'closed_won' | 'closed_lost' | 'unresponsive';

interface Lead {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  phone: string;
  service_interested: string | null;
  notes: string | null;
  source: string | null;
  status: LeadStatus;
  followup_count: number;
  created_at: string;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    service_interested: '',
    notes: '',
    source: 'manual',
  });

  const limit = 20;

  useEffect(() => {
    loadLeads();
  }, [page, statusFilter]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
      });
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load leads');
      }

      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      console.error('Error loading leads:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add lead');
      }

      toast.success('Lead added successfully!');
      setShowAddModal(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        service_interested: '',
        notes: '',
        source: 'manual',
      });
      loadLeads();
    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast.error(error.message || 'Failed to add lead');
    } finally {
      setSaving(false);
    }
  };

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
      toast.success('Status updated');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const res = await fetch(`/api/leads?id=${leadId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete lead');
      }

      toast.success('Lead deleted');
      setSelectedLead(null);
      loadLeads();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Leads</h1>
          <p className="text-dark-400 mt-1">
            {total} total leads
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
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
              className="input w-full sm:w-40"
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
            <p className="text-dark-400 max-w-sm mx-auto mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first lead or embed your form on your website'}
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Lead
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-dark-800">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 hover:bg-dark-800/50 cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-white truncate">{lead.name}</p>
                        <span className={`badge ${statusColors[lead.status]} text-xs`}>
                          {statusLabels[lead.status]}
                        </span>
                      </div>
                      <p className="text-sm text-dark-400 truncate">{lead.email}</p>
                      <p className="text-sm text-dark-500">{lead.phone}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block table-container">
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
                              navigator.clipboard.writeText(lead.email);
                              toast.success('Email copied!');
                            }}
                            className="p-2 hover:bg-dark-700 rounded-lg"
                            title="Copy Email"
                          >
                            <Mail className="w-4 h-4 text-dark-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(lead.phone);
                              toast.success('Phone copied!');
                            }}
                            className="p-2 hover:bg-dark-700 rounded-lg"
                            title="Copy Phone"
                          >
                            <Phone className="w-4 h-4 text-dark-400" />
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-dark-800">
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

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-dark-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Add New Lead</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="label">Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="text"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    className="input pl-10"
                    placeholder="John Smith"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="input pl-10"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="input pl-10"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Service Interested In</label>
                <input
                  type="text"
                  value={newLead.service_interested}
                  onChange={(e) => setNewLead({ ...newLead, service_interested: e.target.value })}
                  className="input"
                  placeholder="e.g., Web Design, Consulting"
                />
              </div>

              <div>
                <label className="label">Source</label>
                <select
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  className="input"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="website">Website Form</option>
                  <option value="referral">Referral</option>
                  <option value="social">Social Media</option>
                  <option value="ads">Paid Ads</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Any additional information..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary flex-1"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Add Lead'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-dark-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{selectedLead.name}</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div>
                  <label className="label">Source</label>
                  <p className="text-white">{selectedLead.source || 'Direct'}</p>
                </div>
                <div>
                  <label className="label">Created</label>
                  <p className="text-white">{new Date(selectedLead.created_at).toLocaleString()}</p>
                </div>
              </div>
              {selectedLead.notes && (
                <div>
                  <label className="label">Notes</label>
                  <p className="text-dark-300">{selectedLead.notes}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-dark-800">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedLead.email);
                    toast.success('Email copied!');
                  }}
                  className="btn btn-secondary flex-1"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Copy Email
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedLead.phone);
                    toast.success('Phone copied!');
                  }}
                  className="btn btn-secondary flex-1"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Copy Phone
                </button>
                <button
                  onClick={() => deleteLead(selectedLead.id)}
                  className="btn btn-danger flex-1"
                >
                  Delete Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
