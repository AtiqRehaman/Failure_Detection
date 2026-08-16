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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileAlt,
  FaBrain,
  FaShieldAlt,
  FaInfoCircle,
  FaChartPie,
  FaSatelliteDish,
  FaLightbulb,
  FaChartLine,
  FaUsers,
  FaUserTie,
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
  const [mlResult, setMlResult] = useState(null);
  const [llmResult, setLlmResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("token");

  const CHART_COLORS = [
    "#00F5A0",
    "#00D284",
    "#00B06E",
    "#38EF7D",
    "#11998E",
    "#1DC5D8",
    "#3B82F6",
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

      const projectResponse = await axios.get(`${API_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (projectResponse.data.status === "success") {
        setProject(projectResponse.data.data);
      }

      try {
        const assessmentResponse = await axios.get(
          `${API_URL}/assessment/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (assessmentResponse.data.status === "success") {
          const data = assessmentResponse.data.data;
          setAssessment(data);

          if (data.ml) {
            setMlResult(data.ml);
          } else if (data.prediction) {
            const mlData = buildMLFromAssessment(data);
            setMlResult(mlData);
          }

          if (data.swot || data.recommendations) {
            setLlmResult({
              swot: data.swot || null,
              recommendations: data.recommendations || [],
            });
          }
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

  const buildMLFromAssessment = (data) => {
    const riskDist = {};
    if (data.risks && data.risks.length > 0) {
      data.risks.forEach((risk) => {
        const category = risk.risk_category?.toLowerCase();
        if (category) {
          riskDist[category] = parseFloat(risk.risk_score) || 0;
        }
      });
    }
    return {
      success_probability:
        parseFloat(data.prediction?.success_probability) || 0,
      overall_risk_score: parseFloat(data.prediction?.overall_risk_score) || 0,
      confidence_rating: parseFloat(data.prediction?.confidence_rating) || 0,
      system_evaluation:
        data.prediction?.system_evaluation || "Moderate Potential",
      risk_distribution: riskDist,
    };
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

        const assessmentResponse = await axios.get(
          `${API_URL}/assessment/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (assessmentResponse.data.status === "success") {
          const data = assessmentResponse.data.data;
          setAssessment(data);
          setMlResult(data.ml || buildMLFromAssessment(data));
          setLlmResult({
            swot: data.swot || null,
            recommendations: data.recommendations || [],
          });
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
      CRITICAL: "bg-red-500/10 text-red-300 border-red-400/30",
      HIGH: "bg-[#00F5A0]/10 text-[#00F5A0] border-[#00F5A0]/30",
      MEDIUM: "bg-[#111a2c] text-[#d8e5f8] border-[#1d2c47]",
      LOW: "bg-[#101726] text-[#8ea0b7] border-[#1d2c47]",
    };
    return styles[priority] || styles["MEDIUM"];
  };

  const getRiskChartData = () => {
    if (!assessment?.risks) return [];
    return assessment.risks.map((risk) => ({
      category: risk.risk_category,
      score: risk.risk_score || 0,
      priority: risk.priority_level || "MEDIUM",
    }));
  };

  const getRadarData = () => {
    if (!mlResult) return [];
    const dist = mlResult.risk_distribution || {};
    return [
      {
        subject: "Success",
        value: mlResult.success_probability || 0,
        fullMark: 100,
      },
      { subject: "Financial", value: dist.financial || 0, fullMark: 100 },
      { subject: "Market", value: dist.market || 0, fullMark: 100 },
      { subject: "Technical", value: dist.technical || 0, fullMark: 100 },
      { subject: "Business", value: dist.business || 0, fullMark: 100 },
      { subject: "Regulatory", value: dist.regulatory || 0, fullMark: 100 },
    ];
  };

  const getSWOTData = () => {
    if (llmResult?.swot) {
      const swot = llmResult.swot;
      return {
        strengths: swot.strengths || [],
        weaknesses: swot.weaknesses || [],
        opportunities: swot.opportunities || [],
        threats: swot.threats || [],
        summary: swot.summary || "",
      };
    }
    if (assessment?.swot) {
      const swot = assessment.swot;
      return {
        strengths: swot.strengths || [],
        weaknesses: swot.weaknesses || [],
        opportunities: swot.opportunities || [],
        threats: swot.threats || [],
        summary: swot.summary || "",
      };
    }
    return {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      summary: "",
    };
  };

  const swotData = getSWOTData();
  const riskChartData = getRiskChartData();
  const radarData = getRadarData();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
        <LoadingSpinner size="lg" color="#00F5A0" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white px-4 py-12">
        <div className="max-w-sm rounded-[28px] border border-[#162032] bg-[#080d19] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
          <p className="text-base font-semibold text-white">
            Project not found
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 rounded-2xl bg-[#00F5A0] px-4 py-2 text-xs font-bold text-[#080d19] shadow-[0_8px_25px_rgba(0,245,160,0.25)] transition-colors hover:bg-[#00dc8f]"
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

  const renderSWOTItems = (items, type) => {
    if (!items || items.length === 0) {
      return (
        <p className="text-xs italic text-[#7e8ca0]">No items identified</p>
      );
    }

    const colors = {
      strengths: "border-[#1f8d65]/40 bg-[#0d2c26]",
      weaknesses: "border-red-500/40 bg-[#2c1520]",
      opportunities: "border-blue-500/40 bg-[#112238]",
      threats: "border-yellow-500/40 bg-[#2a2618]",
    };

    const icons = {
      strengths: (
        <FaCheckCircle className="flex-shrink-0 text-[#00F5A0]" size={14} />
      ),
      weaknesses: (
        <FaExclamationTriangle
          className="flex-shrink-0 text-red-400"
          size={14}
        />
      ),
      opportunities: (
        <FaLightbulb className="flex-shrink-0 text-[#67d2ff]" size={14} />
      ),
      threats: (
        <FaShieldAlt className="flex-shrink-0 text-yellow-400" size={14} />
      ),
    };

    return items.map((item, index) => (
      <div
        key={index}
        className={`mb-2 flex items-start gap-2 rounded-2xl border p-3 last:mb-0 ${colors[type]}`}
      >
        {icons[type]}
        <span className="block text-xs font-medium leading-relaxed text-[#dfeaf7]">
          {item}
        </span>
      </div>
    ));
  };

  return (
    <div className="relative min-h-screen bg-[#070b14] text-white py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-[#00F5A0] selection:text-black">
      {toast && (
        <div className="fixed right-4 top-20 z-[9999] w-full max-w-md transition-all sm:right-6">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-2xl border border-[#1d2c47] bg-[#101726] p-2.5 text-[#dfeaf7] transition-colors hover:border-[#2a3d5a] hover:text-[#00F5A0]"
              title="Back to Dashboard"
            >
              <FaArrowLeft size={16} />
            </button>
            <div>
              <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[#1d2c47] bg-[#111a2c] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F5A0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00F5A0]" />
                {mlResult
                  ? "ML-Powered Assessment"
                  : "Project Intelligence Assessment"}
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {project.project_name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs font-medium text-[#8ea0b7]">
                <span>{project.industry || "N/A"}</span>
                <span>•</span>
                <span>{project.business_model || "N/A"}</span>
                <span>•</span>
                <span className="font-semibold text-white">
                  Budget: {formatCurrency(project.budget)}
                </span>
                {project.employees_count && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FaUsers size={12} />
                      {project.employees_count} employees
                    </span>
                  </>
                )}
                {project.founder_experience_years !== undefined && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FaUserTie size={12} />
                      {project.founder_experience_years} yrs experience
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={generateAssessment}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00F5A0] px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.15em] text-[#080d19] shadow-[0_8px_25px_rgba(0,245,160,0.25)] transition-all hover:bg-[#00dc8f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" color="black" />
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
                    : "Generate ML Analysis"}
                </span>
              </>
            )}
          </button>
        </div>

        {mlResult && (
          <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-6 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Success Probability
                </p>
                <p className="mt-1 text-2xl font-extrabold text-white">
                  {mlResult.success_probability || 0}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Overall Risk
                </p>
                <p className="mt-1 text-2xl font-extrabold text-white">
                  {mlResult.overall_risk_score || 0}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Confidence
                </p>
                <p className="mt-1 text-2xl font-extrabold text-white">
                  {mlResult.confidence_rating || 0}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Prediction
                </p>
                <span className="mt-1 inline-block rounded-xl border border-[#1d2c47] bg-[#111a2c] px-3 py-1 text-xs font-bold text-white">
                  {mlResult.success_probability >= 50 ? "Viable" : "At Risk"}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Evaluation
                </p>
                <span
                  className={`mt-1 inline-block rounded-xl border px-3 py-1 text-xs font-bold ${
                    mlResult.system_evaluation?.includes("Very Strong") ||
                    mlResult.system_evaluation?.includes("Strong")
                      ? "border-[#1f8d65]/40 bg-[#0d2c26] text-[#b5f5d5]"
                      : mlResult.system_evaluation?.includes("Moderate")
                        ? "border-yellow-500/40 bg-[#2a2618] text-yellow-200"
                        : "border-red-500/40 bg-[#2c1520] text-red-200"
                  }`}
                >
                  {mlResult.system_evaluation || "Moderate Potential"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 rounded-full border border-[#1d2c47] bg-[#0d1424] p-1.5">
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
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  isTabActive
                    ? "bg-[#00F5A0] text-[#080d19] shadow-[0_8px_25px_rgba(0,245,160,0.2)]"
                    : "text-[#9bb0cb] hover:bg-[#101b2d] hover:text-white"
                }`}
              >
                <Icon size={12} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {hasAssessment ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-5 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7e8ca0]">
                      Risk Categories
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-white">
                      {assessment.risks?.length || 0}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#7e8ca0]">
                      Categories evaluated
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-5 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7e8ca0]">
                      SWOT Points
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-white">
                      {(swotData.strengths?.length || 0) +
                        (swotData.weaknesses?.length || 0) +
                        (swotData.opportunities?.length || 0) +
                        (swotData.threats?.length || 0)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#7e8ca0]">
                      LLM-identified factors
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-5 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7e8ca0]">
                      ML Success Score
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-[#00F5A0]">
                      {mlResult?.success_probability || 0}%
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#7e8ca0]">
                      CatBoost model prediction
                    </p>
                  </div>
                </div>

                {radarData.length > 0 && (
                  <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-6 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#21304f] bg-[#141e33] text-[#00F5A0]">
                        <FaChartLine size={14} />
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        ML Success Factors
                      </h3>
                      <span className="rounded-full border border-[#1d2c47] bg-[#111a2c] px-2 py-0.5 text-[10px] text-[#7e8ca0]">
                        CatBoost
                      </span>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#162238" />
                          <PolarAngleAxis
                            dataKey="subject"
                            stroke="#7e8ca0"
                            fontSize={11}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            stroke="#7e8ca0"
                            fontSize={10}
                          />
                          <Radar
                            name="Score"
                            dataKey="value"
                            stroke="#00F5A0"
                            fill="#00F5A0"
                            fillOpacity={0.2}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0d1424",
                              borderColor: "#1d2b45",
                              borderRadius: "16px",
                              color: "#fff",
                              fontSize: "12px",
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {riskChartData.length > 0 && (
                  <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-6 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#21304f] bg-[#141e33] text-[#00F5A0]">
                        <FaSatelliteDish size={14} />
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        ML Risk Distribution
                      </h3>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={riskChartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#162238"
                          />
                          <XAxis
                            dataKey="category"
                            stroke="#7e8ca0"
                            fontSize={11}
                          />
                          <YAxis
                            domain={[0, 100]}
                            stroke="#7e8ca0"
                            fontSize={11}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0d1424",
                              borderColor: "#1d2b45",
                              borderRadius: "16px",
                              color: "#fff",
                              fontSize: "12px",
                            }}
                          />
                          <Bar
                            dataKey="score"
                            fill="#00F5A0"
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
              <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-8 text-center shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                <div className="mx-auto max-w-md space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#21304f] bg-[#141e33] text-[#00F5A0]">
                    <FaBrain size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    No Assessment Generated
                  </h3>
                  <p className="text-xs leading-relaxed text-[#7e8ca0]">
                    Generate an ML-powered assessment to evaluate risk factors,
                    SWOT matrix, and success predictions using CatBoost models.
                  </p>
                  <button
                    onClick={generateAssessment}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 rounded-full bg-[#00F5A0] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.15em] text-[#080d19] shadow-[0_8px_25px_rgba(0,245,160,0.25)] hover:bg-[#00dc8f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <LoadingSpinner size="sm" color="black" />
                        <span>Generating Assessment...</span>
                      </>
                    ) : (
                      <>
                        <FaBrain size={14} />
                        <span>Generate ML Assessment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "risks" && (
          <div className="space-y-6">
            {hasAssessment && assessment.risks?.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {assessment.risks.map((risk, index) => (
                    <div
                      key={index}
                      className="space-y-3 rounded-[28px] border border-[#162032] bg-[#0e1526] p-5 shadow-[0_18px_42px_rgba(8,13,25,0.4)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {risk.risk_category}
                          </h4>
                          <p className="mt-0.5 text-xs text-[#88a0ba]">
                            {risk.risk_description ||
                              "ML-predicted risk factor"}
                          </p>
                        </div>
                        <span
                          className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase ${getPriorityBadge(risk.priority_level)}`}
                        >
                          {risk.priority_level || "MEDIUM"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-[#c6d1e3]">
                          <span>Risk Rating</span>
                          <span>{risk.risk_score || 0}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full border border-[#1d2c47] bg-[#101726]">
                          <div
                            className="h-full rounded-full bg-[#00F5A0] transition-all duration-500"
                            style={{ width: `${risk.risk_score || 0}%` }}
                          />
                        </div>
                      </div>

                      {risk.mitigation_strategy && (
                        <div className="border-t border-[#1a2333] pt-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7e8ca0]">
                            Mitigation Strategy
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-[#d7e2f0]">
                            {risk.mitigation_strategy}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-6 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                  <h3 className="mb-4 text-lg font-bold text-white">
                    Risk Overview Spectrum
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#162238" />
                        <XAxis
                          dataKey="category"
                          stroke="#7e8ca0"
                          fontSize={11}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#7e8ca0"
                          fontSize={11}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0d1424",
                            borderColor: "#1d2b45",
                            borderRadius: "16px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                        />
                        <Bar
                          dataKey="score"
                          fill="#00F5A0"
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
              <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-12 text-center shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                <p className="text-xs font-semibold text-[#7e8ca0]">
                  No risk assessment available. Click "Generate ML Analysis" to
                  calculate risk metrics using CatBoost models.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "swot" && (
          <div className="space-y-6">
            {hasAssessment &&
            (swotData.strengths?.length > 0 ||
              swotData.weaknesses?.length > 0) ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full border border-[#1d2c47] bg-[#111a2c] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F5A0]">
                    LLM-Generated
                  </span>
                  <p className="text-xs text-[#7e8ca0]">
                    Qualitative analysis based on ML results
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-5 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                    <h4 className="mb-3.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                      <FaCheckCircle className="text-[#00F5A0]" size={14} />
                      Strengths
                    </h4>
                    {renderSWOTItems(swotData.strengths, "strengths")}
                  </div>

                  <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-5 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                    <h4 className="mb-3.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                      <FaExclamationTriangle
                        className="text-red-400"
                        size={14}
                      />
                      Weaknesses
                    </h4>
                    {renderSWOTItems(swotData.weaknesses, "weaknesses")}
                  </div>

                  <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-5 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                    <h4 className="mb-3.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                      <FaLightbulb className="text-[#67d2ff]" size={14} />
                      Opportunities
                    </h4>
                    {renderSWOTItems(swotData.opportunities, "opportunities")}
                  </div>

                  <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-5 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                    <h4 className="mb-3.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                      <FaShieldAlt className="text-yellow-400" size={14} />
                      Threats
                    </h4>
                    {renderSWOTItems(swotData.threats, "threats")}
                  </div>
                </div>

                {swotData.summary && (
                  <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-5 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7e8ca0]">
                      SWOT Summary
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[#dfeaf7]">
                      {swotData.summary}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-12 text-center shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                <p className="text-xs font-semibold text-[#7e8ca0]">
                  No SWOT matrix available. Generate the analysis to display
                  LLM-generated SWOT data.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "details" && (
          <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-6 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#21304f] bg-[#141e33] text-[#00F5A0]">
                <FaFileAlt size={14} />
              </div>
              <h3 className="text-lg font-bold text-white">
                Project Specifications
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Project Name
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {project.project_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Industry
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {project.industry || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Business Model
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {project.business_model || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Target Market Size
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {project.target_market_size || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Budget Allocation
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {formatCurrency(project.budget)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Employees
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {project.employees_count || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Founder Experience
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {project.founder_experience_years !== undefined
                    ? `${project.founder_experience_years} years`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  Submitted Date
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {project.created_at
                    ? new Date(project.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-[#1a2333] pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7e8ca0]">
                Executive Overview
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#dfeaf7] sm:text-sm">
                {project.description || "No description provided"}
              </p>
            </div>

            {mlResult && (
              <div className="mt-6 border-t border-[#1a2333] pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#7e8ca0]">
                  ML Analysis Results
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <div className="rounded-2xl border border-[#1d2c47] bg-[#111a2c] p-3">
                    <p className="text-[10px] text-[#7e8ca0]">Success</p>
                    <p className="text-sm font-bold text-white">
                      {mlResult.success_probability || 0}%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#1d2c47] bg-[#111a2c] p-3">
                    <p className="text-[10px] text-[#7e8ca0]">Overall Risk</p>
                    <p className="text-sm font-bold text-white">
                      {mlResult.overall_risk_score || 0}%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#1d2c47] bg-[#111a2c] p-3">
                    <p className="text-[10px] text-[#7e8ca0]">Confidence</p>
                    <p className="text-sm font-bold text-white">
                      {mlResult.confidence_rating || 0}%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#1d2c47] bg-[#111a2c] p-3">
                    <p className="text-[10px] text-[#7e8ca0]">Prediction</p>
                    <p className="text-sm font-bold text-white">
                      {mlResult.success_probability >= 50
                        ? "Viable"
                        : "At Risk"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#1d2c47] bg-[#111a2c] p-3">
                    <p className="text-[10px] text-[#7e8ca0]">Evaluation</p>
                    <p className="text-sm font-bold text-white">
                      {mlResult.system_evaluation || "Moderate"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectAnalysis;
