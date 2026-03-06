import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role to bypass RLS
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

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    // If user doesn't exist in users table, create them
    if (!existingUser) {
      const { error: insertUserError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
        });

      if (insertUserError) {
        console.error('Error creating user:', insertUserError);
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
      }
    }

    // Check if user has a workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (membership) {
      return NextResponse.json({
        success: true,
        message: 'Workspace already exists',
        workspaceId: membership.workspace_id
      });
    }

    // Create a new workspace for the user
    const slug = `${user.email?.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${user.id.substring(0, 8)}`;

    const { data: workspace, error: workspaceError } = await supabase
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

    if (workspaceError) {
      console.error('Error creating workspace:', workspaceError);
      return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
    }

    // Add user as owner of the workspace
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Error creating membership:', memberError);
      return NextResponse.json({ error: 'Failed to add workspace membership' }, { status: 500 });
    }

    // Create a default follow-up sequence
    await supabase.from('followup_sequences').insert({
      workspace_id: workspace.id,
      name: 'Default Follow-up',
      steps: [
        { delay_hours: 24, channel: 'email', subject: 'Following up on your inquiry', template: 'Hi {name}! Just checking in about your inquiry. Any questions I can help with?' },
        { delay_hours: 48, channel: 'email', subject: 'Quick follow-up', template: 'Hi {name}, Wanted to make sure you saw my last message. We have limited availability this week - shall I save a spot for you?' },
        { delay_hours: 72, channel: 'email', subject: 'Last follow-up', template: 'Hey {name}, this is my last follow-up. If you are still interested, I would love to help. Otherwise, no worries!' },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Workspace created successfully',
      workspaceId: workspace.id
    });
  } catch (error: any) {
    console.error('Init workspace error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
