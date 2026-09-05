// server/services/recommendation.service.js
const { pool } = require("../config/database");
const llmService = require("./llm.service");

class RecommendationService {
  constructor() {
    this.MAX_REFINEMENTS = 1;
  }

  isValidRecommendation(result) {
    if (!result) return false;
    if (!result.summary) return false;
    if (!result.recommendations || result.recommendations.length === 0)
      return false;

    for (const rec of result.recommendations) {
      if (!rec.title || !rec.action) return false;
    }
    return true;
  }

  async generateRecommendations(projectId) {
    try {
      // Step 1: Collect analysis context
      const context = await this.collectAnalysisContext(projectId);

      if (!context || !context.risks || context.risks.length === 0) {
        return {
          status: "insufficient_data",
          message:
            "No risk data available for recommendations. Please generate analysis first.",
        };
      }

      // Step 2: Build compact context
      const compactContext = this.buildCompactContext(context);

      // Step 3: Generate recommendations using LLM
      const result = await this.generateWithLLM(compactContext);

      // Step 4: Store recommendations in database
      if (result.recommendations && result.recommendations.length > 0) {
        await this.storeRecommendations(projectId, result);
      }

      return result;
    } catch (error) {
      console.error("❌ Recommendation generation error:", error);
      return this.generateFallbackRecommendations();
    }
  }

  // Generate recommendations from context (no DB query)
  async generateRecommendationsFromContext(context) {
    try {
      if (!context || !context.all_risks || context.all_risks.length === 0) {
        return {
          summary: "No risk data available for recommendations",
          recommendations: [],
          improvement_suggestions: [],
          llm_provider: "none",
          refined: false,
        };
      }

      // Build prompt
      const prompt = this.buildRecommendationPrompt(context);

      let result = null;
      let provider = "local";

      // Try local LLM first
      if (llmService.provider === "local") {
        try {
          result = await llmService.generateWithLocal(prompt);
          provider = "local";
        } catch (error) {
          try {
            result = await llmService.generateWithGemini(prompt);
            provider = "gemini";
          } catch (geminiError) {
            console.error("❌ Both providers failed:", geminiError);
            result = null;
          }
        }
      } else {
        try {
          result = await llmService.generateWithGemini(prompt);
          provider = "gemini";
        } catch (error) {
          console.error("❌ Gemini failed:", error);
          result = null;
        }
      }

      // If result is invalid and using local, try once more
      if (
        provider === "local" &&
        result &&
        !this.isValidRecommendation(result)
      ) {
        const refinedPrompt = this.buildRefinementPrompt(context, result);
        try {
          const refined = await llmService.generateWithLocal(refinedPrompt);
          if (this.isValidRecommendation(refined)) {
            result = refined;
          }
        } catch (error) {
          console.error("❌ Refinement failed:", error);
        }
      }

      // Fallback if still invalid
      if (!result || !this.isValidRecommendation(result)) {
        result = this.generateFallbackRecommendations(context);
        provider = "fallback";
      }

      return {
        summary:
          result.summary ||
          "Strategic recommendations based on project analysis",
        recommendations: result.recommendations || [],
        improvement_suggestions: result.improvement_suggestions || [],
        llm_provider: provider,
        refined: provider === "local" && result !== null,
      };
    } catch (error) {
      console.error("❌ Recommendation generation error:", error);
      return {
        summary: "Unable to generate recommendations at this time",
        recommendations: [],
        improvement_suggestions: [],
        llm_provider: "error",
        refined: false,
      };
    }
  }

  async collectAnalysisContext(projectId) {
    try {
      // Get project
      const projectResult = await pool.query(
        "SELECT * FROM projects WHERE project_id = $1",
        [projectId],
      );

      if (projectResult.rows.length === 0) {
        throw new Error("Project not found");
      }
      const project = projectResult.rows[0];

      // Get risks
      const riskResult = await pool.query(
        "SELECT * FROM risk_assessments WHERE project_id = $1 AND is_latest = true",
        [projectId],
      );
      const risks = riskResult.rows;

      // Get SWOT
      const swotResult = await pool.query(
        "SELECT * FROM swot_analysis WHERE project_id = $1 AND is_latest = true",
        [projectId],
      );
      const swot = swotResult.rows[0];

      // Get prediction
      const predictionResult = await pool.query(
        "SELECT * FROM success_predictions WHERE project_id = $1 AND is_latest = true",
        [projectId],
      );
      const prediction = predictionResult.rows[0];

      return {
        project,
        risks,
        swot,
        prediction,
      };
    } catch (error) {
      console.error("❌ Error collecting analysis context:", error);
      throw error;
    }
  }

