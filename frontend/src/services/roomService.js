/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Service des chambres
 * ═══════════════════════════════════════════════════════════════════════════
 */

import api from '@config/api';

const roomService = {
  /**
   * Obtenir toutes les chambres disponibles
   */
  getRooms: async (params = {}) => {
    const response = await api.get('/rooms', { params });
    return response.data;
  },

  /**
   * Obtenir une chambre par ID
   */
  getRoom: async (id) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  /**
   * Obtenir les quartiers disponibles
   */
  getQuartiers: async () => {
    const response = await api.get('/rooms/quartiers');
    return response.data;
  },

  /**
   * Créer une chambre (propriétaire)
   */
  createRoom: async (roomData) => {
    const response = await api.post('/rooms', roomData);
    return response.data;
  },

  /**
   * Mettre à jour une chambre
   */
  updateRoom: async (id, roomData) => {
    const response = await api.put(`/rooms/${id}`, roomData);
    return response.data;
  },

  /**
   * Obtenir mes chambres (propriétaire)
   */
  getMyRooms: async () => {
    const response = await api.get('/rooms/owner/my-rooms');
    return response.data;
  },

  /**
   * Statistiques des chambres (admin)
   */
  getStats: async () => {
    const response = await api.get('/rooms/admin/stats');
    return response.data;
  },
};

export default roomService;
