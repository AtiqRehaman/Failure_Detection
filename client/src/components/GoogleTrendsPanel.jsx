import React, { useState } from "react";
import {
  FaChartLine,
  FaFire,
  FaSearch,
  FaArrowUp,
  FaArrowDown,
  FaInfoCircle,
  FaClock,
} from "react-icons/fa";
import { getTrendData } from "../utils/analytics";

const GoogleTrendsPanel = ({ selectedIndustry = "all" }) => {
  const [timeRange, setTimeRange] = useState("12m");
  const [selectedInd, setSelectedInd] = useState(selectedIndustry || "all");

  const trendData = getTrendData(selectedInd, timeRange);

  const timeRanges = [
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" },
    { label: "12 Months", value: "12m" },
  ];

  const industries = [
    "All Industries",
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
  ];

  return (
    <div className="rounded-2xl border border-[#162032] bg-[#0b1220] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00F5A0] to-[#0ea5e9]">
            <FaFire className="text-[#07131d]" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Google Trends</h3>
            <p className="text-xs text-[#7e8ca0]">
              Real-time market interest analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[#162032] bg-[#0f172a] p-1">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-all duration-200 ${
                timeRange === range.value
                  ? "bg-[#00F5A0] text-[#080d19] shadow-[0_8px_20px_rgba(0,245,160,0.2)]"
                  : "text-[#a7b5c9] hover:bg-[#111d2e]"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {industries.map((ind) => (
          <button
            key={ind}
            onClick={() => setSelectedInd(ind)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-all duration-200 ${
              selectedInd === ind
                ? "border-[#00F5A0]/40 bg-[#00F5A0]/10 text-[#bafbe4]"
                : "border-[#1d2c47] bg-[#101a2a] text-[#a7b5c9] hover:border-[#243754] hover:text-white"
            }`}
          >
            {ind}
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[#1d2c47] bg-[#0e1526] p-4">
          <p className="mb-1 text-xs text-[#7e8ca0]">Trend Score</p>
          <p className="text-3xl font-bold text-white">
            {trendData.trendScore}/100
          </p>
          <div className="mt-1 flex items-center">
            <span
              className={`text-xs font-medium ${trendData.status === "Rising" ? "text-emerald-300" : "text-yellow-300"}`}
            >
              {trendData.status}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#1d2c47] bg-[#0e1526] p-4">
          <p className="mb-1 text-xs text-[#7e8ca0]">Trending Topics</p>
          <div className="flex flex-wrap gap-1">
            {trendData.trendingTopics?.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="rounded-full bg-[#0d1a2f] px-2 py-0.5 text-xs text-[#dfeaf7] shadow-sm ring-1 ring-[#1d2c47]"
              >
                {topic}
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs text-[#6f7f99]">
            + {trendData.trendingTopics?.length} topics
          </p>
        </div>

        <div className="rounded-xl border border-[#1d2c47] bg-[#0e1526] p-4">
          <p className="mb-1 text-xs text-[#7e8ca0]">Related Queries</p>
          <div className="flex flex-wrap gap-1">
            {trendData.relatedQueries?.slice(0, 3).map((query) => (
              <span
                key={query}
                className="rounded-full bg-[#0d1a2f] px-2 py-0.5 text-xs text-[#dfeaf7] shadow-sm ring-1 ring-[#1d2c47]"
              >
                {query}
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs text-[#6f7f99]">
            + {trendData.relatedQueries?.length} queries
          </p>
        </div>

        <div className="rounded-xl border border-[#1d2c47] bg-[#0e1526] p-4">
          <p className="mb-1 text-xs text-[#7e8ca0]">Market Status</p>
          <div className="flex items-center space-x-2">
            {trendData.status === "Rising" ? (
              <FaArrowUp className="text-emerald-300" size={16} />
            ) : (
              <FaArrowDown className="text-yellow-300" size={16} />
            )}
            <span
              className={`text-sm font-semibold ${trendData.status === "Rising" ? "text-emerald-300" : "text-yellow-300"}`}
            >
              {trendData.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#6f7f99]">Based on market data</p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#dfeaf7]">
          <FaSearch className="text-[#00F5A0]" size={14} />
          Rising Searches
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trendData.risingSearches?.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-[#1d2c47] bg-[#101a2a] p-3"
            >
              <span className="text-sm font-medium text-[#dfeaf7]">
                {item.term}
              </span>
              <span className="rounded-full bg-[#0f3f36] px-2 py-1 text-xs font-semibold text-[#bafbe4]">
                +{item.growth}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#1d2c47] bg-[#0d1424] p-4">
        <div className="flex items-start space-x-3">
          <FaInfoCircle className="mt-0.5 text-[#00F5A0]" size={16} />
          <div>
            <p className="text-sm font-medium text-white">Trend Insights</p>
            <p className="mt-1 text-sm text-[#a7b5c9]">{trendData.insight}</p>
            <p className="mt-2 flex items-center gap-1 text-xs text-[#6f7f99]">
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
