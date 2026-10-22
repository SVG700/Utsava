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
          <label htmlFor={inputId} className="block text-xs sm:text-sm font-medium text-[#2d3832] dark:text-[#d3ded8]">
            {label}
            {required && <span className="text-[#134e3a] dark:text-[#2dd4bf] ml-1 font-bold" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-[#18201c] text-[#1c2420] dark:text-[#f3f5f4] text-sm placeholder:text-[#596660] focus:outline-none focus:ring-2 transition-all duration-150',
            error
              ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-950'
              : 'border-[#dcd6c8] dark:border-[#2f3f37] focus:border-[#134e3a] dark:focus:border-[#2dd4bf] focus:ring-[#134e3a]/15 dark:focus:ring-[#2dd4bf]/20',
            className
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-rose-700 dark:text-rose-400 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-help`} className="text-xs text-[#596660] dark:text-[#94a19b]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
