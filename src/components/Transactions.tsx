import React, { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Download } from 'lucide-react';

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

const getTxns = (): Txn[] => {
  try { return JSON.parse(localStorage.getItem('transactions') || '[]'); } catch { return []; }
};

const formatINR = (n: number) => `₹${n.toFixed(2)}`;

const Transactions: React.FC = () => {
  const [q, setQ] = useState('');
  const [type, setType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [version, setVersion] = useState(0);

  const txns = useMemo(() => {
    let items = getTxns();
    if (type !== 'ALL') items = items.filter(t => t.type === type);
    if (q) items = items.filter(t => (t.symbol + ' ' + t.name).toLowerCase().includes(q.toLowerCase()));
    return items;
  }, [q, type, version]);

  const seedDemo = () => {
    const now = Date.now();
    const demoTx: Txn[] = [
      { id: `${now-500000}_a1`, type: 'BUY', symbol: 'RELIANCE', name: 'Reliance Industries', qty: 10, price: 2900, total: 29000, timestamp: now - 500000, orderType: 'Market' },
      { id: `${now-450000}_a2`, type: 'BUY', symbol: 'INFY', name: 'Infosys', qty: 15, price: 1550, total: 23250, timestamp: now - 450000, orderType: 'Limit' },
      { id: `${now-420000}_a3`, type: 'BUY', symbol: 'ONGC', name: 'Oil & Natural Gas Corp', qty: 50, price: 275, total: 13750, timestamp: now - 420000, orderType: 'Market' },
      { id: `${now-300000}_a4`, type: 'SELL', symbol: 'INFY', name: 'Infosys', qty: 5, price: 1605, total: 8025, timestamp: now - 300000, orderType: 'Market' },
      { id: `${now-200000}_a5`, type: 'BUY', symbol: 'SBIN', name: 'State Bank of India', qty: 20, price: 820, total: 16400, timestamp: now - 200000, orderType: 'Market' },
      { id: `${now-100000}_a6`, type: 'SELL', symbol: 'RELIANCE', name: 'Reliance Industries', qty: 4, price: 2950, total: 11800, timestamp: now - 100000, orderType: 'Limit' },
    ];
    localStorage.setItem('transactions', JSON.stringify(demoTx.sort((a,b) => b.timestamp - a.timestamp)));
    // also build holdings so P&L reflects
    const holdings: Record<string, { symbol: string; name: string; qty: number; avgPrice: number }> = {};
    for (const tx of demoTx) {
      const cur = holdings[tx.symbol] || { symbol: tx.symbol, name: tx.name, qty: 0, avgPrice: 0 };
      if (tx.type === 'BUY') {
        const newQty = cur.qty + tx.qty;
        const newCost = cur.qty * cur.avgPrice + tx.qty * tx.price;
        holdings[tx.symbol] = { symbol: tx.symbol, name: tx.name, qty: newQty, avgPrice: newQty ? newCost / newQty : 0 };
      } else {
        const newQty = Math.max(0, cur.qty - tx.qty);
        holdings[tx.symbol] = { ...cur, qty: newQty };
      }
    }
    localStorage.setItem('holdings', JSON.stringify(holdings));
    setVersion(v => v + 1);
  };

  const clearDemo = () => {
    localStorage.removeItem('transactions');
    localStorage.removeItem('holdings');
    setVersion(v => v + 1);
  };

  const exportCSV = () => {
    const header = ['ID','Type','Symbol','Name','Qty','Price','Total','OrderType','Timestamp'];
    const rows = getTxns().map(t => [t.id, t.type, t.symbol, t.name, t.qty, t.price, t.total, t.orderType, new Date(t.timestamp).toISOString()]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">All your buy/sell history</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={seedDemo} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Load Demo</button>
          <button onClick={clearDemo} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">Clear</button>
          <button onClick={exportCSV} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
            <Download className="h-4 w-4"/> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Search</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Symbol or company" className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100" />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100">
              <option value="ALL">All</option>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {txns.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{new Date(t.timestamp).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${t.type === 'BUY' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20' : 'bg-red-100 text-red-700 dark:bg-red-900/20'}`}>
                    {t.type === 'BUY' ? <ArrowDownCircle className="h-4 w-4"/> : <ArrowUpCircle className="h-4 w-4"/>}
                    {t.type}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{t.symbol}</td>
                <td className="px-6 py-4 text-slate-700 dark:text-slate-200">{t.name}</td>
                <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-200">{t.qty}</td>
                <td className="px-6 py-4 text-right text-slate-900 dark:text-white">{formatINR(t.price)}</td>
                <td className="px-6 py-4 text-right text-slate-900 dark:text-white">{formatINR(t.total)}</td>
                <td className="px-6 py-4 text-slate-700 dark:text-slate-200">{t.orderType}</td>
              </tr>
            ))}
            {txns.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={8}>No transactions yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