  buildCompactContext(context) {
    const { project, risks, swot, prediction } = context;

    // Sort risks by score (highest first)
    const sortedRisks = [...risks].sort(
      (a, b) => parseFloat(b.risk_score) - parseFloat(a.risk_score),
    );

    // Build compact context
    return {
      project_summary: {
        name: project.project_name,
        industry: project.industry,
        business_model: project.business_model,
        target_market: project.target_market_size,
        budget: project.budget,
        employees: project.employees_count,
        founder_experience: project.founder_experience_years,
        description: project.description,
      },
      high_priority_risks: sortedRisks
        .filter(
          (r) => r.priority_level === "HIGH" || r.priority_level === "CRITICAL",
        )
        .map((r) => ({
          category: r.risk_category,
          score: r.risk_score,
          priority: r.priority_level,
          description: r.risk_description,
        })),
      all_risks: sortedRisks.map((r) => ({
        category: r.risk_category,
        score: r.risk_score,
        priority: r.priority_level,
      })),
      swot: swot
        ? {
            strengths: swot.strengths || [],
            weaknesses: swot.weaknesses || [],
            opportunities: swot.opportunities || [],
            threats: swot.threats || [],
            summary: swot.summary || "",
          }
        : null,
      prediction: prediction
        ? {
            success_probability: prediction.success_probability,
            overall_risk: prediction.overall_risk_score,
            confidence: prediction.confidence_rating,
            evaluation: prediction.system_evaluation,
          }
        : null,
    };
  }

  async buildContextFromProject(project) {
    // Get risks for this project
    const riskResult = await pool.query(
      "SELECT * FROM risk_assessments WHERE project_id = $1 AND is_latest = true",
      [project.project_id],
    );
    const risks = riskResult.rows;

    // Get SWOT
    const swotResult = await pool.query(
      "SELECT * FROM swot_analysis WHERE project_id = $1 AND is_latest = true",
      [project.project_id],
    );
    const swot = swotResult.rows[0];

    // Get prediction
    const predictionResult = await pool.query(
      "SELECT * FROM success_predictions WHERE project_id = $1 AND is_latest = true",
      [project.project_id],
    );
    const prediction = predictionResult.rows[0];

    // Sort risks by score
    const sortedRisks = [...risks].sort(
      (a, b) => parseFloat(b.risk_score) - parseFloat(a.risk_score),
    );

    return {
      project_summary: {
        name: project.project_name,
        industry: project.industry,
        business_model: project.business_model,
        target_market: project.target_market_size,
        budget: project.budget,
        employees: project.employees_count,
        founder_experience: project.founder_experience_years,
        description: project.description,
      },
      high_priority_risks: sortedRisks
        .filter(
          (r) => r.priority_level === "HIGH" || r.priority_level === "CRITICAL",
        )
        .map((r) => ({
          category: r.risk_category,
          score: r.risk_score,
          priority: r.priority_level,
          description: r.risk_description,
        })),
      all_risks: sortedRisks.map((r) => ({
        category: r.risk_category,
        score: r.risk_score,
        priority: r.priority_level,
      })),
      swot: swot
        ? {
            strengths: swot.strengths || [],
            weaknesses: swot.weaknesses || [],
            opportunities: swot.opportunities || [],
            threats: swot.threats || [],
            summary: swot.summary || "",
          }
        : null,
      prediction: prediction
        ? {
            success_probability: prediction.success_probability,
            overall_risk: prediction.overall_risk_score,
            confidence: prediction.confidence_rating,
            evaluation: prediction.system_evaluation,
          }
        : null,
    };
  }

