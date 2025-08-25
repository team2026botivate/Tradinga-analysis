import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, IndianRupee, ShoppingCart, TrendingUp } from 'lucide-react';

// Simple price map for demo. In a real app, fetch live prices.
const demoPrices: Record<string, { name: string; price: number }> = {
  RELIANCE: { name: 'Reliance Industries', price: 2945.3 },
  TCS: { name: 'Tata Consultancy Services', price: 3764.8 },
  HDFCBANK: { name: 'HDFC Bank', price: 1635.5 },
  INFY: { name: 'Infosys', price: 1598.4 },
  ITC: { name: 'ITC Limited', price: 468.9 },
  SBIN: { name: 'State Bank of India', price: 834.2 },
  ONGC: { name: 'Oil & Natural Gas Corp', price: 282.4 },
  ADANIENT: { name: 'Adani Enterprises', price: 3085.6 },
};

type OrderType = 'Market' | 'Limit' | 'Stop';

type Txn = {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  name: string;
  qty: number;
  price: number; // per share
  total: number; // qty * price
  timestamp: number;
  orderType: OrderType;
};

type Holdings = Record<string, { symbol: string; name: string; qty: number; avgPrice: number }>;

const storage = {
  getTxns(): Txn[] {
    try { return JSON.parse(localStorage.getItem('transactions') || '[]'); } catch { return []; }
  },
  setTxns(txns: Txn[]) { localStorage.setItem('transactions', JSON.stringify(txns)); },
  getHoldings(): Holdings {
    try { return JSON.parse(localStorage.getItem('holdings') || '{}'); } catch { return {}; }
  },
  setHoldings(h: Holdings) { localStorage.setItem('holdings', JSON.stringify(h)); },
};

const symbols = Object.keys(demoPrices);

