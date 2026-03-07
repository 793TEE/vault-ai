import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAILS = ['infohissecretvault23@gmail.com'];

// Service role client to bypass RLS
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// Auth client to verify user
const getAuthClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete(name);
        },
      },
    }
  );
};

// Check if user is admin
async function isAdmin() {
  const authClient = getAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  return user && ADMIN_EMAILS.includes(user.email || '');
}

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
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: totalWorkspaces } = await supabase
        .from('workspaces')
        .select('*', { count: 'exact', head: true });

      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      const { count: totalMessages } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

      return NextResponse.json({
        totalUsers: totalUsers || 0,
        totalWorkspaces: totalWorkspaces || 0,
        totalLeads: totalLeads || 0,
        totalMessages: totalMessages || 0,
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
