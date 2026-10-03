import { useMemo } from 'react';
import {
  TrendingUp,
  Target,
  DollarSign,
  Scale,
  Activity,
  Percent,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader, EmptyState, FullPageLoader } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import {
  LineChart,
  BarChart,
  DonutChart,
} from '@/components/ui/Charts';
import {
  calcTradeStats,
  calcEquityCurve,
  calcDailyPnL,
  calcMonthlyPnL,
  calcGroupStats,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatR,
} from '@/lib/calculations';
import {
  INSTRUMENT_COLORS,
  SESSION_COLORS,
  SETUP_COLORS,
} from '@/lib/constants';
import { PageKey } from '@/components/Layout';

interface DashboardProps {
  onNavigate: (page: PageKey) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { trades, accounts, loading } = useData();

  const stats = useMemo(() => {
    const startingBalance = accounts.reduce((s, a) => s + a.starting_balance, 0);
    return calcTradeStats(trades, startingBalance);
  }, [trades, accounts]);

  const equityCurve = useMemo(() => {
    const startingBalance = accounts.reduce((s, a) => s + a.starting_balance, 0);
    return calcEquityCurve(trades, startingBalance);
  }, [trades, accounts]);

  const dailyPnL = useMemo(() => calcDailyPnL(trades), [trades]);
  const monthlyPnL = useMemo(() => calcMonthlyPnL(trades), [trades]);

  const instrumentStats = useMemo(
    () => calcGroupStats(trades, (t) => t.instrument, INSTRUMENT_COLORS),
    [trades]
  );

  const sessionStats = useMemo(
    () => calcGroupStats(trades, (t) => t.session ?? 'Unknown', SESSION_COLORS),
    [trades]
  );

  const setupStats = useMemo(() => {
    const setupTrades: { setup: string; trade: typeof trades[0] }[] = [];
    for (const t of trades) {
      for (const s of t.setups) {
        setupTrades.push({ setup: s, trade: t });
      }
    }
    const fakeTrades = setupTrades.map((st) => ({ ...st.trade, setups: [st.setup] }));
    return calcGroupStats(fakeTrades, (t) => t.setups[0] ?? 'Unknown', SETUP_COLORS);
  }, [trades]);

  const winLossData = useMemo(() => {
    const wins = stats.wins;
    const losses = stats.losses;
    return [
      { label: 'Wins', value: wins, color: '#10b981' },
      { label: 'Losses', value: losses, color: '#ef4444' },
    ];
  }, [stats]);

