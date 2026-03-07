export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getServiceClient } from '@/lib/admin/auth';

// GET - List all conversations across all workspaces
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const workspaceId = searchParams.get('workspaceId');
    const leadId = searchParams.get('leadId');

    const supabase = getServiceClient();

    let query = supabase
      .from('conversations')
      .select(`
        *,
        lead:leads (
          id,
          name,
          email,
          phone
        ),
        workspace:workspaces (
          id,
          name,
          users!workspaces_owner_id_fkey (
            email,
            full_name
          )
        )
      `, { count: 'exact' });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    query = query.order('created_at', { ascending: false });
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: conversations, error, count } = await query;

    if (error) {
      console.error('Error loading conversations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get message counts for each conversation
    const conversationsWithCounts = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { count: messageCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        return {
          ...conv,
          message_count: messageCount || 0,
        };
      })
    );

    return NextResponse.json({
      conversations: conversationsWithCounts,
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Admin conversations GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete conversations
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const conversationIds = searchParams.get('ids')?.split(',') || [];

    if (conversationIds.length === 0) {
      return NextResponse.json({ error: 'No conversation IDs provided' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Delete messages first
    await supabase
      .from('messages')
      .delete()
      .in('conversation_id', conversationIds);

    // Delete conversations
    const { error } = await supabase
      .from('conversations')
      .delete()
      .in('id', conversationIds);

    if (error) {
      console.error('Conversations deletion error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: conversationIds.length });
  } catch (error: any) {
    console.error('Admin conversations DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
