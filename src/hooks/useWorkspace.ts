'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Workspace } from '@/types/database';

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get workspaces user belongs to
      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id);

      if (!memberships || memberships.length === 0) {
        setLoading(false);
        return;
      }

      const workspaceIds = memberships.map(m => m.workspace_id);

      const { data: workspaceData } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds);

      if (workspaceData) {
        setWorkspaces(workspaceData);
        // Set first workspace as default if none selected
        if (!workspace && workspaceData.length > 0) {
          setWorkspace(workspaceData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws) {
      setWorkspace(ws);
      // Store in localStorage for persistence
      localStorage.setItem('activeWorkspaceId', workspaceId);
    }
  };

  const updateWorkspace = async (updates: Partial<Workspace>) => {
    if (!workspace) return;

    const { data, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspace.id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setWorkspace(data);
      setWorkspaces(prev => prev.map(w => w.id === data.id ? data : w));
    }
    return data;
  };

  return {
    workspace,
    workspaces,
    loading,
    switchWorkspace,
    updateWorkspace,
    refreshWorkspaces: loadWorkspaces,
  };
}