  const dailyChartData = useMemo(() => {
    return Array.from(dailyPnL.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, pnl]) => ({ label: date.slice(5), value: pnl }));
  }, [dailyPnL]);

  if (loading) return <FullPageLoader message="Loading your dashboard..." />;

  if (trades.length === 0) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Your trading performance at a glance" />
        <Card>
          <EmptyState
            icon={<TrendingUp size={48} />}
            title="No trades yet"
            description="Start building your trading journal by adding your first trade. Your dashboard will populate with analytics automatically."
            action={
              <button
                onClick={() => onNavigate('add-trade')}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
              >
                Add Your First Trade
              </button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Your trading performance at a glance" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Trades"
          value={String(stats.totalTrades)}
          icon={Activity}
          color="default"
        />
        <StatCard
          label="Win Rate"
          value={formatPercent(stats.winRate)}
          icon={Target}
          color={stats.winRate >= 50 ? 'green' : 'red'}
        />
        <StatCard
          label="Total P&L"
          value={formatCurrency(stats.totalPnl)}
          icon={DollarSign}
          color={stats.totalPnl >= 0 ? 'green' : 'red'}
        />
        <StatCard
          label="Avg R:R"
          value={formatNumber(stats.avgRR)}
          icon={Scale}
          color="blue"
        />
        <StatCard
          label="Avg R"
          value={formatR(stats.avgR)}
          icon={TrendingUp}
          color={stats.avgR >= 0 ? 'green' : 'red'}
        />
        <StatCard
          label="Profit Factor"
          value={stats.profitFactor === Infinity ? '∞' : formatNumber(stats.profitFactor)}
          icon={Percent}
          color={stats.profitFactor >= 1 ? 'green' : 'red'}
        />
        <StatCard
          label="Max Drawdown"
          value={formatCurrency(stats.maxDrawdown)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          label="Current Balance"
          value={formatCurrency(stats.currentBalance)}
          icon={Wallet}
          color="amber"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Equity Curve" subtitle="Account balance over time" />
          <div className="p-5">
            <LineChart data={equityCurve.map((e) => ({ label: e.date, value: e.balance }))} height={240} color="#10b981" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Win / Loss" subtitle="Distribution of trades" />
          <div className="p-5 flex items-center justify-center">
            <DonutChart data={winLossData} size={180} />
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Daily P&L" subtitle="Last 14 trading days" />
          <div className="p-5">
            <BarChart data={dailyChartData} height={220} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Monthly P&L" subtitle="Profit and loss by month" />
          <div className="p-5">
            <BarChart
              data={monthlyPnL.map((m) => ({ label: m.label, value: m.pnl }))}
              height={220}
            />
          </div>
        </Card>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Instruments */}
        <Card>
          <CardHeader title="By Instrument" subtitle="Performance per pair" />
          <div className="p-5 space-y-3">
            {instrumentStats.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-4">No data</p>
            ) : (
              instrumentStats.slice(0, 5).map((inst) => (
                <div key={inst.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: inst.color ?? INSTRUMENT_COLORS[inst.name] ?? '#64748b' }}
                    />
                    <span className="text-sm font-medium text-zinc-200">{inst.name}</span>
                    <Badge variant="default">{inst.count}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">{formatPercent(inst.winRate)}</span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${inst.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {formatCurrency(inst.totalPnl)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Sessions */}
        <Card>
          <CardHeader title="By Session" subtitle="Performance per session" />
          <div className="p-5 space-y-3">
            {sessionStats.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-4">No data</p>
            ) : (
              sessionStats.map((sess) => (
                <div key={sess.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: sess.color ?? SESSION_COLORS[sess.name] ?? '#64748b' }}
                    />
                    <span className="text-sm font-medium text-zinc-200">{sess.name}</span>
                    <Badge variant="default">{sess.count}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">{formatPercent(sess.winRate)}</span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${sess.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {formatCurrency(sess.totalPnl)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Setups */}
        <Card>
          <CardHeader title="ICT / SMC Setups" subtitle="Performance per setup" />
          <div className="p-5 space-y-3">
            {setupStats.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-4">No data</p>
            ) : (
              setupStats.slice(0, 6).map((setup) => (
                <div key={setup.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: setup.color ?? SETUP_COLORS[setup.name] ?? '#64748b' }}
                    />
                    <span className="text-sm font-medium text-zinc-200">{setup.name}</span>
                    <Badge variant="default">{setup.count}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">{formatPercent(setup.winRate)}</span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${setup.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {formatCurrency(setup.totalPnl)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Summary */}
      <Card>
        <CardHeader title="Performance Summary" subtitle="Key metrics at a glance" />
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryItem
            icon={<Trophy size={16} />}
            label="Gross Profit"
            value={formatCurrency(stats.grossProfit)}
            positive
          />
          <SummaryItem
            icon={<ArrowDownRight size={16} />}
            label="Gross Loss"
            value={formatCurrency(stats.grossLoss)}
            negative
          />
          <SummaryItem
            icon={<ArrowUpRight size={16} />}
            label="Wins"
            value={String(stats.wins)}
            positive
          />
          <SummaryItem
            icon={<ArrowDownRight size={16} />}
            label="Losses"
            value={String(stats.losses)}
            negative
          />
        </div>
      </Card>
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
  positive,
  negative,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          positive ? 'bg-emerald-500/10 text-emerald-400' : negative ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p
          className={`text-sm font-semibold tabular-nums ${
            positive ? 'text-emerald-400' : negative ? 'text-red-400' : 'text-zinc-200'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
