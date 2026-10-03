import { Trade, Account } from '@/types';

export function tradesToCSV(trades: Trade[], accounts: Account[]): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const headers = [
    'Date', 'Time', 'Account', 'Instrument', 'Direction',
    'Entry', 'Stop Loss', 'Take Profit', 'Exit Price',
    'Lot Size', 'Risk %', 'Risk Amount', 'Reward Amount',
    'R:R', 'P&L', 'R Multiple', 'Setups', 'Session', 'Kill Zone',
    'Emotion Before', 'Emotion During', 'Emotion After',
    'Followed Plan', 'Overtraded', 'Moved SL', 'Early Entry', 'Revenge Trade',
    'Mistakes', 'Notes', 'Status',
  ];

  const rows = trades.map((t) => [
    t.trade_date,
    t.trade_time ?? '',
    accountMap.get(t.account_id ?? '') ?? '',
    t.instrument,
    t.direction,
    t.entry_price ?? '',
    t.stop_loss ?? '',
    t.take_profit ?? '',
    t.exit_price ?? '',
    t.lot_size ?? '',
    t.risk_percent ?? '',
    t.risk_amount ?? '',
    t.reward_amount ?? '',
    t.rr_ratio ?? '',
    t.pnl ?? '',
    t.r_multiple ?? '',
    t.setups.join('; '),
    t.session ?? '',
    t.kill_zone ?? '',
    t.emotion_before ?? '',
    t.emotion_during ?? '',
    t.emotion_after ?? '',
    t.followed_plan ? 'Yes' : 'No',
    t.overtraded ? 'Yes' : 'No',
    t.moved_sl ? 'Yes' : 'No',
    t.early_entry ? 'Yes' : 'No',
    t.revenge_trade ? 'Yes' : 'No',
    t.mistakes.join('; '),
    (t.notes ?? '').replace(/[\n\r]/g, ' '),
    t.status,
  ]);

  const allRows = [headers, ...rows];
  return allRows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell);
        currentCell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') i++;
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }
  return rows.filter((r) => r.length > 0 && !(r.length === 1 && r[0] === ''));
}

interface ParsedTrade {
  trade_date: string;
  trade_time: string | null;
  instrument: string;
  direction: 'buy' | 'sell';
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  exit_price: number | null;
  lot_size: number | null;
  risk_percent: number | null;
  pnl: number | null;
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
  status: 'open' | 'closed';
}

export function csvRowsToTrades(rows: string[][], headerRow: string[]): ParsedTrade[] {
  const headerMap = new Map(
    headerRow.map((h, i) => [h.trim().toLowerCase(), i])
  );
  const get = (row: string[], name: string): string => {
    const idx = headerMap.get(name.toLowerCase());
    if (idx == null || idx < 0 || idx >= row.length) return '';
    return row[idx]?.trim() ?? '';
  };
  const parseNum = (val: string): number | null => {
    if (!val || val === '') return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  };
  const parseBool = (val: string): boolean => val.toLowerCase() === 'yes' || val.toLowerCase() === 'true';

  const trades: ParsedTrade[] = [];
  for (const row of rows) {
    const direction = (get(row, 'Direction').toLowerCase() === 'sell' ? 'sell' : 'buy') as 'buy' | 'sell';
    const setupsStr = get(row, 'Setups');
    const mistakesStr = get(row, 'Mistakes');
    const status = (get(row, 'Status').toLowerCase() === 'open' ? 'open' : 'closed') as 'open' | 'closed';
    trades.push({
      trade_date: get(row, 'Date') || new Date().toISOString().slice(0, 10),
      trade_time: get(row, 'Time') || null,
      instrument: get(row, 'Instrument') || 'Unknown',
      direction,
      entry_price: parseNum(get(row, 'Entry')),
      stop_loss: parseNum(get(row, 'Stop Loss')),
      take_profit: parseNum(get(row, 'Take Profit')),
      exit_price: parseNum(get(row, 'Exit Price')),
      lot_size: parseNum(get(row, 'Lot Size')),
      risk_percent: parseNum(get(row, 'Risk %')),
      pnl: parseNum(get(row, 'P&L')),
      setups: setupsStr ? setupsStr.split(';').map((s) => s.trim()).filter(Boolean) : [],
      session: get(row, 'Session') || null,
      kill_zone: get(row, 'Kill Zone') || null,
      emotion_before: get(row, 'Emotion Before') || null,
      emotion_during: get(row, 'Emotion During') || null,
      emotion_after: get(row, 'Emotion After') || null,
      followed_plan: parseBool(get(row, 'Followed Plan')),
      overtraded: parseBool(get(row, 'Overtraded')),
      moved_sl: parseBool(get(row, 'Moved SL')),
      early_entry: parseBool(get(row, 'Early Entry')),
      revenge_trade: parseBool(get(row, 'Revenge Trade')),
      mistakes: mistakesStr ? mistakesStr.split(';').map((s) => s.trim()).filter(Boolean) : [],
      notes: get(row, 'Notes') || null,
      status,
    });
  }
  return trades;
}
