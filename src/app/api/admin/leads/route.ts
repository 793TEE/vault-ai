import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getServiceClient } from '@/lib/admin/auth';

// GET - List all leads across all workspaces
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const workspaceId = searchParams.get('workspaceId');

    const supabase = getServiceClient();

    let query = supabase
      .from('leads')
      .select(`
        *,
        workspace:workspaces (
          id,
          name,
          users!workspaces_owner_id_fkey (
            email,
            full_name
          )
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    query = query.order('created_at', { ascending: false });
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Error loading leads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      leads,
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Admin leads GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update lead status or details
export async function PATCH(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: lead, error } = await supabase
      .from('leads')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Lead update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error('Admin lead PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete leads
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const leadIds = searchParams.get('ids')?.split(',') || [];

    if (leadIds.length === 0) {
      return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { error } = await supabase
      .from('leads')
      .delete()
      .in('id', leadIds);

    if (error) {
      console.error('Leads deletion error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: leadIds.length });
  } catch (error: any) {
    console.error('Admin leads DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
