export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getServiceClient } from '@/lib/admin/auth';

// GET - List all workspaces with pagination and filters
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const plan = searchParams.get('plan');
    const status = searchParams.get('status');

    const supabase = getServiceClient();

    let query = supabase
      .from('workspaces')
      .select(`
        *,
        users!workspaces_owner_id_fkey (
          id,
          email,
          full_name
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%`);
    }

    if (plan && plan !== 'all') {
      query = query.eq('subscription_plan', plan);
    }

    if (status && status !== 'all') {
      query = query.eq('subscription_status', status);
    }

    query = query.order('created_at', { ascending: false });
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: workspaces, error, count } = await query;

    if (error) {
      console.error('Error loading workspaces:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get stats for each workspace
    const workspacesWithStats = await Promise.all(
      (workspaces || []).map(async (ws) => {
        const { count: leadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', ws.id);

        const { count: conversationsCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', ws.id);

        return {
          ...ws,
          stats: {
            leads: leadsCount || 0,
            conversations: conversationsCount || 0,
          },
        };
      })
    );

    return NextResponse.json({
      workspaces: workspacesWithStats,
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Admin workspaces GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new workspace
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { owner_id, name, subscription_plan, messages_limit } = body;

    if (!owner_id || !name) {
      return NextResponse.json({ error: 'Owner ID and name required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        owner_id,
        name,
        subscription_plan: subscription_plan || 'starter',
        subscription_status: 'active',
        messages_limit: messages_limit || 500,
        messages_used: 0,
      })
      .select()
      .single();

    if (workspaceError) {
      console.error('Workspace creation error:', workspaceError);
      return NextResponse.json({ error: workspaceError.message }, { status: 500 });
    }

    // Add owner as member
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: owner_id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      // Clean up workspace
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, workspace });
  } catch (error: any) {
    console.error('Admin workspaces POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
