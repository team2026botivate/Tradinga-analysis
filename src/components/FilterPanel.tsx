import React, { useState } from 'react';
import { FiCalendar, FiSearch, FiPlus } from 'react-icons/fi';

interface FilterPanelProps {
  symbols: string[];
  strategies: string[];
  onSearch: (query: string) => void;
  onDateChange: (from: string, to: string) => void;
  onFilterChange: (filters: {
    status: string;
    symbol: string;
    strategy: string;
    year: number;
    side: string;
  }) => void;
  onAddTrade: () => void;
  onLoadDemo?: () => void;
  onClearData?: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  symbols,
  strategies,
  onSearch,
  onDateChange,
  onFilterChange,
  onAddTrade,
  onLoadDemo,
  onClearData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    symbol: '',
    strategy: '',
    year: 2025,
    side: 'all'
  });

  return (
    <div className="surface-card rounded-xl p-4 shadow-sm transition-all duration-300">
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 rounded-lg input placeholder-slate-400 focus-ring transition-all duration-200"
          placeholder="e.g., RELIANCE breakout ..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearch(e.target.value);
          }}
        />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <FiCalendar className="text-slate-400" />
          </div>
          <input
            type="date"
            className="block w-full pl-3 pr-10 py-2 rounded-lg input placeholder-slate-400 focus-ring"
            placeholder="dd-mm-yyyy"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              onDateChange(e.target.value, dateTo);
            }}
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <FiCalendar className="text-slate-400" />
          </div>
          <input
            type="date"
            className="block w-full pl-3 pr-10 py-2 rounded-lg input placeholder-slate-400 focus-ring"
            placeholder="dd-mm-yyyy"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              onDateChange(dateFrom, e.target.value);
            }}
          />
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <select
          className="input overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          value={filters.status}
          onChange={(e) => {
            const newFilters = { ...filters, status: e.target.value };
            setFilters(newFilters);
            onFilterChange(newFilters);
          }}
        >
          <option value="all">All Results</option>
          <option value="win">Wins</option>
          <option value="loss">Losses</option>
          <option value="breakeven">Breakevens</option>
        </select>

        <select
          className="input overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          value={filters.symbol}
          onChange={(e) => {
            const newFilters = { ...filters, symbol: e.target.value };
            setFilters(newFilters);
            onFilterChange(newFilters);
          }}
        >
          <option value="">All Symbols</option>
          {symbols.map(symbol => (
            <option key={symbol} value={symbol}>{symbol}</option>
          ))}
        </select>

        <select
          className="input overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          value={filters.strategy}
          onChange={(e) => {
            const newFilters = { ...filters, strategy: e.target.value };
            setFilters(newFilters);
            onFilterChange(newFilters);
          }}
        >
          <option value="">All Strategies</option>
          {strategies.map(strategy => (
            <option key={strategy} value={strategy}>{strategy}</option>
          ))}
        </select>

        <select
          className="input overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          value={filters.side}
          onChange={(e) => {
            const newFilters = { ...filters, side: e.target.value };
            setFilters(newFilters);
            onFilterChange(newFilters);
          }}
        >
          <option value="all">All Sides</option>
          <option value="Buy">Buy</option>
          <option value="Sell">Sell</option>
          <option value="Long">Long</option>
          <option value="Short">Short</option>
        </select>

        <input
          type="number"
          className="input"
          value={filters.year}
          onChange={(e) => {
            const newFilters = { ...filters, year: parseInt(e.target.value) || 2025 };
            setFilters(newFilters);
            onFilterChange(newFilters);
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-3">
        <button
          onClick={onAddTrade}
          className="flex-1 btn-secondary flex items-center justify-center gap-2"
        >
          <FiPlus /> Add Trading Day
        </button>
       
      </div>
    </div>
  );
};

export default FilterPanel;
