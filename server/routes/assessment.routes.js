const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authenticate = require('../middleware/auth');
const mlService = require('../services/ml.service');
const llmService = require('../services/llm.service');

// ============================================================
// GENERATE ASSESSMENT FOR A PROJECT
// ============================================================
router.post('/:projectId/generate', authenticate, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        console.log(`🔄 Generating assessment for project: ${projectId}`);
        
        // Get project details
        const projectResult = await pool.query(
            'SELECT * FROM projects WHERE project_id = $1',
            [projectId]
        );
        
        if (projectResult.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }
        
        const project = projectResult.rows[0];

        // Prepare features for ML
        const features = {
            industry: project.industry,
            business_model: project.business_model,
            target_market_size: project.target_market_size || 'Medium',
            budget_inr: parseFloat(project.budget) || 0,
            employees_count: parseInt(project.employees_count) || 1,
            founder_experience_years: parseInt(project.founder_experience_years) || 0
        };

        console.log('🧠 ML Features:', features);

        // STEP 1: Get ML predictions
        let mlResult;
        try {
            mlResult = await mlService.predictFull(features);
            console.log('✅ ML Result:', mlResult);
        } catch (mlError) {
            console.error('❌ ML prediction error:', mlError);
            return res.status(500).json({
                status: 'error',
                message: 'ML prediction failed: ' + mlError.message
            });
        }

        // STEP 2: Generate LLM explanation
        let llmResult = null;
        try {
            console.log('🤖 Generating LLM explanation...');
            llmResult = await llmService.generateExplanation(project, mlResult);
            console.log('✅ LLM explanation generated');
        } catch (llmError) {
            console.error('❌ LLM generation error:', llmError);
            // Continue with ML results only - don't fail the whole request
        }

        // STEP 3: Store ML results in database
        await storeMLResults(projectId, mlResult);

        // STEP 4: Store LLM results if available
        if (llmResult) {
            await storeLLMResults(projectId, llmResult);
        }

        // STEP 5: Return combined results
        res.status(200).json({
            status: 'success',
            message: 'Assessment generated successfully',
            data: {
                ml: mlResult,
                llm: llmResult || null
            }
        });
    } catch (error) {
        console.error('❌ Assessment generation error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to generate assessment'
        });
    }
});

// ============================================================
// GET ASSESSMENT FOR A PROJECT
// ============================================================
router.get('/:projectId', authenticate, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const [project, risks, swot, prediction, recommendations] = await Promise.all([
            pool.query('SELECT * FROM projects WHERE project_id = $1', [projectId]),
            pool.query(
                'SELECT * FROM risk_assessments WHERE project_id = $1 AND is_latest = true',
                [projectId]
            ),
            pool.query(
                'SELECT * FROM swot_analysis WHERE project_id = $1 AND is_latest = true',
                [projectId]
            ),
            pool.query(
                'SELECT * FROM success_predictions WHERE project_id = $1 AND is_latest = true',
                [projectId]
            ),
            pool.query(
                'SELECT * FROM recommendations WHERE project_id = $1 AND is_latest = true',
                [projectId]
            )
        ]);

        if (project.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        // Build ML result from stored data
        const mlResult = buildMLResultFromDB(prediction.rows[0], risks.rows);

        res.status(200).json({
            status: 'success',
            data: {
                project: project.rows[0],
                risks: risks.rows,
                swot: swot.rows[0] || null,
                prediction: prediction.rows[0] || null,
                recommendations: recommendations.rows || [],
                ml: mlResult
            }
        });
    } catch (error) {
        console.error('❌ Error fetching assessment:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch assessment'
        });
    }
});

