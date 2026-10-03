import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'green' | 'red' | 'blue' | 'amber' | 'purple';
  className?: string;
}

const variantClasses = {
  default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  purple: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
