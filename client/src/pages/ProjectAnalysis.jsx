import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBuilding,
  FaFileAlt,
  FaDownload,
  FaBrain,
  FaShieldAlt,
  FaRocket,
  FaInfoCircle,
  FaChartPie,
  FaSatelliteDish,
  FaLightbulb,
} from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import Toast from "../components/Toast";
import axios from "axios";

const ProjectAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [toast, setToast] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("token");

  // Professional slate/monochrome chart palette
  const CHART_COLORS = [
    "#0f172a",
    "#334155",
    "#475569",
    "#64748b",
    "#94a3b8",
    "#cbd5e1",
  ];

  useEffect(() => {
    if (!id || id === "undefined" || id === "null") {
      setToast({
        message: "Invalid project ID. Redirecting to dashboard...",
        type: "error",
      });
      setTimeout(() => navigate("/dashboard"), 2000);
      return;
    }

    fetchProjectAssessment();
  }, [id]);

  const fetchProjectAssessment = async () => {
    try {
      setLoading(true);

      // Get project details
      const projectResponse = await axios.get(`${API_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (projectResponse.data.status === "success") {
        setProject(projectResponse.data.data);
      }

      // Try to get existing assessment
      try {
        const assessmentResponse = await axios.get(
          `${API_URL}/assessment/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (assessmentResponse.data.status === "success") {
          setAssessment(assessmentResponse.data.data);
        }
      } catch (error) {
        console.log("No assessment found. Click generate to create one.");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      setToast({
        message: error.response?.data?.message || "Failed to load project",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAssessment = async () => {
    try {
      setIsGenerating(true);
      setToast({
        message: "Generating AI-powered assessment... This may take a moment.",
        type: "info",
      });

      const response = await axios.post(
        `${API_URL}/assessment/${id}/generate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.status === "success") {
        setToast({
          message: "Assessment generated successfully!",
          type: "success",
        });
        // Refresh assessment data
        const assessmentResponse = await axios.get(
          `${API_URL}/assessment/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (assessmentResponse.data.status === "success") {
          setAssessment(assessmentResponse.data.data);
        }
      }
    } catch (error) {
      console.error("Error generating assessment:", error);
      setToast({
        message:
          error.response?.data?.message || "Failed to generate assessment",
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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

  const getPriorityBadge = (priority) => {
    const styles = {
      CRITICAL: "bg-slate-900 text-white border-slate-900",
      HIGH: "bg-slate-800 text-white border-slate-800",
      MEDIUM: "bg-slate-200 text-slate-800 border-slate-300",
      LOW: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return styles[priority] || styles["MEDIUM"];
  };

  // Prepare risk data for charts
  const getRiskChartData = () => {
    if (!assessment?.risks) return [];
    return assessment.risks.map((risk) => ({
      category: risk.risk_category,
      score: risk.risk_score || 0,
      priority: risk.priority_level || "MEDIUM",
    }));
  };

  // Prepare SWOT data
  const getSWOTData = () => {
    if (!assessment?.swot)
      return { strengths: [], weaknesses: [], opportunities: [], threats: [] };
    const swot = assessment.swot;
    return {
      strengths: swot.strengths || [],
      weaknesses: swot.weaknesses || [],
      opportunities: swot.opportunities || [],
      threats: swot.threats || [],
    };
  };

  const swotData = getSWOTData();
  const riskChartData = getRiskChartData();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" color="black" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-sm">
          <p className="text-slate-600 font-medium">Project not found</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const hasAssessment =
    assessment &&
    (assessment.risks?.length > 0 || assessment.swot || assessment.prediction);

  // SWOT Items renderer
  const renderSWOTItems = (items) => {
    if (!items || items.length === 0) {
      return (
        <p className="text-slate-400 text-xs italic">No items identified</p>
      );
    }

    return items.map((item, index) => (
      <div
        key={index}
        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-2 last:mb-0 flex items-start gap-2"
      >
        <span className="text-xs font-medium text-slate-800 leading-relaxed block">
          {item}
        </span>
      </div>
    ));
  };

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

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition-colors"
              title="Back to Dashboard"
            >
              <FaArrowLeft size={16} />
            </button>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-200/80 border border-slate-300 text-slate-800 text-[11px] font-semibold tracking-wider uppercase mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                Project Intelligence Assessment
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {project.project_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-slate-500 font-medium">
                <span>{project.industry || "N/A"}</span>
                <span>•</span>
                <span>{project.business_model || "N/A"}</span>
                <span>•</span>
                <span className="font-semibold text-slate-900">
                  Budget: {formatCurrency(project.budget)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={generateAssessment}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>
                    {hasAssessment ? "Regenerating..." : "Generating..."}
                  </span>
                </>
              ) : (
                <>
                  <FaBrain size={14} />
                  <span>
                    {hasAssessment
                      ? "Regenerate Analysis"
                      : "Generate AI Analysis"}
                  </span>
                </>
              )}
            </button>

            {/* <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2">
              <FaDownload size={12} />
              Export
            </button> */}
          </div>
        </div>

        {/* Status Banner - Show if assessment exists */}
        {hasAssessment && assessment.prediction && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                  <FaRocket size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Success Probability
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                    {assessment.prediction.success_probability || 0}%
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Overall Risk Score
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {assessment.prediction.overall_risk_score || 0}%
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Confidence Rating
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {assessment.prediction.confidence_score || 0}%
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  System Evaluation
                </p>
                <span className="inline-block mt-1 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-900 rounded-lg text-xs font-bold">
                  {(assessment.prediction.success_probability || 0) >= 70
                    ? "High Potential"
                    : (assessment.prediction.success_probability || 0) >= 50
                      ? "Moderate Potential"
                      : "Needs Review"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
          {[
            { key: "overview", label: "Overview", icon: FaInfoCircle },
            { key: "risks", label: "Risk Assessment", icon: FaShieldAlt },
            { key: "swot", label: "SWOT Matrix", icon: FaChartPie },
            { key: "details", label: "Project Details", icon: FaFileAlt },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-semibold transition-all rounded-lg flex items-center gap-2 ${
                  isTabActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon size={12} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {hasAssessment ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Risk Categories
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">
                      {assessment.risks?.length || 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Categories evaluated
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      SWOT Points
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">
                      {(swotData.strengths?.length || 0) +
                        (swotData.weaknesses?.length || 0) +
                        (swotData.opportunities?.length || 0) +
                        (swotData.threats?.length || 0)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Identified factors
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Success Score
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">
                      {assessment.prediction?.success_probability || 0}%
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Model prediction
                    </p>
                  </div>
                </div>

                {/* Risk Overview Chart */}
                {riskChartData.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-900">
                        <FaSatelliteDish size={14} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Risk Score Distribution
                      </h3>
                    </div>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={riskChartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="category"
                            stroke="#64748b"
                            fontSize={12}
                          />
                          <YAxis
                            domain={[0, 100]}
                            stroke="#64748b"
                            fontSize={12}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#ffffff",
                              borderColor: "#e2e8f0",
                              borderRadius: "8px",
                              color: "#0f172a",
                            }}
                          />
                          <Bar
                            dataKey="score"
                            fill="#0f172a"
                            radius={[4, 4, 0, 0]}
                          >
                            {riskChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 bg-slate-100 border border-slate-200 text-slate-900 rounded-2xl flex items-center justify-center mx-auto">
                    <FaBrain size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    No Assessment Generated
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Generate an AI-powered assessment to evaluate risk factors,
                    SWOT matrix, and success predictions.
                  </p>
                  <button
                    onClick={generateAssessment}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        <span>Generating Assessment...</span>
                      </>
                    ) : (
                      <>
                        <FaBrain size={14} />
                        <span>Generate AI Assessment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Risk Assessment */}
        {activeTab === "risks" && (
          <div className="space-y-6">
            {hasAssessment && assessment.risks?.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assessment.risks.map((risk, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {risk.risk_category}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {risk.risk_description || "Risk factor analysis"}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase ${getPriorityBadge(risk.priority_level)}`}
                        >
                          {risk.priority_level || "MEDIUM"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                          <span>Risk Rating</span>
                          <span>{risk.risk_score || 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="h-full bg-slate-900 rounded-full transition-all duration-500"
                            style={{ width: `${risk.risk_score || 0}%` }}
                          />
                        </div>
                      </div>

                      {risk.mitigation_strategy && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Mitigation Strategy
                          </p>
                          <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
                            {risk.mitigation_strategy}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Risk Overview Spectrum
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="category"
                          stroke="#64748b"
                          fontSize={12}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#64748b"
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderColor: "#e2e8f0",
                            borderRadius: "8px",
                            color: "#0f172a",
                          }}
                        />
                        <Bar
                          dataKey="score"
                          fill="#0f172a"
                          radius={[4, 4, 0, 0]}
                        >
                          {riskChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">
                  No risk assessment available. Click "Generate AI Analysis" to
                  calculate risk metrics.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: SWOT Matrix */}
        {activeTab === "swot" && (
          <div className="space-y-6">
            {hasAssessment &&
            (swotData.strengths?.length > 0 ||
              swotData.weaknesses?.length > 0) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5 flex items-center gap-2">
                    <FaCheckCircle className="text-slate-900" size={14} />
                    Strengths
                  </h4>
                  {renderSWOTItems(swotData.strengths)}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5 flex items-center gap-2">
                    <FaExclamationTriangle
                      className="text-slate-900"
                      size={14}
                    />
                    Weaknesses
                  </h4>
                  {renderSWOTItems(swotData.weaknesses)}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5 flex items-center gap-2">
                    <FaLightbulb className="text-slate-900" size={14} />
                    Opportunities
                  </h4>
                  {renderSWOTItems(swotData.opportunities)}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5 flex items-center gap-2">
                    <FaShieldAlt className="text-slate-900" size={14} />
                    Threats
                  </h4>
                  {renderSWOTItems(swotData.threats)}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">
                  No SWOT matrix available. Generate the analysis to display
                  SWOT data.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Project Details */}
        {activeTab === "details" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-900">
                <FaFileAlt size={14} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Project Specifications
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Project Name
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {project.project_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Industry
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {project.industry || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Business Model
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {project.business_model || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Target Market
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {project.target_market || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Budget Allocation
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {formatCurrency(project.budget)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Submitted Date
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {project.created_at
                    ? new Date(project.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Executive Overview
              </p>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-1">
                {project.description || "No description provided"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectAnalysis;
