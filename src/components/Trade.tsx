import React, { useEffect, useMemo, useState } from 'react';
import { getTrades, toCSV, addTrade, Trade as JournalTrade } from '../store/trades';
import Select from './ui/Select';
import { CheckCircle2, IndianRupee, ShoppingCart, TrendingUp, ArrowRightLeft } from 'lucide-react';
import { syncTradingDayToSheet, syncTradeToSheet } from '../lib/sheets';

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
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL'>('BUY');
  const [buyShimmer, setBuyShimmer] = useState(false);
  const [sellShimmer, setSellShimmer] = useState(false);
  // Journal-style trade form modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [draftDate, setDraftDate] = useState<string | undefined>(undefined);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showFormModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showFormModal]);

  useEffect(() => {
    setBuyPrice(demoPrices[buySymbol]?.price ?? 0);
    setBuyShimmer(true);
    const t = setTimeout(() => setBuyShimmer(false), 600);
    return () => clearTimeout(t);
  }, [buySymbol]);
  useEffect(() => {
    setSellPrice(demoPrices[sellSymbol]?.price ?? 0);
    setSellShimmer(true);
    const t = setTimeout(() => setSellShimmer(false), 600);
    return () => clearTimeout(t);
  }, [sellSymbol]);

  const buyName = demoPrices[buySymbol]?.name || '';
  const sellName = demoPrices[sellSymbol]?.name || '';

  const totalBuy = (buyQty || 0) * (buyPrice || 0);
  const totalSell = (sellQty || 0) * (sellPrice || 0);

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
      // Log to Journal store as a trade entry
      try {
        const jt: JournalTrade = {
          id: Math.random().toString(36).slice(2,9),
          date: new Date(tx.timestamp).toISOString(),
          instrument: tx.symbol,
          side: 'Buy',
          entryPrice: tx.price,
          exitPrice: tx.price, // initial exit same as entry; can be edited later in Journal
          quantity: tx.qty,
          strategy: '',
          entryReason: 'Purchase from Trade tab',
          notes: `Order: ${tx.orderType}`,
        };
        addTrade(jt as any);
        // Fire-and-forget sync to Google Sheets
        void syncTradeToSheet(jt as any);
      } catch {}
    } else {
      // SELL: reduce qty, keep avgPrice same
      const newQty = Math.max(0, cur.qty - tx.qty);
      h[tx.symbol] = { ...cur, qty: newQty };
      setSuccess(`Sold ${tx.qty} ${tx.symbol} @ ₹${tx.price.toFixed(2)} (${tx.orderType})`);
      // Optionally also log Sell to Journal
      try {
        const jt: JournalTrade = {
          id: Math.random().toString(36).slice(2,9),
          date: new Date(tx.timestamp).toISOString(),
          instrument: tx.symbol,
          side: 'Sell',
          entryPrice: tx.price,
          exitPrice: tx.price,
          quantity: tx.qty,
          strategy: '',
          entryReason: 'Sale from Trade tab',
          notes: `Order: ${tx.orderType}`,
        };
        addTrade(jt as any);
        // Fire-and-forget sync to Google Sheets
        void syncTradeToSheet(jt as any);
      } catch {}
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

  // Journal trades for All Trades table
  const [tick, setTick] = useState(0);
  const tradesAll = useMemo(() => getTrades(), [tick]);

  // Filters (mirroring Journal)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    strategy: '',
    instrument: '',
    status: 'all' as 'all' | 'win' | 'loss',
    search: '',
    year: String(new Date().getFullYear()),
  });

  const symbolsList = useMemo(
    () => Array.from(new Set(tradesAll.map(t => t.instrument))).sort(),
    [tradesAll]
  );
  const strategiesList = useMemo(
    () => Array.from(new Set(tradesAll.map(t => t.strategy || ''))).filter(Boolean).sort(),
    [tradesAll]
  );

  const filteredTrades = useMemo(() => {
    return tradesAll.filter(t => {
      const d = new Date(t.date).getTime();
      if (filters.dateFrom) {
        const f = new Date(filters.dateFrom).getTime();
        if (d < f) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo).getTime();
        if (d > to) return false;
      }
      if (filters.year) {
        const y = new Date(t.date).getFullYear();
        if (String(y) !== String(filters.year)) return false;
      }
      if (filters.strategy && (t.strategy || '') !== filters.strategy) return false;
      if (filters.instrument && !t.instrument.toLowerCase().includes(filters.instrument.toLowerCase())) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = [t.instrument, t.strategy || '', t.notes || '', t.entryReason || '', t.exitReason || '']
          .join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status !== 'all') {
        const dir = t.side === 'Buy' || t.side === 'Long' ? 1 : -1;
        const pnl = (t.exitPrice - t.entryPrice) * dir * t.quantity;
        if (filters.status === 'win' && pnl < 0) return false;
        if (filters.status === 'loss' && pnl >= 0) return false;
      }
      return true;
    });
  }, [tradesAll, filters]);
  // Auto-refresh when trades change in this tab or another tab
  useEffect(() => {
    const onChange = () => setTick(v => v + 1);
    window.addEventListener('trades_changed' as any, onChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'trades_v1') onChange();
    });
    return () => {
      window.removeEventListener('trades_changed' as any, onChange);
      window.removeEventListener('storage', onChange as any);
    };
  }, []);
  type SortKey = 'date'|'instrument'|'side'|'entryPrice'|'exitPrice'|'quantity'|'pnl';
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc'|'desc' }>({ key: 'date', dir: 'desc' });
  const sorted = useMemo(() => {
    const arr = [...filteredTrades];
    const cmp = (a: JournalTrade, b: JournalTrade) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const pnlA = (a.exitPrice - a.entryPrice) * (a.side === 'Buy' || a.side === 'Long' ? 1 : -1) * a.quantity;
      const pnlB = (b.exitPrice - b.entryPrice) * (b.side === 'Buy' || b.side === 'Long' ? 1 : -1) * b.quantity;
      const val = (() => {
        switch (sort.key) {
          case 'date': return new Date(a.date).getTime() - new Date(b.date).getTime();
          case 'instrument': return a.instrument.localeCompare(b.instrument);
          case 'side': return String(a.side).localeCompare(String(b.side));
          case 'entryPrice': return a.entryPrice - b.entryPrice;
          case 'exitPrice': return a.exitPrice - b.exitPrice;
          case 'quantity': return a.quantity - b.quantity;
          case 'pnl': return pnlA - pnlB;
        }
      })() as number;
      return val * dir;
    };
    arr.sort(cmp);
    return arr;
  }, [filteredTrades, sort]);

  const exportCSV = () => {
    const csv = toCSV(filteredTrades);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Trade</h1>
          <p className="text-slate-600 mt-1">Buy or sell stocks. Transactions are stored locally.</p>
        </div>
      </div>

      {/* Top controls (like Journal) */}
      <section className="surface-card p-4 space-y-3 hover:bg-slate-50 hover:shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row gap-3">
          <label className="text-sm flex-1">
            <span className="block mb-1 text-slate-600">Search symbols, strategies, notes</span>
            <input
              value={filters.search}
              onChange={e => setFilters(s => ({ ...s, search: e.target.value }))}
              placeholder="e.g., RELIANCE breakout ..."
              className="input"
            />
          </label>
          <label className="text-sm md:w-64">
            <span className="block mb-1 text-slate-600">Date from</span>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters(s => ({ ...s, dateFrom: e.target.value }))} className="input" />
          </label>
          <label className="text-sm md:w-64">
            <span className="block mb-1 text-slate-600">Date to</span>
            <input type="date" value={filters.dateTo} onChange={e => setFilters(s => ({ ...s, dateTo: e.target.value }))} className="input" />
          </label>
          <div className="self-start -mt-1 md:-mt-2 flex items-center gap-2">
            <button
              onClick={() => {
                setDraftDate(new Date().toISOString().slice(0,10));
                setShowFormModal(true);
              }}
              className="btn-secondary"
            >
              + Add Trading Day
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select
            label="All Results"
            value={filters.status}
            onChange={v => setFilters(s => ({ ...s, status: v as any }))}
            options={[
              { label: 'All Results', value: 'all' },
              { label: 'Wins', value: 'win' },
              { label: 'Losses', value: 'loss' },
            ]}
          />
          <Select
            label="All Symbols"
            value={filters.instrument}
            onChange={v => setFilters(s => ({ ...s, instrument: v }))}
            options={[{ label: 'All Symbols', value: '' }, ...symbolsList.map(s => ({ label: s, value: s }))]}
          />
          <Select
            label="All Strategies"
            value={filters.strategy}
            onChange={v => setFilters(s => ({ ...s, strategy: v }))}
            options={[{ label: 'All Strategies', value: '' }, ...strategiesList.map(s => ({ label: s, value: s }))]}
          />
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Year</span>
            <input
              type="number"
              value={filters.year}
              onChange={e => setFilters(s => ({ ...s, year: e.target.value }))}
              className="input"
            />
          </label>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="inline-flex bg-slate-100 rounded-lg p-1">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors subtle-hover ${activeTab === 'BUY' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'}`}
            onClick={() => setActiveTab('BUY')}
          >
            <span className="inline-flex items-center gap-2"><ShoppingCart className="h-4 w-4"/> Buy</span>
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors subtle-hover ${activeTab === 'SELL' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'}`}
            onClick={() => setActiveTab('SELL')}
          >
            <span className="inline-flex items-center gap-2"><TrendingUp className="h-4 w-4"/> Sell</span>
          </button>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
          <ArrowRightLeft className="h-4 w-4"/>
          <span>Last price • {activeTab === 'BUY' ? buySymbol : sellSymbol}: ₹{(demoPrices[activeTab === 'BUY' ? buySymbol : sellSymbol]?.price ?? 0).toFixed(2)}</span>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm card-appear subtle-hover">
        {activeTab === 'BUY' ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"><ShoppingCart className="h-5 w-5"/> Purchase</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
              <div className="lg:col-span-2">
                <label className="text-sm text-slate-600">Stock Symbol</label>
                <input value={buySymbol} onChange={(e) => setBuySymbol(e.target.value.toUpperCase())} list="symbols" placeholder="e.g., RELIANCE" className="mt-1 input-muted" />
                <datalist id="symbols">
                  {symbols.map(s => (<option key={s} value={s} />))}
                </datalist>
              </div>
              <div className="lg:col-span-2">
                <label className="text-sm text-slate-600">Company Name</label>
                <div className={`mt-1 ${buyShimmer ? 'shimmer' : 'input-muted'}`}>{buyName || '-'}</div>
              </div>
              <div>
                <label className="text-sm text-slate-600">Quantity</label>
                <input type="number" min={0} value={buyQty} onChange={(e) => setBuyQty(Number(e.target.value))} className="mt-1 input" />
                <div className="mt-2 flex gap-2">
                  {[1,5,10,25].map(q => (
                    <button key={q} onClick={() => setBuyQty(q)} className="chip subtle-hover">x{q}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600">Price per Share</label>
                <div className="mt-1 relative">
                  <span className="money-prefix"><IndianRupee className="h-4 w-4"/></span>
                  <input type="number" min={0} step={0.01} value={buyPrice} onChange={(e) => setBuyPrice(Number(e.target.value))} className="w-full pl-9 pr-3 py-2 input" />
                </div>
                <div className="text-xs text-slate-500 mt-1">Real-time: ₹{(demoPrices[buySymbol]?.price ?? 0).toFixed(2)}</div>
              </div>
              <div>
                <label className="text-sm text-slate-600">Order Type</label>
                <select value={buyOrderType} onChange={(e) => setBuyOrderType(e.target.value as OrderType)} className="mt-1 input">
                  {(['Market','Limit','Stop'] as OrderType[]).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Total Cost</label>
                <div className={`mt-1 ${buyShimmer ? 'shimmer' : 'input-muted'} flex items-center gap-1`}><IndianRupee className="h-4 w-4"/> {isFinite(totalBuy) ? `₹${totalBuy.toFixed(2)}` : '-'}</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={addToPortfolio}
                  onChange={(e) => setAddToPortfolio(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-slate-700">Add to Portfolio</span>
              </label>
              <button disabled={!buySymbol || buyQty <= 0 || buyPrice <= 0} onClick={doBuy} className={`btn bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 subtle-hover ${(!buySymbol || buyQty <= 0 || buyPrice <= 0) ? '' : 'pulse-soft'}`}>
                <CheckCircle2 className="h-4 w-4"/> Buy
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Sell</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
              <div className="lg:col-span-2">
                <label className="text-sm text-slate-600">Stock Symbol</label>
                <select value={sellSymbol} onChange={(e) => setSellSymbol(e.target.value)} className="mt-1 input">
                  {ownedSymbols.length ? ownedSymbols.map(s => <option key={s} value={s}>{s}</option>) : symbols.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="text-sm text-slate-600">Company Name</label>
                <div className={`mt-1 ${sellShimmer ? 'shimmer' : 'input-muted'}`}>{sellName || '-'}</div>
              </div>
              <div>
                <label className="text-sm text-slate-600">Quantity to Sell</label>
                <input type="number" min={0} max={ownedQty} value={sellQty} onChange={(e) => setSellQty(Number(e.target.value))} className="mt-1 input" />
                <div className="mt-2 flex gap-2">
                  {[1,5,10].map(q => (
                    <button key={q} onClick={() => setSellQty(Math.min(ownedQty, q))} className="chip subtle-hover">x{q}</button>
                  ))}
                  <button onClick={() => setSellQty(ownedQty)} className="chip subtle-hover">Max</button>
                </div>
                <div className="text-xs text-slate-500 mt-1">Owned: {ownedQty}</div>
              </div>
              <div>
                <label className="text-sm text-slate-600">Current Price</label>
                <div className="mt-1 relative">
                  <span className="money-prefix"><IndianRupee className="h-4 w-4"/></span>
                  <input type="number" min={0} step={0.01} value={sellPrice} onChange={(e) => setSellPrice(Number(e.target.value))} className="w-full pl-9 pr-3 py-2 input" />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600">Order Type</label>
                <select value={sellOrderType} onChange={(e) => setSellOrderType(e.target.value as OrderType)} className="mt-1 input">
                  {(['Market','Limit','Stop'] as OrderType[]).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Sale Amount</label>
                <div className={`mt-1 ${sellShimmer ? 'shimmer' : 'input-muted'} flex items-center gap-1`}><IndianRupee className="h-4 w-4"/> {isFinite(totalSell) ? `₹${totalSell.toFixed(2)}` : '-'}</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <button onClick={() => setSellQty(ownedQty)} className="btn bg-slate-100 text-slate-700 subtle-hover">Sell All</button>
              <button disabled={sellQty <= 0 || sellQty > ownedQty} onClick={doSell} className={`btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 subtle-hover ${(sellQty <= 0 || sellQty > ownedQty) ? '' : 'pulse-soft'}`}>
                <CheckCircle2 className="h-4 w-4"/> Sell
              </button>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 p-6 shadow-xl modal-appear">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Confirm {showConfirm.action === 'BUY' ? 'Purchase' : 'Sale'}</h3>
            <p className="text-slate-700 dark:text-slate-300 text-sm">{showConfirm.payload.qty} x {showConfirm.payload.symbol} at ₹{Number(showConfirm.payload.price).toFixed(2)} • {showConfirm.payload.orderType}</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowConfirm(null)} className="btn bg-slate-100 text-slate-700 subtle-hover">Cancel</button>
              <button onClick={confirm} className="btn bg-blue-600 text-white hover:bg-blue-700 subtle-hover">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-lg flex items-center gap-2 toast-slide">
            <CheckCircle2 className="h-5 w-5"/> {success}
          </div>
        </div>
      )}

      {/* Journal-style Trade Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen p-4 md:p-8 overscroll-none">
          <div className="absolute inset-0 h-full w-full bg-slate-950/60 backdrop-blur-2xl" onClick={() => setShowFormModal(false)} />
          <div className="relative w-full max-w-full md:max-w-3xl mx-0 my-6 md:my-10">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-h-[92vh] overflow-auto no-scrollbar">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add Trading Day</h3>
                <button onClick={() => setShowFormModal(false)} className="px-2 py-1 rounded-lg hover:bg-slate-100">✕</button>
              </div>
              <div className="p-4">
                <TradingDayForm
                  initialDate={draftDate}
                  onSaved={() => {
                    setShowFormModal(false);
                    setSuccess('Trading day added');
                    setTimeout(() => setSuccess(''), 2000);
                  }}
                  onCancel={() => setShowFormModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* All Trades from Journal */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm card-appear subtle-hover">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">All Trades</h2>
          <button onClick={() => setTick(v => v + 1)} className="btn bg-slate-100 text-slate-700 subtle-hover">Refresh</button>
        </div>
        <div className="flex justify-end mb-3">
          <button onClick={exportCSV} className="btn bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/40 subtle-hover">Export CSV</button>
        </div>
        <div className="overflow-auto no-scrollbar max-h-[70vh] overscroll-contain">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-800/60 backdrop-blur-sm">
              <tr className="text-left border-b border-slate-200">
                {(['Date','Instrument','Side','Entry','Exit','Qty','P&L','Strategy','Tags','Notes'] as const).map((label, idx) => {
                  const keyMap: Record<number, SortKey | undefined> = {0:'date',1:'instrument',2:'side',3:'entryPrice',4:'exitPrice',5:'quantity',6:'pnl'};
                  const key = keyMap[idx];
                  return (
                    <th key={label} className="py-2 pr-4">
                      {key ? (
                        <button
                          className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                          onClick={() => setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))}
                        >
                          <span>{label}</span>
                          <span className={`text-xs ${sort.key === key ? 'opacity-100' : 'opacity-30'}`}>
                            {sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : '▲'}
                          </span>
                        </button>
                      ) : (
                        <span>{label}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map(t => {
                const dir = t.side === 'Buy' || t.side === 'Long' ? 1 : -1;
                const pnl = (t.exitPrice - t.entryPrice) * dir * t.quantity;
                return (
                  <tr key={t.id} className="border-b border-slate-100 odd:bg-white even:bg-slate-50 hover:bg-slate-100/80 transition-colors">
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(t.date).toLocaleString()}</td>
                    <td className="py-2 pr-4">{t.instrument}</td>
                    <td className="py-2 pr-4">{t.side}</td>
                    <td className="py-2 pr-4">{t.entryPrice}</td>
                    <td className="py-2 pr-4">{t.exitPrice}</td>
                    <td className="py-2 pr-4">{t.quantity}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pnl>=0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {pnl.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{t.strategy || '—'}</td>
                    <td className="py-2 pr-4">
                      <span className="flex flex-wrap gap-1">
                        {(t.tags||[]).map((tag, i) => (
                          <span key={`${tag}-${i}`} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">{tag}</span>
                        ))}
                        {(!t.tags || !t.tags.length) && <span className="text-slate-400">—</span>}
                      </span>
                    </td>
                    <td className="py-2 pr-4 max-w-[300px] truncate" title={t.notes || ''}>{t.notes || '—'}</td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6">
                    <div className="mx-auto max-w-lg text-center bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="text-slate-700">No trades yet.</div>
                      <div className="text-slate-500 text-sm mt-1">Add trades in the Journal page, then refresh.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ---------------- Trading Day Form (Popup) ----------------
type TradingDayRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  tradesCount: number;
  symbols: string[];
  result: 'profit' | 'loss' | 'breakeven' | 'open';
  netMtm: number; // before brokerage
  brokerage: number;
  strategies: string[];
  notes?: string;
  // single trade snapshot (optional)

  
  instrument?: string;
  side?: 'Buy'|'Sell'|'Long'|'Short';
  entryPrice?: number;
  exitPrice?: number;
  quantity?: number;
  strategy?: string;
  tags?: string[];
};

const strategiesPreset = [
  'Breakout','Reversal','Scalping','Trend Following','Swing Trading','Momentum',
  'Mean Reversion','Gap Trading','News Based','Technical Analysis','Fundamental Analysis','Other'
];

const TradingDayForm: React.FC<{ initialDate?: string; onSaved: () => void; onCancel?: () => void }>
  = ({ initialDate, onSaved, onCancel }) => {
  const [date, setDate] = useState<string>(initialDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [tradesCount, setTradesCount] = useState<number>(0);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symInput, setSymInput] = useState('');
  const [result, setResult] = useState<'profit'|'loss'|'breakeven'|'open'>('profit');
  const [netMtm, setNetMtm] = useState<number>(0);
  const [brokerage, setBrokerage] = useState<number>(0.1);
  const [strategies, setStrategies] = useState<string[]>([]);
  const [customStrategy, setCustomStrategy] = useState('');
  const [notes, setNotes] = useState('');
  // Single-trade row fields
  const [instrument, setInstrument] = useState('');
  const [side, setSide] = useState<'Buy'|'Sell'|'Long'|'Short'>('Buy');
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [exitPrice, setExitPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [strategy, setStrategy] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  const pnl = useMemo(() => {
    const dir = side === 'Buy' || side === 'Long' ? 1 : -1;
    const v = (exitPrice - entryPrice) * dir * (quantity || 0);
    return isFinite(v) ? v : 0;
  }, [entryPrice, exitPrice, quantity, side]);

  const addSymbol = () => {
    const v = symInput.trim().toUpperCase();
    if (!v) return;
    if (!symbols.includes(v)) setSymbols(prev => [...prev, v]);
    setSymInput('');
  };
  const onSymKey: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSymbol();
    }
  };
  const toggleStrategy = (s: string) => {
    setStrategies(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };
  const addCustomStrategy = () => {
    const v = customStrategy.trim();
    if (!v) return;
    if (!strategies.includes(v)) setStrategies(p => [...p, v]);
    setCustomStrategy('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    const rec: TradingDayRecord = {
      id: Math.random().toString(36).slice(2,9),
      date,
      tradesCount: Number(tradesCount) || 0,
      symbols,
      result,
      netMtm: Number(netMtm) || 0,
      brokerage: Number(brokerage) || 0,
      strategies,
      notes: notes.trim() || undefined,
      instrument: instrument || undefined,
      side,
      entryPrice: Number(entryPrice) || 0,
      exitPrice: Number(exitPrice) || 0,
      quantity: Number(quantity) || 0,
      strategy: strategy || undefined,
      tags: tagsStr.split(',').map(s=>s.trim()).filter(Boolean),
    };
    try {
      const key = 'day_logs_v1';
      const arr: TradingDayRecord[] = JSON.parse(localStorage.getItem(key) || '[]');
      arr.unshift(rec);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch {}
    // Fire-and-forget sync to Google Sheets (Apps Script)
    void syncTradingDayToSheet(rec);
    onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Date */}
      <label className="block text-sm">
        <span className="block mb-1 text-slate-700">Trading Date *</span>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input" />
      </label>

      {/* Number of trades */}
      <label className="block text-sm">
        <span className="block mb-1 text-slate-700">Number of Trades</span>
        <input type="number" value={tradesCount} onChange={e=>setTradesCount(Number(e.target.value))} className="input" />
      </label>

      {/* Symbols tag input */}
      <div className="space-y-2">
        <div className="text-sm text-slate-700">Symbols Traded *</div>
        <div className="flex flex-wrap gap-2">
          {symbols.map(s => (
            <span key={s} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
              {s}
              <button type="button" onClick={()=>setSymbols(prev=>prev.filter(x=>x!==s))} className="ml-1 text-slate-500 hover:text-red-600">×</button>
            </span>
          ))}
        </div>
        <input
          value={symInput}
          onChange={e=>setSymInput(e.target.value)}
          onKeyDown={onSymKey}
          placeholder="Type symbol name (e.g., TCS, GOLD)..."
          className="input"
        />
        <div className="text-xs text-slate-500">Press Enter or comma to add.</div>
      </div>

      {/* Single trade snapshot (optional) */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-slate-800">Trade Snapshot (optional)</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 items-end">
          <label className="text-xs sm:col-span-2 md:col-span-2">
            <span className="block mb-1 text-slate-600">Instrument</span>
            <input value={instrument} onChange={e=>setInstrument(e.target.value)} className="input" placeholder="e.g., RELIANCE" />
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Side</span>
            <select value={side} onChange={e=>setSide(e.target.value as any)} className="input">
              {['Buy','Sell','Long','Short'].map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Entry</span>
            <input type="number" step={0.01} value={entryPrice} onChange={e=>setEntryPrice(Number(e.target.value))} className="input" />
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Exit</span>
            <input type="number" step={0.01} value={exitPrice} onChange={e=>setExitPrice(Number(e.target.value))} className="input" />
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Qty</span>
            <input type="number" value={quantity} onChange={e=>setQuantity(Number(e.target.value))} className="input" />
          </label>
          <div className="text-xs sm:col-span-2 md:col-span-1">
            <div className="mb-1 text-slate-600">P&L</div>
            <div className={`px-3 py-2 rounded-xl border text-center ${pnl>=0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{pnl.toFixed(2)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <label className="text-xs sm:col-span-2 md:col-span-2">
            <span className="block mb-1 text-slate-600">Strategy</span>
            <input value={strategy} onChange={e=>setStrategy(e.target.value)} className="input" placeholder="e.g., Breakout" />
          </label>
          <label className="text-xs sm:col-span-2 md:col-span-2">
            <span className="block mb-1 text-slate-600">Tags</span>
            <input value={tagsStr} onChange={e=>setTagsStr(e.target.value)} className="input" placeholder="comma separated" />
          </label>
        </div>
      </div>

      {/* Trading Result segmented */}
      <div className="space-y-2">
        <div className="text-sm text-slate-700">Trading Result</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3">
          {[
            {k:'profit', label:'Profit', cls:'border-emerald-600 text-emerald-700', bg:'bg-emerald-600 text-white'},
            {k:'loss', label:'Loss', cls:'border-red-600 text-red-700', bg:'bg-red-600 text-white'},
            {k:'open', label:'Open Trade', cls:'border-blue-600 text-blue-700', bg:'bg-blue-600 text-white'},
            {k:'breakeven', label:'Breakeven', cls:'border-yellow-600 text-yellow-700', bg:'bg-yellow-600 text-white'},
          ].map((b:any) => (
            <button
              key={b.k}
              type="button"
              onClick={()=>setResult(b.k)}
              className={`px-4 py-2 rounded-xl border ${result===b.k ? b.bg : `bg-white ${b.cls}`}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Net MTM and Brokerage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="block mb-1 text-slate-700">Net MTM Amount *</span>
          <div className="relative">
            <span className="money-prefix">₹</span>
            <input type="number" step={0.01} value={netMtm} onChange={e=>setNetMtm(Number(e.target.value))} className="w-full pl-9 pr-3 py-2 input" />
          </div>
          <div className="text-xs text-slate-500 mt-1">Enter the gross profit amount (before brokerage deduction)</div>
        </label>
        <label className="block text-sm">
          <span className="block mb-1 text-slate-700">Brokerage Charges *</span>
          <div className="relative">
            <span className="money-prefix">₹</span>
            <input type="number" step={0.01} value={brokerage} onChange={e=>setBrokerage(Number(e.target.value))} className="w-full pl-9 pr-3 py-2 input" />
          </div>
          <div className="text-xs text-slate-500 mt-1">Enter total charges including brokerage, taxes, and other fees</div>
        </label>
      </div>

      {/* Strategies */}
      <div className="space-y-2">
        <div className="text-sm text-slate-700">Strategies Used</div>
        <div className="flex flex-wrap gap-2">
          {strategiesPreset.map(s => (
            <button
              key={s}
              type="button"
              onClick={()=>toggleStrategy(s)}
              className={`px-3 py-1.5 rounded-full text-sm border ${strategies.includes(s) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            >{s}</button>
          ))}
          <div className="inline-flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <input value={customStrategy} onChange={e=>setCustomStrategy(e.target.value)} placeholder="Add custom strategy..." className="px-3 py-1.5 rounded-full border border-slate-300 text-sm flex-1" />
            <button type="button" onClick={addCustomStrategy} className="btn-secondary text-sm">Add</button>
          </div>
        </div>
      </div>

      {/* Notes */}
      <label className="block text-sm">
        <span className="block mb-1 text-slate-700">Notes (Optional)</span>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus-ring" placeholder="Market conditions, key observations, lessons learned..." />
      </label>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn bg-slate-100 text-slate-700 subtle-hover">Cancel</button>
        )}
        <button type="submit" className="btn bg-emerald-600 text-white hover:bg-emerald-700">Add Trading Day</button>
      </div>
    </form>
  );
};

export default Trade;
