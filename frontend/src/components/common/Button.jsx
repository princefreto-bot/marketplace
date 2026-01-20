/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Button - Composant de bouton réutilisable
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-black text-white border-black hover:bg-white hover:text-black',
  secondary: 'bg-transparent text-black border-black hover:bg-black hover:text-white',
  ghost: 'bg-transparent text-black border-transparent hover:bg-primary-100',
  danger: 'bg-black text-white border-black hover:bg-red-600 hover:border-red-600',
};

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-sm',
  xl: 'px-10 py-5 text-base',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={clsx(
        // Base
        'inline-flex items-center justify-center',
        'font-body tracking-[0.15em] uppercase',
        'border transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-[0.98]',
        // Variant
        variants[variant],
        // Size
        sizes[size],
        // Full width
        fullWidth && 'w-full',
        // Custom
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className="w-4 h-4 mr-2" />
          )}
          {children}
          {Icon && iconPosition === 'right' && (
            <Icon className="w-4 h-4 ml-2" />
          )}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
