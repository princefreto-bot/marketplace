/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Input - Composant d'entrée réutilisable
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block font-body text-sm text-primary-500 uppercase tracking-[0.1em] mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full px-4 py-3',
          'bg-transparent border',
          'font-body text-base',
          'transition-all duration-300',
          'placeholder:text-primary-400 placeholder:italic',
          'focus:outline-none focus:ring-0',
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-primary-300 focus:border-black',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500 font-body">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-primary-400 font-body italic">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

/**
 * Textarea
 */
export const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block font-body text-sm text-primary-500 uppercase tracking-[0.1em] mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          'w-full px-4 py-3',
          'bg-transparent border',
          'font-body text-base',
          'transition-all duration-300',
          'placeholder:text-primary-400 placeholder:italic',
          'focus:outline-none focus:ring-0',
          'resize-y min-h-[120px]',
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-primary-300 focus:border-black',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500 font-body">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-primary-400 font-body italic">{helperText}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

/**
 * Select
 */
export const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Sélectionner...',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block font-body text-sm text-primary-500 uppercase tracking-[0.1em] mb-2">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={clsx(
          'w-full px-4 py-3',
          'bg-transparent border',
          'font-body text-base',
          'transition-all duration-300',
          'focus:outline-none focus:ring-0',
          'cursor-pointer',
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-primary-300 focus:border-black',
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500 font-body">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Input;
