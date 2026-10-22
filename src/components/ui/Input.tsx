import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-medium text-moss-810 dark:text-moss-155"
          >
            {label}
            {required && (
              <span
                className="text-forest-700 dark:text-mint-285 ml-1 font-bold"
                aria-hidden="true"
              >
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-moss-885 text-moss-875 dark:text-moss-45 text-sm placeholder:text-moss-645 focus:outline-none focus:ring-2 transition-all duration-150',
            error
              ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-950'
              : 'border-linen-180 dark:border-moss-790 focus:border-forest-700 dark:focus:border-mint-285 focus:ring-forest-700/15 dark:focus:ring-mint-285/20',
            className,
          )}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-rose-700 dark:text-rose-400 font-medium"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-help`} className="text-xs text-moss-645 dark:text-moss-415">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
