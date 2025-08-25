import React, { useMemo, useState } from 'react';
import { CalendarRange, Download, PieChart } from 'lucide-react';

// Keep this in sync with Trade demoPrices
const demoPrices: Record<string, number> = {
  RELIANCE: 2945.3,
  TCS: 3764.8,
  HDFCBANK: 1635.5,
  INFY: 1598.4,
  ITC: 468.9,
  SBIN: 834.2,
  ONGC: 282.4,
  ADANIENT: 3085.6,
};

type Txn = {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  name: string;
  qty: number;
  price: number;
  total: number;
  timestamp: number;
  orderType: 'Market' | 'Limit' | 'Stop';
};

type HoldingsItem = { symbol: string; name: string; qty: number; avgPrice: number };

const getTxns = (): Txn[] => {
  try { return JSON.parse(localStorage.getItem('transactions') || '[]'); } catch { return []; }
};
const getHoldings = (): Record<string, HoldingsItem> => {
  try { return JSON.parse(localStorage.getItem('holdings') || '{}'); } catch { return {}; }
};

const formatINR = (n: number) => `₹${n.toFixed(2)}`;

const ranges = ['Today', 'Week', 'Month', 'YTD'] as const;

type Range = typeof ranges[number];

const withinRange = (ts: number, range: Range) => {
  const now = new Date();
  const t = new Date(ts);
  if (range === 'Today') {
    return t.toDateString() === now.toDateString();
  }
  if (range === 'Week') {
    const first = new Date(now);
    first.setDate(now.getDate() - 7);
    return t >= first && t <= now;
  }
  if (range === 'Month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return t >= first && t <= now;
  }
  if (range === 'YTD') {
    const first = new Date(now.getFullYear(), 0, 1);
    return t >= first && t <= now;
  }
  return true;
};

