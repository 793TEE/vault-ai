'use client';

import Link from 'next/link';
import { Zap, Mail, MessageSquare, FileText, ExternalLink, Copy } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      <Toaster position="top-center" />
      <nav className="border-b border-dark-800 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">Vault AI</span>
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">How can we help?</h1>
          <p className="text-dark-400">Get the support you need to succeed with Vault AI</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={() => {
              navigator.clipboard.writeText('support@hissecretvault.net');
              toast.success('Email copied to clipboard!');
            }}
            className="card hover:border-primary-500/50 transition-colors group text-left"
          >
            <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-500/20">
              <Mail className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Email Support</h3>
            <p className="text-dark-400 text-sm">Get help via email within 24 hours</p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-primary-400 text-sm">support@hissecretvault.net</p>
              <Copy className="w-4 h-4 text-primary-400" />
            </div>
          </button>

          <div className="card">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Live Chat</h3>
            <p className="text-dark-400 text-sm">Chat with our team in real-time</p>
            <p className="text-dark-500 text-sm mt-2">Available 9am - 6pm EST</p>
          </div>

          <div className="card">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Documentation</h3>
            <p className="text-dark-400 text-sm">Browse our help articles and guides</p>
            <p className="text-dark-500 text-sm mt-2">Coming soon</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'How do I add the lead form to my website?',
                a: 'Go to Settings > Embed & Integrate to get your embed code. Simply paste the iframe or script into your website.',
              },
              {
                q: 'How does the AI respond to leads?',
                a: 'Our AI uses GPT-4 to generate personalized responses based on your business settings, offer details, and the conversation context.',
              },
              {
                q: 'Can I customize the AI responses?',
                a: 'Yes! Go to Settings > AI Configuration to set your tone, offer details, pricing info, and objection handling guidelines.',
              },
              {
                q: 'What happens when I reach my message limit?',
                a: 'You\'ll receive a notification. Upgrade your plan or wait for your billing cycle to reset to continue sending AI messages.',
              },
              {
                q: 'How do I cancel my subscription?',
                a: 'Go to Settings > Billing and click "Cancel Subscription". Your access continues until the end of your billing period.',
              },
            ].map((faq, i) => (
              <div key={i} className="p-4 bg-dark-800/50 rounded-lg">
                <h3 className="font-medium text-white mb-2">{faq.q}</h3>
                <p className="text-dark-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
