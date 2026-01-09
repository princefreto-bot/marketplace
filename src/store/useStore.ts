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
  token: localStorage.getItem("token"),

  login: async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) return false;

      const data = await res.json();
      localStorage.setItem("token", data.token);

      set({ token: data.token, user: data.user });
      return true;
    } catch {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  loadUser: async () => {
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
      localStorage.removeItem("token");
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
      const token = localStorage.getItem("token");

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
