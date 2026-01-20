/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MobileNav - Navigation mobile en bas d'écran
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useFavorites } from '@contexts/FavoritesContext';
import { useAuth } from '@contexts/AuthContext';

const navItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/search', icon: Search, label: 'Recherche' },
  { path: '/favorites', icon: Heart, label: 'Favoris' },
  { path: '/profile', icon: User, label: 'Profil' },
];

export default function MobileNav({ onSearchClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { count: favoritesCount } = useFavorites();
  const { isAuthenticated } = useAuth();

  const handleNavClick = (item) => {
    if (item.path === '/search') {
      onSearchClick?.();
    } else if (item.path === '/profile') {
      navigate(isAuthenticated ? '/profile' : '/login');
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-primary-200">
      <div
        className="flex items-center justify-around py-2"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const showBadge = item.path === '/favorites' && favoritesCount > 0;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item)}
              className={clsx(
                'flex flex-col items-center gap-1 py-2 px-4',
                'transition-colors duration-200 haptic relative',
                isActive ? 'text-black' : 'text-primary-500'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-2xs tracking-wider uppercase font-body">
                {item.label}
              </span>
              {showBadge && (
                <span className="absolute -top-1 right-1/2 translate-x-3 w-4 h-4 bg-black text-white text-2xs rounded-full flex items-center justify-center">
                  {favoritesCount > 9 ? '9+' : favoritesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
