import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Account,
  Trade,
  TradeScreenshot,
  UserPreferences,
  TradeFormData,
  AccountFormData,
  ScreenshotType,
} from '@/types';
import {
  calcRRRatio,
  calcRiskAmount,
  calcRewardAmount,
  calcPnL,
  calcRMultiple,
} from '@/lib/calculations';
import { STORAGE_BUCKET } from '@/lib/constants';

interface DataContextType {
  accounts: Account[];
  trades: Trade[];
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addAccount: (data: AccountFormData) => Promise<{ error: string | null }>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<{ error: string | null }>;
  deleteAccount: (id: string) => Promise<{ error: string | null }>;
  addTrade: (data: TradeFormData) => Promise<{ error: string | null; id: string | null }>;
  updateTrade: (id: string, data: Partial<Trade>) => Promise<{ error: string | null }>;
  deleteTrade: (id: string) => Promise<{ error: string | null }>;
  uploadScreenshot: (
    tradeId: string,
    type: ScreenshotType,
    file: File,
    notes: string
  ) => Promise<{ error: string | null }>;
  getScreenshots: (tradeId: string) => Promise<TradeScreenshot[]>;
  getScreenshotUrl: (path: string) => string;
  deleteScreenshot: (id: string, path: string) => Promise<{ error: string | null }>;
  updatePreferences: (data: Partial<UserPreferences>) => Promise<{ error: string | null }>;
  getAccountBalance: (accountId: string | null) => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setTrades([]);
      setPreferences(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [accountsRes, tradesRes, prefsRes] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('trades').select('*').order('trade_date', { ascending: false }),
        supabase.from('user_preferences').select('*').maybeSingle(),
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (tradesRes.error) throw tradesRes.error;

      setAccounts(accountsRes.data as Account[]);
      setTrades(tradesRes.data as Trade[]);

      if (prefsRes.data) {
        setPreferences(prefsRes.data as UserPreferences);
      } else if (!prefsRes.error) {
        const { data: newPrefs } = await supabase
          .from('user_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (newPrefs) setPreferences(newPrefs as UserPreferences);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getAccountBalance = useCallback(
    (accountId: string | null): number => {
      if (!accountId) return 0;
      const account = accounts.find((a) => a.id === accountId);
      return account?.current_balance ?? account?.starting_balance ?? 0;
    },
    [accounts]
  );

  const addAccount = useCallback(
    async (data: AccountFormData): Promise<{ error: string | null }> => {
      const { error } = await supabase.from('accounts').insert({
        name: data.name,
        broker: data.broker || null,
        account_type: data.account_type,
        starting_balance: parseFloat(data.starting_balance) || 0,
        current_balance: parseFloat(data.current_balance) || 0,
        currency: data.currency,
      });
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const updateAccount = useCallback(
    async (id: string, data: Partial<Account>): Promise<{ error: string | null }> => {
      const { error } = await supabase.from('accounts').update(data).eq('id', id);
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const deleteAccount = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const addTrade = useCallback(
    async (data: TradeFormData): Promise<{ error: string | null; id: string | null }> => {
      const balance = getAccountBalance(data.account_id || null);
      const entry = data.entry_price ? parseFloat(data.entry_price) : null;
      const sl = data.stop_loss ? parseFloat(data.stop_loss) : null;
      const tp = data.take_profit ? parseFloat(data.take_profit) : null;
      const exit = data.exit_price ? parseFloat(data.exit_price) : null;
      const lotSize = data.lot_size ? parseFloat(data.lot_size) : null;
      const riskPct = data.risk_percent ? parseFloat(data.risk_percent) : null;

      const rrRatio = calcRRRatio(entry, sl, tp);
      const riskAmount = calcRiskAmount(balance, riskPct);
      const rewardAmount = calcRewardAmount(riskAmount, rrRatio);
      const pnl = calcPnL(data.direction, entry, exit, lotSize, data.instrument);
      const rMultiple = calcRMultiple(pnl, riskAmount);

      const insertData = {
        account_id: data.account_id || null,
        trade_date: data.trade_date,
        trade_time: data.trade_time || null,
        instrument: data.instrument,
        direction: data.direction,
        entry_price: entry,
        stop_loss: sl,
        take_profit: tp,
        exit_price: exit,
        lot_size: lotSize,
        risk_percent: riskPct,
        risk_amount: riskAmount,
        reward_amount: rewardAmount,
        rr_ratio: rrRatio,
        pnl,
        r_multiple: rMultiple,
        setups: data.setups,
        session: data.session || null,
        kill_zone: data.kill_zone || null,
        emotion_before: data.emotion_before || null,
        emotion_during: data.emotion_during || null,
        emotion_after: data.emotion_after || null,
        followed_plan: data.followed_plan,
        overtraded: data.overtraded,
        moved_sl: data.moved_sl,
        early_entry: data.early_entry,
        revenge_trade: data.revenge_trade,
        mistakes: data.mistakes,
        notes: data.notes || null,
        status: data.status,
      };

      const { data: result, error } = await supabase
        .from('trades')
        .insert(insertData)
        .select()
        .single();

      if (error) return { error: error.message, id: null };

      if (data.account_id && pnl != null) {
        const account = accounts.find((a) => a.id === data.account_id);
        if (account) {
          await supabase
            .from('accounts')
            .update({ current_balance: account.current_balance + pnl })
            .eq('id', data.account_id);
        }
      }

      await refresh();
      return { error: null, id: result?.id ?? null };
    },
    [getAccountBalance, accounts, refresh]
  );

  const updateTrade = useCallback(
    async (id: string, data: Partial<Trade>): Promise<{ error: string | null }> => {
      const { error } = await supabase.from('trades').update(data).eq('id', id);
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const deleteTrade = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.from('trades').delete().eq('id', id);
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const uploadScreenshot = useCallback(
    async (
      tradeId: string,
      type: ScreenshotType,
      file: File,
      notes: string
    ): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not authenticated' };
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `${user.id}/${tradeId}/${type}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) return { error: uploadError.message };

      const { error: dbError } = await supabase.from('trade_screenshots').insert({
        trade_id: tradeId,
        type,
        storage_path: filePath,
        notes: notes || null,
      });

      if (dbError) return { error: dbError.message };
      return { error: null };
    },
    [user]
  );

  const getScreenshots = useCallback(async (tradeId: string): Promise<TradeScreenshot[]> => {
    const { data, error } = await supabase
      .from('trade_screenshots')
      .select('*')
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data as TradeScreenshot[];
  }, []);

  const getScreenshotUrl = useCallback((path: string): string => {
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }, []);

  const deleteScreenshot = useCallback(
    async (id: string, path: string): Promise<{ error: string | null }> => {
      const { error: dbError } = await supabase
        .from('trade_screenshots')
        .delete()
        .eq('id', id);
      if (dbError) return { error: dbError.message };

      await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      return { error: null };
    },
    []
  );

  const updatePreferences = useCallback(
    async (data: Partial<UserPreferences>): Promise<{ error: string | null }> => {
      if (!preferences) return { error: 'No preferences loaded' };
      const { error } = await supabase
        .from('user_preferences')
        .update(data)
        .eq('id', preferences.id);
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [preferences, refresh]
  );

  return (
    <DataContext.Provider
      value={{
        accounts,
        trades,
        preferences,
        loading,
        error,
        refresh,
        addAccount,
        updateAccount,
        deleteAccount,
        addTrade,
        updateTrade,
        deleteTrade,
        uploadScreenshot,
        getScreenshots,
        getScreenshotUrl,
        deleteScreenshot,
        updatePreferences,
        getAccountBalance,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
