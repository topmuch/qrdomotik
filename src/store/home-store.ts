import { create } from 'zustand';

export interface HomeInfo {
  id: string;
  name: string;
  address?: string | null;
  role: string;
  roomsCount: number;
  qrCodesCount: number;
  membersCount: number;
  createdAt: string;
}

export interface RoomInfo {
  id: string;
  homeId: string;
  name: string;
  icon: string;
  sortOrder: number;
  _count: { qrCodes: number };
}

interface HomeStore {
  homes: HomeInfo[];
  selectedHomeId: string | null;
  rooms: RoomInfo[];
  isLoading: boolean;
  sidebarOpen: boolean;

  // Actions
  setHomes: (homes: HomeInfo[]) => void;
  selectHome: (homeId: string | null) => void;
  setRooms: (rooms: RoomInfo[]) => void;
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  getSelectedHome: () => HomeInfo | undefined;
  refreshHomes: () => Promise<void>;
  refreshRooms: () => Promise<void>;
}

export const useHomeStore = create<HomeStore>((set, get) => ({
  homes: [],
  selectedHomeId: null,
  rooms: [],
  isLoading: false,
  sidebarOpen: true,

  setHomes: (homes) => set({ homes }),
  selectHome: (homeId) => {
    set({ selectedHomeId: homeId, rooms: [] });
    if (homeId) {
      get().refreshRooms();
    }
  },
  setRooms: (rooms) => set({ rooms }),
  setLoading: (loading) => set({ isLoading: loading }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  getSelectedHome: () => {
    const { homes, selectedHomeId } = get();
    return homes.find((h) => h.id === selectedHomeId);
  },

  refreshHomes: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/homes');
      const json = await res.json();
      if (json.success) {
        set({ homes: json.data });
        // Si aucune maison sélectionnée, prendre la première
        if (!get().selectedHomeId && json.data.length > 0) {
          set({ selectedHomeId: json.data[0].id });
          get().refreshRooms();
        }
      }
    } catch (err) {
      console.error('Failed to refresh homes:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshRooms: async () => {
    const { selectedHomeId } = get();
    if (!selectedHomeId) return;
    try {
      const res = await fetch(`/api/rooms?homeId=${selectedHomeId}`);
      const json = await res.json();
      if (json.success) {
        set({ rooms: json.data });
      }
    } catch (err) {
      console.error('Failed to refresh rooms:', err);
    }
  },
}));
