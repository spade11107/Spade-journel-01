import { Trade } from '@/types';

export function calcRRRatio(
  entry: number | null,
  stopLoss: number | null,
  takeProfit: number | null
): number | null {
  if (entry == null || stopLoss == null || takeProfit == null) return null;
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  if (risk === 0) return null;
  return reward / risk;
}

export function calcRiskAmount(
  accountBalance: number | null,
  riskPercent: number | null
): number | null {
  if (accountBalance == null || riskPercent == null) return null;
  return (accountBalance * riskPercent) / 100;
}

export function calcRewardAmount(
  riskAmount: number | null,
  rrRatio: number | null
): number | null {
  if (riskAmount == null || rrRatio == null) return null;
  return riskAmount * rrRatio;
}

const CONTRACT_SIZES: Record<string, number> = {
  XAUUSD: 100,
  BTCUSD: 1,
  EURUSD: 100000,
  GBPUSD: 100000,
  USDJPY: 100000,
  USDCAD: 100000,
  AUDUSD: 100000,
  NZDUSD: 100000,
  ETHUSD: 1,
  SPX500: 1,
  NAS100: 1,
  US30: 1,
  Other: 1,
};

export function getContractSize(instrument: string): number {
  return CONTRACT_SIZES[instrument] ?? 1;
}

export function calcPnL(
  direction: 'buy' | 'sell',
  entryPrice: number | null,
  exitPrice: number | null,
  lotSize: number | null,
  instrument?: string
): number | null {
  if (entryPrice == null || exitPrice == null || lotSize == null) return null;
  const contractSize = instrument ? getContractSize(instrument) : 1;
  const diff =
    direction === 'buy' ? exitPrice - entryPrice : entryPrice - exitPrice;
  return diff * lotSize * contractSize;
}

export function calcRMultiple(
  pnl: number | null,
  riskAmount: number | null
): number | null {
  if (pnl == null || riskAmount == null || riskAmount === 0) return null;
  return pnl / riskAmount;
}

export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgRR: number;
  avgR: number;
  profitFactor: number;
  maxDrawdown: number;
  currentBalance: number;
  grossProfit: number;
  grossLoss: number;
}

export function calcTradeStats(
  trades: Trade[],
  startingBalance: number = 0
): TradeStats {
  const closedTrades = trades.filter((t) => t.status === 'closed' && t.pnl != null);
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closedTrades.filter((t) => (t.pnl ?? 0) < 0);

  const grossProfit = wins.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl ?? 0), 0));
  const totalPnl = grossProfit - grossLoss;

  const totalTrades = closedTrades.length;
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

  const rrValues = closedTrades
    .map((t) => t.rr_ratio)
    .filter((v): v is number => v != null && v > 0);
  const avgRR = rrValues.length > 0
    ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length
    : 0;

  const rValues = closedTrades
    .map((t) => t.r_multiple)
    .filter((v): v is number => v != null);
  const avgR = rValues.length > 0
    ? rValues.reduce((a, b) => a + b, 0) / rValues.length
    : 0;

  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Max drawdown from equity curve
  let runningBalance = startingBalance;
  let peak = startingBalance;
  let maxDD = 0;
  for (const t of closedTrades) {
    runningBalance += t.pnl ?? 0;
    if (runningBalance > peak) peak = runningBalance;
    const dd = peak - runningBalance;
    if (dd > maxDD) maxDD = dd;
  }

  const currentBalance = startingBalance + totalPnl;

  return {
    totalTrades,
    wins: wins.length,
    losses: losses.length,
    winRate,
    totalPnl,
    avgRR,
    avgR,
    profitFactor,
    maxDrawdown: maxDD,
    currentBalance,
    grossProfit,
    grossLoss,
  };
}

export interface GroupStats {
  name: string;
  count: number;
  winRate: number;
  totalPnl: number;
  avgR: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  color?: string;
}

