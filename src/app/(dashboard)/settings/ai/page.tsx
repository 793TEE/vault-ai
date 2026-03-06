'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Zap, MessageSquare, DollarSign, Shield, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

type AITone = 'professional' | 'friendly' | 'casual' | 'aggressive';

const tones: { value: AITone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-focused' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'aggressive', label: 'Aggressive', description: 'Direct and urgent' },
];

export default function AISettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [aiEnabled, setAiEnabled] = useState(true);
  const [tone, setTone] = useState<AITone>('professional');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [offerDetails, setOfferDetails] = useState('');
  const [pricingInfo, setPricingInfo] = useState('');
  const [objectionHandling, setObjectionHandling] = useState('');
  const [bookingLink, setBookingLink] = useState('');

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workspace/settings');
      const data = await res.json();

      if (res.ok && data.workspace) {
        const ws = data.workspace;
        setAiEnabled(ws.ai_enabled ?? true);
        setTone(ws.ai_tone || 'professional');
        setSystemPrompt(ws.ai_system_prompt || '');
        setOfferDetails(ws.ai_offer_details || '');
        setPricingInfo(ws.ai_pricing_info || '');
        setObjectionHandling(ws.ai_objection_handling || '');
        setBookingLink(ws.booking_link || '');
      } else {
        console.error('Failed to load workspace:', data);
        toast.error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading workspace:', error);
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await fetch('/api/workspace/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_enabled: aiEnabled,
          ai_tone: tone,
          ai_system_prompt: systemPrompt,
          ai_offer_details: offerDetails,
          ai_pricing_info: pricingInfo,
          ai_objection_handling: objectionHandling,
          booking_link: bookingLink,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('AI settings saved!');
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (error: any) {
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">AI Configuration</h1>
          <p className="text-dark-400 mt-1">
            Customize how AI responds to your leads
          </p>
        </div>
        <button
          onClick={loadWorkspace}
          className="btn btn-secondary btn-sm"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* AI Toggle */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">AI Auto-Response</h3>
              <p className="text-dark-400 text-sm">
                Automatically respond to leads with AI
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              aiEnabled ? 'bg-primary-500' : 'bg-dark-700'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                aiEnabled ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Tone Selection */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-medium text-white">Conversation Tone</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tones.map((t) => (
            <button
              key={t.value}
              onClick={() => setTone(t.value)}
              className={`p-4 rounded-lg border transition-all ${
                tone === t.value
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-700 hover:border-dark-600'
              }`}
            >
              <p className="font-medium text-white">{t.label}</p>
              <p className="text-sm text-dark-400 mt-1">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Booking Link */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-medium text-white">Booking Link</h3>
        </div>
        <p className="text-dark-400 text-sm mb-4">
          This link will be sent to qualified leads who want to book
        </p>
        <input
          type="url"
          value={bookingLink}
          onChange={(e) => setBookingLink(e.target.value)}
          className="input"
          placeholder="https://calendly.com/your-link"
        />
      </div>

      {/* Offer Details */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-medium text-white">Offer Details</h3>
        </div>
        <p className="text-dark-400 text-sm mb-4">
          Describe your services and what you offer to clients
        </p>
        <textarea
          value={offerDetails}
          onChange={(e) => setOfferDetails(e.target.value)}
          className="input min-h-[120px]"
          placeholder="Describe your services..."
        />
      </div>

      {/* Pricing Info */}
      <div className="card">
        <h3 className="text-lg font-medium text-white mb-4">Pricing Information</h3>
        <p className="text-dark-400 text-sm mb-4">
          What should AI say when asked about pricing?
        </p>
        <textarea
          value={pricingInfo}
          onChange={(e) => setPricingInfo(e.target.value)}
          className="input min-h-[100px]"
          placeholder="Our pricing information..."
        />
      </div>

      {/* Objection Handling */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-medium text-white">Objection Handling</h3>
        </div>
        <p className="text-dark-400 text-sm mb-4">
          How should AI handle common objections?
        </p>
        <textarea
          value={objectionHandling}
          onChange={(e) => setObjectionHandling(e.target.value)}
          className="input min-h-[150px]"
          placeholder="How to handle objections..."
        />
      </div>

      {/* Custom System Prompt */}
      <div className="card">
        <h3 className="text-lg font-medium text-white mb-4">Custom AI Instructions</h3>
        <p className="text-dark-400 text-sm mb-4">
          Additional instructions for the AI (optional, for advanced users)
        </p>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="input min-h-[150px] font-mono text-sm"
          placeholder="Additional custom instructions for the AI assistant..."
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
