import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Target,
  AlertTriangle,
  Info
} from 'lucide-react';

const Analysis: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');

  const symbols = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA'];
  const timeframes = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];

  const technicalIndicators = [
    { name: 'RSI (14)', value: '68.42', signal: 'Neutral', color: 'yellow' },
    { name: 'MACD', value: '+2.34', signal: 'Bullish', color: 'green' },
    { name: 'SMA (20)', value: '$172.45', signal: 'Above', color: 'green' },
    { name: 'SMA (50)', value: '$168.23', signal: 'Above', color: 'green' },
    { name: 'Bollinger Upper', value: '$178.90', signal: 'Below', color: 'yellow' },
    { name: 'Bollinger Lower', value: '$165.40', signal: 'Above', color: 'green' },
  ];

  const supportResistance = [
    { type: 'Resistance', level: '$178.50', strength: 'Strong' },
    { type: 'Resistance', level: '$175.20', strength: 'Moderate' },
    { type: 'Support', level: '$172.10', strength: 'Strong' },
    { type: 'Support', level: '$168.75', strength: 'Weak' },
  ];

  const getSignalColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'red':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Technical Analysis</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Advanced charting and indicators</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {symbols.map((symbol) => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Info */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">{selectedSymbol.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedSymbol}</h2>
              <p className="text-slate-600 dark:text-slate-400">Apple Inc.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">$175.43</p>
            <div className="flex items-center space-x-2 mt-1">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-green-600 font-semibold">+$2.34 (+1.35%)</span>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex space-x-2 mb-4">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedTimeframe === timeframe
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>

        {/* Chart Placeholder */}
        <div className="h-80 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Advanced Trading Chart</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">TradingView integration would go here</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technical Indicators */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Technical Indicators</h3>
          <div className="space-y-3">
            {technicalIndicators.map((indicator, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{indicator.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{indicator.value}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSignalColor(indicator.color)}`}>
                  {indicator.signal}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Support & Resistance</h3>
          <div className="space-y-3">
            {supportResistance.map((level, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <div className="flex items-center space-x-3">
                  {level.type === 'Resistance' ? (
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{level.type}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{level.level}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  level.strength === 'Strong' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                  level.strength === 'Moderate' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' :
                  'bg-gray-50 dark:bg-gray-900/20 text-gray-600'
                }`}>
                  {level.strength}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trading Signals */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">AI Trading Signals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3 mb-2">
              <Target className="h-6 w-6 text-green-600" />
              <h4 className="font-bold text-green-800 dark:text-green-400">BUY Signal</h4>
            </div>
            <p className="text-green-700 dark:text-green-300 font-semibold">Strong Bullish Momentum</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">Confidence: 78%</p>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-3 mb-2">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <h4 className="font-bold text-yellow-800 dark:text-yellow-400">HOLD Signal</h4>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 font-semibold">Consolidation Phase</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Wait for breakout</p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3 mb-2">
              <Info className="h-6 w-6 text-blue-600" />
              <h4 className="font-bold text-blue-800 dark:text-blue-400">Market Sentiment</h4>
            </div>
            <p className="text-blue-700 dark:text-blue-300 font-semibold">Bullish</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Social: +65% positive</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Market Cap', value: '$2.75T' },
            { label: 'P/E Ratio', value: '28.45' },
            { label: 'Volume', value: '52.3M' },
            { label: '52W High', value: '$182.94' },
            { label: '52W Low', value: '$124.17' },
            { label: 'Avg Volume', value: '48.7M' },
            { label: 'Beta', value: '1.24' },
            { label: 'Dividend Yield', value: '0.52%' }
          ].map((metric, index) => (
            <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
              <p className="text-sm text-slate-600 dark:text-slate-400">{metric.label}</p>
              <p className="font-bold text-slate-900 dark:text-white">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analysis;