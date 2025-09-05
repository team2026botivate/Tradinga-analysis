import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  AlertTriangle,
  Star,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Footer from './Footer';

const Calendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
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
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">Economic Calendar</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Track important market events</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 w-full md:w-auto bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Mobile Filters Toggle */}
      <button 
        onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
        className="md:hidden flex items-center justify-between w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
        {isMobileFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {/* Filters */}
      <div className={`${isMobileFiltersOpen ? 'block' : 'hidden'} md:block bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm`}>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setSelectedFilter(filter.id);
                setIsMobileFiltersOpen(false);
              }}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                selectedFilter === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {filteredEvents.filter(e => e.impact === 'high').length}
              </p>
              <p className="text-sm text-slate-600">High Impact</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {filteredEvents.filter(e => e.category === 'earnings').length}
              </p>
              <p className="text-sm text-slate-600">Earnings Reports</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {filteredEvents.length}
              </p>
              <p className="text-sm text-slate-600">Total Events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-xl font-bold p-4 border-b border-slate-100 dark:border-slate-700">Today's Events</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filteredEvents.map((event) => (
            <div key={event.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Impact Indicator */}
                <div className="flex flex-col items-center gap-1">
                  <div className={`p-2 rounded-lg border ${getImpactColor(event.impact)}`}>
                    {getImpactIcon(event.impact)}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getImpactColor(event.impact)}`}>
                    {event.impact.toUpperCase()}
                  </span>
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {event.title}
                        {event.starred && <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                        {event.description}
                      </p>
                    </div>
                    
                    {/* Mobile-only time */}
                    <div className="sm:hidden flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{event.time}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    {/* Desktop time */}
                    <div className="hidden sm:flex items-center gap-1">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">{event.time}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Currency:</span>
                      <span className="text-slate-600 dark:text-slate-400">{event.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Forecast/Previous */}
                <div className="sm:text-right min-w-[120px]">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Forecast</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{event.forecast}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Previous</p>
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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-xl font-bold p-4 border-b border-slate-100 dark:border-slate-700">Upcoming This Week</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
          {[
            { day: 'Tomorrow', event: 'GDP Growth Rate', time: '8:30 AM EST', impact: 'high' },
            { day: 'Wednesday', event: 'Crude Oil Inventories', time: '10:30 AM EST', impact: 'medium' },
            { day: 'Thursday', event: 'Jobless Claims', time: '8:30 AM EST', impact: 'medium' },
            { day: 'Friday', event: 'Consumer Confidence', time: '10:00 AM EST', impact: 'high' },
          ].map((upcoming, index) => (
            <div key={index} className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{upcoming.day}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(upcoming.impact)}`}>
                  {upcoming.impact.toUpperCase()}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{upcoming.event}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{upcoming.time}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Calendar;