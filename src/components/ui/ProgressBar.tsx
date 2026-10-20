import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100+
  max?: number;
  label?: string;
  showPercent?: boolean;
  variant?: 'primary' | 'warning' | 'danger' | 'success';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = true,
  variant,
  className = '',
}: ProgressBarProps) {
  const percent = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);
  const actualPercent = Math.round((value / max) * 100);

  // Auto pick variant based on overspend/progress if not explicitly set
  const computedVariant =
    variant || (actualPercent > 100 ? 'danger' : actualPercent >= 85 ? 'warning' : 'primary');

  const variants = {
    primary: 'bg-[#134e3a] dark:bg-[#2dd4bf]',
    warning: 'bg-[#c48a3f] dark:bg-[#eab368]',
    danger: 'bg-rose-600 dark:bg-rose-500',
    success: 'bg-emerald-600 dark:bg-emerald-400',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs">
          {label && <span className="font-medium text-[#2d3832] dark:text-[#d3ded8]">{label}</span>}
          {showPercent && (
            <span
              className={`font-semibold tabular-nums ${
                actualPercent > 100 ? 'text-rose-600 dark:text-rose-400' : 'text-[#606d66] dark:text-[#94a19b]'
              }`}
            >
              {actualPercent}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full h-2 bg-[#ece7dd] dark:bg-[#243029] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div
          className={`h-full transition-all duration-500 rounded-full ${variants[computedVariant]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
