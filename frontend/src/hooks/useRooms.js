/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useRooms - Hook pour la gestion des chambres
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useEffect } from 'react';
import api from '@config/api';

/**
 * Hook pour récupérer et filtrer les chambres
 */
export function useRooms(initialFilters = {}) {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState(initialFilters);

  /**
   * Charger les chambres
   */
  const loadRooms = useCallback(async (newFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        ...filters,
        ...newFilters,
        page: newFilters.page || pagination.page,
        limit: pagination.limit,
      };

      const response = await api.get('/rooms', { params });
      const { rooms: fetchedRooms, pagination: paginationData } = response.data.data;

      setRooms(fetchedRooms);
      setPagination(paginationData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  /**
   * Charger une chambre spécifique
   */
  const getRoom = useCallback(async (id) => {
    try {
      const response = await api.get(`/rooms/${id}`);
      return { success: true, room: response.data.data.room };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Mettre à jour les filtres
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Réinitialiser les filtres
   */
  const resetFilters = useCallback(() => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Changer de page
   */
  const goToPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  /**
   * Charger au montage et quand les filtres changent
   */
  useEffect(() => {
    loadRooms();
  }, [filters]);

  return {
    rooms,
    isLoading,
    error,
    pagination,
    filters,
    loadRooms,
    getRoom,
    updateFilters,
    resetFilters,
    goToPage,
  };
}

/**
 * Hook pour les chambres du propriétaire
 */
export function useMyRooms() {
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Charger mes chambres
   */
  const loadMyRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get('/rooms/owner/my-rooms');
      const { rooms: fetchedRooms, stats: fetchedStats } = response.data.data;

      setRooms(fetchedRooms);
      setStats(fetchedStats);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Créer une chambre
   */
  const createRoom = useCallback(async (roomData) => {
    try {
      const response = await api.post('/rooms', roomData);
      await loadMyRooms(); // Recharger la liste
      return { success: true, room: response.data.data.room };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [loadMyRooms]);

  /**
   * Mettre à jour une chambre
   */
  const updateRoom = useCallback(async (id, roomData) => {
    try {
      const response = await api.put(`/rooms/${id}`, roomData);
      await loadMyRooms(); // Recharger la liste
      return { success: true, room: response.data.data.room };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [loadMyRooms]);

  useEffect(() => {
    loadMyRooms();
  }, []);

  return {
    rooms,
    stats,
    isLoading,
    error,
    loadMyRooms,
    createRoom,
    updateRoom,
  };
}

export default useRooms;
