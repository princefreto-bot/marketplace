/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Header - En-tête de l'application
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Link, useNavigate } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useFavorites } from '@contexts/FavoritesContext';
import { Button } from '@components/common';

/**
 * Header Desktop
 */
export function DesktopHeader() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isAdmin, isOwner } = useAuth();
  const { count: favoritesCount } = useFavorites();

  return (
    <header className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-primary-100">
      <div className="container mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="font-display text-xl tracking-[0.3em] uppercase hover:opacity-70 transition-opacity"
          >
            Résidence
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-12">
            <Link
              to="/"
              className="font-body text-sm tracking-[0.15em] uppercase text-primary-600 hover:text-black transition-colors"
            >
              Découvrir
            </Link>
            <Link
              to="/how-it-works"
              className="font-body text-sm tracking-[0.15em] uppercase text-primary-600 hover:text-black transition-colors"
            >
              Fonctionnement
            </Link>
            <Link
              to="/favorites"
              className="font-body text-sm tracking-[0.15em] uppercase text-primary-600 hover:text-black transition-colors"
            >
              Favoris
              {favoritesCount > 0 && (
                <span className="ml-1 text-xs">({favoritesCount})</span>
              )}
            </Link>
            <Link
              to="/owner"
              className="font-body text-sm tracking-[0.15em] uppercase text-primary-600 hover:text-black transition-colors"
            >
              Propriétaires
            </Link>
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {isAdmin() && (
                  <Link
                    to="/admin"
                    className="font-body text-sm tracking-[0.1em] uppercase text-primary-600 hover:text-black transition-colors"
                  >
                    Admin
                  </Link>
                )}
                {isOwner() && !isAdmin() && (
                  <Link
                    to="/dashboard"
                    className="font-body text-sm tracking-[0.1em] uppercase text-primary-600 hover:text-black transition-colors"
                  >
                    Mes chambres
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="font-body text-sm tracking-[0.1em] uppercase text-primary-600 hover:text-black transition-colors"
                >
                  Déconnexion
                </button>
                <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-display">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-body text-sm tracking-[0.1em] uppercase text-primary-600 hover:text-black transition-colors"
                >
                  Connexion
                </Link>
                <Button
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  Inscription
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Header Mobile
 */
export function MobileHeader({ onMenuClick }) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 h-14">
        <Link
          to="/"
          className="font-display text-lg tracking-[0.2em] uppercase"
        >
          Résidence
        </Link>
        <button
          onClick={onMenuClick}
          className="p-2 haptic"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}

export default function Header({ onMenuClick }) {
  return (
    <>
      <DesktopHeader />
      <MobileHeader onMenuClick={onMenuClick} />
    </>
  );
}
