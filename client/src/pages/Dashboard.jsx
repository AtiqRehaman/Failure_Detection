import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  Area,
  ComposedChart,
} from "recharts";
import { getProjects } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Toast from "../components/Toast";
import {
  FaProjectDiagram,
  FaIndustry,
  FaRupeeSign,
  FaChartLine,
  FaArrowUp,
  FaSearch,
  FaTimes,
  FaEye,
  FaUndo,
} from "react-icons/fa";

// Corelytics UI Vibrant Mint & Cyber Dark Palette
const CHART_COLORS = [
  "#00F5A0",
  "#00D284",
  "#00B06E",
  "#38EF7D",
  "#11998E",
  "#1DC5D8",
  "#3B82F6",
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [toast, setToast] = useState(null);

  // ---------------------------------------------------------
  // SEARCH & FILTER STATES
  // ---------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedBusinessModel, setSelectedBusinessModel] = useState("all");
  const [selectedTargetMarket, setSelectedTargetMarket] = useState("all");
  const [selectedBudgetRange, setSelectedBudgetRange] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");

  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getProjects();
      const { data } = response;

      const projectList = Array.isArray(data) ? data : [];
      setProjects(projectList);
      if (projectList.length > 0) {
        setSelectedProject(projectList[0]);
      }
    } catch (error) {
      setToast({
        message: "Failed to load dashboard telemetry",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // EXTRACT DYNAMIC UNIQUE FILTER OPTIONS
  // ---------------------------------------------------------
  const filterOptions = useMemo(() => {
    const industries = new Set();
    const businessModels = new Set();
    const targetMarkets = new Set();

    projects.forEach((p) => {
      if (p?.industry) industries.add(p.industry);
      if (p?.business_model) businessModels.add(p.business_model);
      if (p?.target_market) targetMarkets.add(p.target_market);
    });

    return {
      industries: Array.from(industries).sort(),
      businessModels: Array.from(businessModels).sort(),
      targetMarkets: Array.from(targetMarkets).sort(),
    };
  }, [projects]);

  // ---------------------------------------------------------
  // COMBINED SEARCH + FILTERING LOGIC (SORTED BY DATE)
  // ---------------------------------------------------------
  const filteredProjects = useMemo(() => {
    const results = projects.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p?.project_name?.toLowerCase().includes(query) ||
        p?.industry?.toLowerCase().includes(query) ||
        p?.business_model?.toLowerCase().includes(query) ||
        p?.target_market?.toLowerCase().includes(query);

      const matchesIndustry =
        selectedIndustry === "all" || p?.industry === selectedIndustry;

      const matchesBusinessModel =
        selectedBusinessModel === "all" ||
        p?.business_model === selectedBusinessModel;

      const matchesTargetMarket =
        selectedTargetMarket === "all" ||
        p?.target_market === selectedTargetMarket;

      let matchesBudget = true;
      const budgetNum = Number(p?.budget) || 0;
      if (selectedBudgetRange === "under1l") {
        matchesBudget = budgetNum < 100000;
      } else if (selectedBudgetRange === "1l_10l") {
        matchesBudget = budgetNum >= 100000 && budgetNum <= 1000000;
      } else if (selectedBudgetRange === "above10l") {
        matchesBudget = budgetNum > 1000000;
      }

      let matchesDate = true;
      if (selectedDateRange !== "all" && p?.created_at) {
        const projectDate = new Date(p.created_at);
        const now = new Date();
        if (selectedDateRange === "week") {
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          matchesDate = projectDate >= weekAgo;
        } else if (selectedDateRange === "month") {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          matchesDate = projectDate >= monthAgo;
        }
      }

      return (
        matchesSearch &&
        matchesIndustry &&
        matchesBusinessModel &&
        matchesTargetMarket &&
        matchesBudget &&
        matchesDate
      );
    });

    return results.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
    );
  }, [
    projects,
    searchQuery,
    selectedIndustry,
    selectedBusinessModel,
    selectedTargetMarket,
    selectedBudgetRange,
    selectedDateRange,
  ]);

  const top10Projects = useMemo(() => {
    return filteredProjects.slice(0, 10);
  }, [filteredProjects]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedIndustry("all");
    setSelectedBusinessModel("all");
    setSelectedTargetMarket("all");
    setSelectedBudgetRange("all");
    setSelectedDateRange("all");
  };

  const isFilterActive =
    searchQuery ||
    selectedIndustry !== "all" ||
    selectedBusinessModel !== "all" ||
    selectedTargetMarket !== "all" ||
    selectedBudgetRange !== "all" ||
    selectedDateRange !== "all";

  // Calculate dynamic stats
  const additionalStats = useMemo(() => {
    if (!Array.isArray(filteredProjects) || filteredProjects.length === 0) {
      return {
        totalProjects: 0,
        totalBudget: 0,
        avgBudget: 0,
        industryCount: 0,
        businessModelCount: 0,
      };
    }

    const totalBudget = filteredProjects.reduce((sum, p) => {
      const budgetNum = Number(p?.budget);
      return sum + (!isNaN(budgetNum) ? budgetNum : 0);
    }, 0);

    const validBudgetProjects = filteredProjects.filter(
      (p) => !isNaN(Number(p?.budget)) && Number(p?.budget) > 0,
    );
    const countForAvg =
      validBudgetProjects.length > 0
        ? validBudgetProjects.length
        : filteredProjects.length;

    const avgBudget = countForAvg > 0 ? totalBudget / countForAvg : 0;
    const industries = new Set(
      filteredProjects.map((p) => p?.industry).filter(Boolean),
    );
    const businessModels = new Set(
      filteredProjects.map((p) => p?.business_model).filter(Boolean),
    );

    return {
      totalProjects: filteredProjects.length,
      totalBudget: isNaN(totalBudget) ? 0 : totalBudget,
      avgBudget: isNaN(avgBudget) ? 0 : avgBudget,
      industryCount: industries.size,
      businessModelCount: businessModels.size,
    };
  }, [filteredProjects]);

  // Indian Currency Notation
  const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount === 0) return "₹0";

    if (numericAmount >= 10000000) {
      return `₹${(numericAmount / 10000000).toFixed(2)} Cr`;
    } else if (numericAmount >= 100000) {
      return `₹${(numericAmount / 100000).toFixed(2)} L`;
    } else if (numericAmount >= 1000) {
      return `₹${(numericAmount / 1000).toFixed(1)}k`;
    }

    return `₹${numericAmount.toLocaleString("en-IN")}`;
  };

  // Trend chart dataset
  const trendsData = useMemo(() => {
    const grouped = {};
    filteredProjects.forEach((p) => {
      if (!p?.created_at) return;
      const date = new Date(p.created_at);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          count: 0,
          totalBudget: 0,
          projects: [],
          month: date.getMonth(),
          year: date.getFullYear(),
        };
      }
      grouped[monthKey].count++;
      const budgetNum = Number(p.budget);
      grouped[monthKey].totalBudget += !isNaN(budgetNum) ? budgetNum : 0;
      grouped[monthKey].projects.push(p);
    });

    return Object.entries(grouped)
      .map(([month, data]) => ({
        month,
        count: data.count,
        totalBudget: data.totalBudget,
        avgBudget:
          data.projects.length > 0
            ? data.totalBudget / data.projects.length
            : 0,
        monthIndex: data.month + data.year * 12,
      }))
      .sort((a, b) => a.monthIndex - b.monthIndex);
  }, [filteredProjects]);

  const budgetByIndustry = useMemo(() => {
    const industries = {};
    filteredProjects.forEach((p) => {
      const industry = p.industry || "Other";
      if (!industries[industry]) {
        industries[industry] = { total: 0, count: 0 };
      }
      const budgetNum = Number(p.budget);
      industries[industry].total += !isNaN(budgetNum) ? budgetNum : 0;
      industries[industry].count++;
    });

    return Object.entries(industries)
      .map(([industry, data]) => ({
        industry,
        totalBudget: data.total,
        avgBudget: data.count > 0 ? data.total / data.count : 0,
        count: data.count,
      }))
      .sort((a, b) => b.avgBudget - a.avgBudget);
  }, [filteredProjects]);

  const growthPercentage = useMemo(() => {
    if (trendsData.length < 2) return 0;
    const last = trendsData[trendsData.length - 1]?.count || 0;
    const prev = trendsData[trendsData.length - 2]?.count || 0;
    if (prev === 0) return last > 0 ? 100 : 0;
    const growth = ((last - prev) / prev) * 100;
    return isNaN(growth) ? 0 : growth;
  }, [trendsData]);

  const handleViewAnalysis = (projectId) => {
    navigate(`/analysis/${projectId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <LoadingSpinner size="lg" color="#00F5A0" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-[#00F5A0] selection:text-black">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 right-4 sm:right-6 z-[9999] max-w-md w-full transition-all">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Main Corelytics Container Shell */}
      <div className="max-w-7xl mx-auto bg-[#080d19] rounded-[36px] border border-[#162032] p-5 sm:p-8 lg:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.4)] relative overflow-hidden space-y-8">
        {/* Subtle Ambient Mint Glow Spheres */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F5A0]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-[#00F5A0]/5 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Toolbar */}
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dashboard
            </h1>
          </div>
        </div>

        {/* 2. Interactive Search & Unified Filter Strip */}
        <div className="bg-[#0e1526] rounded-3xl border border-[#182338] p-5 space-y-4">
          {/* Search Box */}
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#51627b]">
              <FaSearch size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by Name, Industry, Business Model, or Target Market..."
              className="w-full pl-11 pr-10 py-3 bg-[#131c31] border border-[#1e2c47] rounded-2xl text-xs text-white placeholder:text-[#52637c] focus:outline-none focus:border-[#00F5A0] focus:ring-1 focus:ring-[#00F5A0] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#52637c] hover:text-white"
              >
                <FaTimes size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#6a7b95] mb-1">
                Industry
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full py-2 px-3 bg-[#131c31] border border-[#1e2c47] rounded-xl text-xs font-medium text-[#c0ccd9] focus:outline-none focus:border-[#00F5A0]"
              >
                <option value="all">All Industries</option>
                {filterOptions.industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#6a7b95] mb-1">
                Business Model
              </label>
              <select
                value={selectedBusinessModel}
                onChange={(e) => setSelectedBusinessModel(e.target.value)}
                className="w-full py-2 px-3 bg-[#131c31] border border-[#1e2c47] rounded-xl text-xs font-medium text-[#c0ccd9] focus:outline-none focus:border-[#00F5A0]"
              >
                <option value="all">All Models</option>
                {filterOptions.businessModels.map((bm) => (
                  <option key={bm} value={bm}>
                    {bm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#6a7b95] mb-1">
                Target Market
              </label>
              <select
                value={selectedTargetMarket}
                onChange={(e) => setSelectedTargetMarket(e.target.value)}
                className="w-full py-2 px-3 bg-[#131c31] border border-[#1e2c47] rounded-xl text-xs font-medium text-[#c0ccd9] focus:outline-none focus:border-[#00F5A0]"
              >
                <option value="all">All Markets</option>
                {filterOptions.targetMarkets.map((tm) => (
                  <option key={tm} value={tm}>
                    {tm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#6a7b95] mb-1">
                Budget Range
              </label>
              <select
                value={selectedBudgetRange}
                onChange={(e) => setSelectedBudgetRange(e.target.value)}
                className="w-full py-2 px-3 bg-[#131c31] border border-[#1e2c47] rounded-xl text-xs font-medium text-[#c0ccd9] focus:outline-none focus:border-[#00F5A0]"
              >
                <option value="all">All Budgets</option>
                <option value="under1l">Under ₹1 Lakh</option>
                <option value="1l_10l">₹1 L – ₹10 Lakhs</option>
                <option value="above10l">Above ₹10 Lakhs</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#6a7b95] mb-1">
                Date Timeline
              </label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full py-2 px-3 bg-[#131c31] border border-[#1e2c47] rounded-xl text-xs font-medium text-[#c0ccd9] focus:outline-none focus:border-[#00F5A0]"
              >
                <option value="all">All Time</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </select>
            </div>
          </div>

          {/* Active Summary */}
          <div className="flex items-center justify-between pt-2 border-t border-[#182338] text-xs text-[#7e8ca0]">
            <span>
              Telemetry filtered to{" "}
              <strong className="text-[#00F5A0]">
                {filteredProjects.length}
              </strong>{" "}
              active project(s)
            </span>
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-white font-bold hover:text-[#00F5A0] transition-colors"
              >
                <FaUndo size={10} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Hero Feature Tile + Stat Metric Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Hero Card (Inspired by the $120,873 Cyan Revenue Card) */}
          <div className="lg:col-span-5 bg-[#00F5A0] text-[#080d19] rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-[0_15px_40px_rgba(0,245,160,0.25)] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider font-extrabold text-[#05432d]">
                Aggregate Capital Scored
              </span>
              <div className="w-8 h-8 rounded-full bg-[#080d19] text-[#00F5A0] flex items-center justify-center font-bold text-xs">
                ↗
              </div>
            </div>

            <div className="my-6">
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {formatCurrency(additionalStats.totalBudget)}
              </h3>
              <p className="text-xs font-semibold text-[#05432d] mt-1">
                Avg: {formatCurrency(additionalStats.avgBudget)} per candidate
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#080d19] text-white text-[11px] font-bold">
                {growthPercentage >= 0 ? "+" : ""}
                {growthPercentage.toFixed(1)}% YoY
              </span>
              <span className="text-[11px] font-bold text-[#05432d]">
                From {filteredProjects.length} analyzed batches
              </span>
            </div>
          </div>

          {/* 3 Secondary Stats Tiles */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0e1526] rounded-3xl border border-[#182338] p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6a7b95]">
                  Active Projects
                </span>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {additionalStats.totalProjects}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#162135] flex items-center justify-between text-xs text-[#7e8ca0]">
                <span>In Database</span>
                <FaProjectDiagram className="text-[#00F5A0]" />
              </div>
            </div>

            <div className="bg-[#0e1526] rounded-3xl border border-[#182338] p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6a7b95]">
                  Sectors Monitored
                </span>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {additionalStats.industryCount}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#162135] flex items-center justify-between text-xs text-[#7e8ca0]">
                <span>Industries</span>
                <FaIndustry className="text-[#00F5A0]" />
              </div>
            </div>

            <div className="bg-[#0e1526] rounded-3xl border border-[#182338] p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6a7b95]">
                  Growth Trajectory
                </span>
                <p className="text-2xl font-extrabold text-[#00F5A0] mt-1">
                  {growthPercentage >= 0 ? "+" : ""}
                  {growthPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#162135] flex items-center justify-between text-xs text-[#7e8ca0]">
                <span>MoM Intake</span>
                <FaArrowUp className="text-[#00F5A0]" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Large Composed Trend Chart */}
        <div className="bg-[#0e1526] rounded-3xl border border-[#182338] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#141e33] border border-[#21304f] flex items-center justify-center text-[#00F5A0]">
                <FaChartLine size={14} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Intake Volume & Capital Trajectory
                </h3>
                <p className="text-xs text-[#6a7b95]">
                  Monthly project submissions over time
                </p>
              </div>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#131c31] border border-[#1e2c47] text-[#00F5A0]">
              Telemetry Live
            </span>
          </div>

          {trendsData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendsData}>
                  <defs>
                    <linearGradient
                      id="cyberGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#00F5A0"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#00F5A0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#162238" />
                  <XAxis dataKey="month" stroke="#6a7b95" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#6a7b95" fontSize={11} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#6a7b95"
                    fontSize={11}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "avgBudget") return formatCurrency(value);
                      return value;
                    }}
                    contentStyle={{
                      backgroundColor: "#0d1424",
                      borderColor: "#1d2b45",
                      borderRadius: "16px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#00F5A0"
                    strokeWidth={3}
                    fill="url(#cyberGradient)"
                    yAxisId="left"
                    name="Projects Intake"
                  />
                  <Line
                    type="monotone"
                    dataKey="avgBudget"
                    stroke="#38EF7D"
                    strokeWidth={2}
                    yAxisId="right"
                    name="Average Budget"
                    dot={{ fill: "#00F5A0", r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-[#55657f] text-xs">
              No trend telemetry matching active filters
            </div>
          )}
        </div>

        {/* 5. Sector Breakdown & Average Budget Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Industry Distribution Donut */}
          <div className="bg-[#0e1526] rounded-3xl border border-[#182338] p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              Sector Distribution
            </h3>
            <div className="h-72">
              {(() => {
                let pieData = Object.entries(
                  filteredProjects.reduce((acc, p) => {
                    const ind = p?.industry || "Other";
                    acc[ind] = (acc[ind] || 0) + 1;
                    return acc;
                  }, {}),
                ).map(([name, value]) => ({ name, value }));

                if (
                  pieData.length === 0 ||
                  pieData.every((d) => d.value === 0)
                ) {
                  return (
                    <div className="h-full flex items-center justify-center text-[#55657f] text-xs">
                      No industry metrics available
                    </div>
                  );
                }

                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        label={({ name, value }) => `${name} (${value})`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0d1424",
                          borderColor: "#1d2b45",
                          borderRadius: "16px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>

          {/* Average Budget by Industry (Custom Bar Fill style like Corelytics image) */}
          <div className="bg-[#0e1526] rounded-3xl border border-[#182338] p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              Sector Budget Allocation
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetByIndustry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#162238" />
                  <XAxis
                    dataKey="industry"
                    angle={-35}
                    textAnchor="end"
                    height={70}
                    stroke="#6a7b95"
                    fontSize={11}
                  />
                  <YAxis stroke="#6a7b95" fontSize={11} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "#0d1424",
                      borderColor: "#1d2b45",
                      borderRadius: "16px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="avgBudget"
                    fill="#00F5A0"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 6. Recent Projects Candidate Table */}
        <div className="bg-[#0e1526] rounded-3xl border border-[#182338] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Recent Scored Projects (Top 10)
              </h3>
              <p className="text-xs text-[#6a7b95]">
                Click any row to open the instant AI failure analysis report
              </p>
            </div>
          </div>

          {top10Projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#182338] text-[11px] font-mono text-[#6a7b95] uppercase">
                    <th className="py-3 px-4">Project Name</th>
                    <th className="py-3 px-4">Industry</th>
                    <th className="py-3 px-4">Business Model</th>
                    <th className="py-3 px-4">Target Market</th>
                    <th className="py-3 px-4">Budget</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Inference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141d30]">
                  {top10Projects.map((project) => (
                    <tr
                      key={project.id}
                      onClick={() => {
                        setSelectedProject(project);
                        handleViewAnalysis(project.id);
                      }}
                      className="hover:bg-[#121a2e] transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 text-xs font-bold text-white group-hover:text-[#00F5A0]">
                        {project.project_name}
                      </td>
                      <td className="py-4 px-4 text-xs text-[#9bb0cb]">
                        <span className="px-2.5 py-1 rounded-full bg-[#141e33] border border-[#21304f] text-[#00F5A0] text-[10px] font-semibold">
                          {project.industry}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-[#8ca0be]">
                        {project.business_model}
                      </td>
                      <td className="py-4 px-4 text-xs text-[#8ca0be]">
                        {project.target_market}
                      </td>
                      <td className="py-4 px-4 text-xs font-mono font-bold text-white">
                        {project.budget
                          ? formatCurrency(project.budget)
                          : "N/A"}
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-[#62738d]">
                        {project.created_at
                          ? new Date(project.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAnalysis(project.id);
                          }}
                          className="px-3 py-1.5 bg-[#141e33] hover:bg-[#00F5A0] hover:text-[#080d19] text-[#00F5A0] rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 border border-[#21304f]"
                        >
                          <FaEye size={11} />
                          <span>Report</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProjects.length > 10 && (
                <div className="text-center py-3 text-xs text-[#62738d] border-t border-[#182338]">
                  Showing top 10 of {filteredProjects.length} candidate projects
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-[#55657f] text-xs">
              No matching records found. Try adjusting your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
