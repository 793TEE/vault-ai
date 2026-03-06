import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  MessageSquare,
  Mail,
  Phone,
  Zap,
  Clock,
  User,
  ArrowRight,
  Search,
} from 'lucide-react';
import Link from 'next/link';

async function getConversations(workspaceId: string) {
  const supabase = createServerSupabaseClient();

  // Get all leads with their latest message
  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      conversations (
        id,
        channel,
        direction,
        content,
        ai_generated,
        created_at
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
    .limit(50);

  // Process leads to get conversation summaries
  const conversationSummaries = leads?.map((lead) => {
    const messages = lead.conversations || [];
    const lastMessage = messages.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const unreadCount = messages.filter((m: any) =>
      m.direction === 'inbound' &&
      new Date(m.created_at) > new Date(lead.last_contacted_at || 0)
    ).length;

    return {
      lead,
      lastMessage,
      messageCount: messages.length,
      unreadCount,
    };
  }) || [];

  return conversationSummaries;
}

export default async function ConversationsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!membership) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-dark-400">No workspace found.</p>
      </div>
    );
  }

  const conversations = await getConversations(membership.workspace_id);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Conversations</h1>
          <p className="text-dark-400 mt-1">All your lead conversations in one place</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="search"
            placeholder="Search conversations..."
            className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none w-full sm:w-64"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Unread', 'SMS', 'Email', 'AI Handled'].map((filter) => (
          <button
            key={filter}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'All'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Conversation List */}
      <div className="space-y-2">
        {conversations.length > 0 ? (
          conversations.map(({ lead, lastMessage, messageCount, unreadCount }) => (
            <Link
              key={lead.id}
              href={`/conversations/${lead.id}`}
              className="block bg-dark-900 border border-dark-800 rounded-xl p-4 hover:border-dark-700 transition-colors group"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                      {unreadCount}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white truncate">{lead.name}</h3>
                    <span className="text-xs text-dark-500 whitespace-nowrap ml-2">
                      {lastMessage
                        ? new Date(lastMessage.created_at).toLocaleDateString()
                        : 'No messages'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-dark-400 truncate">{lead.email}</span>
                    {lead.phone && (
                      <>
                        <span className="text-dark-600">•</span>
                        <span className="text-sm text-dark-400">{lead.phone}</span>
                      </>
                    )}
                  </div>

                  {lastMessage && (
                    <div className="flex items-center gap-2">
                      {lastMessage.channel === 'sms' ? (
                        <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      )}
                      {lastMessage.ai_generated && (
                        <Zap className="w-4 h-4 text-primary-400 flex-shrink-0" />
                      )}
                      <p className={`text-sm truncate ${
                        lastMessage.direction === 'inbound' ? 'text-dark-300' : 'text-dark-500'
                      }`}>
                        {lastMessage.direction === 'outbound' && 'You: '}
                        {lastMessage.content}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status & Arrow */}
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    lead.status === 'new' ? 'badge-info' :
                    lead.status === 'contacted' ? 'badge-warning' :
                    lead.status === 'qualified' ? 'badge-primary' :
                    lead.status === 'booked' ? 'badge-success' :
                    'badge-danger'
                  }`}>
                    {lead.status}
                  </span>
                  <ArrowRight className="w-5 h-5 text-dark-600 group-hover:text-dark-400 transition-colors" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-dark-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
            <p className="text-dark-400 mb-6">
              Conversations will appear here when leads start engaging
            </p>
            <Link href="/settings/embed" className="btn btn-primary">
              Get Your Embed Code
            </Link>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {conversations.length > 0 && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-400" />
              <span className="text-dark-400">
                {conversations.reduce((acc, c) => acc + c.messageCount, 0)} total messages
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="text-dark-400">{conversations.length} conversations</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-dark-400">
                {conversations.filter(c => c.lastMessage?.ai_generated).length} AI handled
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
