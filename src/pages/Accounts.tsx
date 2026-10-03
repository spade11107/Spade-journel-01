import { useState, FormEvent } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  Building2,
  CircleDollarSign,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { PageHeader, EmptyState, FullPageLoader } from '@/components/ui/States';
import { formatCurrency } from '@/lib/calculations';
import { ACCOUNT_TYPES, CURRENCIES } from '@/lib/constants';
import { Account, AccountFormData } from '@/types';

const accountTypeColors: Record<string, 'blue' | 'green' | 'amber'> = {
  Personal: 'blue',
  Funded: 'green',
  Demo: 'amber',
};

export function Accounts() {
  const { accounts, trades, addAccount, updateAccount, deleteAccount, loading } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<AccountFormData>({
    name: '',
    broker: '',
    account_type: 'Personal',
    starting_balance: '10000',
    current_balance: '10000',
    currency: 'USD',
  });

  const openAdd = () => {
    setEditingAccount(null);
    setForm({
      name: '',
      broker: '',
      account_type: 'Personal',
      starting_balance: '10000',
      current_balance: '10000',
      currency: 'USD',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setForm({
      name: account.name,
      broker: account.broker ?? '',
      account_type: account.account_type,
      starting_balance: String(account.starting_balance),
      current_balance: String(account.current_balance),
      currency: account.currency,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Account name is required');
      return;
    }
    setSaving(true);

    if (editingAccount) {
      const { error: err } = await updateAccount(editingAccount.id, {
        name: form.name,
        broker: form.broker || null,
        account_type: form.account_type,
        starting_balance: parseFloat(form.starting_balance) || 0,
        current_balance: parseFloat(form.current_balance) || 0,
        currency: form.currency,
      });
      if (err) setError(err);
    } else {
      const { error: err } = await addAccount(form);
      if (err) setError(err);
    }

    setSaving(false);
    if (!error) setModalOpen(false);
  };

  const getAccountStats = (accountId: string) => {
    const accountTrades = trades.filter((t) => t.account_id === accountId && t.status === 'closed');
    const pnl = accountTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const wins = accountTrades.filter((t) => (t.pnl ?? 0) > 0).length;
    const winRate = accountTrades.length > 0 ? (wins / accountTrades.length) * 100 : 0;
    return { count: accountTrades.length, pnl, winRate };
  };

  if (loading) return <FullPageLoader message="Loading accounts..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Accounts"
        subtitle="Manage your trading accounts"
        action={
          <Button onClick={openAdd}>
            <Plus size={16} /> Add Account
          </Button>
        }
      />

      {accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet size={48} />}
            title="No accounts yet"
            description="Create your first trading account to start logging trades. You can manage personal, funded, and demo accounts."
            action={
              <Button onClick={openAdd}>
                <Plus size={16} /> Create Account
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const stats = getAccountStats(account.id);
            const pnlVsStart = account.current_balance - account.starting_balance;
            return (
              <Card key={account.id} className="p-5 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-700/10 border border-blue-500/20 flex items-center justify-center">
                      <Wallet size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">{account.name}</h3>
                      <Badge variant={accountTypeColors[account.account_type] ?? 'default'} className="mt-1">
                        {account.account_type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(account)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(account)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Current Balance</p>
                    <p className="text-2xl font-bold tabular-nums text-zinc-100">
                      {formatCurrency(account.current_balance, account.currency)}
                    </p>
                    <p className={`text-xs font-medium tabular-nums mt-0.5 ${pnlVsStart >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pnlVsStart >= 0 ? '+' : ''}{formatCurrency(pnlVsStart)} from start
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase">Trades</p>
                      <p className="text-sm font-semibold text-zinc-200 tabular-nums">{stats.count}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase">Win Rate</p>
                      <p className={`text-sm font-semibold tabular-nums ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stats.winRate.toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase">P&L</p>
                      <p className={`text-sm font-semibold tabular-nums ${stats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(stats.pnl)}
                      </p>
                    </div>
                  </div>

                  {account.broker && (
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                      <Building2 size={14} className="text-zinc-600" />
                      <span className="text-xs text-zinc-500">{account.broker}</span>
                      <span className="text-xs text-zinc-600 ml-auto flex items-center gap-1">
                        <CircleDollarSign size={12} /> {account.currency}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAccount ? 'Edit Account' : 'Add Account'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Account Name"
            placeholder="e.g. Personal, FTMO 100K"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Broker / Funded Firm"
            placeholder="e.g. IC Markets, FTMO, MetaTrader"
            value={form.broker}
            onChange={(e) => setForm({ ...form, broker: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Account Type"
              value={form.account_type}
              onChange={(e) => setForm({ ...form, account_type: e.target.value })}
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Select
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Starting Balance"
              type="number"
              step="any"
              value={form.starting_balance}
              onChange={(e) => setForm({ ...form, starting_balance: e.target.value })}
            />
            <Input
              label="Current Balance"
              type="number"
              step="any"
              value={form.current_balance}
              onChange={(e) => setForm({ ...form, current_balance: e.target.value })}
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingAccount ? 'Update Account' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteAccount(deleteTarget.id);
        }}
        title="Delete Account"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Trades linked to this account will remain but lose their account association. This cannot be undone.`}
      />
    </div>
  );
}
