const { ProjectModel } = require('../models');

class ProjectController {
    async createProject(req, res, next) {
        try {
            const projectData = {
                project_name: req.body.projectName,
                industry: req.body.industry,
                business_model: req.body.businessModel,
                target_market: req.body.targetMarket,
                budget: req.body.budget,
                description: req.body.description
            };

            const project = await ProjectModel.create(projectData);

            res.status(201).json({
                status: 'success',
                message: 'Project created successfully',
                data: project
            });
        } catch (error) {
            next(error);
        }
    }

    async getProjects(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;

            const projects = await ProjectModel.findAll({ limit, offset });
            const total = await ProjectModel.count();
            const industryStats = await ProjectModel.getIndustryStats();

            res.status(200).json({
                status: 'success',
                data: projects,
                pagination: {
                    total,
                    limit,
                    offset,
                    pages: Math.ceil(total / limit)
                },
                stats: {
                    totalProjects: total,
                    industryDistribution: industryStats
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getProject(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid project ID'
                });
            }

            const project = await ProjectModel.findById(id);

            if (!project) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Project not found'
                });
            }

            res.status(200).json({
                status: 'success',
                data: project
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProject(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid project ID'
                });
            }

            const updateData = {
                project_name: req.body.projectName,
                industry: req.body.industry,
                business_model: req.body.businessModel,
                target_market: req.body.targetMarket,
                budget: req.body.budget,
                description: req.body.description
            };

            const project = await ProjectModel.update(id, updateData);

            if (!project) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Project not found'
                });
            }

            res.status(200).json({
                status: 'success',
                message: 'Project updated successfully',
                data: project
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteProject(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid project ID'
                });
            }

            const deleted = await ProjectModel.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Project not found'
                });
            }

            res.status(200).json({
                status: 'success',
                message: 'Project deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getDashboardStats(req, res, next) {
        try {
            const total = await ProjectModel.count();
            const industryStats = await ProjectModel.getIndustryStats();
            const recentProjects = await ProjectModel.findAll({ limit: 5 });

            res.status(200).json({
                status: 'success',
                data: {
                    totalProjects: total,
                    industryDistribution: industryStats,
                    recentProjects: recentProjects
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProjectController();
