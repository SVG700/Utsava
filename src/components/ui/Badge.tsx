import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'festive' | 'forest';
}

export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default:
      'bg-linen-85 text-moss-810 border-linen-150 dark:bg-moss-845 dark:text-moss-155 dark:border-moss-790',
    forest:
      'bg-forest-50 text-forest-700 border-moss-145 dark:bg-moss-860 dark:text-mint-295 dark:border-moss-795',
    festive:
      'bg-saffron-50 text-saffron-685 border-saffron-150 dark:bg-saffron-880 dark:text-saffron-230 dark:border-saffron-825',
    success:
      'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    warning:
      'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    danger:
      'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
    info: 'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase border',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
