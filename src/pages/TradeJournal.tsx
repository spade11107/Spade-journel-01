import { useState, useMemo, useRef } from 'react';
import {
  Search,
  Download,
  Upload,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Eye,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { PageHeader, EmptyState, FullPageLoader } from '@/components/ui/States';
import {
  formatCurrency,
  formatNumber,
  formatR,
  formatPercent,
  getExitReason,
} from '@/lib/calculations';
import { ExitReason } from '@/lib/calculations';
import { tradesToCSV, downloadCSV, parseCSV, csvRowsToTrades } from '@/lib/csv';
import { Trade, TradeScreenshot } from '@/types';
import { INSTRUMENTS, SESSIONS, SETUPS } from '@/lib/constants';

export function TradeJournal() {
  const { trades, accounts, deleteTrade, loading, getScreenshots, getScreenshotUrl, deleteScreenshot, addTrade } = useData();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    account: '',
    pair: '',
    session: '',
    setup: '',
    result: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [screenshots, setScreenshots] = useState<TradeScreenshot[]>([]);
  const [loadingScreenshots, setLoadingScreenshots] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Trade | null>(null);
  const [page, setPage] = useState(1);
  const [deleteScreenshotTarget, setDeleteScreenshotTarget] = useState<TradeScreenshot | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const pageSize = 12;

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (filters.account && t.account_id !== filters.account) return false;
      if (filters.pair && t.instrument !== filters.pair) return false;
      if (filters.session && t.session !== filters.session) return false;
      if (filters.setup && !t.setups.includes(filters.setup)) return false;
      if (filters.result && filters.result === 'win' && (t.pnl ?? 0) <= 0) return false;
      if (filters.result && filters.result === 'loss' && (t.pnl ?? 0) >= 0) return false;
      if (filters.dateFrom && t.trade_date < filters.dateFrom) return false;
      if (filters.dateTo && t.trade_date > filters.dateTo) return false;
      if (search) {
        const s = search.toLowerCase();
        const matchSearch =
          t.instrument.toLowerCase().includes(s) ||
          t.setups.join(' ').toLowerCase().includes(s) ||
          (t.notes ?? '').toLowerCase().includes(s) ||
          (t.session ?? '').toLowerCase().includes(s);
        if (!matchSearch) return false;
      }
      return true;
    });
  }, [trades, filters, search]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const accountName = (id: string | null) =>
    accounts.find((a) => a.id === id)?.name ?? '—';

  const openTradeDetail = async (trade: Trade) => {
    setSelectedTrade(trade);
    setLoadingScreenshots(true);
    const ss = await getScreenshots(trade.id);
    setScreenshots(ss);
    setLoadingScreenshots(false);
  };

  const handleExport = () => {
    const csv = tradesToCSV(filtered, accounts);
    downloadCSV(csv, `spade_trades_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('Importing...');
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) {
      setImportStatus('Invalid CSV file');
      setTimeout(() => setImportStatus(null), 3000);
      return;
    }
    const header = rows[0];
    const dataRows = rows.slice(1);
    const parsed = csvRowsToTrades(dataRows, header);

    let success = 0;
    for (const t of parsed) {
      const result = await addTrade({
        account_id: accounts[0]?.id ?? '',
        trade_date: t.trade_date,
        trade_time: t.trade_time ?? '',
        instrument: t.instrument,
        direction: t.direction,
        entry_price: t.entry_price?.toString() ?? '',
        stop_loss: t.stop_loss?.toString() ?? '',
        take_profit: t.take_profit?.toString() ?? '',
        exit_price: t.exit_price?.toString() ?? '',
        lot_size: t.lot_size?.toString() ?? '',
        risk_percent: t.risk_percent?.toString() ?? '',
        setups: t.setups,
        session: t.session ?? '',
        kill_zone: '',
        emotion_before: t.emotion_before ?? '',
        emotion_during: t.emotion_during ?? '',
        emotion_after: t.emotion_after ?? '',
        followed_plan: t.followed_plan,
        overtraded: t.overtraded,
        moved_sl: t.moved_sl,
        early_entry: t.early_entry,
        revenge_trade: t.revenge_trade,
        mistakes: t.mistakes,
        notes: t.notes ?? '',
        status: t.status,
      });
      if (!result.error) success++;
    }
    setImportStatus(`Imported ${success} of ${parsed.length} trades`);
    setTimeout(() => setImportStatus(null), 4000);
    if (importRef.current) importRef.current.value = '';
  };

  if (loading) return <FullPageLoader message="Loading trades..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trade Journal"
        subtitle={`${filtered.length} trade${filtered.length !== 1 ? 's' : ''} found`}
        action={
          <>
            <input
              ref={importRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
            />
            <Button variant="secondary" size="sm" onClick={() => importRef.current?.click()}>
              <Upload size={15} /> Import
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
              <Download size={15} /> Export
            </Button>
          </>
        }
      />

      {importStatus && (
        <div className="text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3">
          {importStatus}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <div className="relative lg:col-span-2 xl:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <Input
              placeholder="Search trades..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filters.account} onChange={(e) => setFilters({ ...filters, account: e.target.value })}>
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
          <Select value={filters.pair} onChange={(e) => setFilters({ ...filters, pair: e.target.value })}>
            <option value="">All Pairs</option>
            {INSTRUMENTS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
          <Select value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value })}>
            <option value="">All Sessions</option>
            {SESSIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={filters.setup} onChange={(e) => setFilters({ ...filters, setup: e.target.value })}>
            <option value="">All Setups</option>
            {SETUPS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={filters.result} onChange={(e) => setFilters({ ...filters, result: e.target.value })}>
            <option value="">All Results</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
          </Select>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="max-w-[160px]"
          />
          <span className="text-xs text-zinc-600">to</span>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="max-w-[160px]"
          />
          {(filters.account || filters.pair || filters.session || filters.setup || filters.result || filters.dateFrom || filters.dateTo || search) && (
            <button
              onClick={() => {
                setFilters({ account: '', pair: '', session: '', setup: '', result: '', dateFrom: '', dateTo: '' });
                setSearch('');
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 ml-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen size={48} />}
            title="No trades found"
            description={trades.length === 0 ? "Start by adding your first trade to build your journal." : "Try adjusting your filters to see more trades."}
          />
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden lg:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wide">
                    <th className="text-left font-medium px-4 py-3">Date</th>
                    <th className="text-left font-medium px-4 py-3">Pair</th>
                    <th className="text-left font-medium px-4 py-3">Dir</th>
                    <th className="text-left font-medium px-4 py-3">Setup</th>
                    <th className="text-left font-medium px-4 py-3">Session</th>
                    <th className="text-right font-medium px-4 py-3">Entry</th>
                    <th className="text-right font-medium px-4 py-3">SL</th>
                    <th className="text-right font-medium px-4 py-3">TP</th>
                    <th className="text-right font-medium px-4 py-3">R:R</th>
                    <th className="text-center font-medium px-4 py-3">Result</th>
                    <th className="text-right font-medium px-4 py-3">P&L</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => openTradeDetail(t)}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">{t.trade_date}</td>
                      <td className="px-4 py-3 font-medium text-zinc-100">{t.instrument}</td>
                      <td className="px-4 py-3">
                        {t.direction === 'buy' ? (
                          <span className="text-emerald-400 flex items-center gap-0.5"><ArrowUpRight size={14} /> Buy</span>
                        ) : (
                          <span className="text-red-400 flex items-center gap-0.5"><ArrowDownRight size={14} /> Sell</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap max-w-[140px]">
                          {t.setups.slice(0, 2).map((s) => (
                            <Badge key={s} variant="blue" className="text-[10px]">{s}</Badge>
                          ))}
                          {t.setups.length > 2 && <Badge variant="default" className="text-[10px]">+{t.setups.length - 2}</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{t.session ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-300">{formatNumber(t.entry_price)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-400">{formatNumber(t.stop_loss)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-400">{formatNumber(t.take_profit)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-300">{formatNumber(t.rr_ratio)}</td>
                      <td className="px-4 py-3 text-center">
                        <ExitReasonBadge reason={getExitReason(t)} pnl={t.pnl ?? 0} />
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-semibold ${(t.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(t.pnl)}
                      </td>
                      <td className="px-4 py-3">
                        <Eye size={16} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {pageData.map((t) => (
              <Card key={t.id} onClick={() => openTradeDetail(t)} hover className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-100">{t.instrument}</span>
                      {t.direction === 'buy' ? (
                        <Badge variant="green">Buy</Badge>
                      ) : (
                        <Badge variant="red">Sell</Badge>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{t.trade_date} · {t.session ?? '—'}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${(t.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(t.pnl)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {t.setups.slice(0, 3).map((s) => (
                    <Badge key={s} variant="blue" className="text-[10px]">{s}</Badge>
                  ))}
                  <ExitReasonBadge reason={getExitReason(t)} pnl={t.pnl ?? 0} />
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Page {currentPage} of {totalPages} · {filtered.length} trades
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={15} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Trade Detail Modal */}
      <Modal
        open={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
        title="Trade Details"
        size="xl"
      >
        {selectedTrade && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedTrade.direction === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {selectedTrade.direction === 'buy' ? (
                    <ArrowUpRight size={24} className="text-emerald-400" />
                  ) : (
                    <ArrowDownRight size={24} className="text-red-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">{selectedTrade.instrument}</h3>
                  <p className="text-xs text-zinc-500">{selectedTrade.trade_date} {selectedTrade.trade_time ? `· ${selectedTrade.trade_time}` : ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold tabular-nums ${(selectedTrade.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(selectedTrade.pnl)}
                </p>
                <p className="text-xs text-zinc-500">{formatR(selectedTrade.r_multiple)}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailItem label="Account" value={accountName(selectedTrade.account_id)} />
              <DetailItem label="Direction" value={selectedTrade.direction === 'buy' ? 'Buy' : 'Sell'} />
              <DetailItem label="Status" value={selectedTrade.status === 'open' ? 'Open' : 'Closed'} />
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">Exit Reason</p>
                <ExitReasonBadge reason={getExitReason(selectedTrade)} pnl={selectedTrade.pnl ?? 0} large />
              </div>
              <DetailItem label="Session" value={selectedTrade.session ?? '—'} />
              <DetailItem label="Entry" value={formatNumber(selectedTrade.entry_price)} />
              <DetailItem label="Stop Loss" value={formatNumber(selectedTrade.stop_loss)} />
              <DetailItem label="Take Profit" value={formatNumber(selectedTrade.take_profit)} />
              <DetailItem label="Exit" value={formatNumber(selectedTrade.exit_price)} />
              <DetailItem label="Lot Size" value={formatNumber(selectedTrade.lot_size)} />
              <DetailItem label="Risk %" value={formatNumber(selectedTrade.risk_percent)} />
              <DetailItem label="R:R" value={formatNumber(selectedTrade.rr_ratio)} />
              <DetailItem label="Kill Zone" value={selectedTrade.kill_zone ?? '—'} />
            </div>

            {/* Setups */}
            {selectedTrade.setups.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Setups</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTrade.setups.map((s) => (
                    <Badge key={s} variant="blue">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Psychology */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailItem label="Before Emotion" value={selectedTrade.emotion_before ?? '—'} />
              <DetailItem label="During Emotion" value={selectedTrade.emotion_during ?? '—'} />
              <DetailItem label="After Emotion" value={selectedTrade.emotion_after ?? '—'} />
            </div>

            {/* Discipline */}
            <div className="flex flex-wrap gap-2">
              {selectedTrade.followed_plan && <Badge variant="green">Followed Plan</Badge>}
              {selectedTrade.overtraded && <Badge variant="red">Overtraded</Badge>}
              {selectedTrade.moved_sl && <Badge variant="red">Moved SL</Badge>}
              {selectedTrade.early_entry && <Badge variant="red">Early Entry</Badge>}
              {selectedTrade.revenge_trade && <Badge variant="red">Revenge Trade</Badge>}
            </div>

            {/* Mistakes */}
            {selectedTrade.mistakes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Mistakes</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTrade.mistakes.map((m) => (
                    <Badge key={m} variant="red">{m}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedTrade.notes && (
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Notes</p>
                <div className="bg-zinc-800/40 rounded-lg p-4 text-sm text-zinc-300 whitespace-pre-wrap">
                  {selectedTrade.notes}
                </div>
              </div>
            )}

            {/* Screenshots */}
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Screenshots</p>
              {loadingScreenshots ? (
                <p className="text-sm text-zinc-500">Loading screenshots...</p>
              ) : screenshots.length === 0 ? (
                <p className="text-sm text-zinc-600">No screenshots uploaded</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {screenshots.map((ss) => (
                    <div key={ss.id} className="border border-zinc-800 rounded-lg overflow-hidden group relative">
                      <img
                        src={getScreenshotUrl(ss.storage_path)}
                        alt={ss.type}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-2">
                        <p className="text-xs font-medium text-zinc-300 capitalize">{ss.type.replace('_', ' ')}</p>
                        {ss.notes && <p className="text-xs text-zinc-500 mt-0.5">{ss.notes}</p>}
                      </div>
                      <button
                        onClick={() => setDeleteScreenshotTarget(ss)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete */}
            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <Button variant="danger" size="sm" onClick={() => setDeleteTarget(selectedTrade)}>
                <Trash2 size={15} /> Delete Trade
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteTrade(deleteTarget.id);
          setSelectedTrade(null);
        }}
        title="Delete Trade"
        message="Are you sure you want to delete this trade? This action cannot be undone."
      />

      <ConfirmModal
        open={!!deleteScreenshotTarget}
        onClose={() => setDeleteScreenshotTarget(null)}
        onConfirm={async () => {
          if (deleteScreenshotTarget) {
            await deleteScreenshot(deleteScreenshotTarget.id, deleteScreenshotTarget.storage_path);
            if (selectedTrade) {
              const ss = await getScreenshots(selectedTrade.id);
              setScreenshots(ss);
            }
          }
        }}
        title="Delete Screenshot"
        message="Remove this screenshot from the trade?"
        confirmLabel="Remove"
      />
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-medium text-zinc-200 capitalize">{value}</p>
    </div>
  );
}

const exitReasonConfig: Record<ExitReason, { label: string; variant: 'green' | 'red' | 'amber' | 'blue' | 'default' }> = {
  tp_hit: { label: 'TP Hit', variant: 'green' },
  sl_hit: { label: 'SL Hit', variant: 'red' },
  manual: { label: 'Manual', variant: 'amber' },
  open: { label: 'Open', variant: 'blue' },
  unknown: { label: '—', variant: 'default' },
};

function ExitReasonBadge({ reason, pnl, large }: { reason: ExitReason; pnl: number; large?: boolean }) {
  const config = exitReasonConfig[reason];
  return (
    <div className={`inline-flex items-center gap-1 ${large ? 'text-sm' : ''}`}>
      <Badge variant={config.variant} className={large ? '' : 'text-[10px]'}>
        {config.label}
      </Badge>
      {reason !== 'open' && reason !== 'unknown' && (
        <span className={`text-[10px] tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {pnl >= 0 ? 'Win' : 'Loss'}
        </span>
      )}
    </div>
  );
}
