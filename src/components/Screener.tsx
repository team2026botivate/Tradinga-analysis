import React, { useMemo, useState } from 'react';
import { Filter, Search, Star, ArrowUpDown, CheckCircle2, XCircle } from 'lucide-react';

type Stock = {
  symbol: string;
  name: string;
  price: number;
  change: number; // percentage
  marketCap: string; // e.g. "Large", "Mid", "Small"
  sector: string;
  rating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell';
};

const allStocks: Stock[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2945.3, change: 1.24, marketCap: 'Large', sector: 'Energy', rating: 'Buy' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3764.8, change: 0.92, marketCap: 'Large', sector: 'Technology', rating: 'Strong Buy' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1635.5, change: -0.58, marketCap: 'Large', sector: 'Financials', rating: 'Hold' },
  { symbol: 'INFY', name: 'Infosys', price: 1598.4, change: 1.05, marketCap: 'Large', sector: 'Technology', rating: 'Buy' },
  { symbol: 'ITC', name: 'ITC Limited', price: 468.9, change: -0.42, marketCap: 'Large', sector: 'Consumer Discretionary', rating: 'Buy' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 7275.2, change: 2.15, marketCap: 'Large', sector: 'Financials', rating: 'Strong Buy' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', price: 3085.6, change: -1.12, marketCap: 'Large', sector: 'Industrials', rating: 'Hold' },
  { symbol: 'SBIN', name: 'State Bank of India', price: 834.2, change: 0.15, marketCap: 'Large', sector: 'Financials', rating: 'Buy' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', price: 282.4, change: 3.21, marketCap: 'Large', sector: 'Energy', rating: 'Strong Buy' },
];

const sectors = ['Technology', 'Healthcare', 'Financials', 'Energy', 'Consumer Discretionary', 'Industrials'];
const caps = ['Large', 'Mid', 'Small'];
const ratings: Stock['rating'][] = ['Strong Buy', 'Buy', 'Hold', 'Sell'];

const badgeForChange = (pct: number) =>
  pct >= 0
    ? 'text-success-700 bg-success-50'
    : 'text-danger-700 bg-danger-50';

const badgeForRating = (r: Stock['rating']) => {
  switch (r) {
    case 'Strong Buy':
      return 'bg-success-50 text-success-700';
    case 'Buy':
      return 'bg-success-50 text-success-700';
    case 'Hold':
      return 'bg-warning-50 text-warning-700';
    default:
      return 'bg-danger-50 text-danger-700';
  }
};

const Screener: React.FC = () => {
  const [query, setQuery] = useState('');
  const [cap, setCap] = useState<string>('');
  const [sector, setSector] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minChange, setMinChange] = useState<string>('');
  const [rating, setRating] = useState<Stock['rating'] | ''>('');
  const [onlyGainers, setOnlyGainers] = useState(false);
  const [sortKey, setSortKey] = useState<'symbol' | 'price' | 'change'>('symbol');
  const [sortAsc, setSortAsc] = useState(true);

  const results = useMemo(() => {
    const minP = minPrice ? parseFloat(minPrice) : -Infinity;
    const maxP = maxPrice ? parseFloat(maxPrice) : Infinity;
    const minC = minChange ? parseFloat(minChange) : -Infinity;

    return allStocks
      .filter(s => (query ? (s.symbol + ' ' + s.name).toLowerCase().includes(query.toLowerCase()) : true))
      .filter(s => (cap ? s.marketCap === cap : true))
      .filter(s => (sector ? s.sector === sector : true))
      .filter(s => (rating ? s.rating === rating : true))
      .filter(s => s.price >= minP && s.price <= maxP)
      .filter(s => s.change >= minC)
      .filter(s => (onlyGainers ? s.change >= 0 : true))
      .sort((a, b) => {
        const dir = sortAsc ? 1 : -1;
        if (sortKey === 'symbol') return a.symbol.localeCompare(b.symbol) * dir;
        if (sortKey === 'price') return (a.price - b.price) * dir;
        return (a.change - b.change) * dir;
      });
  }, [query, cap, sector, minPrice, maxPrice, minChange, rating, onlyGainers, sortKey, sortAsc]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setCap('');
    setSector('');
    setMinPrice('');
    setMaxPrice('');
    setMinChange('');
    setRating('');
    setOnlyGainers(false);
    setSortKey('symbol');
    setSortAsc(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Stock Screener</h1>
          <p className="text-slate-600 mt-1">Filter stocks by fundamentals and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearFilters} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200">
            Reset
          </button>
          <button className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-700 flex items-center gap-2">
            <Filter className="h-4 w-4" /> Apply Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="col-span-2 md:col-span-2 lg:col-span-2">
            <label className="text-sm text-slate-600">Search</label>
            <div className="mt-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Symbol or company"
                     className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400" />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600">Market Cap</label>
            <div className="mt-1 relative">
              <select
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                className="w-full appearance-none pr-9 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-primary-300 transition-colors"
              >
                <option value="">Any</option>
                {caps.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600">Sector</label>
            <div className="mt-1 relative">
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full appearance-none pr-9 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-primary-300 transition-colors"
              >
                <option value="">Any</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600">Min Price</label>
            <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" min="0" step="0.01"
                   className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400" />
          </div>

          <div>
            <label className="text-sm text-slate-600">Max Price</label>
            <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" min="0" step="0.01"
                   className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400" />
          </div>

          <div>
            <label className="text-sm text-slate-600">Min Daily Change (%)</label>
            <input value={minChange} onChange={(e) => setMinChange(e.target.value)} type="number" step="0.01"
                   className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400" />
          </div>

          <div>
            <label className="text-sm text-slate-600">Rating</label>
            <div className="mt-1 relative">
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value as Stock['rating'] | '')}
                className="w-full appearance-none pr-9 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-primary-300 transition-colors"
              >
                <option value="">Any</option>
                {ratings.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={onlyGainers}
                onChange={(e) => setOnlyGainers(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-slate-700">Only Gainers</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3 text-slate-700">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">{results.length} matches</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => toggleSort('symbol')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${sortKey === 'symbol' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <ArrowUpDown className="h-4 w-4" /> Symbol
            </button>
            <button
              onClick={() => toggleSort('price')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${sortKey === 'price' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <ArrowUpDown className="h-4 w-4" /> Price
            </button>
            <button
              onClick={() => toggleSort('change')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${sortKey === 'change' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <ArrowUpDown className="h-4 w-4" /> Change
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sector</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cap</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {results.map((s) => (
                <tr key={s.symbol} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{s.symbol}</td>
                  <td className="px-6 py-4 text-slate-700">{s.name}</td>
                  <td className="px-6 py-4 text-right text-slate-900">₹{s.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${badgeForChange(s.change)}`}>
                      {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{s.sector}</td>
                  <td className="px-6 py-4 text-slate-700">{s.marketCap}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${badgeForRating(s.rating)}`}>{s.rating}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {s.change >= 0 ? (
                      <button className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-success-600 text-white hover:bg-success-700">
                        <CheckCircle2 className="h-4 w-4" /> Add
                      </button>
                    ) : (
                      <button className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
                        <XCircle className="h-4 w-4" /> Skip
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Screener;