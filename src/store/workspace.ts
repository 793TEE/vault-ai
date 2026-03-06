import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace } from '@/types/database';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  updateCurrentWorkspace: (updates: Partial<Workspace>) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      workspaces: [],
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      updateCurrentWorkspace: (updates) =>
        set((state) => ({
          currentWorkspace: state.currentWorkspace
            ? { ...state.currentWorkspace, ...updates }
            : null,
        })),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({ currentWorkspace: state.currentWorkspace }),
    }
  )
);
