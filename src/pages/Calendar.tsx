import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, EmptyState, FullPageLoader } from '@/components/ui/States';
import { calcCalendarData, formatCurrency } from '@/lib/calculations';
import { Trade } from '@/types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar() {
  const { trades, loading } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarData = useMemo(() => calcCalendarData(trades), [trades]);

  const monthData = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const cells: { date: string | null; day: number | null }[] = [];

    for (let i = 0; i < startWeekday; i++) {
      cells.push({ date: null, day: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date: dateStr, day: d });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ date: null, day: null });
    }

    return cells;
  }, [year, month]);

  const monthStats = useMemo(() => {
    let pnl = 0;
    let tradeDays = 0;
    let winDays = 0;
    let lossDays = 0;
    for (const [date, data] of calendarData.entries()) {
      if (date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
        pnl += data.pnl;
        tradeDays++;
        if (data.pnl > 0) winDays++;
        else if (data.pnl < 0) lossDays++;
      }
    }
    return { pnl, tradeDays, winDays, lossDays };
  }, [calendarData, year, month]);

  const selectedDayTrades = useMemo(() => {
    if (!selectedDate) return [];
    return trades
      .filter((t) => t.trade_date === selectedDate)
      .sort((a, b) => (a.trade_time ?? '').localeCompare(b.trade_time ?? ''));
  }, [trades, selectedDate]);

  const selectedDayPnL = selectedDayTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  if (loading) return <FullPageLoader message="Loading calendar..." />;

  return (
    <div className="space-y-5">
      <PageHeader title="Calendar" subtitle="Daily trading performance at a glance" />

      {/* Month Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Month P&L</p>
          <p className={`text-xl font-bold tabular-nums ${monthStats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(monthStats.pnl)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Trading Days</p>
          <p className="text-xl font-bold text-zinc-100 tabular-nums">{monthStats.tradeDays}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Green Days</p>
          <p className="text-xl font-bold text-emerald-400 tabular-nums">{monthStats.winDays}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Red Days</p>
          <p className="text-xl font-bold text-red-400 tabular-nums">{monthStats.lossDays}</p>
        </Card>
      </div>

      <Card>
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <h3 className="text-lg font-semibold text-zinc-100">
            {MONTHS[month]} {year}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800/60">
          {DAYS.map((day) => (
            <div key={day} className="text-center py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {monthData.map((cell, i) => {
            if (!cell.date) {
              return <div key={i} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-zinc-800/30" />;
            }

            const dayData = calendarData.get(cell.date);
            const hasTrades = !!dayData;
            const isToday = cell.date === new Date().toISOString().slice(0, 10);

            return (
              <button
                key={i}
                onClick={() => hasTrades && setSelectedDate(cell.date)}
                className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-zinc-800/30 p-1.5 sm:p-2 text-left transition-all relative group ${
                  hasTrades ? 'cursor-pointer hover:bg-zinc-800/40' : ''
                } ${isToday ? 'ring-1 ring-blue-500/40 ring-inset' : ''}`}
              >
                <span className={`text-xs ${isToday ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}>
                  {cell.day}
                </span>
                {hasTrades && (
                  <div className="mt-1 space-y-1">
                    <div
                      className={`text-[10px] sm:text-xs font-semibold tabular-nums truncate ${
                        dayData.pnl > 0 ? 'text-emerald-400' : dayData.pnl < 0 ? 'text-red-400' : 'text-zinc-400'
                      }`}
                    >
                      {formatCurrency(dayData.pnl)}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-zinc-600">
                      {dayData.tradeCount} trade{dayData.tradeCount !== 1 ? 's' : ''}
                    </div>
                    <div
                      className={`h-1 rounded-full ${
                        dayData.pnl > 0 ? 'bg-emerald-500' : dayData.pnl < 0 ? 'bg-red-500' : 'bg-zinc-600'
                      }`}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Profitable day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Losing day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
          <span>No trades</span>
        </div>
      </div>

      {/* Day Detail Modal */}
      <Modal
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
        size="lg"
      >
        {selectedDate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Day P&L</p>
                <p className={`text-2xl font-bold tabular-nums ${selectedDayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(selectedDayPnL)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Trades</p>
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">{selectedDayTrades.length}</p>
              </div>
            </div>

            {selectedDayTrades.length === 0 ? (
              <EmptyState
                icon={<CalendarIcon size={36} />}
                title="No trades on this day"
                description="This date has no recorded trades."
              />
            ) : (
              <div className="space-y-2">
                {selectedDayTrades.map((t) => (
                  <TradeRow key={t.id} trade={t} />
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  return (
    <div className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-lg border border-zinc-800">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${trade.direction === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          {trade.direction === 'buy' ? (
            <TrendingUp size={16} className="text-emerald-400" />
          ) : (
            <TrendingDown size={16} className="text-red-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-100">
            {trade.instrument} <span className="text-zinc-500 capitalize">· {trade.direction}</span>
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {trade.setups.slice(0, 2).map((s) => (
              <Badge key={s} variant="blue" className="text-[10px]">{s}</Badge>
            ))}
            {trade.trade_time && <span className="text-xs text-zinc-500">{trade.trade_time}</span>}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold tabular-nums ${(trade.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatCurrency(trade.pnl)}
        </p>
        <p className="text-xs text-zinc-500">{trade.session ?? '—'}</p>
      </div>
    </div>
  );
}
