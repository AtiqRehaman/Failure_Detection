const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const authenticate = require("../middleware/auth");
const mlService = require("../services/ml.service");
const llmService = require("../services/llm.service");
const recommendationService = require("../services/recommendation.service");

// ============================================================
// GENERATE ASSESSMENT
// ============================================================
router.post("/:projectId/generate", authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    const projectResult = await pool.query(
      "SELECT * FROM projects WHERE project_id = $1",
      [projectId],
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    const project = projectResult.rows[0];

    // Step 1: ML Prediction
    const features = {
      industry: project.industry,
      business_model: project.business_model,
      target_market_size: project.target_market_size || "Medium",
      budget_inr: parseFloat(project.budget) || 0,
      employees_count: parseInt(project.employees_count) || 1,
      founder_experience_years: parseInt(project.founder_experience_years) || 0,
    };

    let mlResult;
    try {
      mlResult = await mlService.predictFull(features);
      console.log(`[Assessment ${projectId}] ML response:`, mlResult);
    } catch (mlError) {
      console.error("❌ ML prediction error:", mlError);
      return res.status(500).json({
        status: "error",
        message: "ML prediction failed: " + mlError.message,
      });
    }

    // Store ML results
    await storeMLResults(projectId, mlResult);

    // Step 2: Generate LLM Explanation (SWOT + Strategies)
    let llmResult = null;
    try {
      llmResult = await llmService.generateExplanation(project, mlResult);

      // Store LLM results (SWOT)
      if (llmResult) {
        await storeLLMResults(projectId, llmResult);
      }
    } catch (llmError) {
      console.error("❌ LLM generation error:", llmError);
    }

    // Step 3: Reuse recommendations from the project-analysis LLM response
    let recommendations = null;
    try {
      if (llmResult?.recommendations?.length > 0) {
        recommendations = {
          summary:
            llmResult.executive_summary ||
            "Strategic recommendations based on project analysis",
          recommendations: llmResult.recommendations,
          improvement_suggestions: llmResult.improvement_suggestions || [],
          llm_provider: llmService.provider || "fallback",
          refined: false,
        };

        await recommendationService.storeRecommendations(
          projectId,
          recommendations,
        );
      }
    } catch (recError) {
      console.error("❌ Recommendation generation error:", recError);
    }

    // Step 4: Get everything from database (fresh data)
    const freshData = await getFreshAssessment(projectId);

    res.status(200).json({
      status: "success",
      message: "Complete assessment generated successfully",
      data: {
        ...freshData,
        ml: mlResult,
        llm: llmResult,
        recommendations: recommendations,
      },
    });
  } catch (error) {
    console.error("❌ Assessment generation error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to generate assessment",
    });
  }
});

// ============================================================
// GET ASSESSMENT
// ============================================================
router.get("/:projectId", authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    const [project, risks, swot, prediction, recommendations] =
      await Promise.all([
        pool.query("SELECT * FROM projects WHERE project_id = $1", [projectId]),
        pool.query(
          "SELECT * FROM risk_assessments WHERE project_id = $1 AND is_latest = true",
          [projectId],
        ),
        pool.query(
          "SELECT * FROM swot_analysis WHERE project_id = $1 AND is_latest = true",
          [projectId],
        ),
        pool.query(
          "SELECT * FROM success_predictions WHERE project_id = $1 AND is_latest = true",
          [projectId],
        ),
        pool.query(
          "SELECT * FROM recommendations WHERE project_id = $1 AND is_latest = true",
          [projectId],
        ),
      ]);

    if (project.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    const mlResult = buildMLResultFromDB(prediction.rows[0], risks.rows);

    res.status(200).json({
      status: "success",
      data: {
        project: project.rows[0],
        risks: risks.rows,
        swot: swot.rows[0] || null,
        prediction: prediction.rows[0] || null,
        recommendations: recommendations.rows || [],
        ml: mlResult,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching assessment:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch assessment",
    });
  }
});

// ============================================================
// RECOMMENDATIONS ENDPOINTS (NEW - Milestone 3)
// ============================================================

// Generate recommendations
// router.post('/:projectId/recommendations/generate', authenticate, async (req, res) => {
//     try {
//         const { projectId } = req.params;

//         console.log(`📋 Generating recommendations for project: ${projectId}`);

//         const result = await recommendationService.generateRecommendations(parseInt(projectId));

//         if (result.status === 'insufficient_data') {
//             return res.status(400).json({
//                 status: 'error',
//                 message: result.message
//             });
//         }

