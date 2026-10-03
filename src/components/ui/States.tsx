import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-zinc-500 ${className}`} />;
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <LoadingSpinner size={32} />
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-zinc-700">{icon}</div>}
      <h3 className="text-base font-semibold text-zinc-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-zinc-500 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <span className="text-red-400 text-xl">!</span>
      </div>
      <h3 className="text-base font-semibold text-zinc-300 mb-1">Something went wrong</h3>
      <p className="text-sm text-zinc-500 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
