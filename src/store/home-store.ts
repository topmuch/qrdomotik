import { create } from 'zustand';
import type { HomeMemberRole, ROLE_PERMISSIONS } from '@/types';

// ─── Info Types ────────────────────────────────────────────────────────────

export interface HomeInfo {
  id: string;
  name: string;
  address?: string | null;
  role: HomeMemberRole;
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
  isPrivate: boolean;
  pinCode: string | null;
  isPresentMode: boolean;
  createdAt: string;
  room: { id: string; name: string; icon: string } | null;
  content: { contentJson: string; updatedAt: string } | null;
}

export interface MemberInfo {
  id: string;
  homeId: string;
  userId: string;
  role: HomeMemberRole;
  nickname: string | null;
  points: number;
  joinedAt: string | null;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    avatarColor: string | null;
  };
}

// ─── Notification State ────────────────────────────────────────────────────

export interface NotificationInfo {
  id: string;
  type: string;
  title: string;
  body: string | null;
  dataJson: string | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Store Interface ───────────────────────────────────────────────────────

interface HomeStore {
  // Data
  homes: HomeInfo[];
  selectedHomeId: string | null;
  rooms: RoomInfo[];
  qrCodes: QrCodeInfo[];
  members: MemberInfo[];
  notifications: NotificationInfo[];
  unreadCount: number;

  // UI State
  selectedRoomId: string | null;
  isLoading: boolean;
  sidebarOpen: boolean;

  // Actions
  setHomes: (homes: HomeInfo[]) => void;
  selectHome: (homeId: string | null) => void;
  setRooms: (rooms: RoomInfo[]) => void;
  setQrCodes: (qrCodes: QrCodeInfo[]) => void;
  setMembers: (members: MemberInfo[]) => void;
  setNotifications: (notifications: NotificationInfo[]) => void;
  selectRoom: (roomId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;

  // Computed
  getSelectedHome: () => HomeInfo | undefined;
  getCurrentRole: () => HomeMemberRole | null;
  hasPermission: (perm: keyof import('@/types').ROLE_PERMISSIONS[HomeMemberRole]) => boolean;

  // Refresh
  refreshHomes: () => Promise<void>;
  refreshRooms: () => Promise<void>;
  refreshQrCodes: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

// ─── Import permissions dynamically to avoid circular dep ─────────────────

function getPermissions(role: HomeMemberRole) {
  return ROLE_PERMISSIONS[role];
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useHomeStore = create<HomeStore>((set, get) => ({
  // Data
  homes: [],
  selectedHomeId: null,
  rooms: [],
  qrCodes: [],
  members: [],
  notifications: [],
  unreadCount: 0,

  // UI State
  selectedRoomId: null,
  isLoading: false,
  sidebarOpen: true,

  // Actions
  setHomes: (homes) => set({ homes }),
  selectHome: (homeId) => {
    set({ selectedHomeId: homeId, rooms: [], qrCodes: [], selectedRoomId: null, members: [] });
    if (homeId) {
      get().refreshRooms();
      get().refreshQrCodes();
      get().refreshMembers();
    }
  },
  setRooms: (rooms) => set({ rooms }),
  setQrCodes: (qrCodes) => set({ qrCodes }),
  setMembers: (members) => set({ members }),
  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
  }),
  selectRoom: (roomId) => {
    set({ selectedRoomId: roomId });
    get().refreshQrCodes();
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Computed
  getSelectedHome: () => {
    const { homes, selectedHomeId } = get();
    return homes.find((h) => h.id === selectedHomeId);
  },

  getCurrentRole: () => {
    const home = get().getSelectedHome();
    return home?.role ?? null;
  },

  hasPermission: (perm) => {
    const role = get().getCurrentRole();
    if (!role) return false;
    const perms = getPermissions(role);
    return perms[perm] ?? false;
  },

  // Refresh
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
          get().refreshMembers();
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

  refreshMembers: async () => {
    const { selectedHomeId } = get();
    if (!selectedHomeId) return;
    try {
      const res = await fetch(`/api/members?homeId=${selectedHomeId}`);
      const json = await res.json();
      if (json.success) set({ members: json.data });
    } catch (err) {
      console.error('Failed to refresh members:', err);
    }
  },

  refreshNotifications: async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success) {
        set({
          notifications: json.data,
          unreadCount: json.data.filter((n: NotificationInfo) => !n.isRead).length,
        });
      }
    } catch (err) {
      console.error('Failed to refresh notifications:', err);
    }
  },

  refreshAll: async () => {
    await Promise.all([
      get().refreshHomes(),
      get().refreshNotifications(),
    ]);
  },
}));
