/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Service d'authentification
 * ═══════════════════════════════════════════════════════════════════════════
 */

import api from '@config/api';

const authService = {
  /**
   * Inscription
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Connexion
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Obtenir le profil
   */
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Mettre à jour le profil
   */
  updateProfile: async (data) => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },

  /**
   * Changer le mot de passe
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Obtenir les favoris
   */
  getFavorites: async () => {
    const response = await api.get('/auth/favorites');
    return response.data;
  },

  /**
   * Toggle favori
   */
  toggleFavorite: async (roomId) => {
    const response = await api.post(`/auth/favorites/${roomId}`);
    return response.data;
  },
};

export default authService;
