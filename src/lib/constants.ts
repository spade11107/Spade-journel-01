import {
  SetupType,
  SessionType,
  KillZoneType,
  EmotionType,
  MistakeType,
} from '@/types';

export const INSTRUMENTS = [
  'XAUUSD',
  'BTCUSD',
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'USDCAD',
  'AUDUSD',
  'NZDUSD',
  'ETHUSD',
  'SPX500',
  'NAS100',
  'US30',
  'Other',
];

export const SETUPS: SetupType[] = [
  'Liquidity Sweep',
  'FVG',
  'Order Block',
  'CISD',
  'SMT',
  'MSS',
  'BOS',
  'Breakaway Gap',
  'Mitigated Block',
  'PO3',
  'Price Action',
  'Other',
];

export const SESSIONS: SessionType[] = [
  'Asia',
  'London',
  'New York',
  'London/New York Overlap',
];

export const KILL_ZONES: KillZoneType[] = [
  'Asian Kill Zone',
  'London Kill Zone',
  'New York Kill Zone',
];

export const EMOTIONS: EmotionType[] = [
  'Calm',
  'Confident',
  'Fear',
  'FOMO',
  'Greed',
  'Revenge',
  'Hesitation',
  'Disciplined',
];

export const MISTAKES: MistakeType[] = [
  'FOMO',
  'Revenge Trading',
  'Early Entry',
  'Late Entry',
  'Oversized Position',
  'Moved Stop Loss',
  'No Confirmation',
  'Overtrading',
  'Broke Trading Plan',
];

export const ACCOUNT_TYPES = ['Personal', 'Funded', 'Demo'];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

export const SETUP_COLORS: Record<string, string> = {
  'Liquidity Sweep': '#3b82f6',
  FVG: '#06b6d4',
  'Order Block': '#8b5cf6',
  CISD: '#ec4899',
  SMT: '#f59e0b',
  MSS: '#10b981',
  BOS: '#ef4444',
  'Breakaway Gap': '#6366f1',
  'Mitigated Block': '#14b8a6',
  PO3: '#f97316',
  'Price Action': '#eab308',
  Other: '#64748b',
};

export const SESSION_COLORS: Record<string, string> = {
  Asia: '#8b5cf6',
  London: '#3b82f6',
  'New York': '#10b981',
  'London/New York Overlap': '#f59e0b',
};

export const INSTRUMENT_COLORS: Record<string, string> = {
  XAUUSD: '#f59e0b',
  BTCUSD: '#f97316',
  EURUSD: '#3b82f6',
};

export const STORAGE_BUCKET = 'trade-screenshots';
