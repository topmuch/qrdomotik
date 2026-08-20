import { create } from 'zustand';

interface AuthStore {
  isOpen: boolean;
  defaultTab: 'login' | 'register';
  openAuth: (tab?: 'login' | 'register') => void;
  closeAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isOpen: false,
  defaultTab: 'register',
  openAuth: (tab = 'register') => set({ isOpen: true, defaultTab: tab }),
  closeAuth: () => set({ isOpen: false }),
}));
