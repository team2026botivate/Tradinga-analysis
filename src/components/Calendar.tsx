import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  AlertTriangle,
  Star,
  Filter
} from 'lucide-react';

const Calendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const economicEvents = [
    {
      id: 1,
      title: 'Federal Reserve Interest Rate Decision',
      time: '2:00 PM EST',
      impact: 'high',
      currency: 'USD',
      forecast: '5.25%',
      previous: '5.50%',
      description: 'Federal Reserve announces monetary policy decision',
      category: 'monetary-policy',
      starred: true
    },
    {
      id: 2,
      title: 'Non-Farm Payrolls',
      time: '8:30 AM EST',
      impact: 'high',
      currency: 'USD',
      forecast: '180K',
      previous: '199K',
      description: 'Monthly employment change report',
      category: 'employment',
      starred: false
    },
    {
      id: 3,
      title: 'Apple Inc. Earnings Report',
      time: '4:30 PM EST',
      impact: 'medium',
      currency: 'USD',
      forecast: '$1.52 EPS',
      previous: '$1.46 EPS',
      description: 'Q4 2024 earnings announcement',
      category: 'earnings',
      starred: true
    },
    {
      id: 4,
      title: 'Consumer Price Index (CPI)',
      time: '8:30 AM EST',
      impact: 'high',
      currency: 'USD',
      forecast: '3.2%',
      previous: '3.4%',
      description: 'Monthly inflation data release',
      category: 'inflation',
      starred: false
    },
    {
      id: 5,
      title: 'European Central Bank Press Conference',
      time: '8:45 AM EST',
      impact: 'medium',
      currency: 'EUR',
      forecast: 'N/A',
      previous: 'N/A',
      description: 'ECB President press conference following rate decision',
      category: 'monetary-policy',
      starred: false
    }
  ];

  const filters = [
    { id: 'all', label: 'All Events' },
    { id: 'high', label: 'High Impact' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'monetary-policy', label: 'Monetary Policy' },
    { id: 'employment', label: 'Employment' },
    { id: 'inflation', label: 'Inflation' },
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 border-slate-200 dark:border-slate-600';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredEvents = economicEvents.filter(event => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'high') return event.impact === 'high';
    return event.category === selectedFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Economic Calendar</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Track important market events and announcements</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedFilter === filter.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Events Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {filteredEvents.filter(e => e.impact === 'high').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">High Impact</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {filteredEvents.filter(e => e.category === 'earnings').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Earnings Reports</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {filteredEvents.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Today's Events</h2>
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex flex-col items-center space-y-1">
                    <div className={`p-2 rounded-lg border ${getImpactColor(event.impact)}`}>
                      {getImpactIcon(event.impact)}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getImpactColor(event.impact)}`}>
                      {event.impact.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {event.title}
                      </h3>
                      {event.starred && (
                        <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                      )}
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400">{event.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Currency:</span>
                        <span className="text-slate-600 dark:text-slate-400">{event.currency}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-500">Forecast</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{event.forecast}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-500">Previous</p>
                      <p className="text-slate-600 dark:text-slate-400">{event.previous}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming This Week */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Upcoming This Week</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { day: 'Tomorrow', event: 'GDP Growth Rate', time: '8:30 AM EST', impact: 'high' },
            { day: 'Wednesday', event: 'Crude Oil Inventories', time: '10:30 AM EST', impact: 'medium' },
            { day: 'Thursday', event: 'Jobless Claims', time: '8:30 AM EST', impact: 'medium' },
            { day: 'Friday', event: 'Consumer Confidence', time: '10:00 AM EST', impact: 'high' },
          ].map((upcoming, index) => (
            <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{upcoming.day}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(upcoming.impact)}`}>
                  {upcoming.impact.toUpperCase()}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{upcoming.event}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{upcoming.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;