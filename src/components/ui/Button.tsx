import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#134e3a] dark:focus-visible:ring-[#2dd4bf] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-[#134e3a] hover:bg-[#0f3e2e] text-white shadow-xs hover:shadow-soft dark:bg-[#2dd4bf] dark:hover:bg-[#14b8a6] dark:text-[#042f2e]',
      secondary:
        'bg-[#f0ece3] hover:bg-[#e6e0d3] text-[#1c2420] dark:bg-[#222d27] dark:hover:bg-[#2c3a32] dark:text-[#f3f5f4]',
      outline:
        'border border-[#dcd6c8] hover:border-[#b8ad96] hover:bg-[#f6f2ea] text-[#1c2420] dark:border-[#2f3f37] dark:hover:border-[#42584d] dark:hover:bg-[#18231e] dark:text-[#e8ecea]',
      ghost:
        'hover:bg-[#f0ece3] text-[#334039] hover:text-[#1c2420] dark:hover:bg-[#222d27] dark:text-[#a6b4ad] dark:hover:text-[#f3f5f4]',
      accent:
        'bg-[#c48a3f] hover:bg-[#b07832] text-white shadow-xs hover:shadow-soft',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
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
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
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
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
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
  }
);

Button.displayName = 'Button';
