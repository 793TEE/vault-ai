'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Loader2, Zap, MessageSquare, DollarSign, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Workspace, AITone } from '@/types/database';

const tones: { value: AITone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-focused' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'aggressive', label: 'Aggressive', description: 'Direct and urgent' },
];

export default function AISettingsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [aiEnabled, setAiEnabled] = useState(true);
  const [tone, setTone] = useState<AITone>('professional');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [offerDetails, setOfferDetails] = useState('');
  const [pricingInfo, setPricingInfo] = useState('');
  const [objectionHandling, setObjectionHandling] = useState('');
  const [bookingLink, setBookingLink] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!membership) return;

      const { data: ws } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', membership.workspace_id)
        .single();

      if (ws) {
        setWorkspace(ws);
        setAiEnabled(ws.ai_enabled);
        setTone(ws.ai_tone);
        setSystemPrompt(ws.ai_system_prompt || '');
        setOfferDetails(ws.ai_offer_details || '');
        setPricingInfo(ws.ai_pricing_info || '');
        setObjectionHandling(ws.ai_objection_handling || '');
        setBookingLink(ws.booking_link || '');
      }
    } catch (error) {
      console.error('Error loading workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!workspace) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          ai_enabled: aiEnabled,
          ai_tone: tone,
          ai_system_prompt: systemPrompt,
          ai_offer_details: offerDetails,
          ai_pricing_info: pricingInfo,
          ai_objection_handling: objectionHandling,
          booking_link: bookingLink,
        })
        .eq('id', workspace.id);

      if (error) throw error;

      toast.success('AI settings saved successfully!');
    } catch (error: any) {
      toast.error(error.message);
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
      <div>
        <h1 className="text-3xl font-bold text-white">AI Configuration</h1>
        <p className="text-dark-400 mt-1">
          Customize how AI responds to your leads
        </p>
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
          placeholder="We help businesses establish credit, secure funding, and build financial foundations..."
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
          placeholder="Our services start at $X. Final pricing depends on your specific needs, which we'll discuss on our call."
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
          placeholder={`- If they say "too expensive": Emphasize ROI and value
- If they say "need to think": Create urgency, offer to answer questions
- If they're not interested: Ask what would make it valuable to them`}
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
