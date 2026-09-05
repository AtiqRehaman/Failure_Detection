import React, { useState, useEffect } from "react";
import {
  FaBolt,
  FaSearch,
  FaExclamationTriangle,
  FaChartLine,
  FaBuilding,
} from "react-icons/fa";
import { getMarketIntelligence } from "../services/api";

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
        selectedProject.target_market,
      );
      setIntelData(data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="rounded-2xl border border-[#162032] bg-[#0b1220] p-6 py-10 text-center shadow-[0_22px_45px_rgba(0,0,0,0.2)]">
        <FaSearch className="mx-auto mb-3 text-3xl text-[#7e8ca0]" />
        <h3 className="text-base font-bold text-white">
          Real-Time Market Intelligence
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-[#9bb0cb]">
          Select any project from the recent list above to fetch live competitor
          analysis and market saturation metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#162032] bg-[#0b1220] p-6 shadow-[0_22px_45px_rgba(0,0,0,0.2)] transition-all">
      <div className="flex flex-col justify-between gap-4 border-b border-[#162032] pb-5 sm:flex-row sm:items-center">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b1427] text-white">
            <FaBolt className="text-[#00F5A0]" size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                {selectedProject.project_name}
              </h3>
              <span className="rounded-md border border-[#1d2c47] bg-[#101a2a] px-2.5 py-0.5 text-xs font-semibold text-[#dfeaf7]">
                {selectedProject.industry}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#7e8ca0]">
              Live Competitive & Market Landscape Analysis
            </p>
          </div>
        </div>

        <button
          onClick={fetchIntel}
          disabled={loading}
          className="self-start rounded-lg border border-[#1d2c47] bg-[#0e1526] px-3.5 py-1.5 text-xs font-semibold text-[#dfeaf7] transition-colors hover:bg-[#111d2e] sm:self-auto"
        >
          {loading ? "Analyzing..." : "Refresh Market Signals"}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm font-medium text-[#7e8ca0]">
          Fetching competitor data & real-time market signals...
        </div>
      ) : intelData ? (
        <div className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#162032] bg-[#0e1526] p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7e8ca0]">
                Market Saturation
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {intelData.marketSaturationIndex}/100
                </span>
                <span
                  className={`text-xs font-semibold ${intelData.marketSaturationIndex > 70 ? "text-red-300" : "text-emerald-300"}`}
                >
                  {intelData.marketSaturationIndex > 70
                    ? "High Competition"
                    : "Moderate Saturation"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#162032] bg-[#0e1526] p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7e8ca0]">
                Active Competitors
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {intelData.competitorCount}
                </span>
                <span className="text-xs font-medium text-[#7e8ca0]">
                  Tracked Players
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#162032] bg-[#0e1526] p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7e8ca0]">
                Sector Funding Growth
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {intelData.fundingTrend}
                </span>
                <span className="text-xs font-semibold text-emerald-300">
                  YoY Increase
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#162032] p-4">
              <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#dfeaf7]">
                <FaBuilding className="text-[#7e8ca0]" /> Key Direct Competitors
              </h4>
              <div className="space-y-2.5">
                {intelData.keyCompetitors.map((comp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-[#1d2c47] bg-[#0f172a] p-2.5 text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{comp.name}</p>
                      <p className="text-[#7e8ca0]">
                        Market Share: {comp.marketShare}
                      </p>
                    </div>
                    <span className="rounded border border-[#1d2c47] bg-[#0b1220] px-2 py-1 font-semibold text-[#dfeaf7]">
                      Funding: {comp.funding}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-[#162032] p-4">
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#dfeaf7]">
                  <FaChartLine className="text-[#7e8ca0]" /> Strategic Gap
                  Analysis
                </h4>
                <p className="rounded-lg border border-[#1d2c47] bg-[#0d1424] p-3 text-xs leading-relaxed text-[#b7c6d8]">
                  {intelData.marketOpportunityGap}
                </p>
              </div>

              <div className="mt-4">
                <h5 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#7e8ca0]">
                  High-Intent Market Keywords
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {intelData.trendingKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-[#1d2c47] bg-[#101a2a] px-2.5 py-1 text-xs font-medium text-[#dfeaf7]"
                    >
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
