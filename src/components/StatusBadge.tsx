import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'emerald' | 'amber' | 'rose' | 'slate' | 'sky';
  className?: string;
}

const variantStyles: Record<string, string> = {
  emerald: 'bg-emerald-100/80 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-100/80 text-amber-800 border-amber-200',
  rose: 'bg-rose-100/80 text-rose-800 border-rose-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200',
  sky: 'bg-sky-100/80 text-sky-800 border-sky-200',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'emerald',
  className = '',
}) => {
  const badgeStyle = variantStyles[variant] || variantStyles.emerald;

  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeStyle} ${className}`}
    >
      {status}
    </span>
  );
};
