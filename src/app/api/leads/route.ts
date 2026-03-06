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

// Helper to get user's workspace
async function getUserWorkspace(userId: string) {
  const supabase = getServiceClient();
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  return membership?.workspace_id;
}

// GET - List leads for authenticated user
export async function GET(request: NextRequest) {
  try {
    const authClient = getAuthClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const workspaceId = await getUserWorkspace(user.id);
    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Error loading leads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      leads,
      total: count || 0,
      workspace_id: workspaceId
    });
  } catch (error: any) {
    console.error('Leads GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create lead (supports both authenticated and public requests)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceClient();

    let workspaceId = body.workspaceId;

    // If no workspaceId provided, try to get it from authenticated user
    if (!workspaceId) {
      const authClient = getAuthClient();
      const { data: { user } } = await authClient.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Not authenticated and no workspaceId provided' }, { status: 401 });
      }

      workspaceId = await getUserWorkspace(user.id);
      if (!workspaceId) {
        return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
      }
    }

    // Validate required fields
    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json({ error: 'Name, email, and phone are required' }, { status: 400 });
    }

    // Get workspace to check limits
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Invalid workspace' }, { status: 404 });
    }

    // Create lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        workspace_id: workspaceId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        service_interested: body.service_interested || null,
        notes: body.notes || null,
        source: body.source || 'manual',
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error('Leads POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update lead
export async function PATCH(request: NextRequest) {
  try {
    const authClient = getAuthClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const workspaceId = await getUserWorkspace(user.id);
    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data: lead, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error('Leads PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete lead
export async function DELETE(request: NextRequest) {
  try {
    const authClient = getAuthClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const workspaceId = await getUserWorkspace(user.id);
    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error deleting lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Leads DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
