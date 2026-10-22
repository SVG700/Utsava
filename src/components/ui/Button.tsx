import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const base =
      'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 dark:focus-visible:ring-mint-285 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

    const variants = {
      primary:
        'bg-forest-700 hover:bg-forest-800 text-white shadow-xs hover:shadow-soft dark:bg-mint-285 dark:hover:bg-mint-390 dark:text-mint-850',
      secondary:
        'bg-linen-85 hover:bg-linen-135 text-moss-875 dark:bg-moss-845 dark:hover:bg-moss-810 dark:text-moss-45',
      outline:
        'border border-linen-180 hover:border-linen-350 hover:bg-linen-60 text-moss-875 dark:border-moss-790 dark:hover:border-moss-705 dark:hover:bg-moss-880 dark:text-moss-90',
      ghost:
        'hover:bg-linen-85 text-moss-785 hover:text-moss-875 dark:hover:bg-moss-845 dark:text-moss-340 dark:hover:text-moss-45',
      accent: 'bg-saffron-450 hover:bg-saffron-520 text-white shadow-xs hover:shadow-soft',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