  async generateWithLLM(context) {
    try {
      // Build prompt
      const prompt = this.buildRecommendationPrompt(context);

      // Use llm.service to generate recommendations
      let result = await llmService.generateRecommendations(prompt);

      // If result is valid, return it
      if (
        result &&
        result.recommendations &&
        result.recommendations.length > 0
      ) {
        return {
          ...result,
          llm_provider: llmService.provider || "local",
          refined: false,
        };
      }

      // Otherwise use fallback
      return this.generateFallbackRecommendations();
    } catch (error) {
      console.error("❌ LLM generation error:", error);
      return this.generateFallbackRecommendations();
    }
  }

  buildRecommendationPrompt(context) {
    const highRisks = context.high_priority_risks || [];
    const allRisks = context.all_risks || [];

    return `You are Senken, a strategic business advisor for startups and projects.

PROJECT SUMMARY:
- Name: ${context.project_summary.name}
- Industry: ${context.project_summary.industry}
- Business Model: ${context.project_summary.business_model}
- Target Market: ${context.project_summary.target_market}
- Budget: ₹${context.project_summary.budget || 0}
- Employees: ${context.project_summary.employees || "N/A"}
- Founder Experience: ${context.project_summary.founder_experience || 0} years

RISK ASSESSMENT:
${allRisks.map((r) => `- ${r.category}: ${r.score}% (${r.priority})`).join("\n")}

HIGH PRIORITY RISKS:
${highRisks.length > 0 ? highRisks.map((r) => `- ${r.category}: ${r.score}% - ${r.description || ""}`).join("\n") : "None identified"}

${
  context.swot
    ? `
SWOT ANALYSIS:
Strengths: ${context.swot.strengths.join(", ")}
Weaknesses: ${context.swot.weaknesses.join(", ")}
Opportunities: ${context.swot.opportunities.join(", ")}
Threats: ${context.swot.threats.join(", ")}
`
    : ""
}

${
  context.prediction
    ? `
SUCCESS PREDICTION:
- Success Probability: ${context.prediction.success_probability}%
- Overall Risk: ${context.prediction.overall_risk}%
- Confidence: ${context.prediction.confidence}%
- Evaluation: ${context.prediction.evaluation}
`
    : ""
}

Generate 3-5 strategic recommendations focusing on the highest priority risks.

Return a JSON object with this structure:
{
    "summary": "Strategic overview (2-3 sentences)",
    "recommendations": [
        {
            "title": "Recommendation title",
            "priority": "high/medium/low",
            "risk_addressed": "Risk category this addresses",
            "reasoning": "Why this recommendation",
            "action": "Specific action steps",
            "expected_impact": "Expected outcome"
        }
    ],
    "improvement_suggestions": [
        {
            "title": "Improvement title",
            "reasoning": "Why this improvement",
            "action": "Action steps",
            "expected_impact": "Expected outcome"
        }
    ]
}

Return ONLY valid JSON. No other text.`;
  }

