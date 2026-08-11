const express = require('express');
const router = express.Router();
const riskAssessmentService = require('../services/riskAssessment.service');
const swotAnalysisService = require('../services/swotAnalysis.service');
const successPredictionService = require('../services/successPrediction.service');
const { pool } = require('../config/database');
const authenticate = require('../middleware/auth');

// Generate full assessment for a project
router.post('/:projectId/generate', authenticate, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        console.log(`Generating assessment for project: ${projectId}`);
        
        const projectCheck = await pool.query(
            'SELECT * FROM projects WHERE project_id = $1',
            [projectId]
        );
        
        if (projectCheck.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }
        
        const project = projectCheck.rows[0];
        
        // Generate assessments (No recommendations)
        const [risk, swot, prediction] = await Promise.all([
            riskAssessmentService.generateRiskAssessment(parseInt(projectId)),
            swotAnalysisService.generateSWOT(parseInt(projectId)),
            successPredictionService.predictSuccess(parseInt(projectId))
        ]);

        res.status(200).json({
            status: 'success',
            message: 'Assessment generated successfully',
            data: {
                risk,
                swot,
                prediction
            }
        });
    } catch (error) {
        console.error('Assessment generation error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to generate assessment'
        });
    }
});

// Get full assessment for a project
router.get('/:projectId', authenticate, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const [project, risks, swot, prediction] = await Promise.all([
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
            )
        ]);

        if (project.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                project: project.rows[0],
                risks: risks.rows,
                swot: swot.rows[0],
                prediction: prediction.rows[0]
            }
        });
    } catch (error) {
        console.error('Error fetching assessment:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch assessment'
        });
    }
});

module.exports = router;