// ============================================================
// REGENERATE ONLY LLM EXPLANATION (Without ML)
// ============================================================
router.post('/:projectId/regenerate-llm', authenticate, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Get project and existing ML results
        const [projectResult, predictionResult] = await Promise.all([
            pool.query('SELECT * FROM projects WHERE project_id = $1', [projectId]),
            pool.query(
                'SELECT * FROM success_predictions WHERE project_id = $1 AND is_latest = true',
                [projectId]
            )
        ]);

        if (projectResult.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        if (predictionResult.rows.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No ML results found. Generate assessment first.'
            });
        }

        const project = projectResult.rows[0];
        const prediction = predictionResult.rows[0];

        // Reconstruct ML result
        const mlResult = {
            success_probability: parseFloat(prediction.success_probability) || 0,
            overall_risk_score: parseFloat(prediction.overall_risk_score) || 0,
            confidence_rating: parseFloat(prediction.confidence_rating) || 0,
            system_evaluation: prediction.system_evaluation || 'Moderate Potential',
            risk_distribution: prediction.prediction_details?.risk_distribution || {
                financial: 0,
                market: 0,
                technical: 0,
                business: 0,
                regulatory: 0
            }
        };

        // Generate new LLM explanation
        let llmResult;
        try {
            llmResult = await llmService.generateExplanation(project, mlResult);
        } catch (llmError) {
            return res.status(500).json({
                status: 'error',
                message: 'LLM generation failed: ' + llmError.message
            });
        }

        // Store new LLM results
        await storeLLMResults(projectId, llmResult);

        res.status(200).json({
            status: 'success',
            message: 'LLM explanation regenerated successfully',
            data: {
                llm: llmResult
            }
        });
    } catch (error) {
        console.error('❌ LLM regeneration error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to regenerate LLM explanation'
        });
    }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Store ML results in database
async function storeMLResults(projectId, mlResult) {
    const { 
        success_probability, 
        overall_risk_score, 
        confidence_rating, 
        system_evaluation,
        risk_distribution 
    } = mlResult;

    console.log('💾 Storing ML results:', {
        projectId,
        success_probability,
        overall_risk_score,
        confidence_rating,
        system_evaluation
    });

    // Store in success_predictions
    await pool.query(
        `UPDATE success_predictions 
         SET is_latest = false 
         WHERE project_id = $1`,
        [projectId]
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
            system_evaluation || 'Moderate Potential',
            JSON.stringify({ risk_distribution })
        ]
    );

    // Store in risk_assessments
    await pool.query(
        `UPDATE risk_assessments 
         SET is_latest = false 
         WHERE project_id = $1`,
        [projectId]
    );

    const riskCategories = [
        { key: 'financial', label: 'Financial', score: risk_distribution.financial || 0 },
        { key: 'market', label: 'Market', score: risk_distribution.market || 0 },
        { key: 'technical', label: 'Technical', score: risk_distribution.technical || 0 },
        { key: 'business', label: 'Business', score: risk_distribution.business || 0 },
        { key: 'regulatory', label: 'Regulatory', score: risk_distribution.regulatory || 0 }
    ];

    for (const risk of riskCategories) {
        const score = parseFloat(risk.score) || 0;
        let priority = 'LOW';
        if (score >= 70) priority = 'HIGH';
        else if (score >= 50) priority = 'MEDIUM';
        
        // Store with placeholder mitigation - will be updated by LLM later
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
                'Pending - LLM mitigation strategies being generated...', // Placeholder
                risk_distribution.financial || 0,
                risk_distribution.market || 0,
                risk_distribution.technical || 0,
                risk_distribution.business || 0,
                risk_distribution.regulatory || 0
            ]
        );
    }
}

