import React from "react";
import {
  FaBrain,
  FaRocket,
  FaChartPie,
  FaShieldAlt,
  FaLightbulb,
} from "react-icons/fa";

const AIPlaceholders = () => {
  const features = [
    {
      id: "market-intelligence",
      icon: FaBrain,
      title: "Market Intelligence",
      description: "AI-powered market analysis and insights",
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: "startup-score",
      icon: FaRocket,
      title: "AI Startup Score",
      description: "Automated startup evaluation and scoring",
      color: "from-blue-500 to-cyan-600",
    },
    {
      id: "competitor-analysis",
      icon: FaChartPie,
      title: "Competitor Analysis",
      description: "Track and analyze competitor performance",
      color: "from-green-500 to-emerald-600",
    },
    {
      id: "swot-analysis",
      icon: FaShieldAlt,
      title: "SWOT Analysis",
      description: "Strategic SWOT analysis powered by AI",
      color: "from-orange-500 to-red-600",
    },
    {
      id: "recommendations",
      icon: FaLightbulb,
      title: "Business Recommendations",
      description: "AI-generated business insights and recommendations",
      color: "from-yellow-500 to-amber-600",
    },
  ];

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => {
        const IconComponent = feature.icon;
        return (
          <div
            key={feature.id}
            className="group relative cursor-not-allowed rounded-2xl border border-[#162032] bg-[#0b1220] p-6 opacity-75 shadow-[0_22px_50px_rgba(0,0,0,0.2)] transition-all duration-300 hover:opacity-90"
          >
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
            ></div>

            <div className="relative">
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${feature.color} shadow-sm`}
              >
                <IconComponent className="text-white" size={20} />
              </div>

              <h4 className="mb-2 text-md font-semibold text-white">
                {feature.title}
              </h4>
              <p className="mb-4 text-sm text-[#9bb0cb]">
                {feature.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="rounded-full border border-[#1d2c47] bg-[#0d1424] px-3 py-1 text-xs font-medium text-[#dfeaf7]">
                  Coming Soon
                </span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#101a2a] transition-colors duration-200 group-hover:bg-[#162339]">
                  <svg
                    className="h-3 w-3 text-[#8ea0b7]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
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
