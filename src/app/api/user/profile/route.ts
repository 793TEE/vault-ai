import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const authClient = getAuthClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getServiceClient();

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get workspace/subscription data
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single();

    let subscription = null;
    if (membership) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('subscription_status, subscription_plan, messages_used, messages_limit, current_period_end')
        .eq('id', membership.workspace_id)
        .single();

      if (workspace) {
        subscription = {
          status: workspace.subscription_status,
          plan: workspace.subscription_plan,
          messages_used: workspace.messages_used,
          messages_limit: workspace.messages_limit,
          trial_end: workspace.current_period_end,
        };
      }
    }

    return NextResponse.json({
      user: userData || {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
      },
      subscription,
    });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const authClient = getAuthClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, avatar_url } = body;

    const supabase = getServiceClient();

    // Update users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (userError) {
      console.error('User update error:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Update auth metadata
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        full_name,
        avatar_url,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const authClient = getAuthClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getServiceClient();

    // Get user's workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single();

    if (membership) {
      // Delete all workspace data
      await supabase.from('leads').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('conversations').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('appointments').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('followup_sequences').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('followup_queue').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('workspace_members').delete().eq('workspace_id', membership.workspace_id);
      await supabase.from('workspaces').delete().eq('id', membership.workspace_id);
    }

    // Delete user record
    await supabase.from('users').delete().eq('id', user.id);

    // Delete auth user
    await supabase.auth.admin.deleteUser(user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Profile DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
