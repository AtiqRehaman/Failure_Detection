const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { validateProject, handleValidationErrors } = require('../utils/validators');
const { validateRequestBody } = require('../middleware/validation');

router.post(
    '/',
    validateRequestBody,
    validateProject,
    handleValidationErrors,
    projectController.createProject
);

router.get('/', projectController.getProjects);
router.get('/dashboard/stats', projectController.getDashboardStats);
router.get('/:id/analysis', projectController.getProjectAnalysis);
router.get('/:id', projectController.getProject);

router.put(
    '/:id',
    validateRequestBody,
    validateProject,
    handleValidationErrors,
    projectController.updateProject
);

router.delete('/:id', projectController.deleteProject);

module.exports = router;
