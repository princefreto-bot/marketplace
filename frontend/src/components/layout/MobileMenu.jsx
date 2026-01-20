/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MobileMenu - Menu mobile plein écran
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useFavorites } from '@contexts/FavoritesContext';

export default function MobileMenu({ isOpen, onClose }) {
  const { isAuthenticated, user, logout, isAdmin, isOwner } = useAuth();
  const { count: favoritesCount } = useFavorites();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-white"
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* Header */}
          <div className="flex items-center justify-end p-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-primary-100 rounded-full transition-colors haptic"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col items-center justify-center h-[calc(100%-80px)] gap-8">
            <Link
              to="/"
              onClick={onClose}
              className="font-display text-3xl hover:opacity-60 transition-opacity"
            >
              Accueil
            </Link>
            <Link
              to="/how-it-works"
              onClick={onClose}
              className="font-display text-3xl hover:opacity-60 transition-opacity"
            >
              Fonctionnement
            </Link>
            <Link
              to="/favorites"
              onClick={onClose}
              className="font-display text-3xl hover:opacity-60 transition-opacity"
            >
              Favoris {favoritesCount > 0 && `(${favoritesCount})`}
            </Link>
            <Link
              to="/owner"
              onClick={onClose}
              className="font-display text-3xl hover:opacity-60 transition-opacity"
            >
              Propriétaires
            </Link>

            <div className="w-24 h-px bg-primary-200 my-4" />

            {isAuthenticated ? (
              <>
                {/* User info */}
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center font-display text-2xl mx-auto mb-2">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <p className="font-display text-lg">{user?.name}</p>
                  <p className="font-body text-primary-500 text-sm">{user?.email}</p>
                </div>

                {isAdmin() && (
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className="font-display text-2xl hover:opacity-60 transition-opacity"
                  >
                    Dashboard Admin
                  </Link>
                )}

                {isOwner() && !isAdmin() && (
                  <Link
                    to="/dashboard"
                    onClick={onClose}
                    className="font-display text-2xl hover:opacity-60 transition-opacity"
                  >
                    Mes Chambres
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="font-body text-lg text-primary-600 hover:text-black transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="font-body text-lg text-primary-600 hover:text-black transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="font-body text-lg text-primary-600 hover:text-black transition-colors"
                >
                  Inscription
                </Link>
              </>
            )}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
