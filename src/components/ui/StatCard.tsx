import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'default' | 'green' | 'red' | 'blue' | 'amber';
}

const colorClasses = {
  default: 'text-zinc-100',
  green: 'text-emerald-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
  amber: 'text-amber-400',
};

const iconBgClasses = {
  default: 'bg-zinc-800 text-zinc-400',
  green: 'bg-emerald-500/10 text-emerald-400',
  red: 'bg-red-500/10 text-red-400',
  blue: 'bg-blue-500/10 text-blue-400',
  amber: 'bg-amber-500/10 text-amber-400',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'default',
}: StatCardProps) {
  return (
    <Card className="p-4 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
            {label}
          </p>
          <p className={`text-2xl font-bold tabular-nums truncate ${colorClasses[color]}`}>
            {value}
          </p>
          {trend && trendValue && (
            <p
              className={`text-xs mt-1 font-medium ${
                trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-500'
              }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'} {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${iconBgClasses[color]} transition-transform group-hover:scale-110`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </Card>
  );
}
