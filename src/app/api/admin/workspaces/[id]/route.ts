import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getServiceClient } from '@/lib/admin/auth';

// GET - Get single workspace details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getServiceClient();
    const workspaceId = params.id;

    // Get workspace with owner details
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        users!workspaces_owner_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        ),
        workspace_members (
          user:users (
            id,
            email,
            full_name,
            avatar_url
          ),
          role
        )
      `)
      .eq('id', workspaceId)
      .single();

    if (error) {
      console.error('Error loading workspace:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get detailed stats
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    const { count: conversationsCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    const { count: appointmentsCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    const { count: messagesCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    // Get recent leads
    const { data: recentLeads } = await supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      workspace,
      stats: {
        leads: leadsCount || 0,
        conversations: conversationsCount || 0,
        appointments: appointmentsCount || 0,
        messages: messagesCount || 0,
      },
      recentLeads: recentLeads || [],
    });
  } catch (error: any) {
    console.error('Admin workspace GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update workspace
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const workspaceId = params.id;
    const body = await request.json();
    const {
      name,
      subscription_plan,
      subscription_status,
      messages_limit,
      messages_used,
      trial_ends_at,
      current_period_end,
    } = body;

    const supabase = getServiceClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (subscription_plan !== undefined) updateData.subscription_plan = subscription_plan;
    if (subscription_status !== undefined) updateData.subscription_status = subscription_status;
    if (messages_limit !== undefined) updateData.messages_limit = messages_limit;
    if (messages_used !== undefined) updateData.messages_used = messages_used;
    if (trial_ends_at !== undefined) updateData.trial_ends_at = trial_ends_at;
    if (current_period_end !== undefined) updateData.current_period_end = current_period_end;

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('Workspace update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, workspace });
  } catch (error: any) {
    console.error('Admin workspace PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const workspaceId = params.id;
    const supabase = getServiceClient();

    // Delete all workspace data
    await supabase.from('messages').delete().eq('workspace_id', workspaceId);
    await supabase.from('leads').delete().eq('workspace_id', workspaceId);
    await supabase.from('conversations').delete().eq('workspace_id', workspaceId);
    await supabase.from('appointments').delete().eq('workspace_id', workspaceId);
    await supabase.from('followup_sequences').delete().eq('workspace_id', workspaceId);
    await supabase.from('followup_queue').delete().eq('workspace_id', workspaceId);
    await supabase.from('workspace_members').delete().eq('workspace_id', workspaceId);

    const { error } = await supabase.from('workspaces').delete().eq('id', workspaceId);

    if (error) {
      console.error('Workspace deletion error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin workspace DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
