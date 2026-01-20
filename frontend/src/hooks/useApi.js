/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useApi - Hook générique pour les appels API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import api from '@config/api';

/**
 * Hook pour les appels API avec gestion d'état
 */
export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Exécuter une requête GET
   */
  const get = useCallback(async (url, params = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(url, { params });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Exécuter une requête POST
   */
  const post = useCallback(async (url, data = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.post(url, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Exécuter une requête PUT
   */
  const put = useCallback(async (url, data = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.put(url, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Exécuter une requête DELETE
   */
  const del = useCallback(async (url) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.delete(url);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    get,
    post,
    put,
    delete: del,
    clearError: () => setError(null),
  };
}

export default useApi;
