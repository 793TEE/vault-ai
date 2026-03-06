'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage' }),
      });

      const data = await res.json();

      if (data.status === 'subscribed' || data.status === 'resubscribed') {
        setMessageType('success');
        setMessage("You're subscribed! Check your email for a welcome message.");
        setEmail('');
      } else if (data.status === 'exists') {
        setMessageType('success');
        setMessage("You're already subscribed!");
      } else {
        setMessageType('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setMessageType('error');
      setMessage('Connection error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="px-6 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none min-w-[300px]"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary px-8 py-3 disabled:opacity-50"
        >
          {loading ? 'Subscribing...' : 'Subscribe Free'}
        </button>
      </form>
      {message && (
        <p className={`mt-4 ${messageType === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
      <p className="text-dark-500 text-sm mt-4">No spam. Unsubscribe anytime.</p>
    </div>
  );
}
