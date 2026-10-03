import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className = '', onClick, hover = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-zinc-900/80 border border-zinc-800/80 rounded-xl backdrop-blur-sm transition-all duration-200 ${hover ? 'hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between p-5 border-b border-zinc-800/60 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
