import { create } from "zustand";

export interface AppNotification {
  id: string;
  role: "all" | "asha" | "block" | "district";
  title: string;
  message: string;
  timestamp: string;
  type: "alert" | "info" | "success" | "emergency";
  read: boolean;
  linkUrl?: string;
  patientId?: string;
}

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    role: "asha",
    title: "Counter-Referral Ready: Haradhan Soren",
    message: "Patient discharged from Bankura Hospital. Wound dressing and blood sugar home follow-up assigned to Rampur ASHA.",
    timestamp: "10m ago",
    type: "info",
    read: false,
    patientId: "PAT-1076",
  },
  {
    id: "notif-2",
    role: "asha",
    title: "High-Risk ANC Alert: Sunita Mahato",
    message: "BP 162/100 mmHg flagged preeclampsia. Teleconsult scheduled with BMOH Dr. Roy at 11:30 AM.",
    timestamp: "25m ago",
    type: "emergency",
    read: false,
    patientId: "PAT-1082",
  },
  {
    id: "notif-3",
    role: "block",
    title: "New Red-Flag Referral from Joypur Sub-Centre",
    message: "Patient Rajesh Murmu referred for urgent cardiac evaluation. Ambulance 108 transit underway.",
    timestamp: "18m ago",
    type: "alert",
    read: false,
    patientId: "PAT-1088",
  },
  {
    id: "notif-4",
    role: "block",
    title: "Lab Sync Completed: 14 Sample Results",
    message: "Block PHC diagnostic lab synchronized 14 CBC and Hemoglobinometer test results to state EHR.",
    timestamp: "1h ago",
    type: "success",
    read: true,
  },
  {
    id: "notif-5",
    role: "district",
    title: "District ICU Capacity Notice",
    message: "Bankura Sammilani Hospital: 4 of 6 Ventilator Beds occupied. 2 Emergency Neonatal beds available.",
    timestamp: "40m ago",
    type: "info",
    read: false,
  },
  {
    id: "notif-6",
    role: "all",
    title: "Offline Sync Engine Active",
    message: "IndexedDB background cache verified. All offline village records will automatically synchronize once online.",
    timestamp: "2h ago",
    type: "info",
    read: true,
  },
];

const STORAGE_KEY = "medexa_notifications_v1";

interface NotificationsStoreState {
  notifications: AppNotification[];
  getForRole: (role: "asha" | "block" | "district") => AppNotification[];
  getUnreadCount: (role?: "asha" | "block" | "district") => number;
  markAsRead: (id: string) => void;
  markAllAsRead: (role?: "asha" | "block" | "district") => void;
  addNotification: (notif: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
}

export const useNotificationsStore = create<NotificationsStoreState>((set, get) => {
  const loadInitial = (): AppNotification[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Error loading notifications from localStorage:", e);
    }
    return SEED_NOTIFICATIONS;
  };

  const saveToStorage = (list: AppNotification[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Error saving notifications:", e);
    }
  };

  return {
    notifications: loadInitial(),

    getForRole: (role) => {
      const all = get().notifications;
      return all.filter((n) => n.role === "all" || n.role === role);
    },

    getUnreadCount: (role) => {
      const all = get().notifications;
      return all.filter(
        (n) => !n.read && (role ? n.role === "all" || n.role === role : true)
      ).length;
    },

    markAsRead: (id) => {
      const updated = get().notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      saveToStorage(updated);
      set({ notifications: updated });
    },

    markAllAsRead: (role) => {
      const updated = get().notifications.map((n) => {
        if (role && n.role !== "all" && n.role !== role) return n;
        return { ...n, read: true };
      });
      saveToStorage(updated);
      set({ notifications: updated });
    },

    addNotification: (notif) => {
      const newEntry: AppNotification = {
        ...notif,
        id: `notif-${Date.now()}`,
        timestamp: "Just now",
        read: false,
      };
      const updated = [newEntry, ...get().notifications];
      saveToStorage(updated);
      set({ notifications: updated });
    },
  };
});
