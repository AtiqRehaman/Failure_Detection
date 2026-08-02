import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { 
  FaArrowLeft, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaLightbulb, 
  FaChartLine, 
  FaBuilding, 
  FaFileAlt, 
  FaDownload, 
  FaPrint, 
  FaShare 
} from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import axios from 'axios';

const ProjectAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchProjectAnalysis();
  }, [id]);

  const fetchProjectAnalysis = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${id}/analysis`);
      const { project: projectData, analysis: analysisData } = response.data.data;
      setProject(projectData);
      setAnalysis(analysisData);
    } catch (error) {
      setToast({
        message: 'Failed to load project analysis',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Indian Numbering System Formatter (k, Lakh, Crore)
  const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount === 0) return '₹0';

    if (numericAmount >= 10000000) {
      return `₹${(numericAmount / 10000000).toFixed(2)} Cr`;
    } else if (numericAmount >= 100000) {
      return `₹${(numericAmount / 100000).toFixed(2)} L`;
    } else if (numericAmount >= 1000) {
      return `₹${(numericAmount / 1000).toFixed(1)}k`;
    }
    
    return `₹${numericAmount.toLocaleString('en-IN')}`;
  };

  // Prepare radar chart data
  const getRadarData = () => {
    if (!analysis) return [];
    return [
      { subject: 'Market Potential', value: analysis.marketScore || 0, fullMark: 100 },
      { subject: 'Growth Potential', value: analysis.growthPotential || 0, fullMark: 100 },
      { subject: 'Success Prob.', value: analysis.successProbability || 0, fullMark: 100 },
      { subject: 'Competition', value: analysis.competitionLevel === 'High' ? 30 : analysis.competitionLevel === 'Medium' ? 60 : 90, fullMark: 100 },
      { subject: 'Risk Rating', value: analysis.riskLevel === 'High' ? 30 : analysis.riskLevel === 'Medium' ? 60 : 90, fullMark: 100 }
    ];
  };

  // Render SWOT Cards cleanly
  const renderSWOTList = (items) => {
    if (!items || items.length === 0) return <p className="text-xs text-slate-400">No data provided</p>;
    return items.map((item, index) => (
      <div key={index} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-2 last:mb-0">
        <span className="text-xs font-medium text-slate-800 leading-relaxed block">{item}</span>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" color="black" />
      </div>
    );
  }

  if (!project || !analysis) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-sm">
          <p className="text-slate-600 font-medium">Project analysis record not found.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-slate-900 selection:text-white">
      
      {/* Toast Notification Container */}
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
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition-colors"
              title="Back to Dashboard"
            >
              <FaArrowLeft size={16} />
            </button>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-200/80 border border-slate-300 text-slate-800 text-[11px] font-semibold tracking-wider uppercase mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                Analysis Report
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {project.project_name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {project.industry} • {project.business_model}
              </p>
            </div>
          </div>

          {/* <div className="flex items-center gap-2.5">
            <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2">
              <FaDownload size={12} />
              Export
            </button>
            <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2">
              <FaPrint size={12} />
              Print
            </button>
            <button className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2">
              <FaShare size={12} />
              Share
            </button>
          </div> */}
        </div>

        {/* 1. Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {analysis.keyMetrics?.map((metric, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{metric.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{metric.value}</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">{metric.description}</p>
            </div>
          ))}
        </div>

        {/* 2. Primary Analysis Grid: Radar Scorecard + Market Signals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Success Factors Radar Chart (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-900">
                <FaChartLine size={14} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Success Factors Scorecard</h3>
            </div>

            <div className="h-80 my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={getRadarData()}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" fontSize={10} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#0f172a"
                    fill="#0f172a"
                    fillOpacity={0.25}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Trends (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-900">
                  <FaBuilding size={14} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Market Dynamics</h3>
              </div>

              <div className="space-y-4 pt-2">
                {analysis.marketTrends?.map((trend, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{trend.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-bold">{trend.value}%</span>
                        <span className={`text-[10px] font-bold ${trend.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {trend.trend === 'up' ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                      <div
                        className="h-full bg-slate-900 rounded-full transition-all duration-500"
                        style={{ width: `${trend.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* 3. AI Recommendations Block */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-900">
              <FaLightbulb size={14} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">AI Strategic Action Plan</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.recommendations?.map((rec, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{rec.category}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                      rec.priority === 'High' ? 'bg-slate-900 text-white border-slate-900' :
                      rec.priority === 'Medium' ? 'bg-slate-200 text-slate-800 border-slate-300' :
                      'bg-white text-slate-600 border-slate-200'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. SWOT Analysis Matrix */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Strategic SWOT Matrix</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5 flex items-center gap-2">
                <FaCheckCircle className="text-slate-900" size={14} />
                Strengths
              </h4>
              {renderSWOTList(analysis.swot?.strengths)}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5 flex items-center gap-2">
                <FaExclamationTriangle className="text-slate-900" size={14} />
                Weaknesses
              </h4>
              {renderSWOTList(analysis.swot?.weaknesses)}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5 flex items-center gap-2">
                <FaLightbulb className="text-slate-900" size={14} />
                Opportunities
              </h4>
              {renderSWOTList(analysis.swot?.opportunities)}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5 flex items-center gap-2">
                <FaExclamationTriangle className="text-slate-900" size={14} />
                Threats
              </h4>
              {renderSWOTList(analysis.swot?.threats)}
            </div>
          </div>
        </div>

        {/* 5. Full Project Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-900">
              <FaFileAlt size={14} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Project Specifications</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Name</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{project.project_name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Industry</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{project.industry}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Model</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{project.business_model}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Market</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{project.target_market}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget Allocation</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{formatCurrency(project.budget)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Submission Date</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Executive Overview</p>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-1">{project.description}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectAnalysis;
