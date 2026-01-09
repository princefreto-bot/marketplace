import { useState, useEffect, useCallback } from 'react';
import type { User, Demande, Reponse, Message, SocialLink, Slider, Conversation, Stats, Notification } from '../types';
import { mockUsers, mockDemandes, mockReponses, mockMessages, mockNotifications, mockSocialLinks, mockSliders } from '../data/mockData';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '../lib/api';

// Storage keys
const STORAGE_KEYS = {
  USER: 'localdeals_user',
  TOKEN: 'localdeals_token',
  USERS: 'localdeals_users',
  DEMANDES: 'localdeals_demandes',
  REPONSES: 'localdeals_reponses',
  MESSAGES: 'localdeals_messages',
  NOTIFICATIONS: 'localdeals_notifications',
  SOCIAL_LINKS: 'localdeals_social_links',
  SLIDERS: 'localdeals_sliders',
};

// Event emitter for state updates
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());

// Load data from localStorage or use mock data as default
function loadFromStorage<T>(key: string, defaultData: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error(`Error loading ${key}:`, e);
  }
  return defaultData;
}

// Save data to localStorage
function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

// Initialize data from localStorage with mock data as fallback
let users: User[] = loadFromStorage(STORAGE_KEYS.USERS, mockUsers);
let demandes: Demande[] = loadFromStorage(STORAGE_KEYS.DEMANDES, mockDemandes);
let reponses: Reponse[] = loadFromStorage(STORAGE_KEYS.REPONSES, mockReponses);
let messages: Message[] = loadFromStorage(STORAGE_KEYS.MESSAGES, mockMessages);
let notifications: Notification[] = loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, mockNotifications);
let socialLinks: SocialLink[] = loadFromStorage(STORAGE_KEYS.SOCIAL_LINKS, mockSocialLinks);
let sliders: Slider[] = loadFromStorage(STORAGE_KEYS.SLIDERS, mockSliders);

// Save all data to localStorage
function persistData() {
  saveToStorage(STORAGE_KEYS.USERS, users);
  saveToStorage(STORAGE_KEYS.DEMANDES, demandes);
  saveToStorage(STORAGE_KEYS.REPONSES, reponses);
  saveToStorage(STORAGE_KEYS.MESSAGES, messages);
  saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  saveToStorage(STORAGE_KEYS.SOCIAL_LINKS, socialLinks);
  saveToStorage(STORAGE_KEYS.SLIDERS, sliders);
}

// Authentication (API MongoDB)
export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  // Subscribe to auth changes
  useEffect(() => {
    const checkAuth = () => {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      const storedUser = stored ? JSON.parse(stored) : null;
      setUser(storedUser);
    };

    listeners.add(checkAuth);
    return () => {
      listeners.delete(checkAuth);
    };
  }, []);

  // Bootstrap session from token
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return;

    // If user already present, do nothing. Otherwise fetch /api/me.
    if (user) return;

    let cancelled = false;
    (async () => {
      try {
        const me = await apiGet<{ user: User }>("/api/me", true);
        if (cancelled) return;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(me.user));
        setUser(me.user);
        emit();
      } catch {
        // token invalid
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        if (!cancelled) {
          setUser(null);
          emit();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const data = await apiPost<{ token: string; user: User }>("/api/login", { email, password });
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      setUser(data.user);
      emit();
      return { success: true };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Erreur de connexion';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: {
    nom: string;
    email: string;
    password: string;
    role: 'acheteur' | 'vendeur';
    telephone: string;
    localisation: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const res = await apiPost<{ token: string; user: User }>("/api/register", data);
      localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
      setUser(res.user);
      emit();
      return { success: true };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Erreur d'inscription";
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    setUser(null);
    emit();
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Non connecté' };

    try {
      const res = await apiPut<{ user: User }>(`/api/users/${user._id}`, updates, true);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
      setUser(res.user);
      emit();
      return { success: true };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Erreur de mise à jour';
      return { success: false, error: msg };
    }
  }, [user]);

  return { user, loading, login, register, logout, updateProfile };
}

