export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getServiceClient } from '@/lib/admin/auth';

// GET - Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getServiceClient();
    const userId = params.id;

    // Get user with workspace details
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        workspace_members (
          workspace:workspaces (
            *
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get workspace stats if user has workspace
    let workspaceStats = null;
    const workspace = user.workspace_members?.[0]?.workspace;

    if (workspace) {
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      workspaceStats = {
        leads: leadsCount || 0,
        conversations: conversationsCount || 0,
        appointments: appointmentsCount || 0,
      };
    }

    return NextResponse.json({
      user,
      workspaceStats,
    });
  } catch (error: any) {
    console.error('Admin user GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update user (plan, admin status, profile)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = params.id;
    const body = await request.json();
    const { email, full_name, plan, messages_limit, subscription_status } = body;

    const supabase = getServiceClient();

    // Update user profile if provided
    if (email || full_name) {
      await supabase.from('users').update({
        ...(email && { email }),
        ...(full_name && { full_name }),
        updated_at: new Date().toISOString(),
      }).eq('id', userId);

      if (email || full_name) {
        await supabase.auth.admin.updateUserById(userId, {
          ...(email && { email }),
          ...(full_name && { user_metadata: { full_name } }),
        });
      }
    }

    // Update workspace plan/limits if provided
    if (plan || messages_limit !== undefined || subscription_status) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (membership) {
        const planLimits: Record<string, number> = {
          starter: 500,
          growth: 2000,
          scale: 999999999,
        };

        await supabase.from('workspaces').update({
          ...(plan && { subscription_plan: plan }),
          ...(plan && { messages_limit: planLimits[plan] ?? messages_limit ?? 500 }),
          ...(messages_limit !== undefined && { messages_limit }),
          ...(subscription_status && { subscription_status }),
        }).eq('id', membership.workspace_id);
      }
    }

    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Admin user PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete single user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = params.id;
    const supabase = getServiceClient();

    // Get user's workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .single();

    if (membership) {
      // Delete all workspace data
      await supabase.from('messages').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('leads').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('conversations').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('appointments').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('followup_sequences').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('followup_queue').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('workspace_members').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('workspaces').delete().eq('id', membership.workspace_id);
    }

    // Delete user
    await supabase.from('users').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin user DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
