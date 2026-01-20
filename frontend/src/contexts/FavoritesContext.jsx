/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FavoritesContext - Gestion des favoris
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@config/api';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

/**
 * Provider des favoris
 */
export function FavoritesProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Charger les favoris
   */
  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    } else {
      // Charger depuis localStorage pour les non-connectés
      const localFavorites = localStorage.getItem('residence_favorites');
      if (localFavorites) {
        setFavorites(JSON.parse(localFavorites));
      }
    }
  }, [isAuthenticated]);

  /**
   * Charger les favoris depuis l'API
   */
  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await api.get('/auth/favorites');
      setFavorites(response.data.data.favorites.map(f => f._id || f));
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Toggle favori
   */
  const toggleFavorite = useCallback(async (roomId) => {
    const isFavorite = favorites.includes(roomId);

    // Mise à jour optimiste
    if (isFavorite) {
      setFavorites(prev => prev.filter(id => id !== roomId));
    } else {
      setFavorites(prev => [...prev, roomId]);
    }

    // Si connecté, synchroniser avec l'API
    if (isAuthenticated) {
      try {
        await api.post(`/auth/favorites/${roomId}`);
        toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
      } catch (error) {
        // Rollback en cas d'erreur
        if (isFavorite) {
          setFavorites(prev => [...prev, roomId]);
        } else {
          setFavorites(prev => prev.filter(id => id !== roomId));
        }
        toast.error('Erreur lors de la mise à jour');
      }
    } else {
      // Sauvegarder dans localStorage
      const newFavorites = isFavorite
        ? favorites.filter(id => id !== roomId)
        : [...favorites, roomId];
      localStorage.setItem('residence_favorites', JSON.stringify(newFavorites));
      toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
    }
  }, [favorites, isAuthenticated]);

  /**
   * Vérifier si une chambre est en favori
   */
  const isFavorite = useCallback((roomId) => {
    return favorites.includes(roomId);
  }, [favorites]);

  /**
   * Nombre de favoris
   */
  const count = favorites.length;

  const value = {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    count,
    loadFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

/**
 * Hook pour utiliser les favoris
 */
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

export default FavoritesContext;
