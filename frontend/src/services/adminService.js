/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Service d'administration
 * ═══════════════════════════════════════════════════════════════════════════
 */

import api from '@config/api';

const adminService = {
  /**
   * Obtenir le tableau de bord
   */
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Chambres
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Obtenir toutes les chambres
   */
  getAllRooms: async (params = {}) => {
    const response = await api.get('/admin/rooms', { params });
    return response.data;
  },

  /**
   * Obtenir les chambres en attente
   */
  getPendingRooms: async () => {
    const response = await api.get('/admin/rooms/pending');
    return response.data;
  },

  /**
   * Approuver une chambre
   */
  approveRoom: async (id, adminNotes = '') => {
    const response = await api.put(`/admin/rooms/${id}/approve`, { adminNotes });
    return response.data;
  },

  /**
   * Rejeter une chambre
   */
  rejectRoom: async (id, reason) => {
    const response = await api.put(`/admin/rooms/${id}/reject`, { reason });
    return response.data;
  },

  /**
   * Changer le statut d'une chambre
   */
  changeRoomStatus: async (id, status) => {
    const response = await api.put(`/admin/rooms/${id}/status`, { status });
    return response.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Utilisateurs
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Obtenir tous les utilisateurs
   */
  getAllUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Obtenir un utilisateur
   */
  getUser: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour un utilisateur
   */
  updateUser: async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer un utilisateur
   */
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Contacts
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Obtenir toutes les demandes de contact
   */
  getAllContacts: async (params = {}) => {
    const response = await api.get('/admin/contacts', { params });
    return response.data;
  },

  /**
   * Mettre à jour une demande
   */
  updateContact: async (id, data) => {
    const response = await api.put(`/admin/contacts/${id}`, data);
    return response.data;
  },

  /**
   * Marquer comme succès
   */
  markContactAsSuccess: async (id) => {
    const response = await api.put(`/admin/contacts/${id}/success`);
    return response.data;
  },
};

export default adminService;
