import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Service role client to bypass RLS and handle user creation
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

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const userId = authData.user.id;

    // Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      // Create user record
      const { error: userError } = await supabase.from('users').insert({
        id: userId,
        email: email,
        full_name: fullName || null,
      });

      if (userError) {
        console.error('User creation error:', userError);
        // Don't fail - user might already exist
      }
    }

    // Create workspace for user
    const slug = `${email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${userId.substring(0, 8)}`;

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: fullName ? `${fullName}'s Workspace` : 'My Workspace',
        slug,
        owner_id: userId,
        subscription_status: 'trialing',
        subscription_plan: 'starter',
        messages_limit: 500,
        messages_used: 0,
        ai_enabled: true,
      })
      .select()
      .single();

    if (wsError) {
      console.error('Workspace creation error:', wsError);
      // Continue anyway - workspace can be created on first login
    }

    // Create workspace membership
    if (workspace) {
      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner',
      });

      // Create default follow-up sequence
      await supabase.from('followup_sequences').insert({
        workspace_id: workspace.id,
        name: 'Default Follow-up',
        is_active: true,
        steps: [
          { delay_hours: 24, channel: 'email', subject: 'Following up', template: 'Hi {name}! Just checking in about your inquiry.' },
          { delay_hours: 48, channel: 'email', subject: 'Quick follow-up', template: 'Hi {name}, Wanted to make sure you saw my last message.' },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
