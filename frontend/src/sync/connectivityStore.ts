import { create } from "zustand";

interface ConnectivityState {
  isOnline: boolean;
  isSyncing: boolean;
  queuedChangesCount: number;
  lastSyncTime: string;
  setOnline: (online: boolean) => void;
  toggleConnectivity: () => void;
  incrementQueued: () => void;
  triggerManualSync: () => Promise<void>;
}

export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  queuedChangesCount: 2, // seeded with 2 offline queued actions for demo
  lastSyncTime: "Today, 10:45 AM",

  setOnline: (online) => set({ isOnline: online }),

  toggleConnectivity: () => {
    const current = get().isOnline;
    const next = !current;
    set({ isOnline: next });
  },

  incrementQueued: () =>
    set((state) => ({ queuedChangesCount: state.queuedChangesCount + 1 })),

  triggerManualSync: async () => {
    set({ isSyncing: true });
    // Simulated sync delay
    await new Promise((resolve) => setTimeout(resolve, 1400));
    set({
      isSyncing: false,
      queuedChangesCount: 0,
      lastSyncTime: "Just now",
      isOnline: true,
    });
  },
}));
