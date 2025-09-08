import React, { useMemo, useState } from 'react';
import { Filter, Search, Star, ArrowUpDown, CheckCircle2, XCircle } from 'lucide-react';
import Footer from './Footer';

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Stock Screener</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Filter stocks by fundamentals and performance</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={clearFilters}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            Clear Filters
          </button>
          <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 rounded-lg">
            {results.length} results
          </div>
        </div>
      </div>

      {/* Enhanced Filters Panel - Mobile Optimized */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Filter Header with Mobile Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Stock Filters</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                {[
                  query && 'Search',
                  cap && 'Cap',
                  sector && 'Sector',
                  (minPrice || maxPrice) && 'Price',
                  minChange && 'Change',
                  rating && 'Rating',
                  onlyGainers && 'Gainers'
                ].filter(Boolean).length} active
              </div>
              <button
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Main Search - Full Width on Mobile */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Search Stocks
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Symbol or company name (e.g., RELIANCE, TCS)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Primary Filters Grid - Better Mobile Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Market Cap */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Market Cap
              </label>
              <select
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              >
                <option value="">All Market Caps</option>
                {caps.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Sector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Sector
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              >
                <option value="">All Sectors</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Min Price (₹)
              </label>
              <input
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Max Price (₹)
              </label>
              <input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="No limit"
                className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Advanced Filters - Collapsible on Mobile */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Advanced Filters</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Min Change */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Min Change (%)
                </label>
                <input
                  value={minChange}
                  onChange={(e) => setMinChange(e.target.value)}
                  type="number"
                  step="0.01"
                  placeholder="-10.00"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Analyst Rating
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value as Stock['rating'] | '')}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                >
                  <option value="">All Ratings</option>
                  {ratings.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Only Gainers Checkbox */}
              <div className="flex items-center justify-center sm:justify-start">
                <label className="inline-flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={onlyGainers}
                    onChange={(e) => setOnlyGainers(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                    Only Gainers
                  </span>
                </label>
              </div>
            </div>
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
      <Footer />
    </div>
  );
};

export default Screener;