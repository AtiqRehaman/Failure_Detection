const { pool } = require('../config/database');
const aiService = require('./ai.service');

class RiskAssessmentService {
    async generateRiskAssessment(projectId) {
        try {
            // Get project details
            const projectResult = await pool.query(
                'SELECT * FROM projects WHERE project_id = $1',
                [projectId]
            );
            
            if (projectResult.rows.length === 0) {
                throw new Error('Project not found');
            }
            
            const project = projectResult.rows[0];

            // Generate risk analysis using AI service (rule-based + AI enhancement)
            const riskData = await aiService.generateRiskAnalysis(project);

            // Save to database (store both scores and enhanced descriptions)
            await this.saveRiskAssessment(projectId, riskData);

            return riskData;
        } catch (error) {
            console.error('Risk assessment generation error:', error);
            // Fallback to pure rule-based (no AI)
            const project = (await pool.query('SELECT * FROM projects WHERE project_id = $1', [projectId])).rows[0];
            const fallbackData = aiService.generateRuleBasedRiskAnalysis(project);
            await this.saveRiskAssessment(projectId, fallbackData);
            return fallbackData;
        }
    }

    async saveRiskAssessment(projectId, riskData) {
        const { risks } = riskData;

        // Mark previous as not latest
        await pool.query(
            'UPDATE risk_assessments SET is_latest = false WHERE project_id = $1',
            [projectId]
        );

        for (const risk of risks) {
            await pool.query(
                `INSERT INTO risk_assessments 
                 (project_id, risk_category, risk_score, risk_description, priority_level, mitigation_strategy, is_latest) 
                 VALUES ($1, $2, $3, $4, $5, $6, true)`,
                [
                    projectId,
                    risk.category,
                    risk.score,
                    risk.description,
                    risk.priority,
                    risk.mitigation
                ]
            );
        }

        return { projectId, risks };
    }
}

module.exports = new RiskAssessmentService();