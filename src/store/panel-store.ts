import { create } from 'zustand';

interface PanelStore {
  adminOpen: boolean;
  userPanelOpen: boolean;
  openAdmin: () => void;
  closeAdmin: () => void;
  openUserPanel: () => void;
  closeUserPanel: () => void;
}

export const usePanelStore = create<PanelStore>((set) => ({
  adminOpen: false,
  userPanelOpen: false,
  openAdmin: () => set({ adminOpen: true, userPanelOpen: false }),
  closeAdmin: () => set({ adminOpen: false }),
  openUserPanel: () => set({ userPanelOpen: true, adminOpen: false }),
  closeUserPanel: () => set({ userPanelOpen: false }),
}));
