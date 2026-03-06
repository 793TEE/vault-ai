'use client';

import { useState, useEffect } from 'react';
import { Calendar, Link as LinkIcon, Check, ExternalLink, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function IntegrationsPage() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookingLink, setBookingLink] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadWorkspace();
  }, []);

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
      const { data: ws } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', membership.workspace_id)
        .single();

      if (ws) {
        setWorkspace(ws);
        setBookingLink(ws.booking_link || '');
      }
    }
    setLoading(false);
  };

  const saveBookingLink = async () => {
    if (!workspace) return;
    setSaving(true);

    const { error } = await supabase
      .from('workspaces')
      .update({ booking_link: bookingLink })
      .eq('id', workspace.id);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Booking link saved!');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const integrations = [
    {
      name: 'Calendly',
      description: 'Connect your Calendly to automatically book appointments',
      icon: Calendar,
      color: 'blue',
      connected: !!bookingLink?.includes('calendly'),
    },
    {
      name: 'Cal.com',
      description: 'Open source scheduling with your Cal.com calendar',
      icon: Calendar,
      color: 'emerald',
      connected: !!bookingLink?.includes('cal.com'),
    },
    {
      name: 'Google Calendar',
      description: 'Sync appointments directly to Google Calendar',
      icon: Calendar,
      color: 'amber',
      connected: false,
      comingSoon: true,
    },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-dark-400 mt-1">Connect your favorite tools</p>
      </div>

      {/* Booking Link */}
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Booking Link</h2>
            <p className="text-sm text-dark-400">Add your calendar booking link (Calendly, Cal.com, etc.)</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={bookingLink}
            onChange={(e) => setBookingLink(e.target.value)}
            placeholder="https://calendly.com/your-link"
            className="input flex-1"
          />
          <button
            onClick={saveBookingLink}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
        </div>

        {bookingLink && (
          <a
            href={bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 mt-3"
          >
            Test your link <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Integration Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Available Integrations</h3>

        <div className="grid gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="card flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-${integration.color}-500/10 rounded-lg flex items-center justify-center`}>
                  <integration.icon className={`w-6 h-6 text-${integration.color}-400`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{integration.name}</h3>
                    {integration.comingSoon && (
                      <span className="text-xs px-2 py-0.5 bg-dark-700 text-dark-400 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-dark-400">{integration.description}</p>
                </div>
              </div>

              {integration.connected ? (
                <span className="flex items-center gap-1 text-sm text-emerald-400">
                  <Check className="w-4 h-4" /> Connected
                </span>
              ) : !integration.comingSoon ? (
                <span className="text-sm text-dark-500">Not connected</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
