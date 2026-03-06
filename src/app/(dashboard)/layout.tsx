import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  let workspace = null;
  if (membership) {
    const { data } = await supabase
      .from('workspaces')
      .select('name, subscription_plan')
      .eq('id', membership.workspace_id)
      .single();
    workspace = data;
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Sidebar workspace={workspace || undefined} />
      <main className="pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