// Demandes (API MongoDB)
let demandesFetchedOnce = false;
let demandesFetchInFlight: Promise<void> | null = null;

const VALID_BADGES = new Set(['new', 'urgent', 'top', 'sponsored']);

function normalizeDemande(raw: any): Demande {
  const badge = VALID_BADGES.has(raw?.badge) ? (raw.badge as Demande['badge']) : undefined;
  const status = raw?.status === 'active' || raw?.status === 'closed' ? raw.status : 'active';

  return {
    _id: String(raw?._id || ''),
    acheteurId: String(raw?.acheteurId || ''),
    acheteur: raw?.acheteur,
    titre: String(raw?.titre || ''),
    description: String(raw?.description || ''),
    budget: Number(raw?.budget || 0),
    images: Array.isArray(raw?.images) ? raw.images : [],
    categorie: String(raw?.categorie || ''),
    localisation: String(raw?.localisation || ''),
    badge,
    status,
    dateCreation: String(raw?.dateCreation || new Date().toISOString()),
  };
}

export function useDemandes() { 
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const refreshDemandes = useCallback(async (filters?: { categorie?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.categorie) params.set('categorie', filters.categorie);

    const url = params.toString() ? `/api/demandes?${params.toString()}` : '/api/demandes';

    const doFetch = async () => {
      const res = await apiGet<{ demandes: unknown[] }>(url);
      demandes = (res.demandes || []).map((d) => normalizeDemande(d));
      persistData();
      emit();
    };

    // Avoid spamming requests if multiple components mount
    if (!demandesFetchInFlight) {
      demandesFetchInFlight = doFetch().finally(() => {
        demandesFetchInFlight = null;
      });
    }

    await demandesFetchInFlight;
    demandesFetchedOnce = true;
  }, []);

  // Initial load (once)
  useEffect(() => {
    if (demandesFetchedOnce) return;
    void refreshDemandes();
  }, [refreshDemandes]);

  const getDemandes = useCallback((filters?: { categorie?: string; search?: string }) => {
    let filtered: Demande[] = (demandes || []).filter((d) => d.status === 'active');

    if (filters?.categorie) {
      filtered = filtered.filter((d) => d.categorie === filters.categorie);
    }

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(
        (d) => d.titre.toLowerCase().includes(s) || d.description.toLowerCase().includes(s)
      );
    }

    // API may already include acheteur; keep fallback for any locally cached items
    return filtered
      .map((d) => ({
        ...d,
        acheteur: d.acheteur || users.find((u) => u._id === d.acheteurId),
      }))
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, []);

  const getDemandeById = useCallback((id: string) => {
    const demande = (demandes || []).find((d) => d._id === id);
    if (!demande) return null;
    return {
      ...demande,
      acheteur: demande.acheteur || users.find((u) => u._id === demande.acheteurId),
    };
  }, []);

  const fetchDemandeById = useCallback(async (id: string) => {
    const res = await apiGet<{ demande: unknown }>(`/api/demandes/${id}`);
    const d = normalizeDemande(res.demande);

    // Merge/update cache
    const idx = (demandes || []).findIndex((x) => x._id === d._id);
    if (idx >= 0) demandes[idx] = d;
    else demandes.unshift(d);

    persistData();
    emit();
    return d;
  }, []);

  const getMyDemandes = useCallback((userId: string) => {
    return (demandes || [])
      .filter((d) => d.acheteurId === userId)
      .map((d) => ({
        ...d,
        acheteur: d.acheteur || users.find((u) => u._id === d.acheteurId),
      }))
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, []);

  const createDemande = useCallback(
    async (data: Omit<Demande, '_id' | 'dateCreation' | 'status'>): Promise<{ success: boolean; demande?: Demande; error?: string }> => {
      try {
        const payload = {
          titre: data.titre,
          description: data.description,
          budget: data.budget,
          images: data.images,
          categorie: data.categorie,
          localisation: data.localisation,
        };

        const res = await apiPost<{ demande: any }>("/api/demandes", payload, true);
        const created = res.demande as Demande;

        // Update cache
        (demandes as any).unshift(created);
        persistData();
        emit();

        return { success: true, demande: created };
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Erreur lors de la publication';
        return { success: false, error: msg };
      }
    },
    []
  );

  const deleteDemande = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiDelete<{ success: boolean }>(`/api/demandes/${id}`, true);
      const index = (demandes || []).findIndex((d: any) => d._id === id);
      if (index >= 0) (demandes as any).splice(index, 1);
      persistData();
      emit();
      return { success: true };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Erreur de suppression';
      return { success: false, error: msg };
    }
  }, []);

  return {
    getDemandes,
    refreshDemandes,
    getDemandeById,
    fetchDemandeById,
    getMyDemandes,
    createDemande,
    deleteDemande,
  };
}

