import React, { useMemo, useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Download } from 'lucide-react';
import { fetchTradesFromSheet } from '../lib/sheets';
import Footer from './Footer';

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
  strategy: string;
};

type Trade = {
  id: string;
  side: 'Buy' | 'Sell' | 'Long' | 'Short';
  instrument: string;
  quantity: number;
  entryPrice: number;
  date: string;
  notes?: string;
  strategy: string;
};

const formatINR = (n: number) => `₹${n.toFixed(2)}`;

// Update adapter to handle all Trade side values
const tradeToTxn = (trade: Trade): Txn => ({
  id: trade.id,
  type: trade.side === 'Buy' || trade.side === 'Long' ? 'BUY' : 'SELL',
  symbol: trade.instrument,
  name: trade.instrument,
  qty: trade.quantity,
  price: trade.entryPrice,
  total: trade.entryPrice * trade.quantity,
  timestamp: new Date(trade.date).getTime(), // Convert ISO string to timestamp
  orderType: 'Market', // Assuming order type is Market for simplicity
  strategy: trade.strategy
});

const Transactions: React.FC = () => {
  const [q, setQ] = useState('');
  const [type, setType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trades = await fetchTradesFromSheet();
        const txnsData = trades.map(tradeToTxn);
        console.log('Transactions data:', txnsData); // Debug log
        setTxns(txnsData);
      } catch (err) {
        setError('Failed to fetch transactions: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const trades = await fetchTradesFromSheet();
      const txnsData = trades.map(tradeToTxn);
      console.log('Transactions data:', txnsData); // Debug log
      setTxns(txnsData);
    } catch (err) {
      setError('Failed to refresh transactions: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const filteredTxns = useMemo(() => {
    let items = txns;
    if (type !== 'ALL') items = items.filter(t => t.type === type);
    if (q) items = items.filter(t => (t.symbol + ' ' + t.name).toLowerCase().includes(q.toLowerCase()));
    return items;
  }, [txns, q, type]);

  const exportCSV = () => {
    const header = ['ID','Type','Symbol','Name','Qty','Price','Total','OrderType','Strategy','Timestamp'];
    const rows = txns.map(t => [t.id, t.type, t.symbol, t.name, t.qty, t.price, t.total, t.orderType, t.strategy, new Date(t.timestamp).toISOString()]);
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
          <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-600 mt-1">All your buy/sell history</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh} 
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 flex items-center gap-2"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button onClick={exportCSV} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
            <Download className="h-4 w-4"/> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-600">Search</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Symbol or company" className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800">
              <option value="ALL">All</option>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Strategy</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading && (
              <tr>
                <td className="px-6 py-8 text-center text-slate-500" colSpan={9}>
                  Loading transactions...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td className="px-6 py-8 text-center text-red-500" colSpan={9}>
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && filteredTxns.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-slate-500" colSpan={9}>
                  No transactions found
                </td>
              </tr>
            )}
            {!loading && !error && filteredTxns.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-700">{new Date(t.timestamp).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${t.type === 'BUY' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {t.type === 'BUY' ? <ArrowDownCircle className="h-4 w-4"/> : <ArrowUpCircle className="h-4 w-4"/>}
                    {t.type}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900">{t.symbol}</td>
                <td className="px-6 py-4 text-slate-700">{t.name}</td>
                <td className="px-6 py-4 text-right text-slate-700">{t.qty}</td>
                <td className="px-6 py-4 text-right text-slate-900">{formatINR(t.price)}</td>
                <td className="px-6 py-4 text-right text-slate-900">{formatINR(t.total)}</td>
                <td className="px-6 py-4 text-slate-700">{t.orderType}</td>
                <td className="px-6 py-4 text-slate-700">{t.strategy || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </div>
  );
};

export default Transactions;
