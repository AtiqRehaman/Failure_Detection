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

const COLORS = [
  "#0f172a",
  "#334155",
  "#475569",
  "#64748b",
  "#94a3b8",
  "#cbd5e1",
  "#e2e8f0",
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
        message: "Failed to load dashboard data",
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
      // 1. Search Query Filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p?.project_name?.toLowerCase().includes(query) ||
        p?.industry?.toLowerCase().includes(query) ||
        p?.business_model?.toLowerCase().includes(query) ||
        p?.target_market?.toLowerCase().includes(query);

      // 2. Industry Filter
      const matchesIndustry =
        selectedIndustry === "all" || p?.industry === selectedIndustry;

      // 3. Business Model Filter
      const matchesBusinessModel =
        selectedBusinessModel === "all" ||
        p?.business_model === selectedBusinessModel;

      // 4. Target Market Filter
      const matchesTargetMarket =
        selectedTargetMarket === "all" ||
        p?.target_market === selectedTargetMarket;

      // 5. Budget Range Filter
      let matchesBudget = true;
      const budgetNum = Number(p?.budget) || 0;
      if (selectedBudgetRange === "under1l") {
        matchesBudget = budgetNum < 100000;
      } else if (selectedBudgetRange === "1l_10l") {
        matchesBudget = budgetNum >= 100000 && budgetNum <= 1000000;
      } else if (selectedBudgetRange === "above10l") {
        matchesBudget = budgetNum > 1000000;
      }

      // 6. Date Range Filter
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

    // Sort descending by date so most recent projects are first
    return results.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [
    projects,
    searchQuery,
    selectedIndustry,
    selectedBusinessModel,
    selectedTargetMarket,
    selectedBudgetRange,
    selectedDateRange,
  ]);

  // Top 10 most recent projects for the table
  const top10Projects = useMemo(() => {
    return filteredProjects.slice(0, 10);
  }, [filteredProjects]);

  // Reset all filters
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

  // Calculate statistics derived from filtered projects
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
      (p) => !isNaN(Number(p?.budget)) && Number(p?.budget) > 0
    );
    const countForAvg =
      validBudgetProjects.length > 0
        ? validBudgetProjects.length
        : filteredProjects.length;

    const avgBudget = countForAvg > 0 ? totalBudget / countForAvg : 0;
    const industries = new Set(
      filteredProjects.map((p) => p?.industry).filter(Boolean)
    );
    const businessModels = new Set(
      filteredProjects.map((p) => p?.business_model).filter(Boolean)
    );

    return {
      totalProjects: filteredProjects.length,
      totalBudget: isNaN(totalBudget) ? 0 : totalBudget,
      avgBudget: isNaN(avgBudget) ? 0 : avgBudget,
      industryCount: industries.size,
      businessModelCount: businessModels.size,
    };
  }, [filteredProjects]);

  // Indian Numbering System Formatter
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

  // Trend chart data
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

  // Budget by industry
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

  // Navigate to detailed project analysis view
  const handleViewAnalysis = (projectId) => {
    navigate(`/analysis/${projectId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" color="black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-slate-900 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-[9999] max-w-md w-full transition-all">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 border border-slate-300 text-slate-800 text-xs font-semibold tracking-wider uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              Analytics Overview
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-base text-slate-600 max-w-2xl leading-relaxed">
              Overview of all projects and market intelligence insights.
            </p>
          </div>
        </div>

        {/* Search Bar & Filter Controls */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <FaSearch size={16} />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by Name, Industry, Business Model, or Target Market..."
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                title="Clear search query"
              >
                <FaTimes size={16} />
              </button>
            )}
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Industry
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900"
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Business Model
              </label>
              <select
                value={selectedBusinessModel}
                onChange={(e) => setSelectedBusinessModel(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900"
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Target Market
              </label>
              <select
                value={selectedTargetMarket}
                onChange={(e) => setSelectedTargetMarket(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900"
              >
                <option value="all">All Target Markets</option>
                {filterOptions.targetMarkets.map((tm) => (
                  <option key={tm} value={tm}>
                    {tm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Budget Range
              </label>
              <select
                value={selectedBudgetRange}
                onChange={(e) => setSelectedBudgetRange(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900"
              >
                <option value="all">All Budgets</option>
                <option value="under1l">Under ₹1 Lakh</option>
                <option value="1l_10l">₹1 L – ₹10 Lakhs</option>
                <option value="above10l">Above ₹10 Lakhs</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Date Filter
              </label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900"
              >
                <option value="all">All Time</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-medium">
              Showing <strong>{filteredProjects.length}</strong> matching project(s)
            </span>

            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-slate-900 font-bold hover:underline"
              >
                <FaUndo size={10} />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Projects
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {additionalStats.totalProjects}
                </p>
              </div>
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-900">
                <FaProjectDiagram size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Average Budget
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(additionalStats.avgBudget)}
                </p>
              </div>
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-900">
                <FaRupeeSign size={20} />
              </div>
            </div>
            {filteredProjects.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-slate-500">
                  Based on {filteredProjects.length} projects
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Industries
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {additionalStats.industryCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-900">
                <FaIndustry size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Growth Rate
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {growthPercentage >= 0 ? "+" : ""}
                  {growthPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-900">
                <FaArrowUp size={20} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-slate-500">Month over month growth</p>
            </div>
          </div>
        </div>

        {/* Project Trends Composed Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-900">
                <FaChartLine size={14} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Project Trends
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-500">
                Interest over time
              </span>
              <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
            </div>
          </div>

          {trendsData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendsData}>
                  <defs>
                    <linearGradient
                      id="trendGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#0f172a"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="#0f172a"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="budgetGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#64748b"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="#64748b"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "avgBudget") return formatCurrency(value);
                      return value;
                    }}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "8px",
                      color: "#0f172a",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0f172a"
                    strokeWidth={2}
                    fill="url(#trendGradient)"
                    yAxisId="left"
                    name="Projects"
                  />
                  <Area
                    type="monotone"
                    dataKey="avgBudget"
                    stroke="#64748b"
                    strokeWidth={2}
                    fill="url(#budgetGradient)"
                    yAxisId="right"
                    name="Avg Budget"
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0f172a"
                    strokeWidth={2}
                    yAxisId="left"
                    name="Project Count"
                    dot={{ fill: "#0f172a", r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgBudget"
                    stroke="#475569"
                    strokeWidth={2}
                    yAxisId="right"
                    name="Avg Budget"
                    dot={{ fill: "#475569", r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-400 font-medium text-sm">
              No data available for current search and filters
            </div>
          )}
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Industry Distribution
            </h3>
            <div className="h-72">
              {(() => {
                let pieData = Object.entries(
                  filteredProjects.reduce((acc, p) => {
                    const ind = p?.industry || "Other";
                    acc[ind] = (acc[ind] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([name, value]) => ({ name, value }));

                if (
                  pieData.length === 0 ||
                  pieData.every((d) => d.value === 0)
                ) {
                  return (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                      No industry data available
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
                        outerRadius={80}
                        label={({ name, value }) => `${name} (${value})`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} Projects`, "Count"]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "8px",
                          color: "#0f172a",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Average Budget by Industry
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetByIndustry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="industry"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Industry: ${label}`}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "8px",
                      color: "#0f172a",
                    }}
                  />
                  <Bar
                    dataKey="avgBudget"
                    fill="#0f172a"
                    name="Average Budget"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Top 10 Recent Projects
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing top 10 most recent projects based on selected filters and date
              </p>
            </div>
          </div>

          {top10Projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Project Name
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Industry
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Business Model
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Target Market
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Budget
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Submitted Date
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {top10Projects.map((project) => (
                    <tr
                      key={project.id}
                      onClick={() => {
                        setSelectedProject(project);
                        handleViewAnalysis(project.id);
                      }}
                      className={`group hover:bg-slate-100/80 transition-colors cursor-pointer ${
                        selectedProject?.id === project.id
                          ? "bg-slate-50 font-medium"
                          : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-sm font-bold text-slate-900 group-hover:underline">
                        {project.project_name}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-600">
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-md text-xs font-medium">
                          {project.industry}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-600">
                        {project.business_model}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-600">
                        {project.target_market}
                      </td>
                      <td className="py-3.5 px-4 text-sm font-medium text-slate-900">
                        {project.budget
                          ? formatCurrency(project.budget)
                          : "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-500">
                        {project.created_at
                          ? new Date(project.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAnalysis(project.id);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                          title="View Analysis Report"
                        >
                          <FaEye size={12} />
                          <span>Analysis</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredProjects.length > 10 && (
                <div className="text-center py-3 text-xs text-slate-500 border-t border-slate-100 font-medium">
                  Showing top 10 of {filteredProjects.length} matching projects
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 font-medium">
                No projects match the selected search and filter criteria
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-3 text-xs text-slate-900 font-bold hover:underline"
              >
                Clear all filters and search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;