// Réponses (API MongoDB)
let reponsesFetchKeys = new Set<string>();
let reponsesFetchInFlight: Record<string, Promise<void>> = {};

function normalizeReponse(raw: any): Reponse {
  const dateCreation = raw?.dateCreation ? String(raw.dateCreation) : new Date().toISOString();
  const images = Array.isArray(raw?.images) ? raw.images : [];

  const demandeRaw = raw?.demande;
  const demandeNormalized = demandeRaw
    ? {
        _id: String(demandeRaw?._id || raw?.demandeId || ''),
        acheteurId: String(demandeRaw?.acheteurId || ''),
        titre: String(demandeRaw?.titre || ''),
        description: String(demandeRaw?.description || ''),
        budget: Number(demandeRaw?.budget || 0),
        images: Array.isArray(demandeRaw?.images) ? demandeRaw.images : [],
        categorie: String(demandeRaw?.categorie || ''),
        localisation: String(demandeRaw?.localisation || ''),
        badge: VALID_BADGES.has(demandeRaw?.badge) ? (demandeRaw.badge as Demande['badge']) : undefined,
        status: demandeRaw?.status === 'active' || demandeRaw?.status === 'closed' ? demandeRaw.status : 'active',
        dateCreation: demandeRaw?.dateCreation ? String(demandeRaw.dateCreation) : new Date().toISOString(),
      }
    : undefined;

  return {
    _id: String(raw?._id || ''),
    demandeId: String(raw?.demandeId || demandeNormalized?._id || ''),
    demande: demandeNormalized,
    vendeurId: String(raw?.vendeurId || ''),
    vendeur: raw?.vendeur,
    message: String(raw?.message || ''),
    images,
    dateCreation,
  };
}

async function refreshReponses(filters?: { demandeId?: string; vendeurId?: string; acheteurId?: string }) {
  const params = new URLSearchParams();
  if (filters?.demandeId) params.set('demandeId', filters.demandeId);
  if (filters?.vendeurId) params.set('vendeurId', filters.vendeurId);
  if (filters?.acheteurId) params.set('acheteurId', filters.acheteurId);

  const key = `demande:${filters?.demandeId || ''}|vendeur:${filters?.vendeurId || ''}|acheteur:${filters?.acheteurId || ''}`;

  // Avoid duplicate in-flight requests for same key
  if (!reponsesFetchInFlight[key]) {
    reponsesFetchInFlight[key] = (async () => {
      const url = params.toString() ? `/api/reponses?${params.toString()}` : '/api/reponses';
      const res = await apiGet<{ reponses: unknown[] }>(url);
      const incoming = (res.reponses || []).map((r) => normalizeReponse(r));

      // Merge into cache by _id
      const byId = new Map<string, Reponse>();
      for (const r of reponses) byId.set(r._id, r);
      for (const r of incoming) byId.set(r._id, r);
      reponses = Array.from(byId.values());

      persistData();
      emit();
    })().finally(() => {
      delete reponsesFetchInFlight[key];
    });
  }

  await reponsesFetchInFlight[key];
  reponsesFetchKeys.add(key);
}

