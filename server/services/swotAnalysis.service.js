const { pool } = require('../config/database');
const aiService = require('./ai.service');

class SWOTAnalysisService {
    async generateSWOT(projectId) {
        try {
            const projectResult = await pool.query(
                'SELECT * FROM projects WHERE project_id = $1',
                [projectId]
            );
            
            if (projectResult.rows.length === 0) {
                throw new Error('Project not found');
            }
            
            const project = projectResult.rows[0];

            // Generate SWOT using AI
            const swotData = await aiService.generateSWOTAnalysis(project);

            // Save to database
            await this.saveSWOT(projectId, swotData);

            return swotData;
        } catch (error) {
            console.error('SWOT generation error:', error);
            const project = (await pool.query('SELECT * FROM projects WHERE project_id = $1', [projectId])).rows[0];
            const fallbackData = aiService.generateFallbackSWOT(project);
            await this.saveSWOT(projectId, fallbackData);
            return fallbackData;
        }
    }

    async saveSWOT(projectId, swotData) {
        const { strengths, weaknesses, opportunities, threats, summary } = swotData;

        await pool.query(
            'UPDATE swot_analysis SET is_latest = false WHERE project_id = $1',
            [projectId]
        );

        const result = await pool.query(
            `INSERT INTO swot_analysis 
             (project_id, strengths, weaknesses, opportunities, threats, summary, is_latest) 
             VALUES ($1, $2, $3, $4, $5, $6, true)
             RETURNING swot_id`,
            [
                projectId,
                JSON.stringify(strengths || []),
                JSON.stringify(weaknesses || []),
                JSON.stringify(opportunities || []),
                JSON.stringify(threats || []),
                summary || 'SWOT analysis generated'
            ]
        );

        return {
            swotId: result.rows[0].swot_id,
            strengths,
            weaknesses,
            opportunities,
            threats,
            summary
        };
    }
}

module.exports = new SWOTAnalysisService();