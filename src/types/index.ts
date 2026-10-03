export type Direction = 'buy' | 'sell';
export type TradeStatus = 'open' | 'closed';

export type SetupType =
  | 'Liquidity Sweep'
  | 'FVG'
  | 'Order Block'
  | 'CISD'
  | 'SMT'
  | 'MSS'
  | 'BOS'
  | 'Breakaway Gap'
  | 'Mitigated Block'
  | 'PO3'
  | 'Price Action'
  | 'Other';

export type SessionType = 'Asia' | 'London' | 'New York' | 'London/New York Overlap';

export type KillZoneType =
  | 'Asian Kill Zone'
  | 'London Kill Zone'
  | 'New York Kill Zone';

export type EmotionType =
  | 'Calm'
  | 'Confident'
  | 'Fear'
  | 'FOMO'
  | 'Greed'
  | 'Revenge'
  | 'Hesitation'
  | 'Disciplined';

export type MistakeType =
  | 'FOMO'
  | 'Revenge Trading'
  | 'Early Entry'
  | 'Late Entry'
  | 'Oversized Position'
  | 'Moved Stop Loss'
  | 'No Confirmation'
  | 'Overtrading'
  | 'Broke Trading Plan';

export type ScreenshotType = 'before_entry' | 'entry' | 'exit';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  broker: string | null;
  account_type: string;
  starting_balance: number;
  current_balance: number;
  currency: string;
  created_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  account_id: string | null;
  trade_date: string;
  trade_time: string | null;
  instrument: string;
  direction: Direction;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  exit_price: number | null;
  lot_size: number | null;
  risk_percent: number | null;
  risk_amount: number | null;
  reward_amount: number | null;
  rr_ratio: number | null;
  pnl: number | null;
  r_multiple: number | null;
  setups: string[];
  session: string | null;
  kill_zone: string | null;
  emotion_before: string | null;
  emotion_during: string | null;
  emotion_after: string | null;
  followed_plan: boolean;
  overtraded: boolean;
  moved_sl: boolean;
  early_entry: boolean;
  revenge_trade: boolean;
  mistakes: string[];
  notes: string | null;
  status: TradeStatus;
  created_at: string;
  updated_at: string;
}

export interface TradeScreenshot {
  id: string;
  trade_id: string;
  user_id: string;
  type: ScreenshotType;
  storage_path: string;
  notes: string | null;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  default_account_id: string | null;
  theme: string;
  currency: string;
  risk_per_trade: number;
  created_at: string;
  updated_at: string;
}

export interface TradeWithDetails extends Trade {
  account?: Account | null;
  screenshots?: TradeScreenshot[];
}

export interface TradeFormData {
  account_id: string;
  trade_date: string;
  trade_time: string;
  instrument: string;
  direction: Direction;
  entry_price: string;
  stop_loss: string;
  take_profit: string;
  exit_price: string;
  lot_size: string;
  risk_percent: string;
  setups: string[];
  session: string;
  kill_zone: string;
  emotion_before: string;
  emotion_during: string;
  emotion_after: string;
  followed_plan: boolean;
  overtraded: boolean;
  moved_sl: boolean;
  early_entry: boolean;
  revenge_trade: boolean;
  mistakes: string[];
  notes: string;
  status: TradeStatus;
}

export interface AccountFormData {
  name: string;
  broker: string;
  account_type: string;
  starting_balance: string;
  current_balance: string;
  currency: string;
}