const Trade: React.FC = () => {
  // Buy form state
  const [buySymbol, setBuySymbol] = useState('RELIANCE');
  const [buyQty, setBuyQty] = useState<number>(0);
  const [buyPrice, setBuyPrice] = useState<number>(demoPrices[buySymbol].price);
  const [buyOrderType, setBuyOrderType] = useState<OrderType>('Market');
  const [addToPortfolio, setAddToPortfolio] = useState(true);
  const [showConfirm, setShowConfirm] = useState<null | { action: 'BUY' | 'SELL'; payload: any }>(null);
  const [success, setSuccess] = useState<string>('');

  // Sell form state
  const [sellSymbol, setSellSymbol] = useState('RELIANCE');
  const [sellQty, setSellQty] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(demoPrices[sellSymbol].price);
  const [sellOrderType, setSellOrderType] = useState<OrderType>('Market');

  const [holdingsVersion, setHoldingsVersion] = useState(0); // trigger re-render after trade

  useEffect(() => {
    setBuyPrice(demoPrices[buySymbol]?.price ?? 0);
  }, [buySymbol]);
  useEffect(() => {
    setSellPrice(demoPrices[sellSymbol]?.price ?? 0);
  }, [sellSymbol]);

  const buyName = demoPrices[buySymbol]?.name || '';
  const sellName = demoPrices[sellSymbol]?.name || '';

  const totalBuy = (buyQty || 0) * (buyPrice || 0);
  const totalSell = (sellQty || 0) * (sellPrice || 0);

  // Seed/clear demo data to make Trade/Transactions/P&L functional instantly
  const seedDemo = () => {
    const now = Date.now();
    const demoTx = [
      { id: `${now-500000}_a1`, type: 'BUY' as const, symbol: 'RELIANCE', name: demoPrices.RELIANCE.name, qty: 10, price: 2900, total: 29000, timestamp: now - 500000, orderType: 'Market' as const },
      { id: `${now-450000}_a2`, type: 'BUY' as const, symbol: 'INFY', name: demoPrices.INFY.name, qty: 15, price: 1550, total: 23250, timestamp: now - 450000, orderType: 'Limit' as const },
      { id: `${now-420000}_a3`, type: 'BUY' as const, symbol: 'ONGC', name: demoPrices.ONGC.name, qty: 50, price: 275, total: 13750, timestamp: now - 420000, orderType: 'Market' as const },
      { id: `${now-300000}_a4`, type: 'SELL' as const, symbol: 'INFY', name: demoPrices.INFY.name, qty: 5, price: 1605, total: 8025, timestamp: now - 300000, orderType: 'Market' as const },
      { id: `${now-200000}_a5`, type: 'BUY' as const, symbol: 'SBIN', name: demoPrices.SBIN.name, qty: 20, price: 820, total: 16400, timestamp: now - 200000, orderType: 'Market' as const },
      { id: `${now-100000}_a6`, type: 'SELL' as const, symbol: 'RELIANCE', name: demoPrices.RELIANCE.name, qty: 4, price: 2950, total: 11800, timestamp: now - 100000, orderType: 'Limit' as const },
    ];

    // Compute holdings from txns
    const holdings: Holdings = {};
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

    // Save (newest first)
    storage.setTxns(demoTx.sort((a,b) => b.timestamp - a.timestamp));
    storage.setHoldings(holdings);
    setHoldingsVersion(v => v + 1);
    setSuccess('Demo data loaded');
    setTimeout(() => setSuccess(''), 2500);
  };

  const clearDemo = () => {
    localStorage.removeItem('transactions');
    localStorage.removeItem('holdings');
    setHoldingsVersion(v => v + 1);
    setSuccess('Demo data cleared');
    setTimeout(() => setSuccess(''), 2000);
  };

  const doBuy = () => {
    setShowConfirm({ action: 'BUY', payload: { symbol: buySymbol, name: buyName, qty: buyQty, price: buyPrice, orderType: buyOrderType } });
  };
  const doSell = () => {
    setShowConfirm({ action: 'SELL', payload: { symbol: sellSymbol, name: sellName, qty: sellQty, price: sellPrice, orderType: sellOrderType } });
  };

  const confirm = () => {
    if (!showConfirm) return;
    const { action, payload } = showConfirm;

    const tx: Txn = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: action,
      symbol: payload.symbol,
      name: payload.name,
      qty: Number(payload.qty),
      price: Number(payload.price),
      total: Number(payload.qty) * Number(payload.price),
      timestamp: Date.now(),
      orderType: payload.orderType as OrderType,
    };

    const txns = storage.getTxns();
    txns.unshift(tx);
    storage.setTxns(txns);

    // update holdings
    const h = storage.getHoldings();
    const cur = h[tx.symbol] || { symbol: tx.symbol, name: tx.name, qty: 0, avgPrice: 0 };

    if (tx.type === 'BUY') {
      // Weighted average price update
      const newQty = cur.qty + tx.qty;
      const newCost = cur.qty * cur.avgPrice + tx.qty * tx.price;
      h[tx.symbol] = { symbol: tx.symbol, name: tx.name, qty: newQty, avgPrice: newQty ? newCost / newQty : 0 };
      if (!addToPortfolio) {
        // if not adding to portfolio, revert holding change
        h[tx.symbol] = cur;
      }
      setSuccess(`Purchased ${tx.qty} ${tx.symbol} @ ₹${tx.price.toFixed(2)} (${tx.orderType})`);
    } else {
      // SELL: reduce qty, keep avgPrice same
      const newQty = Math.max(0, cur.qty - tx.qty);
      h[tx.symbol] = { ...cur, qty: newQty };
      setSuccess(`Sold ${tx.qty} ${tx.symbol} @ ₹${tx.price.toFixed(2)} (${tx.orderType})`);
    }

    storage.setHoldings(h);
    setHoldingsVersion((v) => v + 1);
    setShowConfirm(null);

    // Reset small bits
    setBuyQty(0);
    setSellQty(0);

    setTimeout(() => setSuccess(''), 3000);
  };

  const ownedSymbols = useMemo(() => Object.keys(storage.getHoldings()).filter(s => storage.getHoldings()[s].qty > 0), [holdingsVersion]);
  const ownedQty = storage.getHoldings()[sellSymbol]?.qty || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Trade</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Buy or sell stocks. Transactions are stored locally.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={seedDemo} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Load Demo Data</button>
          <button onClick={clearDemo} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">Clear</button>
        </div>
      </div>

      {/* Buy Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2"><ShoppingCart className="h-5 w-5"/> Purchase</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
          <div className="lg:col-span-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">Stock Symbol</label>
            <input value={buySymbol} onChange={(e) => setBuySymbol(e.target.value.toUpperCase())} list="symbols" placeholder="e.g., RELIANCE" className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100" />
            <datalist id="symbols">
              {symbols.map(s => (<option key={s} value={s} />))}
            </datalist>
          </div>
          <div className="lg:col-span-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">Company Name</label>
            <div className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100">{buyName || '-'}</div>
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Quantity</label>
            <input type="number" min={0} value={buyQty} onChange={(e) => setBuyQty(Number(e.target.value))} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100" />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Price per Share</label>
            <input type="number" min={0} step={0.01} value={buyPrice} onChange={(e) => setBuyPrice(Number(e.target.value))} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100" />
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time: ₹{(demoPrices[buySymbol]?.price ?? 0).toFixed(2)}</div>
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Order Type</label>
            <select value={buyOrderType} onChange={(e) => setBuyOrderType(e.target.value as OrderType)} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100">
              {(['Market','Limit','Stop'] as OrderType[]).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Total Cost</label>
            <div className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 flex items-center gap-1"><IndianRupee className="h-4 w-4"/> {isFinite(totalBuy) ? `₹${totalBuy.toFixed(2)}` : '-'}</div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <label className="inline-flex items-center gap-2 select-none">
            <input type="checkbox" checked={addToPortfolio} onChange={(e) => setAddToPortfolio(e.target.checked)} />
            <span className="text-slate-700 dark:text-slate-200">Add to Portfolio</span>
          </label>
          <button disabled={!buySymbol || buyQty <= 0 || buyPrice <= 0} onClick={doBuy} className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4"/> Buy
          </button>
        </div>
      </div>

      {/* Sell Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Sell</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
          <div className="lg:col-span-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">Stock Symbol</label>
            <select value={sellSymbol} onChange={(e) => setSellSymbol(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100">
              {ownedSymbols.length ? ownedSymbols.map(s => <option key={s} value={s}>{s}</option>) : symbols.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">Company Name</label>
            <div className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100">{sellName || '-'}</div>
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Quantity to Sell</label>
            <input type="number" min={0} max={ownedQty} value={sellQty} onChange={(e) => setSellQty(Number(e.target.value))} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100" />
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Owned: {ownedQty}</div>
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Current Price</label>
            <input type="number" min={0} step={0.01} value={sellPrice} onChange={(e) => setSellPrice(Number(e.target.value))} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100" />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Order Type</label>
            <select value={sellOrderType} onChange={(e) => setSellOrderType(e.target.value as OrderType)} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100">
              {(['Market','Limit','Stop'] as OrderType[]).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Sale Amount</label>
            <div className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 flex items-center gap-1"><IndianRupee className="h-4 w-4"/> {isFinite(totalSell) ? `₹${totalSell.toFixed(2)}` : '-'}</div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <button onClick={() => setSellQty(ownedQty)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">Sell All</button>
          <button disabled={sellQty <= 0 || sellQty > ownedQty} onClick={doSell} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4"/> Sell
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Confirm {showConfirm.action === 'BUY' ? 'Purchase' : 'Sale'}</h3>
            <p className="text-slate-700 dark:text-slate-300 text-sm">{showConfirm.payload.qty} x {showConfirm.payload.symbol} at ₹{Number(showConfirm.payload.price).toFixed(2)} • {showConfirm.payload.orderType}</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowConfirm(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">Cancel</button>
              <button onClick={confirm} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5"/> {success}
          </div>
        </div>
      )}
    </div>
  );
};

export default Trade;