export function useReponses() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const getReponsesByDemande = useCallback((demandeId: string) => {
    const key = `demande:${demandeId}|vendeur:|acheteur:`;
    if (!reponsesFetchKeys.has(key)) {
      void refreshReponses({ demandeId });
    }

    return reponses
      .filter((r) => r.demandeId === demandeId)
      .map((r) => ({
        ...r,
        vendeur: r.vendeur || users.find((u) => u._id === r.vendeurId),
        demande: r.demande || demandes.find((d) => d._id === r.demandeId),
      }))
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, []);

  const getMyReponses = useCallback((vendeurId: string) => {
    const key = `demande:|vendeur:${vendeurId}|acheteur:`;
    if (!reponsesFetchKeys.has(key)) {
      void refreshReponses({ vendeurId });
    }

    return reponses
      .filter((r) => r.vendeurId === vendeurId)
      .map((r) => ({
        ...r,
        vendeur: r.vendeur || users.find((u) => u._id === r.vendeurId),
        demande: r.demande || demandes.find((d) => d._id === r.demandeId),
      }))
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, []);

  const getReponsesForMyDemandes = useCallback((acheteurId: string) => {
    const key = `demande:|vendeur:|acheteur:${acheteurId}`;
    if (!reponsesFetchKeys.has(key)) {
      void refreshReponses({ acheteurId });
    }

    const myDemandeIds = demandes.filter((d) => d.acheteurId === acheteurId).map((d) => d._id);

    return reponses
      .filter((r) => myDemandeIds.includes(r.demandeId))
      .map((r) => ({
        ...r,
        vendeur: r.vendeur || users.find((u) => u._id === r.vendeurId),
        demande: r.demande || demandes.find((d) => d._id === r.demandeId),
      }))
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, []);

  const createReponse = useCallback(
    async (data: {
      demandeId: string;
      vendeurId?: string; // ignoré (le backend prend l'utilisateur du token)
      message: string;
      images: { url: string; publicId: string }[];
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        const payload = {
          message: data.message,
          images: data.images,
        };

        const res = await apiPost<{ reponse: unknown }>(`/api/demandes/${data.demandeId}/reponses`, payload, true);
        const created = normalizeReponse(res.reponse);

        // Merge into cache
        const idx = reponses.findIndex((r) => r._id === created._id);
        if (idx >= 0) reponses[idx] = created;
        else reponses.unshift(created);

        // ensure demande fetch key gets reloaded
        reponsesFetchKeys.add(`demande:${data.demandeId}|vendeur:|acheteur:`);

        persistData();
        emit();

        return { success: true };
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Erreur lors de l'envoi";
        return { success: false, error: msg };
      }
    },
    []
  );

  return { getReponsesByDemande, getMyReponses, getReponsesForMyDemandes, createReponse };
}

// Messages (API MongoDB)
let conversationsByUser: Record<string, Conversation[]> = {};
let convFetched = new Set<string>();
let convInFlight: Record<string, Promise<void>> = {};

let messagesByConversation: Record<string, Message[]> = {};
let msgsFetched = new Set<string>();
let msgsInFlight: Record<string, Promise<void>> = {};

function stableConversationId(demandeId: string, userAId: string, userBId: string) {
  const a = String(userAId);
  const b = String(userBId);
  const [minId, maxId] = a < b ? [a, b] : [b, a];
  return `${String(demandeId)}_${minId}_${maxId}`;
}

async function uploadBase64IfNeeded(imgs: { url: string; publicId: string }[]) {
  const out: { url: string; publicId: string }[] = [];

  for (const img of imgs) {
    const url = String(img.url || "");
    if (url.startsWith("data:")) {
      // Upload base64 to Cloudinary
      const up = await apiPost<{ url: string; publicId: string }>("/api/upload/base64", { base64: url }, true);
      out.push({ url: up.url, publicId: up.publicId });
    } else {
      out.push({ url, publicId: String(img.publicId || "") });
    }
  }

  return out.filter((x) => x.url && x.publicId);
}

export function useMessages() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const refreshConversations = useCallback(async (userId: string) => {
    const key = String(userId);
    if (!convInFlight[key]) {
      convInFlight[key] = (async () => {
        const res = await apiGet<{ conversations: Conversation[] }>(`/api/conversations/${key}`, true);
        conversationsByUser[key] = Array.isArray(res.conversations) ? res.conversations : [];
        convFetched.add(key);
        emit();
      })().finally(() => {
        delete convInFlight[key];
      });
    }

    await convInFlight[key];
  }, []);

  const getConversationsForUser = useCallback(
    (userId: string): Conversation[] => {
      const key = String(userId);
      if (!convFetched.has(key)) {
        void refreshConversations(key);
      }
      return conversationsByUser[key] || [];
    },
    [refreshConversations]
  );

  const refreshMessages = useCallback(async (conversationId: string) => {
    const key = String(conversationId);

    if (!msgsInFlight[key]) {
      msgsInFlight[key] = (async () => {
        try {
          const res = await apiGet<{ messages: Message[] }>(`/api/messages/${encodeURIComponent(key)}`, true);
          const list = Array.isArray(res.messages) ? res.messages : [];
          messagesByConversation[key] = list;

          // Keep flattened messages list for legacy admin stats
          const byId = new Map<string, Message>();
          for (const m of messages) byId.set(m._id, m);
          for (const m of list) byId.set(m._id, m);
          messages = Array.from(byId.values());

          msgsFetched.add(key);
          persistData();
          emit();
        } catch (e) {
          if (e instanceof ApiError && e.status === 404) {
            // Conversation does not exist yet -> empty history
            messagesByConversation[key] = [];
            msgsFetched.add(key);
            emit();
            return;
          }
          throw e;
        }
      })().finally(() => {
        delete msgsInFlight[key];
      });
    }

    await msgsInFlight[key];
  }, []);

  const getMessagesByConversation = useCallback(
    (conversationId: string) => {
      const key = String(conversationId);
      if (!msgsFetched.has(key)) {
        void refreshMessages(key);
      }
      return (messagesByConversation[key] || []).slice().sort((a, b) => new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime());
    },
    [refreshMessages]
  );

  const sendMessage = useCallback(
    async (data: {
      conversationId: string;
      demandeId: string;
      demandeTitre: string;
      senderId: string; // ignored by backend (from token)
      receiverId: string;
      message: string;
      images?: { url: string; publicId: string }[];
    }): Promise<{ success: boolean; error?: string; message?: Message; conversationId?: string }> => {
      try {
        const imgs = data.images && data.images.length ? await uploadBase64IfNeeded(data.images) : [];

        const payload = {
          receiverId: data.receiverId,
          demandeId: data.demandeId,
          demandeTitre: data.demandeTitre,
          message: data.message,
          images: imgs,
        };

        const res = await apiPost<{ message: Message }>("/api/messages", payload, true);
        const msg = res.message;
        const convId = msg.conversationId;

        // Update caches
        messagesByConversation[convId] = messagesByConversation[convId] || [];
        messagesByConversation[convId].push(msg);
        msgsFetched.add(convId);

        // Keep flattened
        messages.push(msg);
        persistData();

        // Refresh conversation list in background (for unreadCount/lastMessage)
        const tokenUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (tokenUser) {
          const u = JSON.parse(tokenUser) as User;
          void refreshConversations(u._id);
        }

        emit();
        return { success: true, message: msg, conversationId: convId };
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Erreur d'envoi";
        return { success: false, error: msg };
      }
    },
    [refreshConversations]
  );

  const startConversation = useCallback((demandeId: string, _demandeTitre: string, userId1: string, userId2: string) => {
    void _demandeTitre;
    return stableConversationId(demandeId, userId1, userId2);
  }, []);

  return { refreshConversations, getConversationsForUser, refreshMessages, getMessagesByConversation, sendMessage, startConversation };
}

// Notifications (API MongoDB)
let notificationsByUser: Record<string, Notification[]> = {};
let notificationCountByUser: Record<string, number> = {};
let notifFetched = new Set<string>();
let notifInFlight: Record<string, Promise<void>> = {};
let notifCountInFlight: Record<string, Promise<void>> = {};

function normalizeNotification(raw: any): Notification {
  const data = raw?.data && typeof raw.data === 'object' ? raw.data : {};

  return {
    _id: String(raw?._id || ''),
    userId: String(raw?.userId || ''),
    type: raw?.type,
    data: {
      title: String((data as any)?.title || ''),
      message: String((data as any)?.message || ''),
      demandeId: (data as any)?.demandeId ? String((data as any).demandeId) : undefined,
      conversationId: (data as any)?.conversationId ? String((data as any).conversationId) : undefined,
      senderId: (data as any)?.senderId ? String((data as any).senderId) : undefined,
    },
    read: Boolean(raw?.read),
    dateCreation: String(raw?.dateCreation || new Date().toISOString()),
  } as Notification;
}

async function refreshNotificationsApi(userId: string) {
  const key = String(userId);
  if (!notifInFlight[key]) {
    notifInFlight[key] = (async () => {
      const res = await apiGet<{ notifications: unknown[] }>(`/api/notifications/${key}`, true);
      const list = (res.notifications || []).map((n) => normalizeNotification(n));
      notificationsByUser[key] = list;
      notificationCountByUser[key] = list.filter((n) => !n.read).length;
      notifFetched.add(key);
      emit();
    })().finally(() => {
      delete notifInFlight[key];
    });
  }
  await notifInFlight[key];
}

async function refreshNotificationCountApi(userId: string) {
  const key = String(userId);
  if (!notifCountInFlight[key]) {
    notifCountInFlight[key] = (async () => {
      const res = await apiGet<{ count: number }>(`/api/notifications/${key}/count`, true);
      notificationCountByUser[key] = Number(res.count || 0);
      emit();
    })().finally(() => {
      delete notifCountInFlight[key];
    });
  }
  await notifCountInFlight[key];
}

export function useNotifications() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const getNotifications = useCallback((userId: string) => {
    const key = String(userId);
    if (!notifFetched.has(key)) {
      void refreshNotificationsApi(key);
    }
    return (notificationsByUser[key] || []).slice().sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, []);

  const getUnreadCount = useCallback((userId: string) => {
    const key = String(userId);

    // Always try to refresh count in background for accuracy
    void refreshNotificationCountApi(key);

    if (notificationCountByUser[key] !== undefined) return notificationCountByUser[key];
    const list = notificationsByUser[key];
    if (list) return list.filter((n) => !n.read).length;
    return 0;
  }, []);

  const markAsRead = useCallback(async (notificationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiPut<{ notification: unknown }>(`/api/notifications/${notificationId}/read`, undefined, true);
      const updated = normalizeNotification(res.notification);

      const key = String(updated.userId);
      const list = notificationsByUser[key] || [];
      const idx = list.findIndex((n) => n._id === updated._id);
      if (idx >= 0) list[idx] = updated;
      notificationsByUser[key] = list;

      // Update unread count
      if (notificationCountByUser[key] !== undefined) {
        notificationCountByUser[key] = Math.max(0, notificationCountByUser[key] - 1);
      } else {
        notificationCountByUser[key] = list.filter((n) => !n.read).length;
      }

      emit();
      return { success: true };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Erreur';
      return { success: false, error: msg };
    }
  }, []);

  const markAllAsRead = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const key = String(userId);
      await apiPut<{ success: boolean }>(`/api/notifications/${key}/read-all`, undefined, true);

      const list = notificationsByUser[key] || [];
      notificationsByUser[key] = list.map((n) => ({ ...n, read: true }));
      notificationCountByUser[key] = 0;
      emit();
      return { success: true };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Erreur';
      return { success: false, error: msg };
    }
  }, []);

  const refreshNotifications = useCallback(async (userId: string) => {
    await refreshNotificationsApi(userId);
  }, []);

  return { getNotifications, getUnreadCount, markAsRead, markAllAsRead, refreshNotifications };
}