  // Store recommendations
  async storeRecommendations(projectId, result) {
    try {
      // Mark existing as not latest
      await pool.query(
        `UPDATE recommendations 
             SET is_latest = false 
             WHERE project_id = $1`,
        [projectId],
      );

      let storedCount = 0;

      // Helper to normalize priority
      const normalizePriority = (priority) => {
        if (!priority) return "MEDIUM";
        const upper = priority.toUpperCase();
        // Map lowercase values to uppercase
        const priorityMap = {
          LOW: "LOW",
          MEDIUM: "MEDIUM",
          HIGH: "HIGH",
          CRITICAL: "CRITICAL",
          low: "LOW",
          medium: "MEDIUM",
          high: "HIGH",
          critical: "CRITICAL",
          L: "LOW",
          M: "MEDIUM",
          H: "HIGH",
          C: "CRITICAL",
        };
        return priorityMap[upper] || "MEDIUM";
      };

      // Store each recommendation
      for (const rec of result.recommendations || []) {
        const priority = normalizePriority(rec.priority);

        await pool.query(
          `INSERT INTO recommendations 
                 (project_id, recommendation_text, category, risk_mitigation, 
                  priority, expected_impact, implementation_steps, is_latest) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
          [
            projectId,
            rec.action || rec.title || "Action item",
            rec.category || "Strategic",
            rec.action || rec.title || "",
            priority, // Now properly normalized to uppercase
            rec.expected_impact || "Improves project outcomes",
            JSON.stringify({
              reasoning: rec.reasoning || "",
              risk_addressed: rec.risk_addressed || "",
              title: rec.title || "",
            }),
          ],
        );
        storedCount++;
      }

      // Store improvement suggestions
      for (const imp of result.improvement_suggestions || []) {
        await pool.query(
          `INSERT INTO recommendations 
                 (project_id, recommendation_text, category, priority, 
                  expected_impact, is_latest) 
                 VALUES ($1, $2, $3, $4, $5, true)`,
          [
            projectId,
            imp.action || imp.title || "Improvement action",
            "Improvement",
            "MEDIUM", // Always MEDIUM for improvements
            imp.expected_impact || "Improves project outcomes",
          ],
        );
        storedCount++;
      }

      // Store summary in prediction_details
      if (result.summary) {
        await pool.query(
          `UPDATE success_predictions 
                 SET prediction_details = prediction_details || $1
                 WHERE project_id = $2 AND is_latest = true`,
          [
            JSON.stringify({ recommendation_summary: result.summary }),
            projectId,
          ],
        );
      }

      return storedCount;
    } catch (error) {
      console.error("❌ Error storing recommendations:", error);
      throw error;
    }
  }

  generateFallbackRecommendations(context) {
    const highRisks = context?.high_priority_risks || [];
    const riskNames = highRisks.map((r) => r.category || "Unknown").slice(0, 3);

    const recommendations = [];

    // Generate recommendations based on risks
    if (riskNames.length > 0) {
      for (let i = 0; i < Math.min(riskNames.length, 3); i++) {
        const risk = riskNames[i];
        // Use proper priority values (UPPERCASE)
        const priority = i === 0 ? "HIGH" : i === 1 ? "MEDIUM" : "LOW";

        recommendations.push({
          title: `Mitigate ${risk} Risk`,
          priority: priority, // Already uppercase
          risk_addressed: risk,
          reasoning: `Addressing ${risk} risk is critical for project success.`,
          action: `Develop and implement a comprehensive ${risk.toLowerCase()} risk management strategy.`,
          expected_impact: `Reduces ${risk.toLowerCase()} risk and improves project stability.`,
          category: "Strategic",
        });
      }
    }

    // If no risks found, add generic recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        title: "Develop a Comprehensive Risk Management Plan",
        priority: "HIGH", // Uppercase
        risk_addressed: "Overall Risk",
        reasoning:
          "Structured risk management is essential for project success.",
        action:
          "Create a risk register, assign owners, and establish monitoring mechanisms.",
        expected_impact:
          "Reduces overall project risk and improves decision-making.",
        category: "Strategic",
      });

      recommendations.push({
        title: "Secure Additional Funding Sources",
        priority: "HIGH", // Uppercase
        risk_addressed: "Financial Risk",
        reasoning:
          "Financial stability is critical for project sustainability.",
        action:
          "Explore grants, investor networks, and strategic partnerships.",
        expected_impact:
          "Provides financial buffer and increases success probability.",
        category: "Financial",
      });

      recommendations.push({
        title: "Build Strategic Partnerships",
        priority: "MEDIUM", // Uppercase
        risk_addressed: "Market Risk",
        reasoning: "Partnerships can accelerate market entry and reduce risks.",
        action: "Identify and engage potential partners in the industry.",
        expected_impact:
          "Accelerates market validation and customer acquisition.",
        category: "Market",
      });
    }

    return {
      summary:
        "Based on the project analysis, the following strategic recommendations are suggested to mitigate risks and improve success probability.",
      recommendations: recommendations,
      improvement_suggestions: [
        {
          title: "Enhance Team Capabilities",
          reasoning:
            "Additional expertise can improve execution and reduce risks.",
          action: "Hire key roles or engage experienced advisors.",
          expected_impact:
            "Improves execution capability and reduces operational risks.",
        },
        {
          title: "Implement Regular Progress Reviews",
          reasoning: "Regular reviews help identify issues early.",
          action: "Schedule weekly progress reviews with key stakeholders.",
          expected_impact:
            "Early issue detection and improved project outcomes.",
        },
      ],
    };
  }
}

module.exports = new RecommendationService();
