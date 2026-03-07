import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getServiceClient } from '@/lib/admin/auth';

// GET - List all users with pagination and filters
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabase = getServiceClient();

    let query = supabase
      .from('users')
      .select(`
        *,
        workspace_members (
          workspace:workspaces (
            id,
            name,
            subscription_plan,
            subscription_status,
            messages_used,
            messages_limit
          )
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error loading users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      users,
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, full_name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || '',
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Create user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        full_name: full_name || '',
      })
      .select()
      .single();

    if (userError) {
      console.error('User record error:', userError);
      // Clean up auth user if user record creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Admin users POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete multiple users
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('ids')?.split(',') || [];

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'No user IDs provided' }, { status: 400 });
    }

    const supabase = getServiceClient();

    for (const userId of userIds) {
      // Get user's workspace
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)
        .single();

      if (membership) {
        // Delete workspace data
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
    }

    return NextResponse.json({ success: true, deleted: userIds.length });
  } catch (error: any) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