// Admin (API MongoDB)
let statsCache: Stats = { totalUsers: 0, totalDemandes: 0, totalReponses: 0, totalMessages: 0 };
let statsFetched = false;
let statsInFlight: Promise<void> | null = null;

let adminUsersCache: User[] = [];
let adminUsersFetched = false;
let adminUsersInFlight: Promise<void> | null = null;

let adminPostsCache: (Demande & { acheteur?: User })[] = [];
let adminPostsFetched = false;
let adminPostsInFlight: Promise<void> | null = null;

let slidersCache: Slider[] = mockSliders;
let slidersFetched = false;
let slidersInFlight: Promise<void> | null = null;

let socialLinksCache: SocialLink[] = mockSocialLinks;
let socialLinksFetched = false;
let socialLinksInFlight: Promise<void> | null = null;

function normalizeSlider(raw: any): Slider {
  return {
    _id: String(raw?._id || ""),
    title: String(raw?.title || ""),
    description: String(raw?.description || ""),
    image: String(raw?.image || raw?.image?.url || ""),
    buttonText: String(raw?.buttonText || ""),
    buttonLink: String(raw?.buttonLink || ""),
    isActive: Boolean(raw?.isActive ?? true),
    order: Number(raw?.order || 1),
  };
}

function normalizeSocialLink(raw: any): SocialLink {
  return {
    _id: String(raw?._id || ""),
    platform: String(raw?.platform || ""),
    url: String(raw?.url || ""),
    icon: String(raw?.icon || ""),
    isActive: Boolean(raw?.isActive ?? true),
    order: Number(raw?.order || 1),
  };
}

