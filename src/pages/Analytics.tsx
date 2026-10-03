import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { PageHeader, EmptyState, FullPageLoader } from '@/components/ui/States';
import { HorizontalBarChart, DonutChart } from '@/components/ui/Charts';
import {
  calcGroupStats,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatR,
} from '@/lib/calculations';
import { INSTRUMENT_COLORS, SESSION_COLORS, SETUP_COLORS } from '@/lib/constants';

type Tab = 'pairs' | 'sessions' | 'setups';

export function Analytics() {
  const { trades, loading } = useData();
  const [tab, setTab] = useState<Tab>('pairs');

  const instrumentStats = useMemo(
    () => calcGroupStats(trades, (t) => t.instrument, INSTRUMENT_COLORS),
    [trades]
  );

  const sessionStats = useMemo(
    () => calcGroupStats(trades, (t) => t.session ?? 'Unknown', SESSION_COLORS),
    [trades]
  );

  const setupStats = useMemo(() => {
    const expanded: typeof trades = [];
    for (const t of trades) {
      if (t.setups.length === 0) {
        expanded.push({ ...t, setups: ['Other'] });
      } else {
        for (const s of t.setups) {
          expanded.push({ ...t, setups: [s] });
        }
      }
    }
    return calcGroupStats(expanded, (t) => t.setups[0] ?? 'Other', SETUP_COLORS);
  }, [trades]);

  if (loading) return <FullPageLoader message="Loading analytics..." />;

  if (trades.length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Deep performance breakdown by pair, session, and setup" />
        <Card>
          <EmptyState
            icon={<BarChart3 size={48} />}
            title="No data to analyze"
            description="Add trades to see detailed analytics by instrument, session, and ICT/SMC setup."
          />
        </Card>
      </div>
    );
  }

  const currentStats = tab === 'pairs' ? instrumentStats : tab === 'sessions' ? sessionStats : setupStats;
  const tabs: { key: Tab; label: string }[] = [
    { key: 'pairs', label: 'Pairs' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'setups', label: 'Setups' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" subtitle="Deep performance breakdown by pair, session, and setup" />

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              tab === t.key ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title={`${tabs.find((t) => t.key === tab)?.label} — P&L`} subtitle="Total profit and loss" />
          <div className="p-5">
            <HorizontalBarChart
              data={currentStats.map((s) => ({
                label: s.name,
                value: s.totalPnl,
                color: s.color,
                secondary: formatCurrency(s.totalPnl),
              }))}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Trade Distribution" subtitle="Number of trades per category" />
          <div className="p-5">
            <DonutChart
              data={currentStats.map((s) => ({
                label: s.name,
                value: s.count,
                color: s.color ?? '#64748b',
              }))}
            />
          </div>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader title="Detailed Breakdown" subtitle="Full metrics for each category" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wide">
                <th className="text-left font-medium px-5 py-3">Name</th>
                <th className="text-right font-medium px-3 py-3">Trades</th>
                <th className="text-right font-medium px-3 py-3">Win Rate</th>
                <th className="text-right font-medium px-3 py-3">Total P&L</th>
                <th className="text-right font-medium px-3 py-3">Avg R</th>
                <th className="text-right font-medium px-3 py-3">Avg Win</th>
                <th className="text-right font-medium px-3 py-3">Avg Loss</th>
                <th className="text-right font-medium px-5 py-3">Profit Factor</th>
              </tr>
            </thead>
            <tbody>
              {currentStats.map((s) => (
                <tr key={s.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: s.color ?? '#64748b' }}
                      />
                      <span className="font-medium text-zinc-100">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-300">{s.count}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <span className={s.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                      {formatPercent(s.winRate)}
                    </span>
                  </td>
                  <td className={`px-3 py-3 text-right tabular-nums font-semibold ${s.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(s.totalPnl)}
                  </td>
                  <td className={`px-3 py-3 text-right tabular-nums ${s.avgR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatR(s.avgR)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-emerald-400/70">{formatCurrency(s.avgWin)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-red-400/70">{formatCurrency(s.avgLoss)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <span className={s.profitFactor >= 1 ? 'text-emerald-400' : 'text-red-400'}>
                      {s.profitFactor === Infinity ? '∞' : formatNumber(s.profitFactor)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentStats.slice(0, 4).map((s) => (
          <Card key={s.name} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color ?? '#64748b' }} />
              <p className="text-xs font-medium text-zinc-400 truncate">{s.name}</p>
            </div>
            <p className={`text-lg font-bold tabular-nums ${s.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(s.totalPnl)}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
              <span>{s.count} trades</span>
              <span>{formatPercent(s.winRate)} WR</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
