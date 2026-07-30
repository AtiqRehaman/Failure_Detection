import React, { useState } from 'react';
import { FaChartLine, FaFire, FaSearch, FaArrowUp, FaArrowDown, FaInfoCircle, FaClock } from 'react-icons/fa';
import { getTrendData } from '../utils/analytics';

const GoogleTrendsPanel = ({ selectedIndustry = 'all' }) => {
  const [timeRange, setTimeRange] = useState('12m');
  const [selectedInd, setSelectedInd] = useState(selectedIndustry || 'all');
  
  const trendData = getTrendData(selectedInd, timeRange);
  
  const timeRanges = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: '12 Months', value: '12m' }
  ];

  const industries = ['All Industries', 'Technology', 'Healthcare', 'Finance', 'Education'];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
            <FaFire className="text-white" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Google Trends</h3>
            <p className="text-xs text-gray-500">Real-time market interest analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          {timeRanges.map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${
                timeRange === range.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {industries.map(ind => (
          <button
            key={ind}
            onClick={() => setSelectedInd(ind)}
            className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
              selectedInd === ind
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
            }`}
          >
            {ind}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs text-gray-500 mb-1">Trend Score</p>
          <p className="text-3xl font-bold text-gray-900">{trendData.trendScore}/100</p>
          <div className="flex items-center mt-1">
            <span className={`text-xs font-medium ${trendData.status === 'Rising' ? 'text-green-600' : 'text-yellow-600'}`}>
              {trendData.status}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs text-gray-500 mb-1">Trending Topics</p>
          <div className="flex flex-wrap gap-1">
            {trendData.trendingTopics?.slice(0, 3).map(topic => (
              <span key={topic} className="px-2 py-0.5 bg-white rounded-full text-xs text-gray-700 shadow-sm">
                {topic}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">+ {trendData.trendingTopics?.length} topics</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
          <p className="text-xs text-gray-500 mb-1">Related Queries</p>
          <div className="flex flex-wrap gap-1">
            {trendData.relatedQueries?.slice(0, 3).map(query => (
              <span key={query} className="px-2 py-0.5 bg-white rounded-full text-xs text-gray-700 shadow-sm">
                {query}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">+ {trendData.relatedQueries?.length} queries</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
          <p className="text-xs text-gray-500 mb-1">Market Status</p>
          <div className="flex items-center space-x-2">
            {trendData.status === 'Rising' ? (
              <FaArrowUp className="text-green-600" size={16} />
            ) : (
              <FaArrowDown className="text-yellow-600" size={16} />
            )}
            <span className={`text-sm font-semibold ${trendData.status === 'Rising' ? 'text-green-600' : 'text-yellow-600'}`}>
              {trendData.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Based on market data</p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FaSearch className="text-primary-500" size={14} />
          Rising Searches
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {trendData.risingSearches?.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{item.term}</span>
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                +{item.growth}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start space-x-3">
          <FaInfoCircle className="text-blue-500 mt-0.5" size={16} />
          <div>
            <p className="text-sm font-medium text-gray-700">Trend Insights</p>
            <p className="text-sm text-gray-600 mt-1">{trendData.insight}</p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <FaClock size={10} />
              Updated just now
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleTrendsPanel;
