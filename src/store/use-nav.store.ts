import { create } from 'zustand';
import { Columns3, Settings2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type WorkspaceView = 'board' | 'settings';

export interface ViewMetaItem {
  label: string;
  icon: LucideIcon;
  iconClass: string;
}

export const viewMeta: Record<WorkspaceView, ViewMetaItem> = {
  board:    { label: 'Board',    icon: Columns3,  iconClass: 'size-4'   },
  settings: { label: 'Settings', icon: Settings2, iconClass: 'size-3.5' },
};

interface NavState {
  view: WorkspaceView;
  setView: (view: WorkspaceView) => void;
}

export const useNavStore = create<NavState>((set, get) => ({
  view: 'board',
  setView: (view) => set({ view }),
}));