//         res.status(200).json({
//             status: 'success',
//             data: result
//         });
//     } catch (error) {
//         console.error('❌ Recommendation generation error:', error);
//         res.status(500).json({
//             status: 'error',
//             message: error.message || 'Failed to generate recommendations'
//         });
//     }
// });

// // Get recommendations
// router.get('/:projectId/recommendations', authenticate, async (req, res) => {
//     try {
//         const { projectId } = req.params;

//         const result = await pool.query(
//             `SELECT * FROM recommendations
//              WHERE project_id = $1 AND is_latest = true
//              ORDER BY
//                 CASE priority
//                     WHEN 'CRITICAL' THEN 1
//                     WHEN 'HIGH' THEN 2
//                     WHEN 'MEDIUM' THEN 3
//                     WHEN 'LOW' THEN 4
//                 END`,
//             [projectId]
//         );

//         const recommendations = result.rows || [];
//         const strategic = recommendations.filter(r =>
//             r.category === 'Strategic' || r.category === 'Strategic'
//         );
//         const improvements = recommendations.filter(r =>
//             r.category === 'Improvement'
//         );

//         // Try to get the latest recommendation summary from prediction_details
//         const summaryResult = await pool.query(
//             `SELECT prediction_details FROM success_predictions
//              WHERE project_id = $1 AND is_latest = true`,
//             [projectId]
//         );

//         let summary = 'Strategic recommendations based on project analysis';
//         if (summaryResult.rows.length > 0) {
//             const details = summaryResult.rows[0].prediction_details;
//             if (details && details.recommendation_summary) {
//                 summary = details.recommendation_summary;
//             }
//         }

