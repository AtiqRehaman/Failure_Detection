import React from 'react';
import { FaBrain, FaRocket, FaChartPie, FaShieldAlt, FaLightbulb } from 'react-icons/fa';

const AIPlaceholders = () => {
  const features = [
    {
      id: 'market-intelligence',
      icon: FaBrain,
      title: 'Market Intelligence',
      description: 'AI-powered market analysis and insights',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'startup-score',
      icon: FaRocket,
      title: 'AI Startup Score',
      description: 'Automated startup evaluation and scoring',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'competitor-analysis',
      icon: FaChartPie,
      title: 'Competitor Analysis',
      description: 'Track and analyze competitor performance',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'swot-analysis',
      icon: FaShieldAlt,
      title: 'SWOT Analysis',
      description: 'Strategic SWOT analysis powered by AI',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'recommendations',
      icon: FaLightbulb,
      title: 'Business Recommendations',
      description: 'AI-generated business insights and recommendations',
      color: 'from-yellow-500 to-amber-600'
    }
  ];

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map(feature => {
        const IconComponent = feature.icon;
        return (
          <div
            key={feature.id}
            className="group relative bg-white rounded-2xl border border-gray-100 shadow-soft p-6 hover:shadow-soft-lg transition-all duration-300 cursor-not-allowed opacity-75 hover:opacity-90"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            
            <div className="relative">
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
                <IconComponent className="text-white" size={20} />
              </div>
              
              <h4 className="text-md font-semibold text-gray-900 mb-2">{feature.title}</h4>
              <p className="text-sm text-gray-500 mb-4">{feature.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-xs font-medium text-gray-600 rounded-full">
                  Coming Soon
                </span>
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-200">
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AIPlaceholders;
