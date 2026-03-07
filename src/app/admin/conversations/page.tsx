'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    loadConversations();
  }, [page]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(`/api/admin/conversations?${params}`);
      const data = await res.json();

      if (res.ok) {
        setConversations(data.conversations || []);
        setTotal(data.total || 0);
      } else {
        toast.error(data.error || 'Failed to load conversations');
      }
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-dark-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">All Conversations</h1>
            <p className="text-sm text-dark-400">{total} total conversations</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Conversations Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No conversations found</h3>
            <p className="text-dark-400">Conversations will appear here once users start chatting</p>
          </div>
        ) : (
          <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800/50 border-b border-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Lead</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Workspace</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Channel</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Messages</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Started</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-400">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {conversations.map((conv) => {
                    const lead = conv.lead;
                    const workspace = conv.workspace;
                    return (
                      <tr key={conv.id} className="hover:bg-dark-800/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{lead?.name || 'Unknown Lead'}</p>
                          <p className="text-xs text-dark-400">{lead?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white">{workspace?.name || 'Unknown'}</p>
                          <p className="text-xs text-dark-400">{workspace?.users?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            conv.channel === 'sms' ? 'bg-blue-500/20 text-blue-400' :
                            conv.channel === 'email' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {conv.channel || 'chat'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">{conv.message_count || 0}</td>
                        <td className="px-4 py-3 text-sm text-dark-400">
                          {new Date(conv.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-400">
                          {conv.last_message_at
                            ? new Date(conv.last_message_at).toLocaleDateString()
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-dark-800 flex items-center justify-between">
                <p className="text-sm text-dark-400">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed text-dark-400"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-white">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed text-dark-400"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