//         res.status(200).json({
//             status: 'success',
//             data: {
//                 summary: summary,
//                 recommendations: strategic,
//                 improvement_suggestions: improvements
//             }
//         });
//     } catch (error) {
//         console.error('❌ Error fetching recommendations:', error);
//         res.status(500).json({
//             status: 'error',
//             message: 'Failed to fetch recommendations'
//         });
//     }
// });

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function storeMLResults(projectId, mlResult) {
  const {
    success_probability,
    overall_risk_score,
    confidence_rating,
    system_evaluation,
    risk_distribution,
  } = mlResult;

  // Store in success_predictions
  await pool.query(
    `UPDATE success_predictions 
         SET is_latest = false 
         WHERE project_id = $1`,
    [projectId],
  );

  await pool.query(
    `INSERT INTO success_predictions 
         (project_id, success_probability, overall_risk_score, confidence_rating, 
          system_evaluation, prediction_details, is_latest) 
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
    [
      projectId,
      parseFloat(success_probability) || 0,
      parseFloat(overall_risk_score) || 0,
      parseFloat(confidence_rating) || 0,
      system_evaluation || "Moderate Potential",
      JSON.stringify({ risk_distribution }),
    ],
  );

  // Store in risk_assessments
  await pool.query(
    `UPDATE risk_assessments 
         SET is_latest = false 
         WHERE project_id = $1`,
    [projectId],
  );

  const riskCategories = [
    {
      key: "financial",
      label: "Financial",
      score: risk_distribution.financial || 0,
    },
    { key: "market", label: "Market", score: risk_distribution.market || 0 },
    {
      key: "technical",
      label: "Technical",
      score: risk_distribution.technical || 0,
    },
    {
      key: "business",
      label: "Business",
      score: risk_distribution.business || 0,
    },
    {
      key: "regulatory",
      label: "Regulatory",
      score: risk_distribution.regulatory || 0,
    },
  ];

  for (const risk of riskCategories) {
    const score = parseFloat(risk.score) || 0;
    let priority = "LOW";
    if (score >= 70) priority = "HIGH";
    else if (score >= 50) priority = "MEDIUM";

    await pool.query(
      `INSERT INTO risk_assessments 
             (project_id, risk_category, risk_score, risk_description, 
              priority_level, mitigation_strategy, is_latest, 
              financial_risk, market_risk, technical_risk, business_risk, regulatory_risk) 
             VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11)`,
      [
        projectId,
        risk.label,
        score,
        `ML-predicted ${risk.label.toLowerCase()} risk score: ${score.toFixed(2)}%`,
        priority,
        `Pending - LLM mitigation strategies being generated...`,
        risk_distribution.financial || 0,
        risk_distribution.market || 0,
        risk_distribution.technical || 0,
        risk_distribution.business || 0,
        risk_distribution.regulatory || 0,
      ],
    );
  }
}

async function getFreshAssessment(projectId) {
  const [project, risks, swot, prediction, recommendations] = await Promise.all(
    [
      pool.query("SELECT * FROM projects WHERE project_id = $1", [projectId]),
      pool.query(
        "SELECT * FROM risk_assessments WHERE project_id = $1 AND is_latest = true",
        [projectId],
      ),
      pool.query(
        "SELECT * FROM swot_analysis WHERE project_id = $1 AND is_latest = true",
        [projectId],
      ),
      pool.query(
        "SELECT * FROM success_predictions WHERE project_id = $1 AND is_latest = true",
        [projectId],
      ),
      pool.query(
        "SELECT * FROM recommendations WHERE project_id = $1 AND is_latest = true",
        [projectId],
      ),
    ],
  );

  return {
    project: project.rows[0],
    risks: risks.rows,
    swot: swot.rows[0],
    prediction: prediction.rows[0],
    recommendations: recommendations.rows,
  };
}

async function storeLLMResults(projectId, llmResult) {
  try {
    // Store mitigating strategies in risk_assessments
    if (llmResult.mitigating_strategies) {
      const strategies = llmResult.mitigating_strategies;

      const riskResult = await pool.query(
        "SELECT * FROM risk_assessments WHERE project_id = $1 AND is_latest = true",
        [projectId],
      );

      const categoryMap = {
        financial: "Financial",
        market: "Market",
        technical: "Technical",
        business: "Business",
        regulatory: "Regulatory",
      };

      for (const [key, items] of Object.entries(strategies)) {
        const category = categoryMap[key];
        if (!category) continue;

        const risk = riskResult.rows.find(
          (r) =>
            r.risk_category === category ||
            r.risk_category === category + " Risk",
        );

        if (risk && items && items.length > 0) {
          const mitigationText = items.join(". ");

          await pool.query(
            `UPDATE risk_assessments 
                         SET mitigation_strategy = $1,
                             risk_description = $2
                         WHERE risk_id = $3`,
            [
              mitigationText,
              `ML-predicted ${category.toLowerCase()} risk score: ${risk.risk_score}%. ${items.length} mitigation strategies identified.`,
              risk.risk_id,
            ],
          );
        }
      }
    }

    // Store SWOT analysis
    if (llmResult.swot) {
      await pool.query(
        `UPDATE swot_analysis 
                 SET is_latest = false 
                 WHERE project_id = $1`,
        [projectId],
      );

      await pool.query(
        `INSERT INTO swot_analysis 
                 (project_id, strengths, weaknesses, opportunities, threats, summary, is_latest) 
                 VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [
          projectId,
          JSON.stringify(llmResult.swot.strengths || []),
          JSON.stringify(llmResult.swot.weaknesses || []),
          JSON.stringify(llmResult.swot.opportunities || []),
          JSON.stringify(llmResult.swot.threats || []),
          llmResult.swot.summary || "SWOT analysis generated",
        ],
      );
    }

    // Store executive summary
    if (llmResult.executive_summary) {
      await pool.query(
        `UPDATE success_predictions 
                 SET prediction_details = prediction_details || $1
                 WHERE project_id = $2 AND is_latest = true`,
        [
          JSON.stringify({ executive_summary: llmResult.executive_summary }),
          projectId,
        ],
      );
    }
  } catch (error) {
    console.error("❌ Error storing LLM results:", error);
  }
}

function buildMLResultFromDB(prediction, risks) {
  if (!prediction) {
    return null;
  }

  const riskDistribution = {
    financial: 0,
    market: 0,
    technical: 0,
    business: 0,
    regulatory: 0,
  };

  if (risks && risks.length > 0) {
    for (const risk of risks) {
      const category = risk.risk_category?.toLowerCase();
      const score = parseFloat(risk.risk_score) || 0;
      if (category === "financial") riskDistribution.financial = score;
      else if (category === "market") riskDistribution.market = score;
      else if (category === "technical") riskDistribution.technical = score;
      else if (category === "business") riskDistribution.business = score;
      else if (category === "regulatory") riskDistribution.regulatory = score;
    }
  }

  return {
    success_probability: parseFloat(prediction.success_probability) || 0,
    overall_risk_score: parseFloat(prediction.overall_risk_score) || 0,
    confidence_rating: parseFloat(prediction.confidence_rating) || 0,
    system_evaluation: prediction.system_evaluation || "Moderate Potential",
    risk_distribution: riskDistribution,
  };
}

module.exports = router;
