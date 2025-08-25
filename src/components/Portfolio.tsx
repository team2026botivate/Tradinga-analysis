import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Activity,
  Plus,
  MoreVertical
} from 'lucide-react';

const Portfolio: React.FC = () => {
  const [view, setView] = useState('overview');

  const portfolioStats = [
    { title: 'Total Value', value: '$124,567.89', change: '+$2,341.23', percentage: '+1.92%', icon: DollarSign },
    { title: 'Day\'s Change', value: '+$1,234.56', change: '+0.98%', percentage: 'Today', icon: TrendingUp },
    { title: 'Total Return', value: '+$18,432.11', change: '+17.35%', percentage: 'All Time', icon: Activity },
    { title: 'Positions', value: '12', change: '+2', percentage: 'Active', icon: Briefcase },
  ];

  const positions = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 50,
      avgCost: '$165.50',
      currentPrice: '$175.43',
      marketValue: '$8,771.50',
      totalReturn: '+$496.50',
      dayChange: '+$117.00',
      percentage: '+5.98%',
      dayPercentage: '+1.35%',
      trend: 'up'
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      shares: 25,
      avgCost: '$220.00',
      currentPrice: '$242.65',
      marketValue: '$6,066.25',
      totalReturn: '+$566.25',
      dayChange: '+$247.50',
      percentage: '+10.30%',
      dayPercentage: '+4.24%',
      trend: 'up'
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      shares: 30,
      avgCost: '$135.75',
      currentPrice: '$138.21',
      marketValue: '$4,146.30',
      totalReturn: '+$73.80',
      dayChange: '+$76.20',
      percentage: '+1.81%',
      dayPercentage: '+1.87%',
      trend: 'up'
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      shares: 20,
      avgCost: '$145.00',
      currentPrice: '$142.81',
      marketValue: '$2,856.20',
      totalReturn: '-$43.80',
      dayChange: '-$35.40',
      percentage: '-1.51%',
      dayPercentage: '-1.22%',
      trend: 'down'
    }
  ];

  const sectorAllocation = [
    { sector: 'Technology', percentage: 45, value: '$56,055.55', color: 'bg-blue-500' },
    { sector: 'Consumer Discretionary', percentage: 25, value: '$31,141.97', color: 'bg-purple-500' },
    { sector: 'Healthcare', percentage: 15, value: '$18,685.18', color: 'bg-green-500' },
    { sector: 'Financials', percentage: 10, value: '$12,456.79', color: 'bg-yellow-500' },
    { sector: 'Energy', percentage: 5, value: '$6,228.40', color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Portfolio</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Track your investments and performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setView('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                view === 'overview' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setView('positions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                view === 'positions' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Positions
            </button>
          </div>
          <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200">
            <Plus className="h-5 w-5" />
            <span>Add Position</span>
          </button>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {portfolioStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{stat.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{stat.percentage}</p>
              </div>
            </div>
          );
        })}
      </div>

      {view === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Portfolio Performance</h2>
            <div className="h-64 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Activity className="h-16 w-16 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Portfolio Chart</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Performance over time</p>
              </div>
            </div>
          </div>

          {/* Sector Allocation */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Sector Allocation</h2>
            <div className="space-y-4">
              {sectorAllocation.map((sector, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${sector.color}`}></div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{sector.sector}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-900 dark:text-white">{sector.percentage}%</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{sector.value}</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${sector.color}`} 
                      style={{ width: `${sector.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Top Performers</h2>
            <div className="space-y-3">
              {positions.slice(0, 3).map((position, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{position.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{position.symbol}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{position.shares} shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">{position.totalReturn}</p>
                    <p className={`text-sm font-medium ${position.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {position.percentage}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {[
                { action: 'BUY', symbol: 'AAPL', shares: 10, price: '$175.43', date: 'Today' },
                { action: 'SELL', symbol: 'MSFT', shares: 5, price: '$378.85', date: 'Yesterday' },
                { action: 'BUY', symbol: 'GOOGL', shares: 8, price: '$138.21', date: '2 days ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activity.action === 'BUY' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'
                    }`}>
                      {activity.action}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{activity.symbol}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{activity.shares} shares @ {activity.price}</p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{activity.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Positions Table */
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Current Positions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Symbol</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Shares</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Avg Cost</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Current Price</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Market Value</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Total Return</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Day Change</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position, index) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{position.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{position.symbol}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{position.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">{position.shares}</td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{position.avgCost}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">{position.currentPrice}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">{position.marketValue}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-right">
                        <p className={`font-semibold ${position.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {position.totalReturn}
                        </p>
                        <p className={`text-sm ${position.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {position.percentage}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {position.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <div className="text-right">
                          <p className={`font-semibold ${position.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {position.dayChange}
                          </p>
                          <p className={`text-sm ${position.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {position.dayPercentage}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;