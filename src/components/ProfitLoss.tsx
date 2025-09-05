import React, { useState, useEffect, useMemo } from 'react';
import { CalendarRange, Download, PieChart } from 'lucide-react';
import { fetchTradesFromSheet } from '../lib/sheets';
import type { Trade } from '../store/trades';
import Footer from './Footer';

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
  date: number;
  notes: string;
};

type HoldingsItem = { symbol: string; name: string; qty: number; avgPrice: number };

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [holdings, setHoldings] = useState<Record<string, HoldingsItem>>({});

  const tradeToTxn = (trade: Trade): Txn => ({
    id: trade.id,
    type: trade.side === 'Buy' || trade.side === 'Long' ? 'BUY' : 'SELL',
    symbol: trade.instrument,
    name: trade.instrument,
    qty: trade.quantity,
    price: trade.entryPrice,
    date: new Date(trade.date).getTime(),
    notes: trade.notes || ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trades = await fetchTradesFromSheet();
        setTxns(trades.map(tradeToTxn));
      } catch (err) {
        setError('Failed to fetch data: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const hold: Record<string, HoldingsItem> = {};
    txns.forEach(t => {
      const cur = hold[t.symbol] || { symbol: t.symbol, name: t.name, qty: 0, avgPrice: 0 };
      if (t.type === 'BUY') {
        const newQty = cur.qty + t.qty;
        const newCost = cur.qty * cur.avgPrice + t.qty * t.price;
        hold[t.symbol] = { ...cur, qty: newQty, avgPrice: newQty ? newCost / newQty : 0 };
      } else {
        const newQty = Math.max(0, cur.qty - t.qty);
        hold[t.symbol] = { ...cur, qty: newQty };
      }
    });
    setHoldings(hold);
  }, [txns]);

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

  const filteredTxns = useMemo(() => txns.filter(t => withinRange(t.date, range)), [txns, range]);

  const exportCSV = () => {
    const header = ['Symbol','Type','Qty','Price','Date','Notes'];
    const rows = filteredTxns.map(t => [t.symbol, t.type, t.qty, t.price, new Date(t.date).toISOString(), t.notes]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pnl_range_txns.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Profit & Loss</h1>
          <p className="text-slate-600 mt-1">View realized and unrealized P&L</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-700">
            <CalendarRange className="h-4 w-4"/>
            <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="bg-transparent outline-none text-slate-800">
              {ranges.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={exportCSV} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
            <Download className="h-4 w-4"/> Export Range Txns
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-600">Total Realized Profit</div>
          <div className={`mt-2 text-2xl font-semibold ${realized >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(realized)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-600">Total Unrealized P/L</div>
          <div className={`mt-2 text-2xl font-semibold ${unrealized >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(unrealized)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-600">Overview</div>
          <div className="mt-2 flex items-center gap-2 text-slate-700">
            <PieChart className="h-5 w-5"/> {Object.keys(holdings).length} holdings
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 text-slate-700 font-semibold">Profit by Stock</div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Realized (₹)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Unrealized (₹)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {Object.keys({ ...perStockUnrealized, ...perStockRealized }).map(sym => (
              <tr key={sym} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">{sym}</td>
                <td className={`px-6 py-4 text-right ${ (perStockRealized[sym]||0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(perStockRealized[sym] || 0)}</td>
                <td className={`px-6 py-4 text-right ${ (perStockUnrealized[sym]||0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(perStockUnrealized[sym] || 0)}</td>
              </tr>
            ))}
            {Object.keys({ ...perStockUnrealized, ...perStockRealized }).length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-slate-500" colSpan={3}>No P&L yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 text-slate-700 font-semibold">Holdings</div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Price (₹)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Current (₹)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">P&L (₹)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {Object.values(holdings).map(h => {
              const pnl = (demoPrices[h.symbol] || 0 - h.avgPrice) * h.qty;
              return (
                <tr key={h.symbol} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{h.symbol}</td>
                  <td className="px-6 py-4">{h.name}</td>
                  <td className="px-6 py-4 text-right">{h.qty}</td>
                  <td className="px-6 py-4 text-right">{formatINR(h.avgPrice)}</td>
                  <td className="px-6 py-4 text-right">{formatINR(demoPrices[h.symbol] || 0)}</td>
                  <td className={`px-6 py-4 text-right ${pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(pnl)}</td>
                </tr>
              );
            })}
            {Object.keys(holdings).length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-slate-500" colSpan={6}>No holdings yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Footer />
    </div>
  );
};

export default ProfitLoss;
