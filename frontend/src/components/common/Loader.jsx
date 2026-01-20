/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Loader - Composants de chargement
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { motion } from 'framer-motion';
import { clsx } from 'clsx';

/**
 * Loader plein écran avec logo
 */
export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <h1 className="font-display text-2xl tracking-[0.3em] uppercase mb-8">
          RÉSIDENCE
        </h1>
        <div className="w-32 h-px bg-primary-200 mx-auto overflow-hidden">
          <motion.div
            className="h-full w-1/3 bg-black"
            animate={{ x: ['-100%', '400%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Spinner simple
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <svg
      className={clsx('animate-spin', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Skeleton loader
 */
export function Skeleton({ className = '', variant = 'rect' }) {
  const variants = {
    rect: '',
    circle: 'rounded-full',
    text: 'h-4 rounded',
  };

  return (
    <div
      className={clsx(
        'skeleton',
        variants[variant],
        className
      )}
    />
  );
}

/**
 * Skeleton pour une carte de chambre
 */
export function RoomCardSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="aspect-room bg-primary-200 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    </div>
  );
}

/**
 * Loader pour le contenu de page
 */
export function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default Spinner;
