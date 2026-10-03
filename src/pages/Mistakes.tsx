import { useMemo } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { PageHeader, EmptyState, FullPageLoader } from '@/components/ui/States';
import { HorizontalBarChart } from '@/components/ui/Charts';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import { MISTAKES } from '@/lib/constants';

export function Mistakes() {
  const { trades, loading } = useData();

  const mistakeStats = useMemo(() => {
    return MISTAKES.map((mistake) => {
      const matching = trades.filter((t) => t.mistakes.includes(mistake));
      const pnl = matching.reduce((s, t) => s + (t.pnl ?? 0), 0);
      const wins = matching.filter((t) => (t.pnl ?? 0) > 0).length;
      return {
        mistake,
        count: matching.length,
        pnl,
        winRate: matching.length > 0 ? (wins / matching.length) * 100 : 0,
        avgPnl: matching.length > 0 ? pnl / matching.length : 0,
      };
    }).filter((m) => m.count > 0)
      .sort((a, b) => a.pnl - b.pnl);
  }, [trades]);

  const totalMistakes = mistakeStats.reduce((s, m) => s + m.count, 0);
  const totalMistakePnL = mistakeStats.reduce((s, m) => s + m.pnl, 0);

  if (loading) return <FullPageLoader message="Loading mistakes..." />;

  if (trades.length === 0) {
    return (
      <div>
        <PageHeader title="Mistake Tracker" subtitle="Identify and eliminate recurring trading mistakes" />
        <Card>
          <EmptyState
            icon={<AlertTriangle size={48} />}
            title="No mistakes tracked yet"
            description="When you log trades with mistakes, this page will show their frequency and P&L impact."
          />
        </Card>
      </div>
    );
  }

  if (mistakeStats.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Mistake Tracker" subtitle="Identify and eliminate recurring trading mistakes" />
        <Card>
          <EmptyState
            icon={<TrendingUp size={48} />}
            title="No mistakes recorded"
            description="Great job! None of your logged trades have any mistakes marked. Keep up the discipline."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Mistake Tracker" subtitle="Identify and eliminate recurring trading mistakes" />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Total Mistakes</p>
          <p className="text-2xl font-bold text-zinc-100 tabular-nums">{totalMistakes}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">P&L Impact</p>
          <p className={`text-2xl font-bold tabular-nums ${totalMistakePnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(totalMistakePnL)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Most Frequent</p>
          <p className="text-lg font-bold text-red-400 truncate">{mistakeStats[0]?.mistake ?? '—'}</p>
        </Card>
      </div>

      {/* P&L by Mistake */}
      <Card>
        <CardHeader title="P&L by Mistake" subtitle="How much each mistake is costing you" />
        <div className="p-5">
          <HorizontalBarChart
            data={mistakeStats.map((m) => ({
              label: m.mistake,
              value: m.pnl,
              color: m.pnl >= 0 ? '#10b981' : '#ef4444',
              secondary: formatCurrency(m.pnl),
            }))}
          />
        </div>
      </Card>

      {/* Frequency Chart */}
      <Card>
        <CardHeader title="Mistake Frequency" subtitle="How often each mistake occurs" />
        <div className="p-5">
          <HorizontalBarChart
            data={mistakeStats.map((m) => ({
              label: m.mistake,
              value: m.count,
              color: '#f59e0b',
              secondary: `${m.count}x`,
            }))}
          />
        </div>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader title="Detailed Breakdown" subtitle="Full statistics for each mistake" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wide">
                <th className="text-left font-medium px-5 py-3">Mistake</th>
                <th className="text-right font-medium px-3 py-3">Frequency</th>
                <th className="text-right font-medium px-3 py-3">Win Rate</th>
                <th className="text-right font-medium px-3 py-3">Total P&L</th>
                <th className="text-right font-medium px-3 py-3">Avg P&L</th>
                <th className="text-right font-medium px-5 py-3">Impact</th>
              </tr>
            </thead>
            <tbody>
              {mistakeStats.map((m) => (
                <tr key={m.mistake} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle size={14} className="text-red-400" />
                      </div>
                      <span className="font-medium text-zinc-100">{m.mistake}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-300">{m.count}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <span className={m.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                      {formatPercent(m.winRate)}
                    </span>
                  </td>
                  <td className={`px-3 py-3 text-right tabular-nums font-semibold ${m.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(m.pnl)}
                  </td>
                  <td className={`px-3 py-3 text-right tabular-nums ${m.avgPnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                    {formatCurrency(m.avgPnl)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {m.pnl < 0 ? (
                        <TrendingDown size={14} className="text-red-400" />
                      ) : (
                        <TrendingUp size={14} className="text-emerald-400" />
                      )}
                      <span className={`text-xs font-medium ${m.pnl < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {m.pnl < 0 ? 'Costly' : 'Profitable'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
