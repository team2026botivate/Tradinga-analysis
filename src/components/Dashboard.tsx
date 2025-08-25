import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Activity,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const marketIndices = [
    { name: 'NIFTY 50', value: '24,015.30', change: '+85.10', percentage: '+0.36%', trend: 'up' },
    { name: 'SENSEX', value: '79,845.12', change: '+142.55', percentage: '+0.18%', trend: 'up' },
    { name: 'NIFTY BANK', value: '52,430.75', change: '-120.30', percentage: '-0.23%', trend: 'down' },
    { name: 'NIFTY MIDCAP 100', value: '54,210.90', change: '+210.42', percentage: '+0.39%', trend: 'up' },
  ];

  const topMovers = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: '₹2,945.30', change: '+1.24%', trend: 'up' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: '₹3,764.80', change: '+0.92%', trend: 'up' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: '₹1,635.50', change: '-0.58%', trend: 'down' },
    { symbol: 'INFY', name: 'Infosys', price: '₹1,598.40', change: '+1.05%', trend: 'up' },
  ];

  const portfolioStats = [
    { title: 'Total Portfolio Value', value: '₹12,45,678', change: '+₹23,412', percentage: '+1.92%', icon: DollarSign },
    { title: 'Day\'s Gain/Loss', value: '+₹12,345', change: '+0.98%', percentage: 'Today', icon: TrendingUp },
    { title: 'Total Positions', value: '23', change: '+2', percentage: 'Active', icon: Activity },
    { title: 'Watchlist Items', value: '47', change: '+5', percentage: 'Tracking', icon: Eye },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Welcome back, John. Here's your market overview.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600 dark:text-slate-400">Market Status</p>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-semibold">Markets Open</span>
          </div>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {portfolioStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{stat.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{stat.percentage}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Market Indices */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Market Indices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketIndices.map((index, i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{index.name}</h3>
                {index.trend === 'up' ? (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{index.value}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`text-sm font-medium ${index.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {index.change}
                </span>
                <span className={`text-sm ${index.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {index.percentage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Movers */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Top Movers</h2>
          <div className="space-y-3">
            {topMovers.map((stock, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stock.symbol.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{stock.symbol}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-white">{stock.price}</p>
                  <p className={`text-sm font-medium ${stock.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent News */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Market News</h2>
          <div className="space-y-4">
            {[
              {
                title: "Fed Signals Potential Rate Cuts Ahead",
                time: "2 hours ago",
                source: "Financial Times"
              },
              {
                title: "Tech Stocks Rally on AI Optimism",
                time: "4 hours ago",
                source: "Bloomberg"
              },
              {
                title: "Energy Sector Shows Strong Performance",
                time: "6 hours ago",
                source: "Reuters"
              },
              {
                title: "Crypto Markets Surge on Regulatory Clarity",
                time: "8 hours ago",
                source: "CoinDesk"
              }
            ].map((news, index) => (
              <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{news.title}</h3>
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>{news.source}</span>
                  <span>{news.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;