/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Service des paiements
 * ═══════════════════════════════════════════════════════════════════════════
 */

import api from '@config/api';

const paymentService = {
  /**
   * Initialiser un paiement
   */
  initPayment: async (roomId, message = '', preferredDates = []) => {
    const response = await api.post('/payments/init', {
      roomId,
      message,
      preferredDates,
    });
    return response.data;
  },

  /**
   * Compléter un paiement en mode démo
   */
  demoCompletePayment: async (transactionId, message = '', preferredDates = []) => {
    const response = await api.post('/payments/demo-complete', {
      transactionId,
      message,
      preferredDates,
    });
    return response.data;
  },

  /**
   * Vérifier le statut d'un paiement
   */
  getPaymentStatus: async (transactionId) => {
    const response = await api.get(`/payments/${transactionId}/status`);
    return response.data;
  },

  /**
   * Obtenir l'historique des paiements
   */
  getHistory: async () => {
    const response = await api.get('/payments/history');
    return response.data;
  },

  /**
   * Statistiques des paiements (admin)
   */
  getStats: async () => {
    const response = await api.get('/payments/stats');
    return response.data;
  },

  /**
   * Tous les paiements (admin)
   */
  getAllPayments: async (params = {}) => {
    const response = await api.get('/payments/all', { params });
    return response.data;
  },
};

export default paymentService;