const ProfitLoss: React.FC = () => {
  const [range, setRange] = useState<Range>('Month');
  const [version, setVersion] = useState(0);

  const txns = useMemo(() => getTxns(), [version]);
  const holdings = useMemo(() => getHoldings(), [version]);

  const seedDemo = () => {
    const now = Date.now();
    const demoTx = [
      { id: `${now-500000}_a1`, type: 'BUY' as const, symbol: 'RELIANCE', name: 'Reliance Industries', qty: 10, price: 2900, total: 29000, timestamp: now - 500000, orderType: 'Market' as const },
      { id: `${now-450000}_a2`, type: 'BUY' as const, symbol: 'INFY', name: 'Infosys', qty: 15, price: 1550, total: 23250, timestamp: now - 450000, orderType: 'Limit' as const },
      { id: `${now-420000}_a3`, type: 'BUY' as const, symbol: 'ONGC', name: 'Oil & Natural Gas Corp', qty: 50, price: 275, total: 13750, timestamp: now - 420000, orderType: 'Market' as const },
      { id: `${now-300000}_a4`, type: 'SELL' as const, symbol: 'INFY', name: 'Infosys', qty: 5, price: 1605, total: 8025, timestamp: now - 300000, orderType: 'Market' as const },
      { id: `${now-200000}_a5`, type: 'BUY' as const, symbol: 'SBIN', name: 'State Bank of India', qty: 20, price: 820, total: 16400, timestamp: now - 200000, orderType: 'Market' as const },
      { id: `${now-100000}_a6`, type: 'SELL' as const, symbol: 'RELIANCE', name: 'Reliance Industries', qty: 4, price: 2950, total: 11800, timestamp: now - 100000, orderType: 'Limit' as const },
    ];
    localStorage.setItem('transactions', JSON.stringify(demoTx.sort((a,b) => b.timestamp - a.timestamp)));
    const hold: Record<string, HoldingsItem> = {};
    for (const tx of demoTx) {
      const cur = hold[tx.symbol] || { symbol: tx.symbol, name: tx.name, qty: 0, avgPrice: 0 };
      if (tx.type === 'BUY') {
        const newQty = cur.qty + tx.qty;
        const newCost = cur.qty * cur.avgPrice + tx.qty * tx.price;
        hold[tx.symbol] = { symbol: tx.symbol, name: tx.name, qty: newQty, avgPrice: newQty ? newCost / newQty : 0 };
      } else {
        const newQty = Math.max(0, cur.qty - tx.qty);
        hold[tx.symbol] = { ...cur, qty: newQty };
      }
    }
    localStorage.setItem('holdings', JSON.stringify(hold));
    setVersion(v => v + 1);
  };

  const clearDemo = () => {
    localStorage.removeItem('transactions');
    localStorage.removeItem('holdings');
    setVersion(v => v + 1);
  };

  // Realized P&L: sum over SELL transactions (sell_total - proportional cost basis)
  // For simplicity, estimate cost basis using avgPrice at the time of sale from holdings snapshot is not stored.
  // We'll approximate by using current avgPrice in holdings plus historical buys proportionally.
  // Simpler approach: realized = sum( (sell price - average buy price up to that point) * qty ).
  // For demo purposes, we compute realized across all SELLs using current avgPrice fallback.

  const { realized, perStockRealized } = useMemo(() => {
    const per: Record<string, number> = {};
    let total = 0;
    const avgBySymbol: Record<string, number> = {};
    // Build average from buys
    const buysBySymbol: Record<string, { qty: number; cost: number }> = {};
    txns
      .filter(t => t.type === 'BUY')
      .forEach(b => {
        const agg = buysBySymbol[b.symbol] || { qty: 0, cost: 0 };
        agg.qty += b.qty;
        agg.cost += b.qty * b.price;
        buysBySymbol[b.symbol] = agg;
      });
    Object.keys(buysBySymbol).forEach(s => {
      const b = buysBySymbol[s];
      avgBySymbol[s] = b.qty ? b.cost / b.qty : (holdings[s]?.avgPrice || 0);
    });

    txns
      .filter(t => t.type === 'SELL')
      .forEach(sell => {
        const avg = avgBySymbol[sell.symbol] ?? holdings[sell.symbol]?.avgPrice ?? sell.price;
        const pnl = (sell.price - avg) * sell.qty;
        per[sell.symbol] = (per[sell.symbol] || 0) + pnl;
        total += pnl;
      });

    return { realized: total, perStockRealized: per };
  }, [txns, holdings]);

  // Unrealized: sum over current holdings qty * (currentPrice - avgPrice)
  const { unrealized, perStockUnrealized } = useMemo(() => {
    let total = 0;
    const per: Record<string, number> = {};
    Object.values(holdings).forEach(h => {
      if (h.qty <= 0) return;
      const cur = demoPrices[h.symbol] ?? h.avgPrice;
      const pnl = (cur - h.avgPrice) * h.qty;
      per[h.symbol] = pnl;
      total += pnl;
    });
    return { unrealized: total, perStockUnrealized: per };
  }, [holdings]);

  const filteredTxns = useMemo(() => txns.filter(t => withinRange(t.timestamp, range)), [txns, range]);

  const exportCSV = () => {
    const header = ['Symbol','Type','Qty','Price','Total','Timestamp'];
    const rows = filteredTxns.map(t => [t.symbol, t.type, t.qty, t.price, t.total, new Date(t.timestamp).toISOString()]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pnl_range_txns.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profit & Loss</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">View realized and unrealized P&L</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={seedDemo} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Load Demo</button>
          <button onClick={clearDemo} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">Clear</button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            <CalendarRange className="h-4 w-4"/>
            <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="bg-transparent outline-none text-slate-800 dark:text-slate-100">
              {ranges.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={exportCSV} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
            <Download className="h-4 w-4"/> Export Range Txns
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Realized Profit</div>
          <div className={`mt-2 text-2xl font-semibold ${realized >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(realized)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Unrealized P/L</div>
          <div className={`mt-2 text-2xl font-semibold ${unrealized >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(unrealized)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <div className="text-sm text-slate-600 dark:text-slate-400">Overview</div>
          <div className="mt-2 flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <PieChart className="h-5 w-5"/> {Object.keys(holdings).length} holdings
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">Profit by Stock</div>
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Realized</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Unrealized</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {Object.keys({ ...perStockUnrealized, ...perStockRealized }).map(sym => (
              <tr key={sym} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{sym}</td>
                <td className={`px-6 py-4 text-right ${ (perStockRealized[sym]||0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(perStockRealized[sym] || 0)}</td>
                <td className={`px-6 py-4 text-right ${ (perStockUnrealized[sym]||0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(perStockUnrealized[sym] || 0)}</td>
              </tr>
            ))}
            {Object.keys({ ...perStockUnrealized, ...perStockRealized }).length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={3}>No P&L yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitLoss;
