// app/workspaces/store.ts
import { create } from 'zustand';
import { WorkspaceRole } from '@prisma/client';

// تعریف تایپ برای اطلاعات ورک‌اسپیس فعال
export interface ActiveWorkspace {
  id: number;
  name: string;
  role: WorkspaceRole;
}

// تعریف تایپ برای وضعیت (state) و اقدامات (actions) مربوط به store
interface WorkspaceState {
  activeWorkspace: ActiveWorkspace | null;
  setActiveWorkspace: (workspace: ActiveWorkspace | null) => void;
}

// ایجاد store با استفاده از Zustand
const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspace: null, // مقدار اولیه
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
}));

export default useWorkspaceStore;
