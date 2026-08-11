const { pool } = require('../config/database');
const aiService = require('./ai.service');

class SuccessPredictionService {
    async predictSuccess(projectId) {
        try {
            const [projectResult, riskResult, swotResult] = await Promise.all([
                pool.query('SELECT * FROM projects WHERE project_id = $1', [projectId]),
                pool.query('SELECT * FROM risk_assessments WHERE project_id = $1 AND is_latest = true', [projectId]),
                pool.query('SELECT * FROM swot_analysis WHERE project_id = $1 AND is_latest = true', [projectId])
            ]);

            if (projectResult.rows.length === 0) {
                throw new Error('Project not found');
            }

            const project = projectResult.rows[0];
            const risks = riskResult.rows;
            const swot = swotResult.rows[0];

            // Generate prediction using AI
            const predictionData = await aiService.generateSuccessPrediction(project, risks, swot);

            // Save to database
            await this.savePrediction(projectId, predictionData);

            return predictionData;
        } catch (error) {
            console.error('Success prediction error:', error);
            const project = (await pool.query('SELECT * FROM projects WHERE project_id = $1', [projectId])).rows[0];
            const fallbackData = aiService.generateFallbackPrediction(project);
            await this.savePrediction(projectId, fallbackData);
            return fallbackData;
        }
    }

    async savePrediction(projectId, predictionData) {
        const { 
            successProbability, 
            overallRisk, 
            confidence, 
            keyDrivers, 
            keyChallenges, 
            timeline, 
            recommendations 
        } = predictionData;

        await pool.query(
            'UPDATE success_predictions SET is_latest = false WHERE project_id = $1',
            [projectId]
        );

        const result = await pool.query(
            `INSERT INTO success_predictions 
             (project_id, success_probability, overall_risk_score, confidence_score, prediction_details, is_latest) 
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING prediction_id`,
            [
                projectId,
                successProbability || 60,
                overallRisk || 50,
                confidence || 70,
                JSON.stringify({ 
                    keyDrivers: keyDrivers || [],
                    keyChallenges: keyChallenges || [],
                    timeline: timeline || '12-18 months',
                    recommendations: recommendations || []
                })
            ]
        );

        return {
            predictionId: result.rows[0].prediction_id,
            successProbability,
            overallRisk,
            confidence,
            keyDrivers,
            keyChallenges,
            timeline,
            recommendations
        };
    }
}

module.exports = new SuccessPredictionService();