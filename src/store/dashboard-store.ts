import { create } from 'zustand';

export type AdminPage = 'overview' | 'generate-batch' | 'manage-batches' | 'manage-qr' | 'users' | 'stats';
export type ClientPage = 'overview' | 'physical-qr' | 'qr-codes' | 'homes' | 'rooms' | 'activity' | 'settings';
export type DashboardPage = AdminPage | ClientPage;

interface DashboardStore {
  activePage: DashboardPage;
  sidebarOpen: boolean;
  setActivePage: (page: DashboardPage) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activePage: 'overview',
  sidebarOpen: true,
  setActivePage: (page) => set({ activePage: page }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
