import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getServiceClient } from '@/lib/admin/auth';

// GET - Get admin data
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const supabase = getServiceClient();

    if (action === 'users') {
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      return NextResponse.json({ users });
    }

    if (action === 'workspaces') {
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select(`
          *,
          users!workspaces_owner_id_fkey (email, full_name)
        `)
        .order('created_at', { ascending: false });

      return NextResponse.json({ workspaces });
    }

    if (action === 'stats') {
      // Basic counts
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: totalWorkspaces } = await supabase
        .from('workspaces')
        .select('*', { count: 'exact', head: true });

      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      const { count: totalConversations } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

      const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      // Revenue calculations
      const { data: activeWorkspaces } = await supabase
        .from('workspaces')
        .select('subscription_plan, subscription_status')
        .eq('subscription_status', 'active');

      const planPricing: Record<string, number> = {
        starter: 97,
        growth: 197,
        scale: 497,
      };

      let mrr = 0;
      activeWorkspaces?.forEach((ws) => {
        if (ws.subscription_plan && planPricing[ws.subscription_plan]) {
          mrr += planPricing[ws.subscription_plan];
        }
      });

      // Message usage
      const { data: allWorkspaces } = await supabase
        .from('workspaces')
        .select('messages_used, messages_limit');

      let totalMessagesUsed = 0;
      let totalMessagesLimit = 0;

      allWorkspaces?.forEach((ws) => {
        totalMessagesUsed += ws.messages_used || 0;
        totalMessagesLimit += ws.messages_limit || 0;
      });

      return NextResponse.json({
        totalUsers: totalUsers || 0,
        totalWorkspaces: totalWorkspaces || 0,
        totalLeads: totalLeads || 0,
        totalConversations: totalConversations || 0,
        totalAppointments: totalAppointments || 0,
        mrr,
        arr: mrr * 12,
        messagesUsed: totalMessagesUsed,
        messagesLimit: totalMessagesLimit,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Admin actions
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;
    const supabase = getServiceClient();

    // Update user
    if (action === 'update_user') {
      const { userId, data } = body;
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', userId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Delete user and their workspace
    if (action === 'delete_user') {
      const { userId } = body;

      // Get user's workspace
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)
        .single();

      if (membership) {
        // Delete workspace data
        await supabase.from('leads').delete().eq('workspace_id', membership.workspace_id);
        await supabase.from('conversations').delete().eq('workspace_id', membership.workspace_id);
        await supabase.from('appointments').delete().eq('workspace_id', membership.workspace_id);
        await supabase.from('followup_sequences').delete().eq('workspace_id', membership.workspace_id);
        await supabase.from('followup_queue').delete().eq('workspace_id', membership.workspace_id);
        await supabase.from('workspace_members').delete().eq('workspace_id', membership.workspace_id);
        await supabase.from('workspaces').delete().eq('id', membership.workspace_id);
      }

      // Delete user
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;

      // Delete from auth (requires admin API)
      await supabase.auth.admin.deleteUser(userId);

      return NextResponse.json({ success: true });
    }

    // Update workspace
    if (action === 'update_workspace') {
      const { workspaceId, data } = body;
      const { error } = await supabase
        .from('workspaces')
        .update(data)
        .eq('id', workspaceId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Reset user password (send reset email)
    if (action === 'reset_password') {
      const { email } = body;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vault-ai.vercel.app'}/reset-password`,
      });

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Update platform settings
    if (action === 'update_settings') {
      // Store settings in a special admin_settings table or workspace
      const { settings } = body;
      // For now, just return success
      return NextResponse.json({ success: true, settings });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
