import { useMemo } from 'react';
import { Brain, TrendingUp, TrendingDown } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { PageHeader, EmptyState, FullPageLoader } from '@/components/ui/States';
import { HorizontalBarChart, DonutChart } from '@/components/ui/Charts';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import { EMOTIONS } from '@/lib/constants';

const emotionColors: Record<string, string> = {
  Calm: '#10b981',
  Confident: '#3b82f6',
  Disciplined: '#06b6d4',
  Fear: '#f59e0b',
  FOMO: '#ef4444',
  Greed: '#f97316',
  Revenge: '#dc2626',
  Hesitation: '#8b5cf6',
};

export function Psychology() {
  const { trades, loading } = useData();

  const emotionStats = useMemo(() => {
    const phases = ['before', 'during', 'after'] as const;
    const result: Record<string, { count: number; pnl: number; winRate: number; wins: number }> = {};

    for (const phase of phases) {
      const key = `emotion_${phase}`;
      for (const emotion of EMOTIONS) {
        const matching = trades.filter((t) => (t as unknown as Record<string, string | null>)[key] === emotion);
        if (matching.length === 0) continue;
        const pnl = matching.reduce((s, t) => s + (t.pnl ?? 0), 0);
        const wins = matching.filter((t) => (t.pnl ?? 0) > 0).length;
        result[`${phase}-${emotion}`] = {
          count: matching.length,
          pnl,
          wins,
          winRate: matching.length > 0 ? (wins / matching.length) * 100 : 0,
        };
      }
    }

    return result;
  }, [trades]);

  const disciplineStats = useMemo(() => {
    const fields = [
      { key: 'followed_plan' as const, label: 'Followed Plan', positive: true },
      { key: 'overtraded' as const, label: 'Overtraded', positive: false },
      { key: 'moved_sl' as const, label: 'Moved SL', positive: false },
      { key: 'early_entry' as const, label: 'Early Entry', positive: false },
      { key: 'revenge_trade' as const, label: 'Revenge Trade', positive: false },
    ];

    return fields.map((f) => {
      const matching = trades.filter((t) => t[f.key]);
      const pnl = matching.reduce((s, t) => s + (t.pnl ?? 0), 0);
      const wins = matching.filter((t) => (t.pnl ?? 0) > 0).length;
      return {
        label: f.label,
        positive: f.positive,
        count: matching.length,
        pnl,
        winRate: matching.length > 0 ? (wins / matching.length) * 100 : 0,
      };
    });
  }, [trades]);

  if (loading) return <FullPageLoader message="Loading psychology data..." />;

  if (trades.length === 0) {
    return (
      <div>
        <PageHeader title="Psychology" subtitle="Understand how your emotions affect your trading" />
        <Card>
          <EmptyState
            icon={<Brain size={48} />}
            title="No psychology data yet"
            description="Record emotions with your trades to see how your mental state impacts performance."
          />
        </Card>
      </div>
    );
  }

  const phases = [
    { key: 'before' as const, label: 'Before Trade' },
    { key: 'during' as const, label: 'During Trade' },
    { key: 'after' as const, label: 'After Trade' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Psychology" subtitle="Understand how your emotions affect your trading" />

      {/* Emotion Analysis by Phase */}
      {phases.map((phase) => {
        const phaseData = EMOTIONS.map((em) => {
          const stats = emotionStats[`${phase.key}-${em}`];
          return {
            emotion: em,
            count: stats?.count ?? 0,
            pnl: stats?.pnl ?? 0,
            winRate: stats?.winRate ?? 0,
          };
        }).filter((d) => d.count > 0);

        if (phaseData.length === 0) return null;

        return (
          <Card key={phase.key}>
            <CardHeader title={phase.label} subtitle={`Emotional state ${phase.label.toLowerCase()}`} />
            <div className="p-5 space-y-4">
              <HorizontalBarChart
                data={phaseData.map((d) => ({
                  label: d.emotion,
                  value: d.pnl,
                  color: emotionColors[d.emotion],
                  secondary: formatCurrency(d.pnl),
                }))}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-zinc-800">
                {phaseData.map((d) => (
                  <div key={d.emotion} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: emotionColors[d.emotion] }} />
                    <div>
                      <p className="text-xs text-zinc-400">{d.emotion}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500">{d.count} trades</span>
                        <span className={d.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                          {formatPercent(d.winRate)} WR
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })}

      {/* Discipline Stats */}
      <Card>
        <CardHeader title="Discipline Tracker" subtitle="How discipline metrics correlate with P&L" />
        <div className="p-5 space-y-3">
          {disciplineStats.map((d) => (
            <div
              key={d.label}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                d.positive ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    d.positive ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }`}
                >
                  {d.positive ? (
                    <TrendingUp size={18} className="text-emerald-400" />
                  ) : (
                    <TrendingDown size={18} className="text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{d.label}</p>
                  <p className="text-xs text-zinc-500">
                    {d.count} trade{d.count !== 1 ? 's' : ''} · {formatPercent(d.winRate)} win rate
                  </p>
                </div>
              </div>
              <p
                className={`text-lg font-bold tabular-nums ${
                  d.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatCurrency(d.pnl)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Emotion Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {phases.map((phase) => {
          const data = EMOTIONS.map((em) => {
            const stats = emotionStats[`${phase.key}-${em}`];
            return {
              label: em,
              value: stats?.count ?? 0,
              color: emotionColors[em],
            };
          }).filter((d) => d.value > 0);

          if (data.length === 0) return null;

          return (
            <Card key={phase.key}>
              <CardHeader title={`${phase.label} Distribution`} />
              <div className="p-5">
                <DonutChart data={data} size={160} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
