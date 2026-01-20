/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Layout - Layout principal de l'application
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import MobileNav from './MobileNav';
import MobileMenu from './MobileMenu';
import SearchModal from './SearchModal';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header onMenuClick={() => setIsMenuOpen(true)} />

      {/* Contenu principal */}
      <main>
        <Outlet />
      </main>

      {/* Navigation mobile */}
      <MobileNav onSearchClick={() => setIsSearchOpen(true)} />

      {/* Menu mobile */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Modal de recherche */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
