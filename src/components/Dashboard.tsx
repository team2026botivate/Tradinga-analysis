import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { fetchTopProfitFromSheet, type TopProfit, fetchTradingDayStats, fetchPortfolioStats, type PortfolioStats, fetchUserProfileFromSheet } from '../lib/sheets';

const Dashboard: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  useEffect(() => {
    const name = sessionStorage.getItem('auth_name') || '';
    const email = sessionStorage.getItem('auth_email') || '';
    if (name) {
      setUserName(name);
      return;
    }
    if (email) {
      // Fetch from Google Script LoginMaster (Column C)
      fetchUserProfileFromSheet(email)
        .then((res) => {
          if (res?.success && res.name) {
            setUserName(res.name);
            sessionStorage.setItem('auth_name', res.name);
          }
        })
        .catch((e) => {
          console.warn('[Dashboard] fetchUserProfile failed', e);
        });
    }
  }, []);
  const marketIndices = [
    { name: 'NIFTY 50', value: '24,015.30', change: '+85.10', percentage: '+0.36%', trend: 'up' },
    { name: 'SENSEX', value: '79,845.12', change: '+142.55', percentage: '+0.18%', trend: 'up' },
    { name: 'NIFTY BANK', value: '52,430.75', change: '-120.30', percentage: '-0.23%', trend: 'down' },
    { name: 'NIFTY MIDCAP 100', value: '54,210.90', change: '+210.42', percentage: '+0.39%', trend: 'up' },
  ];

  // Fallback data used only if live fetch fails
  const fallbackProfits: TopProfit[] = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', profit: 294530, profitPercent: 12.4, tradesCount: 8 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', profit: 376480, profitPercent: 9.2, tradesCount: 5 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', profit: -163550, profitPercent: -5.8, tradesCount: 3 },
    { symbol: 'INFY', name: 'Infosys', profit: 159840, profitPercent: 10.5, tradesCount: 6 },
  ];

  const [profits, setProfits] = useState<TopProfit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [portfolio, setPortfolio] = useState<PortfolioStats | null>(null);
  const [portfolioError, setPortfolioError] = useState<string>('');
  const [portfolioLoading, setPortfolioLoading] = useState<boolean>(false);

  const [tradingStats, setTradingStats] = useState<{
    best: { date: string; pnl: number };
    worst: { date: string; pnl: number };
    monthlyPnl: number;
  }>({
    best: { date: '', pnl: 0 },
    worst: { date: '', pnl: 0 },
    monthlyPnl: 0
  });

  const formatPrice = (p: number | string) => {
    const n = typeof p === 'number' ? p : Number(p);
    if (!Number.isFinite(n)) return String(p);
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
    } catch {
      return `₹${n.toFixed(2)}`;
    }
  };

  const loadPortfolio = async () => {
    try {
      setPortfolioLoading(true);
      setPortfolioError('');
      const stats = await fetchPortfolioStats({ timeoutMs: 20000 });
      setPortfolio(stats);
    } catch (e) {
      console.error('Failed to load portfolio stats:', e);
      setPortfolioError('Failed to load portfolio stats.');
    } finally {
      setPortfolioLoading(false);
    }
  };

  const loadProfits = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchTopProfitFromSheet({ timeoutMs: 20000 });
      setProfits(Array.isArray(data) ? data.slice(0, 10) : []);
      setLastUpdated(new Date().toLocaleString());
    } catch (e: any) {
      console.warn('[Dashboard] Failed to fetch Top Profits, using fallback', e);
      setError('Failed to load Top Profits. Showing sample data.');
      setProfits(fallbackProfits);
      setLastUpdated('');
    } finally {
      setLoading(false);
    }
  };

  const loadTradingStats = async () => {
    try {
      console.log('Fetching trading stats...');
      const stats = await fetchTradingDayStats({ timeoutMs: 20000 });
      console.log('Received stats:', stats);
      setTradingStats(stats);
    } catch (e) {
      console.error('Failed to load trading stats:', e);
      setTradingStats({
        best: { date: 'Error', pnl: 0 },
        worst: { date: 'Error', pnl: 0 },
        monthlyPnl: 0,
      });
    }
  };

  useEffect(() => {
    loadProfits();
    loadTradingStats();
    loadPortfolio();
  }, []);

  const portfolioCards = [
    { 
      title: 'Total Portfolio Value', 
      value: portfolio ? formatPrice(portfolio.totalPortfolioValue ?? 0) : (portfolioLoading ? 'Loading...' : '₹0'), 
      change: '+0', 
      percentage: portfolio?.lastUpdated ? `as of ${new Date(portfolio.lastUpdated).toLocaleString()}` : 'Live', 
      icon: DollarSign 
    },
    { 
      title: 'Total Positions', 
      value: portfolio ? String(portfolio.totalPositions ?? 0) : (portfolioLoading ? 'Loading...' : '0'), 
      change: '+0', 
      percentage: portfolio ? `${portfolio.uniqueStocksCount ?? 0} unique stocks` : 'Open', 
      icon: Activity 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading">Dashboard</h1>
          <p className="subheading mt-1">{`Welcome back${userName ? `, ${userName}` : ''}. Here's your market overview.`}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Market Status</p>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-2 h-2 bg-success-600 rounded-full animate-pulse"></div>
            <span className="text-success-700 font-semibold">Markets Open</span>
          </div>
        </div>
      </div>

     
      {/* Portfolio Stats */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Portfolio Stats</h2>
        <div className="flex items-center gap-3">
          {portfolio?.lastUpdated && (
            <span className="text-xs text-slate-500">Last updated: {new Date(portfolio.lastUpdated).toLocaleString()}</span>
          )}
          <button
            onClick={loadPortfolio}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 focus-ring"
            aria-label="Refresh Portfolio Stats"
            disabled={portfolioLoading}
          >
            <RefreshCw className={`h-4 w-4 ${portfolioLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {portfolioError && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          <AlertCircle className="w-4 h-4" />
          {portfolioError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portfolioCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = typeof stat.change === 'string' && stat.change.trim().startsWith('+');
  
          return (
            <div key={index} className="surface-card p-6 hover:shadow-md transition-all duration-200 subtle-hover w-full">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{portfolioLoading ? 'Loading…' : stat.value}</p>
                  <div className="flex items-center justify-end gap-2">
                    {isPositive ? (
                      <ArrowUpRight className="h-4 w-4 text-success-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-danger-600" />
                    )}
                    {!portfolioLoading && (
                      <p className={`text-sm ${isPositive ? 'text-success-700' : 'text-danger-700'}`}>
                        {stat.change}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-semibold text-slate-800">{stat.title}</h3>
                <p className="text-sm text-slate-600">{portfolioLoading ? 'Fetching latest…' : stat.percentage}</p>
                
                {/* Additional content */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Daily Trend</span>
                    <span className={`text-xs font-medium ${isPositive ? 'text-success-700' : 'text-danger-700'}`}>
                      {portfolioLoading ? '—' : (isPositive ? 'Increasing' : 'Decreasing')}
                    </span>
                  </div>
                  {stat.title.includes('Portfolio') && portfolio && !portfolioLoading && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">Realized P&L</span>
                      <span className={`text-xs font-medium ${portfolio.totalRealizedPnl >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                        {formatPrice(portfolio.totalRealizedPnl)}
                      </span>
                    </div>
                  )}
                  {stat.title.includes('Portfolio') && portfolio && !portfolioLoading && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">Unrealized P&L</span>
                      <span className={`text-xs font-medium ${(portfolio.netUnrealizedPnl ?? 0) >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                        {formatPrice(portfolio.netUnrealizedPnl ?? 0)}
                      </span>
                    </div>
                  )}
                  {stat.title.includes('Positions') && portfolio && !portfolioLoading && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">Gross Open Exposure</span>
                      <span className="text-xs font-medium text-slate-800">{formatPrice(portfolio.grossOpenExposure)}</span>
                    </div>
                  )}
                  {stat.title.includes('Positions') && portfolio && !portfolioLoading && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">Open Positions MV</span>
                      <span className="text-xs font-medium text-slate-800">{formatPrice(portfolio.openPositionsMarketValue ?? 0)}</span>
                    </div>
                  )}
                  {stat.title.includes('Positions') && portfolio && !portfolioLoading && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">Unrealized P&L</span>
                      <span className={`text-xs font-medium ${(portfolio.netUnrealizedPnl ?? 0) >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                        {formatPrice(portfolio.netUnrealizedPnl ?? 0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* P&L Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly P&L */}
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Monthly P&L</h2>
          <p className={`text-2xl font-bold ${tradingStats.monthlyPnl >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
            {formatPrice(tradingStats.monthlyPnl)}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {new Date().toLocaleString('default', { month: 'long' })}
          </p>
        </div>

        {/* Best Trading Day */}
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Best Trading Day</h2>
          <p className="text-2xl font-bold text-success-700">
            {formatPrice(tradingStats.best.pnl)}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {tradingStats.best.date || 'No data'}
          </p>
        </div>

        {/* Worst Trading Day */}
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Worst Trading Day</h2>
          <p className="text-2xl font-bold text-danger-700">
            {formatPrice(tradingStats.worst.pnl)}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {tradingStats.worst.date || 'No data'}
          </p>
        </div>
      </div>

      {/* Temporary debug view - can remove later */}
      
      {/* Top Profit Companies */}
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Top Profit Companies</h2>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-500">Last updated: {lastUpdated}</span>
            )}
            <button
              onClick={loadProfits}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 focus-ring"
              aria-label="Refresh Top Profits"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="max-h-80 overflow-y-auto no-scrollbar space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 border border-slate-200 rounded-xl shimmer">Loading</div>
            ))
          ) : (
            (profits.length > 0 ? profits : fallbackProfits).map((company, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{company.symbol?.charAt(0) || '?'}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{company.symbol}</p>
                    <p className="text-sm text-slate-600">{company.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${Number(company.profit) >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                    {formatPrice(Number(company.profit))}
                  </p>
                  <p className="text-sm text-slate-600">
                    {(company.tradesCount ?? -1) >= 0 ? company.tradesCount : 'N/A'} trades • {company.profitPercent?.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;