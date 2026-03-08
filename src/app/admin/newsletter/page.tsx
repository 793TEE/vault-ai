'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Users, Send, Sparkles, Eye, Check, AlertCircle, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'compose' | 'subscribers' | 'campaigns';

type Category = {
  value: string;
  label: string;
};

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  subscribed_at: string;
  status: string;
};

type Campaign = {
  id: string;
  subject: string;
  sent_at: string;
  subscriber_count: number;
  category: string | null;
  preview_text: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { value: 'credit_repair', label: 'Credit Repair' },
  { value: 'business_credit', label: 'Business Credit' },
  { value: 'llc_formation', label: 'LLC Formation' },
  { value: 'business_funding', label: 'Business Funding' },
  { value: 'vault_ai', label: 'Vault AI Updates' },
  { value: 'general', label: 'General' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  id,
  active,
  onClick,
  children,
}: {
  id: TabId;
  active: boolean;
  onClick: (id: TabId) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'text-dark-400 hover:text-white hover:bg-dark-800'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Compose Tab ─────────────────────────────────────────────────────────────

function ComposeTab({ activeCount }: { activeCount: number }) {
  const [category, setCategory] = useState('general');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [previewMode, setPreviewMode] = useState<'code' | 'render'>('render');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update iframe preview whenever HTML changes
  useEffect(() => {
    if (iframeRef.current && previewMode === 'render') {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent || '<p style="font-family:sans-serif;color:#999;padding:20px">Generated HTML will appear here...</p>');
        doc.close();
      }
    }
  }, [htmlContent, previewMode]);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError('');
    setSendResult(null);

    try {
      const res = await fetch('/api/newsletter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, topic }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGenerateError(data.error || 'Generation failed');
        return;
      }

      setSubject(data.subject || '');
      setPreviewText(data.preview_text || '');
      setHtmlContent(data.html_content || '');
    } catch {
      setGenerateError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    setSending(true);
    setShowConfirm(false);
    setSendResult(null);

    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html_content: htmlContent, preview_text: previewText, category }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSendResult({ success: false, message: data.error || 'Send failed' });
        return;
      }

      setSendResult({
        success: true,
        message: `Sent to ${data.sent} subscriber${data.sent !== 1 ? 's' : ''}.${data.failed > 0 ? ` ${data.failed} failed.` : ''}`,
      });
    } catch {
      setSendResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setSending(false);
    }
  }

  const canSend = subject.trim() && htmlContent.trim() && !sending;

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-400" />
          AI Content Generator
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Category */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">
              Specific Topic <span className="text-dark-600">(optional)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. CFPB rule changes 2025"
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm placeholder-dark-600 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </>
          )}
        </button>

        {generateError && (
          <p className="mt-3 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {generateError}
          </p>
        )}
      </div>

      {/* Email Fields + Preview (two-column layout on large screens) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: fields */}
        <div className="space-y-4">
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <h2 className="font-semibold text-white mb-4">Email Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-400 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm placeholder-dark-600 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-400 mb-1">Preview Text</label>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Short preview shown in inbox..."
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm placeholder-dark-600 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-400 mb-1">HTML Content</label>
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="Paste or generate HTML email content..."
                  rows={16}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm placeholder-dark-600 focus:outline-none focus:border-primary-500 font-mono resize-y"
                />
              </div>
            </div>
          </div>

          {/* Send Controls */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium text-white">Send to All Subscribers</p>
                <p className="text-sm text-dark-400">
                  {activeCount} active subscriber{activeCount !== 1 ? 's' : ''} will receive this email
                </p>
              </div>

              <button
                onClick={() => setShowConfirm(true)}
                disabled={!canSend}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Newsletter
              </button>
            </div>

            {sendResult && (
              <div
                className={`mt-4 flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${
                  sendResult.success
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {sendResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {sendResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Right: live preview */}
        <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden flex flex-col" style={{ minHeight: '600px' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-dark-400" />
              Preview
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode('render')}
                className={`px-3 py-1 text-xs rounded ${previewMode === 'render' ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-white'}`}
              >
                Rendered
              </button>
              <button
                onClick={() => setPreviewMode('code')}
                className={`px-3 py-1 text-xs rounded ${previewMode === 'code' ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-white'}`}
              >
                HTML
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {previewMode === 'render' ? (
              <iframe
                ref={iframeRef}
                title="Email preview"
                className="w-full h-full border-0"
                style={{ minHeight: '550px', background: '#fff' }}
                sandbox="allow-same-origin"
              />
            ) : (
              <pre className="p-4 text-xs text-dark-300 overflow-auto h-full whitespace-pre-wrap font-mono" style={{ minHeight: '550px' }}>
                {htmlContent || 'No HTML yet'}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Confirm Send</h3>
            <p className="text-dark-400 mb-2">
              You are about to send <span className="text-white font-medium">"{subject}"</span> to{' '}
              <span className="text-emerald-400 font-medium">{activeCount} subscriber{activeCount !== 1 ? 's' : ''}</span>.
            </p>
            <p className="text-dark-500 text-sm mb-6">This action cannot be undone.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subscribers Tab ──────────────────────────────────────────────────────────

function SubscribersTab() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/newsletter/subscribers');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setSubscribers(data.subscribers || []);
      } catch {
        setError('Failed to load subscribers');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeCount = subscribers.filter((s) => s.status === 'active').length;

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
      <div className="p-4 border-b border-dark-800 flex items-center justify-between">
        <h2 className="font-semibold text-white">All Subscribers</h2>
        {!loading && (
          <span className="text-sm text-dark-400">
            {activeCount} active / {subscribers.length} total
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
        </div>
      )}

      {error && (
        <div className="text-center py-16">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-dark-400">{error}</p>
        </div>
      )}

      {!loading && !error && subscribers.length === 0 && (
        <div className="text-center py-16">
          <Mail className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">No subscribers yet</p>
        </div>
      )}

      {!loading && !error && subscribers.length > 0 && (
        <div className="divide-y divide-dark-800">
          {subscribers.map((sub) => (
            <div key={sub.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{sub.email}</p>
                <p className="text-sm text-dark-400 truncate">
                  {sub.name || 'No name'} &bull; {sub.source} &bull; {formatDate(sub.subscribed_at)}
                </p>
              </div>
              <span
                className={`flex-shrink-0 text-xs px-2 py-1 rounded-full ${
                  sub.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-dark-700 text-dark-400'
                }`}
              >
                {sub.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Campaigns Tab ────────────────────────────────────────────────────────────

function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/newsletter/campaigns');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } catch {
        setError('Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
      <div className="p-4 border-b border-dark-800">
        <h2 className="font-semibold text-white">Sent Campaigns</h2>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
        </div>
      )}

      {error && (
        <div className="text-center py-16">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-dark-400">{error}</p>
        </div>
      )}

      {!loading && !error && campaigns.length === 0 && (
        <div className="text-center py-16">
          <Send className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">No campaigns sent yet</p>
        </div>
      )}

      {!loading && !error && campaigns.length > 0 && (
        <div className="divide-y divide-dark-800">
          {campaigns.map((c) => (
            <div key={c.id} className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{c.subject}</p>
                {c.preview_text && (
                  <p className="text-sm text-dark-400 truncate">{c.preview_text}</p>
                )}
                <p className="text-xs text-dark-500 mt-1">{formatDate(c.sent_at)}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-medium text-white">{c.subscriber_count}</p>
                <p className="text-xs text-dark-500">sent</p>
                {c.category && (
                  <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">
                    {c.category.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminNewsletterPage() {
  const [activeTab, setActiveTab] = useState<TabId>('compose');
  const [activeCount, setActiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [subRes, campRes] = await Promise.all([
          fetch('/api/newsletter/subscribers'),
          fetch('/api/newsletter/campaigns'),
        ]);

        if (subRes.ok) {
          const data = await subRes.json();
          const subs: Subscriber[] = data.subscribers || [];
          setTotalCount(subs.length);
          setActiveCount(subs.filter((s) => s.status === 'active').length);
        }

        if (campRes.ok) {
          const data = await campRes.json();
          const camps: Campaign[] = data.campaigns || [];
          setSentCount(camps.reduce((sum, c) => sum + (c.subscriber_count || 0), 0));
        }
      } catch {
        // Stats are non-critical
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-dark-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-dark-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Newsletter</h1>
            <p className="text-sm text-dark-400">
              {statsLoading ? 'Loading...' : `${activeCount} active subscribers`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
            <Users className="w-6 h-6 text-primary-400 mb-2" />
            <div className="text-2xl font-bold text-white">{statsLoading ? '—' : totalCount}</div>
            <div className="text-sm text-dark-400">Total Subscribers</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
            <Mail className="w-6 h-6 text-emerald-400 mb-2" />
            <div className="text-2xl font-bold text-white">{statsLoading ? '—' : activeCount}</div>
            <div className="text-sm text-dark-400">Active</div>
          </div>
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
            <Send className="w-6 h-6 text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-white">{statsLoading ? '—' : sentCount}</div>
            <div className="text-sm text-dark-400">Emails Sent</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <TabButton id="compose" active={activeTab === 'compose'} onClick={setActiveTab}>
            Compose
          </TabButton>
          <TabButton id="subscribers" active={activeTab === 'subscribers'} onClick={setActiveTab}>
            Subscribers
          </TabButton>
          <TabButton id="campaigns" active={activeTab === 'campaigns'} onClick={setActiveTab}>
            Campaigns
          </TabButton>
        </div>

        {/* Tab Content */}
        {activeTab === 'compose' && <ComposeTab activeCount={activeCount} />}
        {activeTab === 'subscribers' && <SubscribersTab />}
        {activeTab === 'campaigns' && <CampaignsTab />}
      </main>
    </div>
  );
}
