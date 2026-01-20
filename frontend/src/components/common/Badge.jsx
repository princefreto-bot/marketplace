/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Badge - Composant de badge réutilisable
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { clsx } from 'clsx';

const variants = {
  default: 'bg-primary-100 text-primary-700',
  available: 'bg-black text-white',
  processing: 'bg-primary-600 text-white',
  reserved: 'bg-primary-800 text-white',
  pending: 'bg-primary-200 text-primary-700',
  rented: 'bg-primary-400 text-white',
  success: 'bg-black text-white',
  user: 'bg-primary-100 text-primary-700',
  owner: 'bg-primary-600 text-white',
  admin: 'bg-black text-white',
};

const sizes = {
  sm: 'px-2 py-0.5 text-2xs',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center',
        'font-body tracking-[0.1em] uppercase',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Badge de statut pour les chambres
 */
export function RoomStatusBadge({ status }) {
  const labels = {
    available: 'Disponible',
    processing: 'En traitement',
    reserved: 'Réservée',
    rented: 'Louée',
    pending: 'En attente',
    archived: 'Archivée',
  };

  return (
    <Badge variant={status}>
      {labels[status] || status}
    </Badge>
  );
}

/**
 * Badge de rôle utilisateur
 */
export function RoleBadge({ role }) {
  const labels = {
    user: 'Utilisateur',
    owner: 'Propriétaire',
    admin: 'Admin',
  };

  return (
    <Badge variant={role}>
      {labels[role] || role}
    </Badge>
  );
}