export function useAdmin() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const refreshStats = useCallback(async () => {
    if (!statsInFlight) {
      statsInFlight = (async () => {
        const res = await apiGet<Stats>("/api/stats");
        statsCache = {
          totalUsers: Number(res.totalUsers || 0),
          totalDemandes: Number(res.totalDemandes || 0),
          totalReponses: Number(res.totalReponses || 0),
          totalMessages: Number(res.totalMessages || 0),
        };
        statsFetched = true;
        emit();
      })().finally(() => {
        statsInFlight = null;
      });
    }
    await statsInFlight;
  }, []);

  const getStats = useCallback((): Stats => {
    if (!statsFetched) void refreshStats();
    return statsCache;
  }, [refreshStats]);

  const refreshAdminUsers = useCallback(async () => {
    if (!adminUsersInFlight) {
      adminUsersInFlight = (async () => {
        const res = await apiGet<{ users: User[] }>("/api/admin/users", true);
        adminUsersCache = Array.isArray(res.users) ? res.users : [];
        adminUsersFetched = true;
        emit();
      })().finally(() => {
        adminUsersInFlight = null;
      });
    }
    await adminUsersInFlight;
  }, []);

  const getAllUsers = useCallback(() => {
    if (!adminUsersFetched) void refreshAdminUsers();
    return adminUsersCache.filter((u) => u.role !== 'admin');
  }, [refreshAdminUsers]);

  const refreshAdminPosts = useCallback(async () => {
    if (!adminPostsInFlight) {
      adminPostsInFlight = (async () => {
        const res = await apiGet<{ posts: any[] }>("/api/admin/posts", true);
        const list = Array.isArray(res.posts) ? res.posts : [];
        adminPostsCache = list.map((p) => normalizeDemande(p)) as any;
        adminPostsFetched = true;
        emit();
      })().finally(() => {
        adminPostsInFlight = null;
      });
    }
    await adminPostsInFlight;
  }, []);

  const getAllPosts = useCallback(() => {
    if (!adminPostsFetched) void refreshAdminPosts();
    return adminPostsCache;
  }, [refreshAdminPosts]);

  const banUser = useCallback(
    async (userId: string, reason: string, type: 'temporary' | 'permanent' = 'permanent') => {
      await apiPost<{ user: User }>(`/api/admin/ban/${userId}`, { banType: type, banReason: reason }, true);
      await Promise.all([refreshAdminUsers(), refreshStats()]);
    },
    [refreshAdminUsers, refreshStats]
  );

  const unbanUser = useCallback(
    async (userId: string) => {
      await apiPost<{ user: User }>(`/api/admin/unban/${userId}`, {}, true);
      await Promise.all([refreshAdminUsers(), refreshStats()]);
    },
    [refreshAdminUsers, refreshStats]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      await apiDelete<{ success: boolean }>(`/api/admin/posts/${postId}`, true);
      await Promise.all([refreshAdminPosts(), refreshStats()]);
    },
    [refreshAdminPosts, refreshStats]
  );

  // Public data used by Home/Footer
  const refreshPublicSocialLinks = useCallback(async () => {
    if (!socialLinksInFlight) {
      socialLinksInFlight = (async () => {
        const res = await apiGet<{ socialLinks: any[] }>("/api/social-links");
        socialLinksCache = (res.socialLinks || []).map((x) => normalizeSocialLink(x));
        socialLinksFetched = true;
        emit();
      })().finally(() => {
        socialLinksInFlight = null;
      });
    }
    await socialLinksInFlight;
  }, []);

  const getSocialLinks = useCallback(() => {
    if (!socialLinksFetched) void refreshPublicSocialLinks();
    return socialLinksCache.filter((l) => l.isActive).sort((a, b) => a.order - b.order);
  }, [refreshPublicSocialLinks]);

  const refreshPublicSliders = useCallback(async () => {
    if (!slidersInFlight) {
      slidersInFlight = (async () => {
        const res = await apiGet<{ sliders: any[] }>("/api/sliders");
        slidersCache = (res.sliders || []).map((x) => normalizeSlider(x));
        slidersFetched = true;
        emit();
      })().finally(() => {
        slidersInFlight = null;
      });
    }
    await slidersInFlight;
  }, []);

  const getSliders = useCallback(() => {
    if (!slidersFetched) void refreshPublicSliders();
    return slidersCache.filter((s) => s.isActive).sort((a, b) => a.order - b.order);
  }, [refreshPublicSliders]);

  // Admin CRUD
  const updateSocialLinks = useCallback(async (_links: SocialLink[]) => {
    // Admin UI will handle CRUD item-by-item; keep this for backward compatibility
    await refreshPublicSocialLinks();
  }, [refreshPublicSocialLinks]);

  const updateSliders = useCallback(async (_newSliders: Slider[]) => {
    // Admin UI will handle CRUD item-by-item; keep this for backward compatibility
    await refreshPublicSliders();
  }, [refreshPublicSliders]);

  const sendAdminMessage = useCallback(
    async (payload: { title?: string; message: string; userId?: string; data?: Record<string, unknown> }) => {
      const body = {
        title: payload.title,
        message: payload.message,
        userId: payload.userId,
        data: payload.data,
      };
      return apiPost<{ success: boolean; sentTo?: number }>("/api/admin/message", body, true);
    },
    []
  );

  return {
    getStats,
    refreshStats,
    getAllUsers,
    refreshAdminUsers,
    getAllPosts,
    refreshAdminPosts,
    banUser,
    unbanUser,
    deletePost,
    getSocialLinks,
    refreshPublicSocialLinks,
    updateSocialLinks,
    getSliders,
    refreshPublicSliders,
    updateSliders,
    sendAdminMessage,
  };
}

// Users
export function useUsers() {
  const getUserById = useCallback((id: string) => {
    return users.find(u => u._id === id) || null;
  }, []);

  return { getUserById };
}
