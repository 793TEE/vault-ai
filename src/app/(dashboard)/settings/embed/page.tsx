'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Copy, Check, Code, ExternalLink, Loader2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmbedSettingsPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      // If no workspace exists, create one
      if (!membership) {
        console.log('No workspace found, creating one...');
        const response = await fetch('/api/init-workspace', {
          method: 'POST',
          credentials: 'include',
        });
        const result = await response.json();
        console.log('Init workspace result:', result);
        if (result.error) {
          setError(result.error);
        }
        if (result.workspaceId) {
          setWorkspaceId(result.workspaceId);
          return;
        }
      }

      if (membership) {
        setWorkspaceId(membership.workspace_id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
        <h2 className="text-xl font-bold text-red-400 mb-2">Error Creating Workspace</h2>
        <p className="text-red-300">{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); loadWorkspace(); }}
          className="mt-4 btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <h2 className="text-xl font-bold text-amber-400 mb-2">No Workspace Found</h2>
        <p className="text-amber-300 mb-4">Unable to create workspace. Please try again.</p>
        <button
          onClick={() => { setLoading(true); loadWorkspace(); }}
          className="btn btn-primary"
        >
          Create Workspace
        </button>
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';

  const iframeCode = `<iframe
  src="${appUrl}/embed/form/${workspaceId}"
  width="100%"
  height="500"
  frameborder="0"
  style="border: none; border-radius: 12px;"
></iframe>`;

  const scriptCode = `<div id="vault-ai-form"></div>
<script src="${appUrl}/embed.js" data-workspace="${workspaceId}"></script>`;

  const apiEndpoint = `POST ${appUrl}/api/leads

Headers:
  Content-Type: application/json

Body:
{
  "workspaceId": "${workspaceId}",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+15551234567",
  "service_interested": "Business Credit",
  "notes": "Interested in building credit",
  "source": "custom_form"
}`;

  const webhookExample = `// Webhook payload sent to your URL when lead status changes
{
  "event": "lead.status_changed",
  "workspace_id": "${workspaceId}",
  "lead_id": "uuid",
  "old_status": "new",
  "new_status": "qualified",
  "timestamp": "2024-01-15T10:30:00Z"
}`;

  const chatWidgetCode = `<!-- Vault AI Chat Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['VaultAI']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','vaultai','${appUrl}/chat-widget.js'));
  vaultai('init', '${workspaceId}');
</script>`;

  return (
    <div className="space-y-6 animate-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Embed & Integrate</h1>
        <p className="text-dark-400 mt-1">
          Add lead capture to your website
        </p>
      </div>

      {/* Iframe Embed */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Iframe Embed</h3>
            <p className="text-dark-400 text-sm">Easiest option - just paste this code</p>
          </div>
        </div>
        <div className="relative">
          <pre className="bg-dark-800 p-4 rounded-lg text-sm overflow-x-auto text-dark-300">
            {iframeCode}
          </pre>
          <button
            onClick={() => copyToClipboard(iframeCode, 'iframe')}
            className="absolute top-2 right-2 p-2 bg-dark-700 rounded-lg hover:bg-dark-600"
          >
            {copied === 'iframe' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-dark-400" />
            )}
          </button>
        </div>
      </div>

      {/* Script Embed */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">JavaScript Embed</h3>
            <p className="text-dark-400 text-sm">More customizable, loads asynchronously</p>
          </div>
        </div>
        <div className="relative">
          <pre className="bg-dark-800 p-4 rounded-lg text-sm overflow-x-auto text-dark-300">
            {scriptCode}
          </pre>
          <button
            onClick={() => copyToClipboard(scriptCode, 'script')}
            className="absolute top-2 right-2 p-2 bg-dark-700 rounded-lg hover:bg-dark-600"
          >
            {copied === 'script' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-dark-400" />
            )}
          </button>
        </div>
      </div>

      {/* API Endpoint */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">API Endpoint</h3>
            <p className="text-dark-400 text-sm">For custom integrations</p>
          </div>
        </div>
        <div className="relative">
          <pre className="bg-dark-800 p-4 rounded-lg text-sm overflow-x-auto text-dark-300">
            {apiEndpoint}
          </pre>
          <button
            onClick={() => copyToClipboard(apiEndpoint, 'api')}
            className="absolute top-2 right-2 p-2 bg-dark-700 rounded-lg hover:bg-dark-600"
          >
            {copied === 'api' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-dark-400" />
            )}
          </button>
        </div>
      </div>

      {/* Chat Widget */}
      <div className="card border-2 border-primary-500/30 bg-gradient-to-br from-primary-900/10 to-dark-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Live Chat Widget</h3>
            <p className="text-dark-400 text-sm">Add a chat bubble to your website - AI responds instantly</p>
          </div>
          <span className="ml-auto px-2 py-1 bg-primary-500/20 text-primary-400 text-xs font-medium rounded-full">NEW</span>
        </div>
        <div className="relative">
          <pre className="bg-dark-800 p-4 rounded-lg text-sm overflow-x-auto text-dark-300">
            {chatWidgetCode}
          </pre>
          <button
            onClick={() => copyToClipboard(chatWidgetCode, 'chat')}
            className="absolute top-2 right-2 p-2 bg-dark-700 rounded-lg hover:bg-dark-600"
          >
            {copied === 'chat' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-dark-400" />
            )}
          </button>
        </div>
        <p className="text-dark-500 text-xs mt-3">
          Place this code before the closing &lt;/body&gt; tag on your website
        </p>
      </div>

      {/* Webhook */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Webhook Events</h3>
            <p className="text-dark-400 text-sm">Receive real-time updates</p>
          </div>
        </div>
        <div className="relative">
          <pre className="bg-dark-800 p-4 rounded-lg text-sm overflow-x-auto text-dark-300">
            {webhookExample}
          </pre>
          <button
            onClick={() => copyToClipboard(webhookExample, 'webhook')}
            className="absolute top-2 right-2 p-2 bg-dark-700 rounded-lg hover:bg-dark-600"
          >
            {copied === 'webhook' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-dark-400" />
            )}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="card">
        <h3 className="text-lg font-medium text-white mb-4">Preview</h3>
        <p className="text-dark-400 text-sm mb-4">
          This is how your form will look when embedded
        </p>
        <div className="bg-dark-800 rounded-lg p-8 border border-dark-700">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-center mb-6">
              <h4 className="text-xl font-bold text-white">Get Started Today</h4>
              <p className="text-dark-400 text-sm">Fill out the form and we'll be in touch</p>
            </div>
            <input className="input" placeholder="Your Name" />
            <input className="input" placeholder="Email Address" />
            <input className="input" placeholder="Phone Number" />
            <select className="input">
              <option>What are you interested in?</option>
              <option>Business Credit</option>
              <option>Funding</option>
              <option>LLC Formation</option>
            </select>
            <button className="btn btn-primary w-full">Submit</button>
          </div>
        </div>
      </div>

      {/* Workspace ID */}
      <div className="card bg-dark-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-white">Workspace ID</h4>
            <p className="text-dark-400 text-xs mt-1">Use this in your integrations</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="px-3 py-1.5 bg-dark-700 rounded text-sm text-primary-400">
              {workspaceId}
            </code>
            <button
              onClick={() => copyToClipboard(workspaceId || '', 'workspace')}
              className="p-2 bg-dark-700 rounded-lg hover:bg-dark-600"
            >
              {copied === 'workspace' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-dark-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
