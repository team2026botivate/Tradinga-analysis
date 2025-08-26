import React, { useState } from 'react';
import {
  Star,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Bell,
  Eye
} from 'lucide-react';

const Watchlist: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const watchlistItems = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: '$175.43',
      change: '+2.34',
      percentage: '+1.35%',
      volume: '52.3M',
      trend: 'up',
      starred: true
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      price: '$242.65',
      change: '+9.87',
      percentage: '+4.24%',
      volume: '89.1M',
      trend: 'up',
      starred: true
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: '$142.81',
      change: '-1.76',
      percentage: '-1.22%',
      volume: '34.7M',
      trend: 'down',
      starred: false
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: '$138.21',
      change: '+2.54',
      percentage: '+1.87%',
      volume: '28.9M',
      trend: 'up',
      starred: true
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      price: '$378.85',
      change: '+5.42',
      percentage: '+1.45%',
      volume: '41.2M',
      trend: 'up',
      starred: false
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      price: '$721.33',
      change: '+18.76',
      percentage: '+2.67%',
      volume: '67.4M',
      trend: 'up',
      starred: true
    }
  ];

  const filteredItems = watchlistItems.filter(item =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Watchlist</h1>
          <p className="text-slate-600 mt-1">Track your favorite stocks and assets</p>
        </div>
        <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200">
          <Plus className="h-5 w-5" />
          <span>Add Symbol</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search symbols or company names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-4 py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
              <Star className="h-4 w-4" />
              <span>Starred</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
              <TrendingUp className="h-4 w-4" />
              <span>Gainers</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
              <TrendingDown className="h-4 w-4" />
              <span>Losers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Watchlist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredItems.map((item, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">{item.symbol.charAt(0)}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-slate-900">{item.symbol}</h3>
                    <button className={`p-1 rounded-full ${item.starred ? 'text-yellow-500' : 'text-slate-400'}`}>
                      <Star className="h-4 w-4" fill={item.starred ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600">{item.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                  <Bell className="h-4 w-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">{item.price}</span>
                <div className="flex items-center space-x-2">
                  {item.trend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <div className="text-right">
                    <p className={`font-semibold ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.change}
                    </p>
                    <p className={`text-sm ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.percentage}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Volume: {item.volume}</span>
                <span className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${item.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{item.trend === 'up' ? 'Bullish' : 'Bearish'}</span>
                </span>
              </div>

              {/* Mini Chart Placeholder */}
              <div className="h-16 bg-slate-50 rounded-lg flex items-center justify-center">
                <div className={`text-sm font-medium ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  📈 Chart Preview
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Watchlist Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <p className="text-2xl font-bold text-slate-900">{watchlistItems.length}</p>
            <p className="text-sm text-slate-600">Total Symbols</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-600">{watchlistItems.filter(item => item.trend === 'up').length}</p>
            <p className="text-sm text-green-600">Gainers</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <p className="text-2xl font-bold text-red-600">{watchlistItems.filter(item => item.trend === 'down').length}</p>
            <p className="text-sm text-red-600">Losers</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-xl">
            <p className="text-2xl font-bold text-yellow-600">{watchlistItems.filter(item => item.starred).length}</p>
            <p className="text-sm text-yellow-600">Starred</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watchlist;