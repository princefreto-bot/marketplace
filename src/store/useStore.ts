import { useState, useEffect, useCallback } from 'react';
import type { User, Demande, Reponse, Message, SocialLink, Slider, Conversation, Stats } from '../types';
import { mockUsers, mockDemandes, mockReponses, mockMessages, mockNotifications, mockSocialLinks, mockSliders, getConversations } from '../data/mockData';

// Simple state management using localStorage
const STORAGE_KEYS = {
  USER: 'localdeals_user',
  TOKEN: 'localdeals_token',
};

// Create a simple event emitter for state updates
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());

// In-memory data store (simulating database)
let users = [...mockUsers];
let demandes = [...mockDemandes];
let reponses = [...mockReponses];
let messages = [...mockMessages];
let notifications = [...mockNotifications];
let socialLinks = [...mockSocialLinks];
let sliders = [...mockSliders];

// Authentication
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
    return () => { listeners.delete(checkAuth); };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500)); // Simulate network delay
    
    const foundUser = users.find(u => u.email === email);
    
    if (!foundUser) {
      setLoading(false);
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }
    
    // Check password (in mock: admin123 for admin, password123 for others)
    const validPassword = (email === 'admin@localdeals.tg' && password === 'admin123') ||
                         (email !== 'admin@localdeals.tg' && password === 'password123');
    
    if (!validPassword) {
      setLoading(false);
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }
    
    if (foundUser.isBanned) {
      setLoading(false);
      return { success: false, error: `Compte banni: ${foundUser.banReason || 'Violation des règles'}` };
    }
    
    foundUser.lastLogin = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(foundUser));
    localStorage.setItem(STORAGE_KEYS.TOKEN, 'mock-jwt-token');
    setUser(foundUser);
    setLoading(false);
    emit();
    return { success: true };
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
    await new Promise(r => setTimeout(r, 500));
    
    if (users.find(u => u.email === data.email)) {
      setLoading(false);
      return { success: false, error: 'Cet email est déjà utilisé' };
    }
    
    const newUser: User = {
      _id: `user${Date.now()}`,
      role: data.role,
      nom: data.nom,
      email: data.email,
      telephone: data.telephone,
      localisation: data.localisation,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nom)}&background=2563EB&color=fff`,
      isBanned: false,
      dateCreation: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    localStorage.setItem(STORAGE_KEYS.TOKEN, 'mock-jwt-token');
    setUser(newUser);
    setLoading(false);
    emit();
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    setUser(null);
    emit();
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<{ success: boolean }> => {
    if (!user) return { success: false };
    
    const userIndex = users.findIndex(u => u._id === user._id);
    if (userIndex >= 0) {
      users[userIndex] = { ...users[userIndex], ...updates };
      const updatedUser = users[userIndex];
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      setUser(updatedUser);
      emit();
    }
    return { success: true };
  }, [user]);

  return { user, loading, login, register, logout, updateProfile };
}

// Demandes
export function useDemandes() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  const getDemandes = useCallback((filters?: { categorie?: string; search?: string }) => {
    let filtered = demandes.filter(d => d.status === 'active');
    
    if (filters?.categorie) {
      filtered = filtered.filter(d => d.categorie === filters.categorie);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(d => 
        d.titre.toLowerCase().includes(search) ||
        d.description.toLowerCase().includes(search)
      );
    }
    
    return filtered.map(d => ({
      ...d,
      acheteur: users.find(u => u._id === d.acheteurId),
    })).sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, []);

  const getDemandeById = useCallback((id: string) => {
    const demande = demandes.find(d => d._id === id);
    if (!demande) return null;
    return {
      ...demande,
      acheteur: users.find(u => u._id === demande.acheteurId),
    };
  }, []);

  const getMyDemandes = useCallback((userId: string) => {
    return demandes
      .filter(d => d.acheteurId === userId)
      .map(d => ({
        ...d,
        acheteur: users.find(u => u._id === d.acheteurId),
      }))
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, []);

  const createDemande = useCallback(async (data: Omit<Demande, '_id' | 'dateCreation' | 'status'>): Promise<{ success: boolean; demande?: Demande }> => {
    const newDemande: Demande = {
      ...data,
      _id: `demande${Date.now()}`,
      status: 'active',
      badge: 'new',
      dateCreation: new Date().toISOString(),
    };
    
    demandes.push(newDemande);
    
    // Create notification for vendors
    users.filter(u => u.role === 'vendeur').forEach(vendor => {
      notifications.push({
        _id: `notif${Date.now()}${vendor._id}`,
        userId: vendor._id,
        type: 'nouvelle_demande',
        data: {
          title: 'Nouvelle demande',
          message: `Nouvelle demande: "${newDemande.titre}"`,
          demandeId: newDemande._id,
        },
        read: false,
        dateCreation: new Date().toISOString(),
      });
    });
    
    emit();
    return { success: true, demande: newDemande };
  }, []);

  const deleteDemande = useCallback(async (id: string): Promise<{ success: boolean }> => {
    const index = demandes.findIndex(d => d._id === id);
    if (index >= 0) {
      demandes.splice(index, 1);
      emit();
    }
    return { success: true };
  }, []);

  return { getDemandes, getDemandeById, getMyDemandes, createDemande, deleteDemande };
}

// Réponses
export function useReponses() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  const getReponsesByDemande = useCallback((demandeId: string) => {
    return reponses
      .filter(r => r.demandeId === demandeId)
      .map(r => ({
        ...r,
        vendeur: users.find(u => u._id === r.vendeurId),
        demande: demandes.find(d => d._id === r.demandeId),
      }))
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, []);

  const getMyReponses = useCallback((vendeurId: string) => {
    return reponses
      .filter(r => r.vendeurId === vendeurId)
      .map(r => ({
        ...r,
        vendeur: users.find(u => u._id === r.vendeurId),
        demande: demandes.find(d => d._id === r.demandeId),
      }))
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, []);

  const getReponsesForMyDemandes = useCallback((acheteurId: string) => {
    const myDemandeIds = demandes.filter(d => d.acheteurId === acheteurId).map(d => d._id);
    return reponses
      .filter(r => myDemandeIds.includes(r.demandeId))
      .map(r => ({
        ...r,
        vendeur: users.find(u => u._id === r.vendeurId),
        demande: demandes.find(d => d._id === r.demandeId),
      }))
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, []);

  const createReponse = useCallback(async (data: {
    demandeId: string;
    vendeurId: string;
    message: string;
    images: { url: string; publicId: string }[];
  }): Promise<{ success: boolean }> => {
    const demande = demandes.find(d => d._id === data.demandeId);
    if (!demande) return { success: false };

    const newReponse: Reponse = {
      _id: `reponse${Date.now()}`,
      ...data,
      dateCreation: new Date().toISOString(),
    };
    
    reponses.push(newReponse);
    
    // Notify the buyer
    const vendeur = users.find(u => u._id === data.vendeurId);
    notifications.push({
      _id: `notif${Date.now()}`,
      userId: demande.acheteurId,
      type: 'reponse',
      data: {
        title: 'Nouvelle réponse',
        message: `${vendeur?.nom || 'Un vendeur'} a répondu à votre demande "${demande.titre}"`,
        demandeId: demande._id,
      },
      read: false,
      dateCreation: new Date().toISOString(),
    });
    
    emit();
    return { success: true };
  }, []);

  return { getReponsesByDemande, getMyReponses, getReponsesForMyDemandes, createReponse };
}

// Messages
export function useMessages() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  const getConversationsForUser = useCallback((userId: string): Conversation[] => {
    return getConversations(userId);
  }, []);

  const getMessagesByConversation = useCallback((conversationId: string) => {
    return messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime());
  }, []);

  const sendMessage = useCallback(async (data: {
    conversationId: string;
    demandeId: string;
    demandeTitre: string;
    senderId: string;
    receiverId: string;
    message: string;
    images?: { url: string; publicId: string }[];
  }): Promise<{ success: boolean }> => {
    const newMessage: Message = {
      _id: `msg${Date.now()}`,
      conversationId: data.conversationId,
      demandeId: data.demandeId,
      demandeTitre: data.demandeTitre,
      senderId: data.senderId,
      receiverId: data.receiverId,
      message: data.message,
      images: data.images || [],
      dateCreation: new Date().toISOString(),
    };
    
    messages.push(newMessage);
    
    // Notify receiver
    const sender = users.find(u => u._id === data.senderId);
    notifications.push({
      _id: `notif${Date.now()}`,
      userId: data.receiverId,
      type: 'message',
      data: {
        title: 'Nouveau message',
        message: `${sender?.nom || 'Quelqu\'un'} vous a envoyé un message`,
        conversationId: data.conversationId,
        senderId: data.senderId,
      },
      read: false,
      dateCreation: new Date().toISOString(),
    });
    
    emit();
    return { success: true };
  }, []);

  const startConversation = useCallback((demandeId: string, _demandeTitre: string, userId1: string, userId2: string) => {
    void _demandeTitre; // used for context
    const existingConv = messages.find(m => 
      m.demandeId === demandeId && 
      ((m.senderId === userId1 && m.receiverId === userId2) || 
       (m.senderId === userId2 && m.receiverId === userId1))
    );
    
    if (existingConv) {
      return existingConv.conversationId;
    }
    
    return `conv_${demandeId}_${userId1}_${userId2}`;
  }, []);

  return { getConversationsForUser, getMessagesByConversation, sendMessage, startConversation };
}

// Notifications
export function useNotifications() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  const getNotifications = useCallback((userId: string) => {
    return notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }, []);

  const getUnreadCount = useCallback((userId: string) => {
    return notifications.filter(n => n.userId === userId && !n.read).length;
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    const notif = notifications.find(n => n._id === notificationId);
    if (notif) {
      notif.read = true;
      emit();
    }
  }, []);

  const markAllAsRead = useCallback(async (userId: string) => {
    notifications.filter(n => n.userId === userId).forEach(n => { n.read = true; });
    emit();
  }, []);

  return { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
}

// Admin
export function useAdmin() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  const getStats = useCallback((): Stats => {
    return {
      totalUsers: users.length,
      totalDemandes: demandes.length,
      totalReponses: reponses.length,
      totalMessages: messages.length,
    };
  }, []);

  const getAllUsers = useCallback(() => {
    return users.filter(u => u.role !== 'admin');
  }, []);

  const getAllPosts = useCallback(() => {
    return demandes.map(d => ({
      ...d,
      acheteur: users.find(u => u._id === d.acheteurId),
    }));
  }, []);

  const banUser = useCallback(async (userId: string, reason: string, type: 'temporary' | 'permanent' = 'permanent') => {
    const user = users.find(u => u._id === userId);
    if (user) {
      user.isBanned = true;
      user.banType = type;
      user.banReason = reason;
      if (type === 'temporary') {
        user.banExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
      
      notifications.push({
        _id: `notif${Date.now()}`,
        userId: userId,
        type: 'ban',
        data: {
          title: 'Compte suspendu',
          message: `Votre compte a été suspendu: ${reason}`,
        },
        read: false,
        dateCreation: new Date().toISOString(),
      });
      
      emit();
    }
  }, []);

  const unbanUser = useCallback(async (userId: string) => {
    const user = users.find(u => u._id === userId);
    if (user) {
      user.isBanned = false;
      user.banType = undefined;
      user.banReason = undefined;
      user.banExpiry = undefined;
      emit();
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    const index = demandes.findIndex(d => d._id === postId);
    if (index >= 0) {
      demandes.splice(index, 1);
      emit();
    }
  }, []);

  const getSocialLinks = useCallback(() => {
    return socialLinks.filter(l => l.isActive).sort((a, b) => a.order - b.order);
  }, []);

  const updateSocialLinks = useCallback(async (links: SocialLink[]) => {
    socialLinks = links;
    emit();
  }, []);

  const getSliders = useCallback(() => {
    return sliders.filter(s => s.isActive).sort((a, b) => a.order - b.order);
  }, []);

  const updateSliders = useCallback(async (newSliders: Slider[]) => {
    sliders = newSliders;
    emit();
  }, []);

  return {
    getStats,
    getAllUsers,
    getAllPosts,
    banUser,
    unbanUser,
    deletePost,
    getSocialLinks,
    updateSocialLinks,
    getSliders,
    updateSliders,
  };
}

// Users
export function useUsers() {
  const getUserById = useCallback((id: string) => {
    return users.find(u => u._id === id) || null;
  }, []);

  return { getUserById };
}
