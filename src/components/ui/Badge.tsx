import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'festive' | 'forest';
}

export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default:
      'bg-[#f0ece3] text-[#2d3832] border-[#e2ddd1] dark:bg-[#222d27] dark:text-[#d3ded8] dark:border-[#2f3f36]',
    forest:
      'bg-[#e8f3ee] text-[#134e3a] border-[#cbe4d7] dark:bg-[#132a22] dark:text-[#34d399] dark:border-[#1d4235]',
    festive:
      'bg-[#fbf3e6] text-[#9c6a28] border-[#eedbb9] dark:bg-[#281f13] dark:text-[#f3c27a] dark:border-[#3d2e1b]',
    success:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    warning:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    danger:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
    info:
      'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
