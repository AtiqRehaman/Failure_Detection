import React from 'react';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

const DashboardFilters = ({
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
  filterOptions,
  onClearFilters
}) => {
  const budgetRanges = [
    { label: 'All Budgets', value: 'all' },
    { label: '$0 - $50K', value: [0, 50000] },
    { label: '$50K - $200K', value: [50000, 200000] },
    { label: '$200K - $500K', value: [200000, 500000] },
    { label: '$500K+', value: [500000, Infinity] }
  ];

  const dateRanges = [
    { label: 'All Time', value: 'all' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'Last 12 Months', value: '12m' }
  ];

  const hasActiveFilters = () => {
    return (
      searchQuery ||
      (filters.industry && filters.industry !== 'all') ||
      (filters.businessModel && filters.businessModel !== 'all') ||
      (filters.targetMarket && filters.targetMarket !== 'all') ||
      (filters.budgetRange && filters.budgetRange !== 'all') ||
      (filters.dateRange && filters.dateRange !== 'all')
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-400" size={16} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects by name, industry, business model, or target market..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <FaTimes className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" size={14} />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>

        <select
          value={filters.industry || 'all'}
          onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Industries</option>
          {filterOptions.industries.map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>

        <select
          value={filters.businessModel || 'all'}
          onChange={(e) => setFilters({ ...filters, businessModel: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Business Models</option>
          {filterOptions.businessModels.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>

        <select
          value={filters.targetMarket || 'all'}
          onChange={(e) => setFilters({ ...filters, targetMarket: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Target Markets</option>
          {filterOptions.targetMarkets.map(market => (
            <option key={market} value={market}>{market}</option>
          ))}
        </select>

        <select
          value={filters.budgetRange || 'all'}
          onChange={(e) => setFilters({ ...filters, budgetRange: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {budgetRanges.map(range => (
            <option key={range.label} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>

        <select
          value={filters.dateRange || 'all'}
          onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {dateRanges.map(range => (
            <option key={range.label} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>

        {hasActiveFilters() && (
          <button
            onClick={onClearFilters}
            className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardFilters;
