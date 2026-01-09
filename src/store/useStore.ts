import { create } from "zustand";

/* ================= AUTH STORE ================= */

interface User {
  _id: string;
  nom: string;
  email: string;
  localisation?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: typeof localStorage !== "undefined" ? localStorage.getItem("token") : null,

  login: async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (typeof localStorage !== "undefined") localStorage.setItem("token", data.token);

      set({ token: data.token, user: data.user });
      return true;
    } catch {
      return false;
    }
  },

  logout: () => {
    if (typeof localStorage !== "undefined") localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  loadUser: async () => {
    if (typeof localStorage === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error();

      const user = await res.json();
      set({ user, token });
    } catch {
      if (typeof localStorage !== "undefined") localStorage.removeItem("token");
      set({ user: null, token: null });
    }
  }
}));

/* ================= DEMANDES STORE ================= */

interface DemandeState {
  demandes: any[];
  loading: boolean;
  fetchDemandes: () => Promise<void>;
}

export const useDemandes = create<DemandeState>((set) => ({
  demandes: [],
  loading: false,

  fetchDemandes: async () => {
    set({ loading: true });

    try {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch("/api/demandes", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      set({ demandes: data });
    } catch (error) {
      console.error("Erreur chargement demandes", error);
    } finally {
      set({ loading: false });
    }
  }
}));

/* ================= NOTIFICATIONS STORE ================= */

interface Notification {
  id: string;
  message: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notif: Notification) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
}

export const useNotifications = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (notif) =>
    set((state) => ({ notifications: [...state.notifications, notif] })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }))
}));

/* ================= ADMIN STORE ================= */

interface AdminState {
  isAdmin: boolean;
  setAdmin: (value: boolean) => void;
}

export const useAdmin = create<AdminState>((set) => ({
  isAdmin: false,
  setAdmin: (value: boolean) => set({ isAdmin: value }),
}));
