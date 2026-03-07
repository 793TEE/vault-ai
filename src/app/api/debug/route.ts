export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const results: any = {
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    tables: {},
    errors: [],
  };

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Test each table
    const tables = ['users', 'workspaces', 'workspace_members', 'leads', 'conversations', 'appointments'];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.tables[table] = { exists: false, error: error.message };
        } else {
          results.tables[table] = { exists: true, count };
        }
      } catch (e: any) {
        results.tables[table] = { exists: false, error: e.message };
      }
    }

  } catch (e: any) {
    results.errors.push(e.message);
  }

  return NextResponse.json(results);
}
