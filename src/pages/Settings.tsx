import { useState, FormEvent, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Check } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { PageHeader, FullPageLoader } from '@/components/ui/States';
import { CURRENCIES } from '@/lib/constants';

export function Settings() {
  const { preferences, accounts, updatePreferences, trades, loading } = useData();
  const { user, signOut } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    default_account_id: preferences?.default_account_id ?? '',
    currency: preferences?.currency ?? 'USD',
    risk_per_trade: String(preferences?.risk_per_trade ?? 1),
  });

  // Sync when preferences load
  useEffect(() => {
    if (preferences) {
      setForm({
        default_account_id: preferences.default_account_id ?? '',
        currency: preferences.currency,
        risk_per_trade: String(preferences.risk_per_trade),
      });
    }
  }, [preferences]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: err } = await updatePreferences({
      default_account_id: form.default_account_id || null,
      currency: form.currency,
      risk_per_trade: parseFloat(form.risk_per_trade) || 1,
    });
    if (err) {
      setError(err);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  if (loading) return <FullPageLoader message="Loading settings..." />;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your preferences and account" />

      {/* Profile */}
      <Card>
        <CardHeader title="Profile" subtitle="Your account information" />
        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-100">{user?.email}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Member since {new Date(user?.created_at ?? Date.now()).toLocaleDateString()}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </Card>

      {/* Trading Preferences */}
      <Card>
        <CardHeader title="Trading Preferences" subtitle="Default settings for new trades" />
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Select
            label="Default Account"
            value={form.default_account_id}
            onChange={(e) => setForm({ ...form, default_account_id: e.target.value })}
          >
            <option value="">No default</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Default Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Input
              label="Default Risk % per Trade"
              type="number"
              step="any"
              value={form.risk_per_trade}
              onChange={(e) => setForm({ ...form, risk_per_trade: e.target.value })}
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Preferences'}</>}
            </Button>
          </div>
        </form>
      </Card>

      {/* Stats Summary */}
      <Card>
        <CardHeader title="Your Data" subtitle="Overview of your trading journal" />
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Total Trades</p>
            <p className="text-xl font-bold text-zinc-100 tabular-nums">{trades.length}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Accounts</p>
            <p className="text-xl font-bold text-zinc-100 tabular-nums">{accounts.length}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Open Trades</p>
            <p className="text-xl font-bold text-amber-400 tabular-nums">
              {trades.filter((t) => t.status === 'open').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Closed Trades</p>
            <p className="text-xl font-bold text-zinc-100 tabular-nums">
              {trades.filter((t) => t.status === 'closed').length}
            </p>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card>
        <CardHeader title="About SPADE" subtitle="Trading journal for ICT / SMC traders" />
        <div className="p-5">
          <p className="text-sm text-zinc-400 leading-relaxed">
            SPADE is a premium trading journal designed for traders who use ICT, SMC, Price Action, FVG,
            Liquidity Sweeps, CISD, Order Blocks, SMT, and Kill Zones. Track your trades, analyze your
            performance, and improve your discipline.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
            <SettingsIcon size={14} />
            <span>Version 1.0 · Track. Analyze. Improve.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
