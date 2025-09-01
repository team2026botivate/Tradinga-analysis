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
  
    { title: 'Total Positions', value: '23', change: '+2', percentage: 'Active', icon: Activity },
    
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading">Dashboard</h1>
          <p className="subheading mt-1">Welcome back, John. Here's your market overview.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portfolioStats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change.startsWith('+');
  
          return (
            <div key={index} className="surface-card p-6 hover:shadow-md transition-all duration-200 subtle-hover w-full">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <div className="flex items-center justify-end gap-2">
                    {isPositive ? (
                      <ArrowUpRight className="h-4 w-4 text-success-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-danger-600" />
                    )}
                    <p className={`text-sm ${isPositive ? 'text-success-700' : 'text-danger-700'}`}>
                      {stat.change}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-semibold text-slate-800">{stat.title}</h3>
                <p className="text-sm text-slate-600">{stat.percentage}</p>
                
                {/* Additional content */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Daily Trend</span>
                    <span className={`text-xs font-medium ${isPositive ? 'text-success-700' : 'text-danger-700'}`}>
                      {isPositive ? 'Increasing' : 'Decreasing'}
                    </span>
                  </div>
                  
                  {stat.title.includes('Portfolio') && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">All Time High</span>
                      <span className="text-xs font-medium text-slate-800">₹13,12,456</span>
                    </div>
                  )}
                  
                  {stat.title.includes('Positions') && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">Active Trades</span>
                      <span className="text-xs font-medium text-slate-800">15</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Market Indices */}
      <div className="surface-card p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Market Indices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketIndices.map((index, i) => (
            <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800">{index.name}</h3>
                {index.trend === 'up' ? (
                  <ArrowUpRight className="h-5 w-5 text-success-600" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-danger-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">{index.value}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`text-sm font-medium ${index.trend === 'up' ? 'text-success-700' : 'text-danger-700'}`}>
                  {index.change}
                </span>
                <span className={`text-sm ${index.trend === 'up' ? 'text-success-700' : 'text-danger-700'}`}>
                  {index.percentage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="surface-card p-6 flex flex-col justify-between">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Monthly P&L</h2>
          <p className="text-3xl font-bold text-primary-700">₹45,200</p>
          <p className="text-sm text-success-700 mt-1">+₹8,500 (18.8%)</p>
          <p className="text-xs text-slate-500 mt-2">June 2024</p>
        </div>
        <div className="surface-card p-6 flex flex-col justify-between">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Today's P&L</h2>
          <p className="text-3xl font-bold text-primary-700">₹2,300</p>
          <p className="text-sm text-success-700 mt-1">+₹300 (15%)</p>
          <p className="text-xs text-slate-500 mt-2">July 3, 2024</p>
        </div>
      </div>
      {/* Best/Worst Trading Date Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="surface-card p-6 flex flex-col justify-between">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Best Trading Day</h2>
          <p className="text-2xl font-bold text-green-700">₹3,200</p>
          <p className="text-sm text-slate-600 mt-1">July 12, 2024</p>
          <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs mt-2">Profit</span>
        </div>
        <div className="surface-card p-6 flex flex-col justify-between">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Worst Trading Day</h2>
          <p className="text-2xl font-bold text-red-700">-₹2,100</p>
          <p className="text-sm text-slate-600 mt-1">July 7, 2024</p>
          <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs mt-2">Loss</span>
        </div>
      </div>
      {/* Statistics Section */}
       
        {/* Top Movers */}
        <div className="surface-card p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Top Movers</h2>
          <div className="space-y-3">
            {topMovers.map((stock, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stock.symbol.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{stock.symbol}</p>
                    <p className="text-sm text-slate-600">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{stock.price}</p>
                  <p className={`text-sm font-medium ${stock.trend === 'up' ? 'text-success-700' : 'text-danger-700'}`}>
                    {stock.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent News */}
        <div className="surface-card p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Market News</h2>
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
              <div key={index} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-colors cursor-pointer">
                <h3 className="font-semibold text-slate-800 mb-1">{news.title}</h3>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{news.source}</span>
                  <span>{news.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
     
      {/* Weekday Performance Bar Chart */}
     
      {/* Calendar View with Daily P&L */}
     
    </div>
  );
};

export default Dashboard;