export function calcGroupStats(
  trades: Trade[],
  groupKey: (t: Trade) => string,
  colorMap?: Record<string, string>
): GroupStats[] {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    if (t.status !== 'closed' || t.pnl == null) continue;
    const key = groupKey(t);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const results: GroupStats[] = [];
  for (const [name, groupTrades] of groups) {
    const wins = groupTrades.filter((t) => (t.pnl ?? 0) > 0);
    const losses = groupTrades.filter((t) => (t.pnl ?? 0) < 0);
    const grossProfit = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
    const rValues = groupTrades
      .map((t) => t.r_multiple)
      .filter((v): v is number => v != null);

    results.push({
      name,
      color: colorMap?.[name],
      count: groupTrades.length,
      winRate: groupTrades.length > 0 ? (wins.length / groupTrades.length) * 100 : 0,
      totalPnl: grossProfit - grossLoss,
      avgR: rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0,
      avgWin: wins.length > 0 ? grossProfit / wins.length : 0,
      avgLoss: losses.length > 0 ? grossLoss / losses.length : 0,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    });
  }

  return results.sort((a, b) => b.count - a.count);
}

export interface DayCalendarData {
  date: string;
  pnl: number;
  tradeCount: number;
  wins: number;
  losses: number;
}

export function calcCalendarData(trades: Trade[]): Map<string, DayCalendarData> {
  const map = new Map<string, DayCalendarData>();
  for (const t of trades) {
    if (t.status !== 'closed' || t.pnl == null) continue;
    const existing = map.get(t.trade_date);
    const pnl = t.pnl ?? 0;
    if (existing) {
      existing.pnl += pnl;
      existing.tradeCount++;
      if (pnl > 0) existing.wins++;
      else if (pnl < 0) existing.losses++;
    } else {
      map.set(t.trade_date, {
        date: t.trade_date,
        pnl,
        tradeCount: 1,
        wins: pnl > 0 ? 1 : 0,
        losses: pnl < 0 ? 1 : 0,
      });
    }
  }
  return map;
}

export function calcEquityCurve(
  trades: Trade[],
  startingBalance: number = 0
): { index: number; date: string; balance: number; pnl: number }[] {
  const sorted = [...trades]
    .filter((t) => t.status === 'closed' && t.pnl != null)
    .sort((a, b) => {
      const da = new Date(a.trade_date).getTime();
      const db = new Date(b.trade_date).getTime();
      if (da !== db) return da - db;
      return (a.trade_time ?? '').localeCompare(b.trade_time ?? '');
    });

  let balance = startingBalance;
  const curve = [
    { index: 0, date: 'Start', balance, pnl: 0 },
  ];
  sorted.forEach((t, i) => {
    balance += t.pnl ?? 0;
    curve.push({
      index: i + 1,
      date: t.trade_date,
      balance,
      pnl: t.pnl ?? 0,
    });
  });
  return curve;
}

export function calcDailyPnL(trades: Trade[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of trades) {
    if (t.status !== 'closed' || t.pnl == null) continue;
    map.set(t.trade_date, (map.get(t.trade_date) ?? 0) + (t.pnl ?? 0));
  }
  return map;
}

export function calcMonthlyPnL(
  trades: Trade[]
): { month: string; label: string; pnl: number }[] {
  const map = new Map<string, number>();
  for (const t of trades) {
    if (t.status !== 'closed' || t.pnl == null) continue;
    const monthKey = t.trade_date.slice(0, 7);
    map.set(monthKey, (map.get(monthKey) ?? 0) + (t.pnl ?? 0));
  }
  const months: { month: string; label: string; pnl: number }[] = [];
  for (const [monthKey, pnl] of map) {
    const [y, m] = monthKey.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    months.push({
      month: monthKey,
      label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      pnl,
    });
  }
  return months.sort((a, b) => a.month.localeCompare(b.month));
}

export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value == null || isNaN(value)) return '—';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return '—';
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null || isNaN(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function formatR(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}R`;
}

export type ExitReason = 'tp_hit' | 'sl_hit' | 'manual' | 'open' | 'unknown';

export function getExitReason(trade: Trade): ExitReason {
  if (trade.status === 'open') return 'open';
  if (trade.exit_price == null) return 'unknown';

  const { exit_price, take_profit, stop_loss, direction } = trade;

  if (take_profit != null) {
    if (direction === 'buy' && exit_price >= take_profit) return 'tp_hit';
    if (direction === 'sell' && exit_price <= take_profit) return 'tp_hit';
  }

  if (stop_loss != null) {
    if (direction === 'buy' && exit_price <= stop_loss) return 'sl_hit';
    if (direction === 'sell' && exit_price >= stop_loss) return 'sl_hit';
  }

  return 'manual';
}
