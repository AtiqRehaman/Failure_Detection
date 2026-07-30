import React, { useState, useEffect } from "react";
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
  LineChart,
  Line,
  Area,
  ComposedChart,
} from "recharts";
import { getProjects } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Toast from "../components/Toast";
import { getMarketIntelligence } from '../services/api';
import MarketIntelligencePanel from "./MarketIntelligencePanel";
import {
  FaProjectDiagram,
  FaIndustry,
  FaUsers,
  FaRupeeSign,
  FaChartLine,
  FaArrowUp,
  FaCalendarAlt,
  FaBolt, FaSearch, FaExclamationTriangle,
  FaBuilding,
} from "react-icons/fa";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    industryDistribution: [],
    recentProjects: [],
  });
  const [toast, setToast] = useState(null);
  const [timeRange, setTimeRange] = useState("all");

  const COLORS = [
    "#0f172a",
    "#334155",
    "#475569",
    "#64748b",
    "#94a3b8",
    "#cbd5e1",
    "#e2e8f0",
  ];
  const TREND_COLORS = ["#0f172a", "#475569", "#64748b", "#94a3b8", "#cbd5e1"];

  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getProjects();
      const { data, stats: dashboardStats } = response;

      const projectList = Array.isArray(data) ? data : [];
      setProjects(projectList);
      setStats({
        totalProjects: dashboardStats?.totalProjects || projectList.length || 0,
        industryDistribution: dashboardStats?.industryDistribution || [],
        recentProjects: projectList.slice(0, 5),
      });
    } catch (error) {
      setToast({
        message: "Failed to load dashboard data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAdditionalStats = () => {
    if (!Array.isArray(projects) || projects.length === 0) {
      return {
        totalBudget: 0,
        avgBudget: 0,
        industryCount: 0,
        businessModelCount: 0,
        averageBudget: 0,
      };
    }

    const totalBudget = projects.reduce((sum, p) => {
      const budgetNum = Number(p?.budget);
      return sum + (!isNaN(budgetNum) ? budgetNum : 0);
    }, 0);

    const validBudgetProjects = projects.filter(
      (p) => !isNaN(Number(p?.budget)) && Number(p?.budget) > 0,
    );
    const countForAvg =
      validBudgetProjects.length > 0
        ? validBudgetProjects.length
        : projects.length;

    const avgBudget = countForAvg > 0 ? totalBudget / countForAvg : 0;
    const industries = new Set(
      projects.map((p) => p?.industry).filter(Boolean),
    );
    const businessModels = new Set(
      projects.map((p) => p?.business_model).filter(Boolean),
    );

    return {
      totalBudget: isNaN(totalBudget) ? 0 : totalBudget,
      avgBudget: isNaN(avgBudget) ? 0 : avgBudget,
      industryCount: industries.size,
      businessModelCount: businessModels.size,
      averageBudget: isNaN(avgBudget) ? 0 : avgBudget,
    };
  };

  const additionalStats = calculateAdditionalStats();

  // Indian Numbering System Formatter (k, Lakh, Crore)
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

  const getTrendsData = () => {
    const grouped = {};
    projects.forEach((p) => {
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
  };

  const getIndustryTrends = () => {
    const trends = {};
    projects.forEach((p) => {
      if (!p?.created_at) return;
      const date = new Date(p.created_at);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const industry = p.industry || "Other";

      if (!trends[industry]) {
        trends[industry] = {};
      }
      if (!trends[industry][monthKey]) {
        trends[industry][monthKey] = 0;
      }
      trends[industry][monthKey]++;
    });

    const industryCounts = {};
    projects.forEach((p) => {
      const industry = p.industry || "Other";
      industryCounts[industry] = (industryCounts[industry] || 0) + 1;
    });

    const topIndustries = Object.entries(industryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([industry]) => industry);

    const months = [
      ...new Set(
        projects
          .map((p) =>
            p?.created_at
              ? new Date(p.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              : null,
          )
          .filter(Boolean),
      ),
    ];

    return {
      topIndustries,
      data: months.map((month) => {
        const point = { month };
        topIndustries.forEach((industry) => {
          point[industry] = (trends[industry] && trends[industry][month]) || 0;
        });
        return point;
      }),
    };
  };

  const getBudgetByIndustry = () => {
    const industries = {};
    projects.forEach((p) => {
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
  };

  const trendsData = getTrendsData();
  const industryTrends = getIndustryTrends();
  const budgetByIndustry = getBudgetByIndustry();

  const calculateGrowth = () => {
    if (trendsData.length < 2) return 0;
    const last = trendsData[trendsData.length - 1]?.count || 0;
    const prev = trendsData[trendsData.length - 2]?.count || 0;
    if (prev === 0) return last > 0 ? 100 : 0;
    const growth = ((last - prev) / prev) * 100;
    return isNaN(growth) ? 0 : growth;
  };

  const growthPercentage = calculateGrowth();

  const getFilteredRecentProjects = () => {
    const now = new Date();
    let filtered = [...projects];

    if (timeRange === "week") {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      filtered = filtered.filter((p) => new Date(p.created_at) > weekAgo);
    } else if (timeRange === "month") {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filtered = filtered.filter((p) => new Date(p.created_at) > monthAgo);
    }

    return filtered.slice(0, 5);
  };

  const filteredRecentProjects = getFilteredRecentProjects();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" color="black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-slate-900 selection:text-white">
      {/* Toast Alert Container */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-[9999] max-w-md w-full transition-all">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 border border-slate-300 text-slate-800 text-xs font-semibold tracking-wider uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            Analytics Overview
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-base text-slate-600 max-w-2xl leading-relaxed">
            Overview of all projects and market intelligence insights.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Projects
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.totalProjects}
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
            {projects.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-slate-500">
                  Based on {projects.length} projects
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

        {/* Project Trends */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
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
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
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
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
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
              No data available for trends
            </div>
          )}
        </div>

        {/* Industry Trends */}
        {/* <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-900">
              <FaBuilding size={14} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Industry Trends
            </h3>
          </div>

          {industryTrends.data.length > 0 &&
          industryTrends.topIndustries.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={industryTrends.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "8px",
                      color: "#0f172a",
                    }}
                  />
                  {industryTrends.topIndustries.map((industry, index) => (
                    <Line
                      key={industry}
                      type="monotone"
                      dataKey={industry}
                      stroke={TREND_COLORS[index % TREND_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-400 font-medium text-sm">
              No industry trend data available
            </div>
          )}
        </div> */}

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Industry Distribution - Pie Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Industry Distribution
            </h3>
            <div className="h-72">
              {(() => {
                // 1. Process data from stats or fallback to calculating directly from project list
                let pieData =
                  Array.isArray(stats.industryDistribution) &&
                  stats.industryDistribution.length > 0
                    ? stats.industryDistribution.map((item) => ({
                        name: item.industry || item.name || "Other",
                        value: Number(
                          item.count || item.value || item.projects || 0,
                        ),
                      }))
                    : Object.entries(
                        projects.reduce((acc, p) => {
                          const ind = p?.industry || "Other";
                          acc[ind] = (acc[ind] || 0) + 1;
                          return acc;
                        }, {}),
                      ).map(([name, value]) => ({ name, value }));

                // 2. Render chart or empty state
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

        {/* Recent Projects Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">
              Recent Projects
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTimeRange("week")}
                className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium border ${
                  timeRange === "week"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FaCalendarAlt className="inline mr-1" size={10} />
                Week
              </button>
              <button
                onClick={() => setTimeRange("month")}
                className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium border ${
                  timeRange === "month"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FaCalendarAlt className="inline mr-1" size={10} />
                Month
              </button>
              <button
                onClick={() => setTimeRange("all")}
                className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium border ${
                  timeRange === "all"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {filteredRecentProjects.length > 0 ? (
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
                      Budget
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecentProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-sm font-medium text-slate-900">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 font-medium">
                No projects found for this time range
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Try selecting a different time filter.
              </p>
            </div>
          )}
        </div>
        {/* Market Intelligence Banner */}
        {/* <MarketIntelligencePanel selectedProject={selectedProject || stats.recentProjects[0]} /> */}
        {/* <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">Market Intelligence Coming Soon</h3>
              <p className="text-slate-600 mt-1 text-sm leading-relaxed">
                AI-powered market analysis, competitor insights, and strategic recommendations will be available in future updates.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-medium">
                  AI Analysis
                </span>
                <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-medium">
                  Competitor Tracking
                </span>
                <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-medium">
                  Market Trends
                </span>
                <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-medium">
                  Risk Assessment
                </span>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;
