'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatWidget({ params }: { params: { workspaceId: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState({ name: '', email: '', phone: '' });
  const [showForm, setShowForm] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorInfo.name || !visitorInfo.email) return;

    setShowForm(false);
    setIsLoading(true);

    // Create lead
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: params.workspaceId,
          name: visitorInfo.name,
          email: visitorInfo.email,
          phone: visitorInfo.phone || '',
          source: 'chat_widget',
        }),
      });

      if (res.ok) {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: `Hi ${visitorInfo.name.split(' ')[0]}! Thanks for reaching out. How can I help you today?`,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
    }

    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (in production, this would call your AI endpoint)
    setTimeout(() => {
      const responses = [
        "That's a great question! Let me help you with that.",
        "I understand. Would you like to schedule a call to discuss this further?",
        "Absolutely! We specialize in exactly that. Can you tell me more about your specific needs?",
        "Thanks for sharing that. Based on what you've told me, I think we'd be a great fit. Want me to send you our booking link?",
      ];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Chat with us</h3>
                  <p className="text-xs text-white/70">We typically reply instantly</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-white/70 hover:text-white transition-colors"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="h-80 overflow-y-auto p-4 bg-gray-50">
            {showForm ? (
              <form onSubmit={handleStartChat} className="space-y-4">
                <div className="text-center mb-6">
                  <h4 className="font-semibold text-gray-800">Start a conversation</h4>
                  <p className="text-sm text-gray-500">We'll get back to you right away</p>
                </div>
                <input
                  type="text"
                  placeholder="Your name"
                  value={visitorInfo.name}
                  onChange={(e) => setVisitorInfo(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={visitorInfo.email}
                  onChange={(e) => setVisitorInfo(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={visitorInfo.phone}
                  onChange={(e) => setVisitorInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Start Chat
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 rounded-bl-md">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {!showForm && (
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Powered by */}
          <div className="px-4 py-2 bg-gray-100 text-center">
            <a
              href="https://my-vaultais.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Powered by Vault AI
            </a>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-800 rotate-0'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-110'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
