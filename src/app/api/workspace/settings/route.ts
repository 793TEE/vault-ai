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

export async function PATCH(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authClient = getAuthClient();
    const { data: { user }, error: userError } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use service role to bypass RLS
    const supabase = getServiceClient();

    // Get user's workspace
    const { data: membership, error: memberError } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (memberError || !membership) {
      console.error('Membership error:', memberError);

      // Try to create workspace if it doesn't exist
      const slug = `${user.email?.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${user.id.substring(0, 8)}`;

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        await supabase.from('users').insert({ id: user.id, email: user.email });
      }

      // Create workspace
      const { data: newWorkspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name: 'My Workspace',
          slug,
          owner_id: user.id,
          subscription_status: 'trialing',
          subscription_plan: 'starter',
          messages_limit: 500,
        })
        .select()
        .single();

      if (wsError || !newWorkspace) {
        console.error('Workspace creation error:', wsError);
        return NextResponse.json({ error: 'Could not create workspace' }, { status: 500 });
      }

      // Add membership
      await supabase.from('workspace_members').insert({
        workspace_id: newWorkspace.id,
        user_id: user.id,
        role: 'owner',
      });

      // Now update with the body
      const body = await request.json();
      const updateData = buildUpdateData(body);

      const { data, error } = await supabase
        .from('workspaces')
        .update(updateData)
        .eq('id', newWorkspace.id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        return NextResponse.json({ error: 'Failed to apply template' }, { status: 500 });
      }

      return NextResponse.json({ success: true, workspace: data });
    }

    // Get the update data
    const body = await request.json();
    const updateData = buildUpdateData(body);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update the workspace
    const { data, error } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', membership.workspace_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workspace:', error);
      return NextResponse.json({
        error: 'Failed to update settings',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, workspace: data });
  } catch (error: any) {
    console.error('Workspace settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function buildUpdateData(body: any): Record<string, any> {
  const allowedFields = [
    'name',
    'business_type',
    'timezone',
    'booking_link',
    'ai_enabled',
    'ai_tone',
    'ai_system_prompt',
    'ai_offer_details',
    'ai_pricing_info',
    'ai_objection_handling',
    'sendgrid_from_email',
  ];

  const updateData: Record<string, any> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }
  return updateData;
}

export async function GET(request: NextRequest) {
  try {
    const authClient = getAuthClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getServiceClient();

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', membership.workspace_id)
      .single();

    return NextResponse.json({ workspace });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
