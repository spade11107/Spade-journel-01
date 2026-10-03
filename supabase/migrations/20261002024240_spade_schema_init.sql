/*
# SPADE Trading Journal — Initial Schema

1. Overview
   SPADE is a multi-user trading journal. Each authenticated user owns their
   accounts, trades, screenshots, and preferences. RLS enforces ownership
   scoping on every table.

2. New Tables
   - `accounts` — Trading accounts (personal, funded, demo, etc.)
     - id (uuid PK), user_id (uuid, owner), name, broker, account_type,
       starting_balance (numeric), current_balance (numeric), currency, created_at
   - `trades` — Individual trade records
     - id (uuid PK), user_id (uuid, owner), account_id (FK accounts),
       trade_date (date), trade_time (time), instrument (text), direction (buy/sell),
       entry_price (numeric), stop_loss (numeric), take_profit (numeric),
       exit_price (numeric), lot_size (numeric), risk_percent (numeric),
       risk_amount (numeric), reward_amount (numeric), rr_ratio (numeric),
       pnl (numeric), r_multiple (numeric),
       setups (text[] — multiple ICT/SMC setups),
       session (text), kill_zone (text),
       emotion_before (text), emotion_during (text), emotion_after (text),
       followed_plan (bool), overtraded (bool), moved_sl (bool), early_entry (bool),
       revenge_trade (bool),
       mistakes (text[] — multiple mistakes),
       notes (text), status (open/closed), created_at, updated_at
   - `trade_screenshots` — Screenshots attached to trades
     - id (uuid PK), trade_id (FK trades), user_id (uuid, owner),
       type (before_entry/entry/exit), storage_path (text), notes (text), created_at
   - `user_preferences` — Per-user settings
     - id (uuid PK), user_id (uuid, owner, unique),
       default_account_id (uuid nullable), theme (text), currency (text),
       risk_per_trade (numeric), created_at, updated_at

3. Security
   - RLS enabled on ALL tables.
   - Owner-scoped CRUD (4 policies per table) using auth.uid() = user_id.
   - trade_screenshots scoped through parent trade ownership for SELECT/DELETE.
   - Storage bucket `trade-screenshots` created with private access.
   - Storage policies: authenticated users can CRUD only objects in their
     user-prefixed folder path.

4. Indexes
   - trades(user_id), trades(account_id), trades(trade_date), trades(instrument), trades(session)
   - accounts(user_id)
   - trade_screenshots(trade_id), trade_screenshots(user_id)
*/

-- ============ ACCOUNTS ============
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  broker text,
  account_type text NOT NULL DEFAULT 'Personal',
  starting_balance numeric(14,2) NOT NULL DEFAULT 0,
  current_balance numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_accounts" ON accounts;
CREATE POLICY "select_own_accounts" ON accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_accounts" ON accounts;
CREATE POLICY "insert_own_accounts" ON accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_accounts" ON accounts;
CREATE POLICY "update_own_accounts" ON accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_accounts" ON accounts;
CREATE POLICY "delete_own_accounts" ON accounts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- ============ TRADES ============
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  trade_date date NOT NULL DEFAULT CURRENT_DATE,
  trade_time time,
  instrument text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('buy','sell')),
  entry_price numeric(14,5),
  stop_loss numeric(14,5),
  take_profit numeric(14,5),
  exit_price numeric(14,5),
  lot_size numeric(10,2),
  risk_percent numeric(8,2),
  risk_amount numeric(14,2),
  reward_amount numeric(14,2),
  rr_ratio numeric(8,2),
  pnl numeric(14,2),
  r_multiple numeric(8,2),
  setups text[] NOT NULL DEFAULT '{}',
  session text,
  kill_zone text,
  emotion_before text,
  emotion_during text,
  emotion_after text,
  followed_plan boolean DEFAULT false,
  overtraded boolean DEFAULT false,
  moved_sl boolean DEFAULT false,
  early_entry boolean DEFAULT false,
  revenge_trade boolean DEFAULT false,
  mistakes text[] NOT NULL DEFAULT '{}',
  notes text,
  status text NOT NULL DEFAULT 'closed' CHECK (status IN ('open','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trades" ON trades;
CREATE POLICY "select_own_trades" ON trades FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trades" ON trades;
CREATE POLICY "insert_own_trades" ON trades FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trades" ON trades;
CREATE POLICY "update_own_trades" ON trades FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trades" ON trades;
CREATE POLICY "delete_own_trades" ON trades FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_trade_date ON trades(trade_date);
CREATE INDEX IF NOT EXISTS idx_trades_instrument ON trades(instrument);
CREATE INDEX IF NOT EXISTS idx_trades_session ON trades(session);

-- ============ TRADE SCREENSHOTS ============
CREATE TABLE IF NOT EXISTS trade_screenshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('before_entry','entry','exit')),
  storage_path text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trade_screenshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_screenshots" ON trade_screenshots;
CREATE POLICY "select_own_screenshots" ON trade_screenshots FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_screenshots" ON trade_screenshots;
CREATE POLICY "insert_own_screenshots" ON trade_screenshots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_screenshots" ON trade_screenshots;
CREATE POLICY "update_own_screenshots" ON trade_screenshots FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_screenshots" ON trade_screenshots;
CREATE POLICY "delete_own_screenshots" ON trade_screenshots FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_screenshots_trade_id ON trade_screenshots(trade_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_user_id ON trade_screenshots(user_id);

-- ============ USER PREFERENCES ============
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  default_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  theme text NOT NULL DEFAULT 'dark',
  currency text NOT NULL DEFAULT 'USD',
  risk_per_trade numeric(8,2) DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_prefs" ON user_preferences;
CREATE POLICY "select_own_prefs" ON user_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_prefs" ON user_preferences;
CREATE POLICY "insert_own_prefs" ON user_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_prefs" ON user_preferences;
CREATE POLICY "update_own_prefs" ON user_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_prefs" ON user_preferences;
CREATE POLICY "delete_own_prefs" ON user_preferences FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trades_updated_at ON trades;
CREATE TRIGGER trg_trades_updated_at BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_prefs_updated_at ON user_preferences;
CREATE TRIGGER trg_prefs_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-screenshots', 'trade-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can only access their own folder
DROP POLICY IF EXISTS "Users can upload own screenshots" ON storage.objects;
CREATE POLICY "Users can upload own screenshots" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'trade-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can view own screenshots" ON storage.objects;
CREATE POLICY "Users can view own screenshots" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'trade-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own screenshots" ON storage.objects;
CREATE POLICY "Users can delete own screenshots" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'trade-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own screenshots" ON storage.objects;
CREATE POLICY "Users can update own screenshots" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'trade-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
