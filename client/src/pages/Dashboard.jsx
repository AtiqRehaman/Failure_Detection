import React, { useState, useEffect } from 'react';
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
  Cell
} from 'recharts';
import { getProjects } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { FaProjectDiagram, FaIndustry, FaUsers, FaDollarSign } from 'react-icons/fa';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    industryDistribution: [],
    recentProjects: []
  });
  const [toast, setToast] = useState(null);

  // Professional slate/monochrome color palette for charts
  const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
  try {
    setLoading(true);
    const response = await getProjects();
    console.log('Full API Response:', response);
    
    const { data, stats: dashboardStats } = response;
    
    // Fix: Convert count strings to numbers
    let industryDistribution = dashboardStats?.industryDistribution || [];
    industryDistribution = industryDistribution.map(item => ({
      ...item,
      count: parseInt(item.count) || 0  // Convert string to number
    }));
    
    console.log('Fixed Industry Distribution:', industryDistribution);
    
    setProjects(data || []);
    setStats({
      totalProjects: dashboardStats?.totalProjects || 0,
      industryDistribution: industryDistribution,
      recentProjects: data?.slice(0, 5) || []
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    setToast({
      message: 'Failed to load dashboard data',
      type: 'error'
    });
  } finally {
    setLoading(false);
  }
};

  // Calculate additional stats
  const calculateAdditionalStats = () => {
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const industries = new Set(projects.map(p => p.industry));
    const businessModels = new Set(projects.map(p => p.business_model));
    
    return {
      totalBudget: totalBudget,
      industryCount: industries.size,
      businessModelCount: businessModels.size,
      averageBudget: projects.length > 0 ? totalBudget / projects.length : 0
    };
  };

  const additionalStats = calculateAdditionalStats();

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `₹${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  // Get budget data for chart
  const getBudgetData = () => {
    return projects.slice(0, 10).map(p => ({
      name: p.project_name.length > 20 ? p.project_name.substring(0, 20) + '...' : p.project_name,
      budget: p.budget || 0
    }));
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
      
      {/* Toast Notification Positioned Cleanly */}
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
            Overview of all submitted projects and market intelligence insights.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Projects</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-900">
                <FaProjectDiagram size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Industries</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{additionalStats.industryCount}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-900">
                <FaIndustry size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Business Models</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{additionalStats.businessModelCount}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-900">
                <FaUsers size={20} />
              </div>
            </div>
          </div>

          {/* <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Budget</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(additionalStats.totalBudget)}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-900">
                <FaDollarSign size={20} />
              </div>
            </div>
          </div> */}

        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Industry Distribution - Pie Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Industry Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.industryDistribution}
                    dataKey="count"
                    nameKey="industry"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => entry.industry}
                  >
                    {stats.industryDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget Distribution - Bar Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Budget Distribution (Top 10)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getBudgetData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                  />
                  <Bar dataKey="budget" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Recent Projects Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Projects</h3>
          {stats.recentProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Project Name</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Industry</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Business Model</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Budget</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentProjects.map((project) => (
                    <tr 
                      key={project.id} 
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-sm font-medium text-slate-900">{project.project_name}</td>
                      <td className="py-3.5 px-4 text-sm text-slate-600">
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-md text-xs font-medium">
                          {project.industry}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-600">{project.business_model}</td>
                      <td className="py-3.5 px-4 text-sm font-medium text-slate-900">
                        {project.budget ? formatCurrency(project.budget) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-500">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 font-medium">No projects submitted yet</p>
              <p className="text-sm text-slate-400 mt-1">Submit your first project to see analytics here.</p>
            </div>
          )}
        </div>

        {/* Market Intelligence Section */}
        {/* <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div>
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