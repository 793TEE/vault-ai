'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, MapPin, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
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
    name: string;
    email: string;
    phone: string;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchAppointments();
  }, [currentMonth]);

  const fetchAppointments = async () => {
    setLoading(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .limit(1)
      .single();

    if (membership) {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          leads (name, email, phone)
        `)
        .eq('workspace_id', membership.workspace_id)
        .gte('scheduled_at', start.toISOString())
        .lte('scheduled_at', end.toISOString())
        .order('scheduled_at', { ascending: true });

      if (!error && data) {
        setAppointments(data);
      }
    }
    setLoading(false);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-dark-400 mt-1">Manage your scheduled appointments</p>
        </div>
        <button className="btn btn-primary">
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
            <div className="text-center py-8 text-dark-400">Loading...</div>
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
                        {apt.leads?.name || 'Unknown'}
                      </div>
                      {apt.leads?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {apt.leads.phone}
                        </div>
                      )}
                    </div>
                    {apt.status === 'scheduled' && (
                      <div className="flex gap-2 mt-3">
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-dark-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No appointments on this day</p>
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

      {/* Upcoming Appointments List */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">All Appointments This Month</h3>
        {loading ? (
          <div className="text-center py-8 text-dark-400">Loading...</div>
        ) : appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Date & Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Lead</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                    <td className="py-3 px-4 text-white">
                      {format(new Date(apt.scheduled_at), 'MMM d, h:mm a')}
                    </td>
                    <td className="py-3 px-4 text-white">{apt.title}</td>
                    <td className="py-3 px-4 text-dark-300">{apt.leads?.name || 'Unknown'}</td>
                    <td className="py-3 px-4 text-dark-400">{apt.duration_minutes} min</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[apt.status]}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-dark-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No appointments scheduled this month</p>
          </div>
        )}
      </div>
    </div>
  );
}
