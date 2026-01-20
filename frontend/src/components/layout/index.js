/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Export centralisé des composants de layout
 * ═══════════════════════════════════════════════════════════════════════════
 */

export { default as Layout } from './Layout';
export { default as Header, DesktopHeader, MobileHeader } from './Header';
export { default as MobileNav } from './MobileNav';
export { default as MobileMenu } from './MobileMenu';
export { default as SearchModal } from './SearchModal';
export {
  ProtectedRoute,
  RoleProtectedRoute,
  AdminRoute,
  OwnerRoute,
} from './ProtectedRoute';
