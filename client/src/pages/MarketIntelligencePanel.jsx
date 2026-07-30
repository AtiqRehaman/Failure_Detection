import React, { useState, useEffect } from 'react';
import { FaBolt, FaSearch, FaExclamationTriangle, FaChartLine, FaBuilding } from 'react-icons/fa';
import { getMarketIntelligence } from '../services/api';

const MarketIntelligencePanel = ({ selectedProject }) => {
  const [intelData, setIntelData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      fetchIntel();
    }
  }, [selectedProject]);

  const fetchIntel = async () => {
    setLoading(true);
    try {
      const data = await getMarketIntelligence(
        selectedProject.industry,
        selectedProject.project_name,
        selectedProject.target_market
      );
      setIntelData(data);
    } catch (err) {
      console.error("Failed to load real-time market data", err);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center py-10">
        <FaSearch className="mx-auto text-slate-300 text-3xl mb-3" />
        <h3 className="text-base font-bold text-slate-900">Real-Time Market Intelligence</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Select any project from the recent list above to fetch live competitor analysis and market saturation metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            <FaBolt className="text-amber-400" size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{selectedProject.project_name}</h3>
              <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-md text-xs font-semibold">
                {selectedProject.industry}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Live Competitive & Market Landscape Analysis</p>
          </div>
        </div>

        <button 
          onClick={fetchIntel}
          disabled={loading}
          className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors self-start sm:self-auto"
        >
          {loading ? 'Analyzing...' : 'Refresh Market Signals'}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-medium text-sm">
          Fetching competitor data & real-time market signals...
        </div>
      ) : intelData ? (
        <div className="pt-6 space-y-6">
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Market Saturation</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">{intelData.marketSaturationIndex}/100</span>
                <span className={`text-xs font-semibold ${intelData.marketSaturationIndex > 70 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {intelData.marketSaturationIndex > 70 ? 'High Competition' : 'Moderate Saturation'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Competitors</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">{intelData.competitorCount}</span>
                <span className="text-xs font-medium text-slate-500">Tracked Players</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sector Funding Growth</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">{intelData.fundingTrend}</span>
                <span className="text-xs font-semibold text-emerald-600">YoY Increase</span>
              </div>
            </div>

          </div>

          {/* Competitor Breakdown Table & Opportunity Gap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Competitors */}
            <div className="border border-slate-200 rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <FaBuilding className="text-slate-500" /> Key Direct Competitors
              </h4>
              <div className="space-y-2.5">
                {intelData.keyCompetitors.map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{comp.name}</p>
                      <p className="text-slate-500">Market Share: {comp.marketShare}</p>
                    </div>
                    <span className="font-semibold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                      Funding: {comp.funding}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Opportunity & Keywords */}
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <FaChartLine className="text-slate-500" /> Strategic Gap Analysis
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {intelData.marketOpportunityGap}
                </p>
              </div>

              <div className="mt-4">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">High-Intent Market Keywords</h5>
                <div className="flex flex-wrap gap-1.5">
                  {intelData.trendingKeywords.map((kw, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-medium">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : null}
    </div>
  );
};

export default MarketIntelligencePanel;