// Store LLM results in database
// Helper function to store LLM results
async function storeLLMResults(projectId, llmResult) {
    try {
        console.log('💾 Storing LLM results...');

        // Store mitigating strategies in risk_assessments
        if (llmResult.mitigating_strategies) {
            const strategies = llmResult.mitigating_strategies;
            
            // Get existing risk assessments for this project
            const riskResult = await pool.query(
                'SELECT * FROM risk_assessments WHERE project_id = $1 AND is_latest = true',
                [projectId]
            );

            // Map strategies to risk categories
            const categoryMap = {
                'financial': 'Financial',
                'market': 'Market',
                'technical': 'Technical',
                'business': 'Business',
                'regulatory': 'Regulatory'
            };

            for (const [key, items] of Object.entries(strategies)) {
                const category = categoryMap[key];
                if (!category) continue;

                // Find matching risk assessment
                const risk = riskResult.rows.find(r => 
                    r.risk_category === category || 
                    r.risk_category === category + ' Risk'
                );

                if (risk && items && items.length > 0) {
                    // Combine strategies into a single text
                    const mitigationText = items.join('. ');
                    
                    // Update risk_assessments with mitigation strategy
                    await pool.query(
                        `UPDATE risk_assessments 
                         SET mitigation_strategy = $1,
                             risk_description = $2
                         WHERE risk_id = $3`,
                        [
                            mitigationText,
                            `ML-predicted ${category.toLowerCase()} risk score: ${risk.risk_score}%. ${items.length} mitigation strategies identified.`,
                            risk.risk_id
                        ]
                    );
                    console.log(`✅ Updated mitigation for ${category}`);
                }
            }
        }

        // Store SWOT analysis
        if (llmResult.swot) {
            await pool.query(
                `UPDATE swot_analysis 
                 SET is_latest = false 
                 WHERE project_id = $1`,
                [projectId]
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
                    llmResult.swot.summary || 'SWOT analysis generated'
                ]
            );
            console.log('✅ SWOT stored');
        }

        // Store recommendations
        if (llmResult.recommended_actions && llmResult.recommended_actions.length > 0) {
            await pool.query(
                `UPDATE recommendations 
                 SET is_latest = false 
                 WHERE project_id = $1`,
                [projectId]
            );

            for (const action of llmResult.recommended_actions) {
                await pool.query(
                    `INSERT INTO recommendations 
                     (project_id, recommendation_text, category, risk_mitigation, priority, expected_impact, is_latest) 
                     VALUES ($1, $2, $3, $4, $5, $6, true)`,
                    [
                        projectId,
                        action.action || 'Action item',
                        'Strategic',
                        action.action || 'Implement action',
                        action.priority || 'MEDIUM',
                        action.impact || 'Improves project success'
                    ]
                );
            }
            console.log('✅ Recommendations stored');
        }

        // Store executive summary
        if (llmResult.executive_summary) {
            // Store in prediction_details or as a separate field
            await pool.query(
                `UPDATE success_predictions 
                 SET prediction_details = prediction_details || $1
                 WHERE project_id = $2 AND is_latest = true`,
                [
                    JSON.stringify({ executive_summary: llmResult.executive_summary }),
                    projectId
                ]
            );
            console.log('✅ Executive summary stored');
        }

    } catch (error) {
        console.error('❌ Error storing LLM results:', error);
        // Don't throw - we want to continue even if LLM storage fails
    }
}

// Build ML result from database records
function buildMLResultFromDB(prediction, risks) {
    if (!prediction) {
        return null;
    }

    const riskDistribution = {
        financial: 0,
        market: 0,
        technical: 0,
        business: 0,
        regulatory: 0
    };

    // Extract risk values from risk assessments
    if (risks && risks.length > 0) {
        for (const risk of risks) {
            const category = risk.risk_category?.toLowerCase();
            const score = parseFloat(risk.risk_score) || 0;
            if (category === 'financial') riskDistribution.financial = score;
            else if (category === 'market') riskDistribution.market = score;
            else if (category === 'technical') riskDistribution.technical = score;
            else if (category === 'business') riskDistribution.business = score;
            else if (category === 'regulatory') riskDistribution.regulatory = score;
        }
    }

    return {
        success_probability: parseFloat(prediction.success_probability) || 0,
        overall_risk_score: parseFloat(prediction.overall_risk_score) || 0,
        confidence_rating: parseFloat(prediction.confidence_rating) || 0,
        system_evaluation: prediction.system_evaluation || 'Moderate Potential',
        risk_distribution: riskDistribution
    };
}

module.exports = router;