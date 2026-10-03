import { useState, useMemo, useEffect, FormEvent } from 'react';
import { Save, Calculator, Upload, X, Check } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/States';
import {
  INSTRUMENTS,
  SETUPS,
  SESSIONS,
  KILL_ZONES,
  EMOTIONS,
  MISTAKES,
} from '@/lib/constants';
import {
  calcRRRatio,
  calcRiskAmount,
  calcRewardAmount,
  calcPnL,
  calcRMultiple,
  formatCurrency,
  formatNumber,
  formatR,
} from '@/lib/calculations';
import { TradeFormData, TradeStatus, ScreenshotType } from '@/types';
import { PageKey } from '@/components/Layout';

interface AddTradeProps {
  onNavigate: (page: PageKey) => void;
  editTradeId?: string | null;
}

const screenshotTypes: { type: ScreenshotType; label: string }[] = [
  { type: 'before_entry', label: 'Before Entry' },
  { type: 'entry', label: 'Entry' },
  { type: 'exit', label: 'Exit' },
];

export function AddTrade({ onNavigate, editTradeId }: AddTradeProps) {
  const { accounts, addTrade, getAccountBalance, uploadScreenshot } = useData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const defaultAccountId = accounts[0]?.id ?? '';

  const [form, setForm] = useState<TradeFormData>({
    account_id: defaultAccountId,
    trade_date: new Date().toISOString().slice(0, 10),
    trade_time: new Date().toTimeString().slice(0, 5),
    instrument: 'XAUUSD',
    direction: 'buy',
    entry_price: '',
    stop_loss: '',
    take_profit: '',
    exit_price: '',
    lot_size: '',
    risk_percent: '1',
    setups: [],
    session: '',
    kill_zone: '',
    emotion_before: '',
    emotion_during: '',
    emotion_after: '',
    followed_plan: false,
    overtraded: false,
    moved_sl: false,
    early_entry: false,
    revenge_trade: false,
    mistakes: [],
    notes: '',
    status: 'closed',
  });

  // Sync account_id when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !form.account_id) {
      setForm((prev) => ({ ...prev, account_id: accounts[0].id }));
    }
  }, [accounts, form.account_id]);

  const [screenshots, setScreenshots] = useState<
    { type: ScreenshotType; file: File; notes: string; preview: string }[]
  >([]);

  // Auto-calculations
  const calculations = useMemo(() => {
    const entry = form.entry_price ? parseFloat(form.entry_price) : null;
    const sl = form.stop_loss ? parseFloat(form.stop_loss) : null;
    const tp = form.take_profit ? parseFloat(form.take_profit) : null;
    const exit = form.exit_price ? parseFloat(form.exit_price) : null;
    const lotSize = form.lot_size ? parseFloat(form.lot_size) : null;
    const riskPct = form.risk_percent ? parseFloat(form.risk_percent) : null;
    const balance = getAccountBalance(form.account_id || null);

    const rrRatio = calcRRRatio(entry, sl, tp);
    const riskAmount = calcRiskAmount(balance, riskPct);
    const rewardAmount = calcRewardAmount(riskAmount, rrRatio);
    const pnl = calcPnL(form.direction, entry, exit, lotSize, form.instrument);
    const rMultiple = calcRMultiple(pnl, riskAmount);

    return { rrRatio, riskAmount, rewardAmount, pnl, rMultiple, balance };
  }, [form, getAccountBalance]);

  const update = <K extends keyof TradeFormData>(key: K, value: TradeFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: 'setups' | 'mistakes', item: string) => {
    setForm((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter((s) => s !== item) : [...arr, item],
      };
    });
  };

  const handleFileSelect = (type: ScreenshotType, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setScreenshots((prev) => {
      const filtered = prev.filter((s) => s.type !== type);
      return [...filtered, { type, file, notes: '', preview }];
    });
  };

  const updateScreenshotNotes = (type: ScreenshotType, notes: string) => {
    setScreenshots((prev) =>
      prev.map((s) => (s.type === type ? { ...s, notes } : s))
    );
  };

  const removeScreenshot = (type: ScreenshotType) => {
    setScreenshots((prev) => {
      const removed = prev.find((s) => s.type === type);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((s) => s.type !== type);
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.instrument.trim()) {
      setError('Instrument is required');
      return;
    }
    if (form.setups.length === 0) {
      setError('Please select at least one setup');
      return;
    }

    setSaving(true);
    const { error: tradeError, id } = await addTrade(form);
    if (tradeError) {
      setError(tradeError);
      setSaving(false);
      return;
    }

    if (id && screenshots.length > 0) {
      for (const ss of screenshots) {
        await uploadScreenshot(id, ss.type, ss.file, ss.notes);
      }
    }

    setSaving(false);
    setSuccess(true);
    setTimeout(() => {
      onNavigate('journal');
    }, 1200);
  };

  if (accounts.length === 0) {
    return (
      <div>
        <PageHeader title="Add Trade" subtitle="Record a new trade with full detail" />
        <Card>
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-400 mb-4">
              You need to create an account first before adding trades.
            </p>
            <Button onClick={() => onNavigate('accounts')}>Go to Accounts</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <PageHeader
        title={editTradeId ? 'Edit Trade' : 'Add Trade'}
        subtitle="Record a new trade with full detail"
      />

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <Check size={16} /> Trade saved successfully! Redirecting to journal...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Trade Information */}
        <Card>
          <CardHeader title="Trade Information" subtitle="Basic trade details" />
          <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Input
              label="Date"
              type="date"
              value={form.trade_date}
              onChange={(e) => update('trade_date', e.target.value)}
              required
            />
            <Input
              label="Time"
              type="time"
              value={form.trade_time}
              onChange={(e) => update('trade_time', e.target.value)}
            />
            <Select
              label="Account"
              value={form.account_id}
              onChange={(e) => update('account_id', e.target.value)}
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <Select
              label="Instrument"
              value={form.instrument}
              onChange={(e) => update('instrument', e.target.value)}
              required
            >
              {INSTRUMENTS.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </Select>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Direction</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => update('direction', 'buy')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    form.direction === 'buy'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => update('direction', 'sell')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    form.direction === 'sell'
                      ? 'bg-red-500/15 text-red-400 border-red-500/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => update('status', e.target.value as TradeStatus)}
            >
              <option value="closed">Closed</option>
              <option value="open">Open</option>
            </Select>
          </div>
        </Card>

        {/* Prices */}
        <Card>
          <CardHeader title="Prices" subtitle="Entry, stop loss, take profit, and exit" />
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Entry Price"
              type="number"
              step="any"
              placeholder="0.00"
              value={form.entry_price}
              onChange={(e) => update('entry_price', e.target.value)}
            />
            <Input
              label="Stop Loss"
              type="number"
              step="any"
              placeholder="0.00"
              value={form.stop_loss}
              onChange={(e) => update('stop_loss', e.target.value)}
            />
            <Input
              label="Take Profit"
              type="number"
              step="any"
              placeholder="0.00"
              value={form.take_profit}
              onChange={(e) => update('take_profit', e.target.value)}
            />
            <Input
              label="Exit Price"
              type="number"
              step="any"
              placeholder="0.00"
              value={form.exit_price}
              onChange={(e) => update('exit_price', e.target.value)}
            />
          </div>
        </Card>

        {/* Position & Auto-Calculations */}
        <Card>
          <CardHeader
            title="Position & Calculations"
            subtitle="Risk and reward are calculated automatically"
            action={<Calculator size={18} className="text-zinc-500" />}
          />
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Lot Size"
                type="number"
                step="any"
                placeholder="0.01"
                value={form.lot_size}
                onChange={(e) => update('lot_size', e.target.value)}
              />
              <Input
                label="Risk %"
                type="number"
                step="any"
                placeholder="1.0"
                value={form.risk_percent}
                onChange={(e) => update('risk_percent', e.target.value)}
              />
            </div>

            <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4 space-y-2.5">
              <CalcRow label="Account Balance" value={formatCurrency(calculations.balance)} />
              <CalcRow label="R:R Ratio" value={formatNumber(calculations.rrRatio)} highlight />
              <CalcRow label="Risk Amount" value={formatCurrency(calculations.riskAmount)} negative />
              <CalcRow label="Reward Amount" value={formatCurrency(calculations.rewardAmount)} positive />
              <CalcRow
                label="P&L"
                value={formatCurrency(calculations.pnl)}
                positive={(calculations.pnl ?? 0) >= 0}
                negative={(calculations.pnl ?? 0) < 0}
              />
              <CalcRow
                label="R Multiple"
                value={formatR(calculations.rMultiple)}
                positive={(calculations.rMultiple ?? 0) >= 0}
                negative={(calculations.rMultiple ?? 0) < 0}
              />
            </div>
          </div>
        </Card>

        {/* Setup Selection */}
        <Card>
          <CardHeader title="Setup Selection" subtitle="Select all ICT/SMC setups that apply" />
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {SETUPS.map((setup) => {
                const selected = form.setups.includes(setup);
                return (
                  <button
                    key={setup}
                    type="button"
                    onClick={() => toggleArrayItem('setups', setup)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${
                      selected
                        ? 'bg-blue-600/15 text-blue-400 border-blue-600/30'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {setup}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Session & Kill Zone */}
        <Card>
          <CardHeader title="Session & Kill Zone" subtitle="When the trade was taken" />
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Session"
              value={form.session}
              onChange={(e) => update('session', e.target.value)}
            >
              <option value="">Select session</option>
              {SESSIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Select
              label="Kill Zone"
              value={form.kill_zone}
              onChange={(e) => update('kill_zone', e.target.value)}
            >
              <option value="">Select kill zone</option>
              {KILL_ZONES.map((kz) => (
                <option key={kz} value={kz}>{kz}</option>
              ))}
            </Select>
          </div>
        </Card>

        {/* Psychology */}
        <Card>
          <CardHeader title="Psychology" subtitle="Record your emotional state and discipline" />
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Before Trade Emotion"
                value={form.emotion_before}
                onChange={(e) => update('emotion_before', e.target.value)}
              >
                <option value="">Select emotion</option>
                {EMOTIONS.map((em) => (
                  <option key={em} value={em}>{em}</option>
                ))}
              </Select>
              <Select
                label="During Trade Emotion"
                value={form.emotion_during}
                onChange={(e) => update('emotion_during', e.target.value)}
              >
                <option value="">Select emotion</option>
                {EMOTIONS.map((em) => (
                  <option key={em} value={em}>{em}</option>
                ))}
              </Select>
              <Select
                label="After Trade Emotion"
                value={form.emotion_after}
                onChange={(e) => update('emotion_after', e.target.value)}
              >
                <option value="">Select emotion</option>
                {EMOTIONS.map((em) => (
                  <option key={em} value={em}>{em}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <ToggleChip
                label="Followed Plan"
                active={form.followed_plan}
                onClick={() => update('followed_plan', !form.followed_plan)}
              />
              <ToggleChip
                label="Overtraded"
                active={form.overtraded}
                onClick={() => update('overtraded', !form.overtraded)}
                negative
              />
              <ToggleChip
                label="Moved SL"
                active={form.moved_sl}
                onClick={() => update('moved_sl', !form.moved_sl)}
                negative
              />
              <ToggleChip
                label="Early Entry"
                active={form.early_entry}
                onClick={() => update('early_entry', !form.early_entry)}
                negative
              />
              <ToggleChip
                label="Revenge Trade"
                active={form.revenge_trade}
                onClick={() => update('revenge_trade', !form.revenge_trade)}
                negative
              />
            </div>
          </div>
        </Card>

        {/* Mistakes */}
        <Card>
          <CardHeader title="Mistakes" subtitle="Select any mistakes made during this trade" />
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {MISTAKES.map((mistake) => {
                const selected = form.mistakes.includes(mistake);
                return (
                  <button
                    key={mistake}
                    type="button"
                    onClick={() => toggleArrayItem('mistakes', mistake)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${
                      selected
                        ? 'bg-red-600/15 text-red-400 border-red-600/30'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {mistake}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Screenshots */}
        <Card>
          <CardHeader title="Screenshots" subtitle="Upload before entry, entry, and exit screenshots" />
          <div className="p-5 space-y-4">
            {screenshotTypes.map(({ type, label }) => {
              const existing = screenshots.find((s) => s.type === type);
              return (
                <div key={type} className="border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-zinc-200">{label}</span>
                    {existing && (
                      <button
                        type="button"
                        onClick={() => removeScreenshot(type)}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <X size={14} /> Remove
                      </button>
                    )}
                  </div>
                  {existing ? (
                    <div className="flex gap-3">
                      <img
                        src={existing.preview}
                        alt={label}
                        className="w-24 h-24 object-cover rounded-lg border border-zinc-800"
                      />
                      <div className="flex-1">
                        <Input
                          placeholder="Notes for this screenshot..."
                          value={existing.notes}
                          onChange={(e) => updateScreenshotNotes(type, e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                      <Upload size={20} className="text-zinc-600" />
                      <span className="text-xs text-zinc-500">Click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(type, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader title="Notes" subtitle="Additional trade notes and observations" />
          <div className="p-5">
            <Textarea
              rows={4}
              placeholder="What was your analysis? What did you learn from this trade?"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button type="button" variant="secondary" onClick={() => onNavigate('dashboard')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Trade'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function CalcRow({
  label,
  value,
  positive,
  negative,
  highlight,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${highlight ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`}>
        {label}
      </span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          positive ? 'text-emerald-400' : negative ? 'text-red-400' : 'text-zinc-200'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
  negative,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  negative?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-center ${
        active
          ? negative
            ? 'bg-red-600/15 text-red-400 border-red-600/30'
            : 'bg-emerald-600/15 text-emerald-400 border-emerald-600/30'
          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {label}
    </button>
  );
}
