/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Modal - Composant de modal réutilisable
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Variants d'animation
 */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, x: '100%' },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: '100%' },
};

const bottomSheetVariants = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
};

const centerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/**
 * Modal Component
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  variant = 'slide', // 'slide' | 'bottom-sheet' | 'center'
  size = 'md', // 'sm' | 'md' | 'lg' | 'full'
  showClose = true,
  closeOnOverlay = true,
  className = '',
}) {
  // Fermer avec Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Déterminer les variants d'animation
  const getVariants = () => {
    switch (variant) {
      case 'bottom-sheet':
        return bottomSheetVariants;
      case 'center':
        return centerVariants;
      default:
        return modalVariants;
    }
  };

  // Déterminer les classes de taille
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-2xl';
      case 'full':
        return 'max-w-none w-full';
      default:
        return 'max-w-md';
    }
  };

  // Déterminer les classes de position
  const getPositionClasses = () => {
    switch (variant) {
      case 'bottom-sheet':
        return 'items-end sm:items-center';
      case 'center':
        return 'items-center justify-center p-4';
      default:
        return 'justify-end';
    }
  };

  // Déterminer les classes du contenu
  const getContentClasses = () => {
    switch (variant) {
      case 'bottom-sheet':
        return clsx(
          'w-full bg-white rounded-t-2xl sm:rounded-lg',
          'max-h-[90vh] overflow-y-auto',
          getSizeClasses()
        );
      case 'center':
        return clsx(
          'w-full bg-white',
          'max-h-[90vh] overflow-y-auto',
          getSizeClasses()
        );
      default:
        return clsx(
          'h-full bg-white overflow-y-auto',
          'w-full md:w-1/2 lg:w-2/5',
          size === 'full' && 'md:w-full'
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={clsx(
            'fixed inset-0 z-50 flex',
            getPositionClasses()
          )}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/80"
            variants={overlayVariants}
            onClick={closeOnOverlay ? onClose : undefined}
          />

          {/* Content */}
          <motion.div
            className={clsx(
              'relative z-10',
              getContentClasses(),
              className
            )}
            variants={getVariants()}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-primary-100">
                {title && (
                  <h2 className="font-display text-xl">{title}</h2>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-primary-100 rounded-full transition-colors haptic ml-auto"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className={!title && !showClose ? '' : ''}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
