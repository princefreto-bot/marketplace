/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Configuration API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import axios from 'axios';

// Base URL de l'API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Instance Axios configurée
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Intercepteur de requêtes - Ajoute le token JWT
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('residence_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Intercepteur de réponses - Gestion globale des erreurs
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expiré ou invalide
    if (error.response?.status === 401) {
      localStorage.removeItem('residence_token');
      localStorage.removeItem('residence_user');
      
      // Rediriger vers login si pas déjà sur la page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Extraire le message d'erreur
    const message = error.response?.data?.message || 'Une erreur est survenue';
    
    return Promise.reject({
      status: error.response?.status,
      message,
      errors: error.response?.data?.errors,
    });
  }
);

export { API_URL };
export default api;
