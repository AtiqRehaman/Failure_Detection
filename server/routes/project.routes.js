const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { validateProject, handleValidationErrors } = require('../utils/validators');
const { validateRequestBody } = require('../middleware/validation');
const authenticate = require('../middleware/auth');

// All routes require authentication
router.post(
    '/',
    authenticate,  // Add this middleware
    validateRequestBody,
    validateProject,
    handleValidationErrors,
    projectController.createProject
);

router.get('/', authenticate, projectController.getProjects);
router.get('/dashboard/stats', authenticate, projectController.getDashboardStats);
router.get('/:id/analysis', authenticate, projectController.getProjectAnalysis);
router.get('/:id', authenticate, projectController.getProject);

router.put(
    '/:id',
    authenticate,
    validateRequestBody,
    validateProject,
    handleValidationErrors,
    projectController.updateProject
);

router.delete('/:id', authenticate, projectController.deleteProject);

module.exports = router;