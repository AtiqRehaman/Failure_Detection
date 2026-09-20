import React, { useState, useEffect, useRef } from "react";
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
  FaList,
  FaRocket,
  FaDownload,
  FaSpinner,
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
  const [recommendations, setRecommendations] = useState(null);
  const [toast, setToast] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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
        message: "Invalid project. Redirecting...",
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
          console.log(`[ProjectAnalysis ${id}] ML response:`, data.ml);
          setAssessment(data);

          if (data.ml) {
            setMlResult(data.ml);
          } else if (data.prediction) {
            const mlData = buildMLFromAssessment(data);
            setMlResult(mlData);
          }

          if (data.swot) {
            setLlmResult({
              swot: data.swot,
              recommendations: data.recommendations || [],
            });
          }

          if (data.recommendations && data.recommendations.length > 0) {
            const formattedRecs = data.recommendations.map((rec) => ({
              title: rec.recommendation_text || rec.title || "Recommendation",
              priority: rec.priority || "MEDIUM",
              risk_addressed: rec.risk_mitigation || rec.risk_addressed || "",
              reasoning:
                rec.implementation_steps?.reasoning || rec.reasoning || "",
              action: rec.recommendation_text || rec.action || "",
              expected_impact: rec.expected_impact || "",
              category: rec.category || "Strategic",
              implementation_steps: rec.implementation_steps || {},
            }));

            const strategic = formattedRecs.filter(
              (r) =>
                r.category !== "Improvement" && r.category !== "improvement",
            );
            const improvements = formattedRecs.filter(
              (r) =>
                r.category === "Improvement" || r.category === "improvement",
            );

            let summary =
              "Strategic recommendations based on project analysis.";
            if (data.prediction?.prediction_details?.recommendation_summary) {
              summary =
                data.prediction.prediction_details.recommendation_summary;
            }

            setRecommendations({
              summary: summary,
              recommendations: strategic,
              improvement_suggestions: improvements,
              llm_provider: data.recommendations_llm_provider || "local",
              refined: data.recommendations_refined || false,
              validation: { valid: true, issues: [] },
            });
          } else {
            setRecommendations(null);
          }
        }
      } catch (error) {}
    } catch (error) {
      console.error("Error fetching project:", error);
      setToast({
        message: error.response?.data?.message || "Unable to load project.",
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
        message: "Generating project analysis...",
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
          message: "Project analysis completed.",
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
          console.log(
            `[ProjectAnalysis ${id}] Generated ML response:`,
            data.ml,
          );
          setAssessment(data);
          setMlResult(data.ml || buildMLFromAssessment(data));

          if (data.recommendations && data.recommendations.length > 0) {
            const formattedRecs = data.recommendations.map((rec) => ({
              title: rec.recommendation_text || rec.title || "Recommendation",
              priority: rec.priority || "MEDIUM",
              risk_addressed: rec.risk_mitigation || rec.risk_addressed || "",
              reasoning:
                rec.implementation_steps?.reasoning || rec.reasoning || "",
              action: rec.recommendation_text || rec.action || "",
              expected_impact: rec.expected_impact || "",
              category: rec.category || "Strategic",
              implementation_steps: rec.implementation_steps || {},
            }));

            const strategic = formattedRecs.filter(
              (r) => r.category !== "Improvement",
            );
            const improvements = formattedRecs.filter(
              (r) => r.category === "Improvement",
            );

            let summary =
              "Strategic recommendations based on project analysis.";
            if (data.prediction?.prediction_details?.recommendation_summary) {
              summary =
                data.prediction.prediction_details.recommendation_summary;
            }

            setRecommendations({
              summary: summary,
              recommendations: strategic,
              improvement_suggestions: improvements,
              llm_provider: "local",
              refined: false,
              validation: { valid: true, issues: [] },
            });
          } else {
            setRecommendations(null);
          }

          setLlmResult({
            swot: data.swot || null,
            recommendations: data.recommendations || [],
          });
        }
      } else {
        setToast({
          message: response.data.message || "Unable to generate analysis.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error generating assessment:", error);
      setToast({
        message:
          error.response?.data?.message || "Unable to generate analysis.",
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================
  // DOWNLOAD PDF FUNCTIONALITY
  // ============================================================

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      setToast({
        message: "Preparing PDF document...",
        type: "info",
      });

      // Dynamically import jsPDF and html2canvas
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const swotData = getSWOTData();

      // Initialize PDF (A4 portrait)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const margin = 10; // 10mm margin
      const contentWidth = pageWidth - margin * 2; // 190mm

      let currentY = margin;
      const pageNumber = { value: 1 };

      // ============================================================
      // HELPER: Add a footer with page number
      // ============================================================
      const addFooter = () => {
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          pdf.text(
            `AI-Powered Product Intelligence System | Confidential Report | Page ${i} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 5,
            { align: "center" },
          );
        }
      };

      // ============================================================
      // HELPER: Create hidden container for rendering HTML sections
      // ============================================================
      const createHiddenContainer = (htmlContent, width = 800) => {
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "0";
        container.style.width = `${width}px`;
        container.style.backgroundColor = "#ffffff";
        container.style.padding = "30px";
        container.style.fontFamily = "Arial, Helvetica, sans-serif";
        container.style.color = "#000000";
        container.style.boxSizing = "border-box";
        container.innerHTML = htmlContent;
        document.body.appendChild(container);
        return container;
      };

      // ============================================================
      // HELPER: Render HTML section and add to PDF
      // ============================================================
      const addSectionToPDF = async (htmlContent, options = {}) => {
        const { addPageBreak = false } = options;

        const container = createHiddenContainer(htmlContent, 800);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 800,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if we need a new page
        if (addPageBreak && currentY > margin + 5) {
          pdf.addPage();
          currentY = margin;
        }

        // Check if section fits on current page
        const remainingHeight = pageHeight - margin - currentY - 10;
        if (imgHeight > remainingHeight && currentY > margin + 5) {
          pdf.addPage();
          currentY = margin;
        }

        // If section is taller than a full page, split it
        if (imgHeight > pageHeight - margin * 2) {
          // Split image across multiple pages
          let remainingImgHeight = imgHeight;
          let yOffset = 0;

          while (remainingImgHeight > 0) {
            const availableHeight = pageHeight - margin - currentY - 10;
            const sliceHeight = Math.min(remainingImgHeight, availableHeight);
            const sliceHeightPx = (sliceHeight / imgHeight) * canvas.height;
            const yOffsetPx = (yOffset / imgHeight) * canvas.height;

            // Create sliced canvas
            const slicedCanvas = document.createElement("canvas");
            slicedCanvas.width = canvas.width;
            slicedCanvas.height = sliceHeightPx;
            const ctx = slicedCanvas.getContext("2d");
            ctx.drawImage(
              canvas,
              0,
              yOffsetPx,
              canvas.width,
              sliceHeightPx,
              0,
              0,
              canvas.width,
              sliceHeightPx,
            );

            const slicedData = slicedCanvas.toDataURL("image/png");
            pdf.addImage(
              slicedData,
              "PNG",
              margin,
              currentY,
              imgWidth,
              sliceHeight,
            );

            remainingImgHeight -= sliceHeight;
            yOffset += sliceHeight;

            if (remainingImgHeight > 0) {
              pdf.addPage();
              currentY = margin;
            }
          }
        } else {
          pdf.addImage(imgData, "PNG", margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 5;
        }

        document.body.removeChild(container);
      };

      // ============================================================
      // 1. COVER / HEADER SECTION
      // ============================================================
      const headerHTML = `
      <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #003366 0%, #0055a5 100%); color: white; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">AI-Powered Product Intelligence System</h1>
        <h2 style="margin: 12px 0 0 0; font-size: 20px; font-weight: normal; opacity: 0.95;">Project Analysis Report</h2>
        <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.85;">Generated on ${new Date().toLocaleString()}</p>
      </div>
    `;
      await addSectionToPDF(headerHTML);

      // ============================================================
      // 2. PROJECT DETAILS SECTION
      // ============================================================
      const projectDetailsHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="color: #003366; font-size: 18px; border-bottom: 3px solid #003366; padding-bottom: 8px; margin-bottom: 15px;">1. Project Details</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr style="background: #f8f9fa;">
            <td style="padding: 10px; font-weight: bold; width: 30%; border: 1px solid #e0e0e0;">Project Name</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${project.project_name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Industry</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${project.industry || "N/A"}</td>
          </tr>
          <tr style="background: #f8f9fa;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Business Model</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${project.business_model || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Target Market Size</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${project.target_market_size || "N/A"}</td>
          </tr>
          <tr style="background: #f8f9fa;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Budget</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${formatCurrency(project.budget)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Employees</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${project.employees_count || "N/A"}</td>
          </tr>
          <tr style="background: #f8f9fa;">
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Founder Experience</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${project.founder_experience_years !== undefined ? project.founder_experience_years + " years" : "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Submitted Date</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${project.created_at ? new Date(project.created_at).toLocaleDateString() : "N/A"}</td>
          </tr>
        </table>
        <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-left: 4px solid #003366; border-radius: 4px;">
          <p style="font-weight: bold; margin: 0 0 8px 0; color: #003366;">Description:</p>
          <p style="margin: 0; line-height: 1.6; font-size: 13px; color: #333;">${project.description || "No description provided"}</p>
        </div>
      </div>
    `;
      await addSectionToPDF(projectDetailsHTML);

      // ============================================================
      // 3. ML PREDICTIONS SECTION
      // ============================================================
      if (mlResult) {
        const mlHTML = `
        <div style="margin-bottom: 20px;">
          <h2 style="color: #003366; font-size: 18px; border-bottom: 3px solid #003366; padding-bottom: 8px; margin-bottom: 15px;">2. ML Predictions</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <tr>
              <td style="padding: 15px; text-align: center; background: #e8f5e9; border: 1px solid #c8e6c9; width: 25%;">
                <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Success Probability</div>
                <div style="font-size: 26px; font-weight: bold; color: #00A86B;">${mlResult.success_probability || 0}%</div>
              </td>
              <td style="padding: 15px; text-align: center; background: #ffebee; border: 1px solid #ffcdd2; width: 25%;">
                <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Overall Risk</div>
                <div style="font-size: 26px; font-weight: bold; color: #C62828;">${mlResult.overall_risk_score || 0}%</div>
              </td>
              <td style="padding: 15px; text-align: center; background: #e3f2fd; border: 1px solid #bbdefb; width: 25%;">
                <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Confidence</div>
                <div style="font-size: 26px; font-weight: bold; color: #1565C0;">${mlResult.confidence_rating || 0}%</div>
              </td>
              <td style="padding: 15px; text-align: center; background: #f3e5f5; border: 1px solid #e1bee7; width: 25%;">
                <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Prediction</div>
                <div style="font-size: 22px; font-weight: bold; color: ${mlResult.success_probability >= 50 ? "#00A86B" : "#C62828"};">${mlResult.success_probability >= 50 ? "Viable" : "At Risk"}</div>
              </td>
            </tr>
          </table>
          <div style="text-align: center; padding: 15px; background: #f5f7fa; border-radius: 8px; border: 1px solid #e0e0e0;">
            <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">System Evaluation</div>
            <div style="font-size: 20px; font-weight: bold; color: #003366;">${mlResult.system_evaluation || "Moderate Potential"}</div>
          </div>
        </div>
      `;
        await addSectionToPDF(mlHTML);
      }

      // ============================================================
      // 4. RISK ASSESSMENT SECTION
      // ============================================================
      if (assessment?.risks?.length > 0) {
        const risksHTML = `
        <div style="margin-bottom: 20px;">
          <h2 style="color: #003366; font-size: 18px; border-bottom: 3px solid #003366; padding-bottom: 8px; margin-bottom: 15px;">3. Risk Assessment</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #003366; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #003366;">Risk Category</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #003366; width: 80px;">Score</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #003366; width: 90px;">Priority</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #003366;">Mitigation Strategy</th>
              </tr>
            </thead>
            <tbody>
              ${assessment.risks
                .map(
                  (risk, idx) => `
                <tr style="background: ${idx % 2 === 0 ? "#ffffff" : "#f8f9fa"};">
                  <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0; vertical-align: top;">${risk.risk_category}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #e0e0e0; vertical-align: top; font-weight: bold;">${risk.risk_score || 0}%</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #e0e0e0; vertical-align: top;">
                    <span style="padding: 4px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; background: ${
                      risk.priority_level === "HIGH" ||
                      risk.priority_level === "CRITICAL"
                        ? "#FFEBEE"
                        : risk.priority_level === "MEDIUM"
                          ? "#FFF3E0"
                          : "#E8F5E9"
                    }; color: ${
                      risk.priority_level === "HIGH" ||
                      risk.priority_level === "CRITICAL"
                        ? "#C62828"
                        : risk.priority_level === "MEDIUM"
                          ? "#EF6C00"
                          : "#2E7D32"
                    };">${risk.priority_level || "MEDIUM"}</span>
                  </td>
                  <td style="padding: 10px; border: 1px solid #e0e0e0; vertical-align: top; line-height: 1.5;">${risk.mitigation_strategy || "N/A"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
        await addSectionToPDF(risksHTML, { addPageBreak: true });
      }

      // ============================================================
      // 5. SWOT ANALYSIS SECTION
      // ============================================================
      if (
        swotData.strengths?.length > 0 ||
        swotData.weaknesses?.length > 0 ||
        swotData.opportunities?.length > 0 ||
        swotData.threats?.length > 0
      ) {
        const swotHTML = `
        <div style="margin-bottom: 20px;">
          <h2 style="color: #003366; font-size: 18px; border-bottom: 3px solid #003366; padding-bottom: 8px; margin-bottom: 15px;">4. SWOT Analysis</h2>
          
          <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 10px;">
            <div style="display: table-row;">
              <div style="display: table-cell; width: 50%; vertical-align: top; background: #E8F5E9; padding: 15px; border-radius: 8px; border: 2px solid #A5D6A7;">
                <h3 style="color: #2E7D32; font-size: 15px; margin: 0 0 12px 0;">✓ Strengths</h3>
                <ul style="padding-left: 18px; margin: 0; font-size: 12px; line-height: 1.7; color: #1B5E20;">
                  ${swotData.strengths.map((s) => `<li style="margin-bottom: 5px;">${s}</li>`).join("")}
                </ul>
              </div>
              <div style="display: table-cell; width: 50%; vertical-align: top; background: #FFEBEE; padding: 15px; border-radius: 8px; border: 2px solid #EF9A9A;">
                <h3 style="color: #C62828; font-size: 15px; margin: 0 0 12px 0;">✗ Weaknesses</h3>
                <ul style="padding-left: 18px; margin: 0; font-size: 12px; line-height: 1.7; color: #B71C1C;">
                  ${swotData.weaknesses.map((w) => `<li style="margin-bottom: 5px;">${w}</li>`).join("")}
                </ul>
              </div>
            </div>
          </div>

          <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 10px; margin-top: 10px;">
            <div style="display: table-row;">
              <div style="display: table-cell; width: 50%; vertical-align: top; background: #E3F2FD; padding: 15px; border-radius: 8px; border: 2px solid #90CAF9;">
                <h3 style="color: #1565C0; font-size: 15px; margin: 0 0 12px 0;">★ Opportunities</h3>
                <ul style="padding-left: 18px; margin: 0; font-size: 12px; line-height: 1.7; color: #0D47A1;">
                  ${swotData.opportunities.map((o) => `<li style="margin-bottom: 5px;">${o}</li>`).join("")}
                </ul>
              </div>
              <div style="display: table-cell; width: 50%; vertical-align: top; background: #FFF8E1; padding: 15px; border-radius: 8px; border: 2px solid #FFE082;">
                <h3 style="color: #F57F17; font-size: 15px; margin: 0 0 12px 0;">⚠ Threats</h3>
                <ul style="padding-left: 18px; margin: 0; font-size: 12px; line-height: 1.7; color: #E65100;">
                  ${swotData.threats.map((t) => `<li style="margin-bottom: 5px;">${t}</li>`).join("")}
                </ul>
              </div>
            </div>
          </div>

          ${
            swotData.summary
              ? `
          <div style="margin-top: 15px; padding: 15px; background: #f3e5f5; border-left: 4px solid #9C27B0; border-radius: 4px;">
            <p style="font-weight: bold; margin: 0 0 8px 0; color: #6A1B9A;">SWOT Summary:</p>
            <p style="margin: 0; line-height: 1.6; font-size: 12px; color: #333;">${swotData.summary}</p>
          </div>
          `
              : ""
          }
        </div>
      `;
        await addSectionToPDF(swotHTML, { addPageBreak: true });
      }

      // ============================================================
      // 6. RECOMMENDATIONS SECTION
      // ============================================================
      if (
        recommendations &&
        (recommendations.recommendations?.length > 0 ||
          recommendations.improvement_suggestions?.length > 0)
      ) {
        // Strategic Summary
        if (recommendations.summary) {
          const summaryHTML = `
          <div style="margin-bottom: 20px;">
            <h2 style="color: #003366; font-size: 18px; border-bottom: 3px solid #003366; padding-bottom: 8px; margin-bottom: 15px;">5. Strategic Recommendations</h2>
            <div style="padding: 15px; background: #E8EAF6; border-left: 4px solid #3F51B5; border-radius: 4px;">
              <p style="font-weight: bold; margin: 0 0 8px 0; color: #283593;">Strategic Summary:</p>
              <p style="margin: 0; line-height: 1.7; font-size: 13px; color: #333;">${recommendations.summary}</p>
            </div>
          </div>
        `;
          await addSectionToPDF(summaryHTML, { addPageBreak: true });
        }

        // Priority Recommendations
        if (recommendations.recommendations?.length > 0) {
          for (let i = 0; i < recommendations.recommendations.length; i++) {
            const rec = recommendations.recommendations[i];
            const priorityColor =
              rec.priority === "HIGH" || rec.priority === "high"
                ? { bg: "#FFEBEE", text: "#C62828", border: "#EF9A9A" }
                : rec.priority === "MEDIUM" || rec.priority === "medium"
                  ? { bg: "#FFF3E0", text: "#EF6C00", border: "#FFCC80" }
                  : { bg: "#E8F5E9", text: "#2E7D32", border: "#A5D6A7" };

            const recHTML = `
            <div style="margin-bottom: 15px; padding: 15px; background: #ffffff; border: 1px solid #e0e0e0; border-left: 4px solid ${priorityColor.text}; border-radius: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <h3 style="margin: 0; font-size: 14px; color: #003366; font-weight: bold; flex: 1;">
                  ${i + 1}. ${rec.title || `Recommendation ${i + 1}`}
                </h3>
                <span style="padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; background: ${priorityColor.bg}; color: ${priorityColor.text}; border: 1px solid ${priorityColor.border}; margin-left: 10px; white-space: nowrap;">
                  ${(rec.priority || "MEDIUM").toUpperCase()}
                </span>
              </div>
              ${
                rec.risk_addressed
                  ? `
                <p style="margin: 6px 0; font-size: 12px; color: #666;">
                  <strong style="color: #003366;">Risk Addressed:</strong> ${rec.risk_addressed}
                </p>
              `
                  : ""
              }
              ${
                rec.reasoning
                  ? `
                <p style="margin: 8px 0; font-size: 12px; line-height: 1.6; color: #333;">
                  <strong style="color: #003366;">Reasoning:</strong> ${rec.reasoning}
                </p>
              `
                  : ""
              }
              ${
                rec.action
                  ? `
                <div style="background: #F5F5F5; padding: 10px; border-radius: 4px; margin: 10px 0;">
                  <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #333;">
                    <strong style="color: #003366;">Action:</strong> ${rec.action}
                  </p>
                </div>
              `
                  : ""
              }
              ${
                rec.expected_impact
                  ? `
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #666;">
                  <strong style="color: #003366;">Expected Impact:</strong> ${rec.expected_impact}
                </p>
              `
                  : ""
              }
            </div>
          `;
            await addSectionToPDF(recHTML);
          }
        }

        // Improvement Suggestions
        if (recommendations.improvement_suggestions?.length > 0) {
          const improvementsHTML = `
          <div style="margin-top: 20px; margin-bottom: 20px;">
            <h2 style="color: #003366; font-size: 16px; border-bottom: 2px solid #2196F3; padding-bottom: 6px; margin-bottom: 15px;">Improvement Suggestions</h2>
            ${recommendations.improvement_suggestions
              .map(
                (imp, idx) => `
              <div style="margin-bottom: 12px; padding: 12px; background: #E3F2FD; border-left: 4px solid #2196F3; border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #0D47A1;">
                  ${idx + 1}. ${imp.title || `Improvement ${idx + 1}`}
                </h4>
                ${
                  imp.reasoning
                    ? `<p style="margin: 4px 0; font-size: 12px; color: #333;"><strong>Reasoning:</strong> ${imp.reasoning}</p>`
                    : ""
                }
                ${
                  imp.action
                    ? `<p style="margin: 6px 0; font-size: 12px; color: #333;"><strong>Action:</strong> ${imp.action}</p>`
                    : ""
                }
                ${
                  imp.expected_impact
                    ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #666;"><strong>Impact:</strong> ${imp.expected_impact}</p>`
                    : ""
                }
              </div>
            `,
              )
              .join("")}
          </div>
        `;
          await addSectionToPDF(improvementsHTML, { addPageBreak: true });
        }
      }

      // ============================================================
      // Add footers to all pages
      // ============================================================
      addFooter();

      // ============================================================
      // Save the PDF
      // ============================================================
      const fileName = `${project.project_name.replace(/[^a-z0-9]/gi, "_")}_Analysis_Report_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      setToast({
        message: "✅ PDF downloaded successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      setToast({
        message: "Failed to generate PDF. Please try again.",
        type: "error",
      });
    } finally {
      setIsDownloading(false);
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

  const getPriorityColor = (priority) => {
    const colors = {
      high: "bg-red-500/20 text-red-400 border-red-500/30",
      medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      low: "bg-green-500/20 text-green-400 border-green-500/30",
      HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
      MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      LOW: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return colors[priority] || colors["medium"];
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
        {/* Header */}
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

          <div className="flex flex-wrap gap-2">
            {/* Download PDF Button */}
            {hasAssessment && (
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#00F5A0]/40 bg-[#00F5A0]/10 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.15em] text-[#00F5A0] shadow-[0_8px_25px_rgba(0,245,160,0.15)] transition-all hover:bg-[#00F5A0]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <FaSpinner className="animate-spin" size={14} />
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <FaDownload size={14} />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            )}

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
        </div>

        {/* ML Results Summary */}
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

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 rounded-full border border-[#1d2c47] bg-[#0d1424] p-1.5">
          {[
            { key: "overview", label: "Overview", icon: FaInfoCircle },
            { key: "risks", label: "Risk Assessment", icon: FaShieldAlt },
            { key: "swot", label: "SWOT Matrix", icon: FaChartPie },
            { key: "recommendations", label: "Recommendations", icon: FaList },
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

        {/* Tab Content: Overview */}
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

        {/* Tab Content: Risk Assessment */}
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

        {/* Tab Content: SWOT Matrix */}
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

        {/* Tab Content: Recommendations */}
        {activeTab === "recommendations" && (
          <div className="space-y-6">
            {isLoadingRecommendations ? (
              <div className="flex flex-col items-center justify-center rounded-[28px] border border-[#162032] bg-[#0e1526] p-16 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                <LoadingSpinner size="lg" color="#00F5A0" />
                <p className="mt-4 text-xs text-[#7e8ca0]">
                  Generating strategic recommendations...
                </p>
              </div>
            ) : recommendations &&
              recommendations.recommendations?.length > 0 ? (
              <>
                <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-6 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#21304f] bg-[#141e33] text-[#00F5A0]">
                      <FaRocket size={14} />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      Strategic Summary
                    </h3>

                    {recommendations.refined && (
                      <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-400">
                        Refined
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-[#dfeaf7]">
                    {recommendations.summary ||
                      "Strategic recommendations based on project analysis."}
                  </p>
                </div>

                {recommendations.recommendations &&
                  recommendations.recommendations.length > 0 && (
                    <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-6 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                      <h3 className="mb-4 text-lg font-bold text-white">
                        Priority Recommendations
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {recommendations.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="rounded-[20px] border border-[#1d2c47] bg-[#111a2c] p-5 transition-all hover:border-[#2a3d5a]"
                          >
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-sm font-bold text-white">
                                  {rec.title || `Recommendation ${index + 1}`}
                                </h4>
                                {rec.risk_addressed && (
                                  <p className="mt-0.5 text-xs text-[#88a0ba]">
                                    Risk Addressed: {rec.risk_addressed}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase ${getPriorityColor(rec.priority)}`}
                              >
                                {rec.priority || "MEDIUM"}
                              </span>
                            </div>

                            {rec.reasoning && (
                              <p className="mb-2 text-xs text-[#c6d1e3]">
                                <span className="font-semibold text-[#7e8ca0]">
                                  Reasoning:
                                </span>{" "}
                                {rec.reasoning}
                              </p>
                            )}

                            {rec.action && (
                              <div className="mb-2 rounded-xl border border-[#1a2333] bg-[#0d1424] p-3">
                                <p className="text-xs font-semibold text-[#7e8ca0]">
                                  Action:
                                </p>
                                <p className="text-sm text-[#dfeaf7]">
                                  {rec.action}
                                </p>
                              </div>
                            )}

                            {rec.expected_impact && (
                              <p className="text-xs text-[#88a0ba]">
                                <span className="font-semibold text-[#7e8ca0]">
                                  Expected Impact:
                                </span>{" "}
                                {rec.expected_impact}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {recommendations.improvement_suggestions &&
                  recommendations.improvement_suggestions.length > 0 && (
                    <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-6 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                      <h3 className="mb-4 text-lg font-bold text-white">
                        Improvement Suggestions
                      </h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {recommendations.improvement_suggestions.map(
                          (imp, index) => (
                            <div
                              key={index}
                              className="rounded-[20px] border border-blue-500/20 bg-blue-500/5 p-4 transition-all hover:border-blue-500/40"
                            >
                              <h4 className="text-sm font-bold text-white">
                                {imp.title || `Improvement ${index + 1}`}
                              </h4>
                              {imp.reasoning && (
                                <p className="mt-1 text-xs text-[#c6d1e3]">
                                  {imp.reasoning}
                                </p>
                              )}
                              {imp.action && (
                                <p className="mt-2 text-xs text-[#88a0ba]">
                                  <span className="font-semibold text-[#7e8ca0]">
                                    Action:
                                  </span>{" "}
                                  {imp.action}
                                </p>
                              )}
                              {imp.expected_impact && (
                                <p className="mt-1 text-xs text-[#88a0ba]">
                                  <span className="font-semibold text-[#7e8ca0]">
                                    Impact:
                                  </span>{" "}
                                  {imp.expected_impact}
                                </p>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {recommendations.recommendations &&
                  recommendations.recommendations.length > 0 && (
                    <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-6 shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                      <h3 className="mb-4 text-lg font-bold text-white">
                        Mitigation Suggestions
                      </h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {recommendations.recommendations
                          .filter((rec) => rec.risk_addressed)
                          .slice(0, 4)
                          .map((rec, index) => (
                            <div
                              key={index}
                              className="rounded-[20px] border border-green-500/20 bg-green-500/5 p-4 transition-all hover:border-green-500/40"
                            >
                              <h4 className="text-sm font-bold text-white">
                                Mitigate {rec.risk_addressed}
                              </h4>
                              <p className="mt-1 text-xs text-[#c6d1e3]">
                                {rec.action}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getPriorityColor(rec.priority)}`}
                                >
                                  {rec.priority || "MEDIUM"}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <div className="rounded-[28px] border border-[#162032] bg-[#0e1526] p-12 text-center shadow-[0_18px_42px_rgba(8,13,25,0.4)]">
                <div className="mx-auto max-w-md space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#21304f] bg-[#141e33] text-[#00F5A0]">
                    <FaList size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    No Recommendations Generated
                  </h3>
                  <p className="text-xs leading-relaxed text-[#7e8ca0]">
                    {hasAssessment
                      ? "Generate strategic recommendations based on your project analysis to get actionable insights for success."
                      : "Generate an ML assessment first to enable strategic recommendations."}
                  </p>
                  <button
                    onClick={generateAssessment}
                    disabled={isLoadingRecommendations || isGenerating}
                    className="inline-flex items-center gap-2 rounded-full bg-[#00F5A0] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.15em] text-[#080d19] shadow-[0_8px_25px_rgba(0,245,160,0.25)] hover:bg-[#00dc8f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoadingRecommendations || isGenerating ? (
                      <>
                        <LoadingSpinner size="sm" color="black" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FaBrain size={14} />
                        <span>
                          {hasAssessment
                            ? "Generate Complete Analysis"
                            : "Generate Assessment"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Project Details */}
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
