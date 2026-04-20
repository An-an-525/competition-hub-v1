import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  searchKeyword: string;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSearchKeyword: (keyword: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'light',
      searchKeyword: '',

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setTheme: (theme) => {
        set({ theme });
      },

      setSearchKeyword: (keyword) => {
        set({ searchKeyword: keyword });
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
