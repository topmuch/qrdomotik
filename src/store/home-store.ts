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

export interface QrCodeInfo {
  id: string;
  homeId: string;
  roomId: string | null;
  name: string;
  type: string;
  publicSlug: string;
  isActive: boolean;
  pinCode: string | null;
  isPresentMode: boolean;
  createdAt: string;
  room: { id: string; name: string; icon: string } | null;
  content: { contentJson: string; updatedAt: string } | null;
}

interface HomeStore {
  homes: HomeInfo[];
  selectedHomeId: string | null;
  rooms: RoomInfo[];
  qrCodes: QrCodeInfo[];
  selectedRoomId: string | null;
  isLoading: boolean;
  sidebarOpen: boolean;

  setHomes: (homes: HomeInfo[]) => void;
  selectHome: (homeId: string | null) => void;
  setRooms: (rooms: RoomInfo[]) => void;
  setQrCodes: (qrCodes: QrCodeInfo[]) => void;
  selectRoom: (roomId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  getSelectedHome: () => HomeInfo | undefined;
  refreshHomes: () => Promise<void>;
  refreshRooms: () => Promise<void>;
  refreshQrCodes: () => Promise<void>;
}

export const useHomeStore = create<HomeStore>((set, get) => ({
  homes: [],
  selectedHomeId: null,
  rooms: [],
  qrCodes: [],
  selectedRoomId: null,
  isLoading: false,
  sidebarOpen: true,

  setHomes: (homes) => set({ homes }),
  selectHome: (homeId) => {
    set({ selectedHomeId: homeId, rooms: [], qrCodes: [], selectedRoomId: null });
    if (homeId) {
      get().refreshRooms();
      get().refreshQrCodes();
    }
  },
  setRooms: (rooms) => set({ rooms }),
  setQrCodes: (qrCodes) => set({ qrCodes }),
  selectRoom: (roomId) => {
    set({ selectedRoomId: roomId });
    get().refreshQrCodes();
  },
  setLoading: (loading) => set({ isLoading: loading }),
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
        if (!get().selectedHomeId && json.data.length > 0) {
          set({ selectedHomeId: json.data[0].id });
          get().refreshRooms();
          get().refreshQrCodes();
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
      if (json.success) set({ rooms: json.data });
    } catch (err) {
      console.error('Failed to refresh rooms:', err);
    }
  },

  refreshQrCodes: async () => {
    const { selectedHomeId, selectedRoomId } = get();
    if (!selectedHomeId) return;
    try {
      const params = new URLSearchParams({ homeId: selectedHomeId });
      if (selectedRoomId) params.set('roomId', selectedRoomId);
      const res = await fetch(`/api/qr-codes?${params}`);
      const json = await res.json();
      if (json.success) set({ qrCodes: json.data });
    } catch (err) {
      console.error('Failed to refresh QR codes:', err);
    }
  },
}));
