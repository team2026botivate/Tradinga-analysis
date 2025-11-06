// Simple localStorage-backed trade store and metrics
export type Trade = {
  id: string;
  date: string; // ISO entry date-time
  exitDate?: string; // ISO exit date-time (optional)
  sheetTimestamp?: string; // Raw timestamp from Google Sheet (display only)
  instrument: string;
  side: 'Buy' | 'Sell' | 'Long' | 'Short';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  riskAmount?: number; // in currency
  riskPercent?: number; // in %
  strategy: string; // Changed from optional to required
  entryReason?: string;
  exitReason?: string;
  screenshotName?: string;
  tags?: string[];
  notes?: string;
};

const KEY = 'trades_v1';

export function getTrades(): Trade[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Trade[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveTrades(trades: Trade[]) {
  localStorage.setItem(KEY, JSON.stringify(trades));
  // notify listeners in this tab
  try { window.dispatchEvent(new CustomEvent('trades_changed')); } catch {}
}

export function addTrade(trade: Trade) {
  const trades = getTrades();
  trades.push(trade);
  saveTrades(trades);
}

export function updateTrade(id: string, patch: Partial<Trade>) {
  const trades = getTrades();
  const idx = trades.findIndex(t => t.id === id);
  if (idx !== -1) {
    trades[idx] = { ...trades[idx], ...patch };
    saveTrades(trades);
  }
}

export function deleteTrade(id: string) {
  const trades = getTrades();
  const filtered = trades.filter(t => t.id !== id);
  if (filtered.length !== trades.length) {
    saveTrades(filtered);
  }
}

export function clearTrades() {
  localStorage.removeItem(KEY);
  try { window.dispatchEvent(new CustomEvent('trades_changed')); } catch {}
}

export type Metrics = {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number; // 0..100
  totalPnL: number;
  avgRR: number | null;
  best?: { trade: Trade; pnl: number };
  worst?: { trade: Trade; pnl: number };
  // equity curve points
  equity: { t: string; equity: number }[];
  avgHoldingHours: number | null;
};

export function computePnL(trade: Trade): number {
  const direction = trade.side === 'Buy' || trade.side === 'Long' ? 1 : -1;
  return (trade.exitPrice - trade.entryPrice) * direction * trade.quantity;
}

export function computeMetrics(trades: Trade[]): Metrics {
  let totalPnL = 0;
  let wins = 0;
  let losses = 0;
  let best: { trade: Trade; pnl: number } | undefined;
  let worst: { trade: Trade; pnl: number } | undefined;
  const rr: number[] = [];

  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const equity: { t: string; equity: number }[] = [];
  let running = 0;
  let holds: number[] = [];

  for (const tr of sorted) {
    const pnl = computePnL(tr);
    totalPnL += pnl;
    running += pnl;
    equity.push({ t: tr.date, equity: running });
    if (pnl >= 0) wins++; else losses++;
    if (!best || pnl > best.pnl) best = { trade: tr, pnl };
    if (!worst || pnl < worst.pnl) worst = { trade: tr, pnl };

    if (tr.stopLoss != null && tr.takeProfit != null) {
      const risk = Math.abs(tr.entryPrice - tr.stopLoss);
      const reward = Math.abs(tr.takeProfit - tr.entryPrice);
      if (risk > 0) rr.push(reward / risk);
    }

    if (tr.exitDate) {
      const ms = new Date(tr.exitDate).getTime() - new Date(tr.date).getTime();
      if (!Number.isNaN(ms)) holds.push(ms / 36e5);
    }
  }

  const totalTrades = trades.length;
  const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;
  const avgRR = rr.length ? rr.reduce((a, b) => a + b, 0) / rr.length : null;

  const avgHoldingHours = holds.length ? holds.reduce((a,b)=>a+b,0)/holds.length : null;
  return { totalTrades, wins, losses, winRate, totalPnL, avgRR, best, worst, equity, avgHoldingHours };
}

export function toCSV(trades: Trade[]): string {
  const headers = [
    'id','date','exitDate','instrument','side','entryPrice','exitPrice','quantity','stopLoss','takeProfit','riskAmount','riskPercent','strategy','entryReason','exitReason','screenshotName','tags','notes'
  ];
  const rows = trades.map(t => [
    t.id,
    t.date,
    t.exitDate ?? '',
    t.instrument,
    t.side,
    t.entryPrice,
    t.exitPrice,
    t.quantity,
    t.stopLoss ?? '',
    t.takeProfit ?? '',
    t.riskAmount ?? '',
    t.riskPercent ?? '',
    t.strategy,
    (t.entryReason ?? '').replace(/\n/g,' '),
    (t.exitReason ?? '').replace(/\n/g,' '),
    t.screenshotName ?? '',
    (t.tags ?? []).join('|'),
    (t.notes ?? '').replace(/\n/g,' ')
  ]);
  const esc = (v: any) => {
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  };
  return [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
}
