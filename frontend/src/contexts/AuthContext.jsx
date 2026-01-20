/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AuthContext - Gestion de l'authentification
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@config/api';

const AuthContext = createContext(null);

/**
 * Provider d'authentification
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Charger l'utilisateur depuis le localStorage au démarrage
   */
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('residence_token');
      const savedUser = localStorage.getItem('residence_user');

      if (token && savedUser) {
        try {
          // Vérifier que le token est toujours valide
          const response = await api.get('/auth/me');
          setUser(response.data.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalide, nettoyer
          localStorage.removeItem('residence_token');
          localStorage.removeItem('residence_user');
        }
      }
      
      setIsLoading(false);
    };

    loadUser();
  }, []);

  /**
   * Inscription
   */
  const register = useCallback(async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data.data;

      localStorage.setItem('residence_token', token);
      localStorage.setItem('residence_user', JSON.stringify(user));

      setUser(user);
      setIsAuthenticated(true);

      toast.success('Compte créé avec succès');
      return { success: true, user };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Connexion
   */
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data;

      localStorage.setItem('residence_token', token);
      localStorage.setItem('residence_user', JSON.stringify(user));

      setUser(user);
      setIsAuthenticated(true);

      toast.success('Connexion réussie');
      return { success: true, user };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Déconnexion
   */
  const logout = useCallback(() => {
    localStorage.removeItem('residence_token');
    localStorage.removeItem('residence_user');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Déconnexion réussie');
  }, []);

  /**
   * Mettre à jour le profil
   */
  const updateProfile = useCallback(async (data) => {
    try {
      const response = await api.put('/auth/me', data);
      const updatedUser = response.data.data.user;

      setUser(updatedUser);
      localStorage.setItem('residence_user', JSON.stringify(updatedUser));

      toast.success('Profil mis à jour');
      return { success: true, user: updatedUser };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Changer le mot de passe
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      toast.success('Mot de passe modifié');
      return { success: true };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  /**
   * Vérifier si l'utilisateur est admin
   */
  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  /**
   * Vérifier si l'utilisateur est propriétaire
   */
  const isOwner = useCallback(() => {
    return user?.role === 'owner' || user?.role === 'admin';
  }, [user]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    isAdmin,
    isOwner,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte d'authentification
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
