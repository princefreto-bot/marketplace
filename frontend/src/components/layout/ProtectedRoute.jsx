/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ProtectedRoute - Protection des routes par authentification/rôle
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { FullScreenLoader } from '@components/common';

/**
 * Route protégée par authentification
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * Route protégée par rôle
 */
export function RoleProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !hasRole(roles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * Route admin uniquement
 */
export function AdminRoute({ children }) {
  return (
    <RoleProtectedRoute roles={['admin']}>
      {children}
    </RoleProtectedRoute>
  );
}

/**
 * Route propriétaire/admin
 */
export function OwnerRoute({ children }) {
  return (
    <RoleProtectedRoute roles={['owner', 'admin']}>
      {children}
    </RoleProtectedRoute>
  );
}

export default ProtectedRoute;
