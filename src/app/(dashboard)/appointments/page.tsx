'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Plus, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_link: string | null;
  leads: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [newAppointment, setNewAppointment] = useState({
    lead_id: '',
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    duration_minutes: 30,
    meeting_link: '',
  });
  const supabase = createClient();

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (workspaceId) {
      fetchAppointments();
      fetchLeads();
    }
  }, [workspaceId, currentMonth]);

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
    } else {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    if (!workspaceId) return;

    const { data } = await supabase
      .from('leads')
      .select('id, name, email, phone')
      .eq('workspace_id', workspaceId)
      .order('name');

    if (data) {
      setLeads(data);
    }
  };

  const fetchAppointments = async () => {
    if (!workspaceId) return;
    setLoading(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        leads (id, name, email, phone)
      `)
      .eq('workspace_id', workspaceId)
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at', { ascending: true });

    if (!error && data) {
      setAppointments(data);
    }
    setLoading(false);
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) {
      toast.error('No workspace found');
      return;
    }

    setSaving(true);
    try {
      const scheduledAt = new Date(`${newAppointment.date}T${newAppointment.time}`);

      const { error } = await supabase.from('appointments').insert({
        workspace_id: workspaceId,
        lead_id: newAppointment.lead_id || null,
        title: newAppointment.title,
        description: newAppointment.description || null,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: newAppointment.duration_minutes,
        meeting_link: newAppointment.meeting_link || null,
        status: 'scheduled',
      });

      if (error) throw error;

      toast.success('Appointment scheduled!');
      setShowAddModal(false);
      setNewAppointment({
        lead_id: '',
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '10:00',
        duration_minutes: 30,
        meeting_link: '',
      });
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create appointment');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update appointment');
    } else {
      toast.success('Appointment updated');
      fetchAppointments();
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm('Delete this appointment?')) return;

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Appointment deleted');
      fetchAppointments();
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => isSameDay(new Date(apt.scheduled_at), day));
  };

  const selectedDayAppointments = selectedDate ? getAppointmentsForDay(selectedDate) : [];

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-400',
    confirmed: 'bg-emerald-500/20 text-emerald-400',
    completed: 'bg-dark-600 text-dark-400',
    cancelled: 'bg-red-500/20 text-red-400',
    no_show: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-dark-400 mt-1">Manage your scheduled appointments</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-dark-400" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-dark-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-dark-400 py-2">
                {day}
              </div>
            ))}
            {days.map((day, idx) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-2 rounded-lg text-sm relative transition-colors
                    ${!isSameMonth(day, currentMonth) ? 'text-dark-600' : 'text-white'}
                    ${isToday(day) ? 'bg-primary-500/20 text-primary-400' : ''}
                    ${isSelected ? 'ring-2 ring-primary-500' : ''}
                    hover:bg-dark-700
                  `}
                >
                  {format(day, 'd')}
                  {dayAppointments.length > 0 && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Appointments */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
          </h3>

          {loading ? (
            <div className="text-center py-8 text-dark-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : selectedDate ? (
            selectedDayAppointments.length > 0 ? (
              <div className="space-y-4">
                {selectedDayAppointments.map((apt) => (
                  <div key={apt.id} className="p-4 bg-dark-800 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white">{apt.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[apt.status]}`}>
                        {apt.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-dark-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {format(new Date(apt.scheduled_at), 'h:mm a')} ({apt.duration_minutes} min)
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {apt.leads?.name || 'No lead assigned'}
                      </div>
                      {apt.leads?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {apt.leads.phone}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {apt.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => updateStatus(apt.id, 'confirmed')}
                            className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => updateStatus(apt.id, 'cancelled')}
                            className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(apt.id, 'completed')}
                          className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
                        >
                          Mark Complete
                        </button>
                      )}
                      <button
                        onClick={() => deleteAppointment(apt.id)}
                        className="text-xs px-3 py-1 bg-dark-700 text-dark-400 rounded hover:bg-dark-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-dark-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No appointments on this day</p>
                <button
                  onClick={() => {
                    setNewAppointment(prev => ({
                      ...prev,
                      date: format(selectedDate, 'yyyy-MM-dd')
                    }));
                    setShowAddModal(true);
                  }}
                  className="btn btn-secondary btn-sm mt-3"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </button>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-dark-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Click a date to view appointments</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-dark-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Schedule Appointment</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAppointment} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                  className="input"
                  placeholder="Consultation Call"
                  required
                />
              </div>

              <div>
                <label className="label">Select Lead (optional)</label>
                <select
                  value={newAppointment.lead_id}
                  onChange={(e) => setNewAppointment({ ...newAppointment, lead_id: e.target.value })}
                  className="input"
                >
                  <option value="">-- No lead --</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} ({lead.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Time *</label>
                  <input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Duration</label>
                <select
                  value={newAppointment.duration_minutes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, duration_minutes: parseInt(e.target.value) })}
                  className="input"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div>
                <label className="label">Meeting Link (optional)</label>
                <input
                  type="url"
                  value={newAppointment.meeting_link}
                  onChange={(e) => setNewAppointment({ ...newAppointment, meeting_link: e.target.value })}
                  className="input"
                  placeholder="https://zoom.us/j/..."
                />
              </div>

              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  value={newAppointment.description}
                  onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Notes about this appointment..."
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
                    'Schedule'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
