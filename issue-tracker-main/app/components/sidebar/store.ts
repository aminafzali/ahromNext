// File: app/components/sidebar/store.ts (نسخه جدید)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;    // برای حالت جمع‌شده در دسکتاپ
  isMobileOpen: boolean;   // برای حالت باز/بسته در موبایل
  toggleCollapse: () => void;
  setMobileOpen: (isOpen: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  // از persist استفاده می‌کنیم تا انتخاب کاربر برای حالت جمع‌شده، ذخیره شود
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setMobileOpen: (isOpen) => set({ isMobileOpen: isOpen }),
    }),
    {
      name: 'sidebar-state-storage', // نام کلید در localStorage
      partialize: (state) => ({ isCollapsed: state.isCollapsed }), // فقط وضعیت isCollapsed را ذخیره کن
    }
  )
);