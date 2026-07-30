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

    async getProjectAnalysis(req, res, next) {
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

            // Generate mock analysis data based on project
            const analysis = generateProjectAnalysis(project);

            res.status(200).json({
                status: 'success',
                data: {
                    project,
                    analysis
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

// Helper function to generate analysis based on project data
function generateProjectAnalysis(project) {
    // Market Size Score based on industry
    const marketScores = {
        'Technology': 92,
        'Healthcare': 88,
        'Finance': 85,
        'Education': 78,
        'Retail': 75,
        'Manufacturing': 72,
        'Real Estate': 70,
        'Transportation': 68,
        'Energy': 82,
        'Agriculture': 65,
        'Entertainment': 80,
        'Food & Beverage': 73,
        'E-commerce': 87,
        'SaaS': 90,
        'Other': 60
    };

    // Competition Level based on industry
    const competitionLevels = {
        'Technology': 'High',
        'Healthcare': 'Medium',
        'Finance': 'High',
        'Education': 'Medium',
        'Retail': 'High',
        'Manufacturing': 'Medium',
        'Real Estate': 'Medium',
        'Transportation': 'Medium',
        'Energy': 'Low',
        'Agriculture': 'Low',
        'Entertainment': 'High',
        'Food & Beverage': 'High',
        'E-commerce': 'High',
        'SaaS': 'High',
        'Other': 'Medium'
    };

    // Growth Potential based on industry
    const growthPotentials = {
        'Technology': 85,
        'Healthcare': 80,
        'Finance': 75,
        'Education': 70,
        'Retail': 65,
        'Manufacturing': 60,
        'Real Estate': 55,
        'Transportation': 65,
        'Energy': 78,
        'Agriculture': 60,
        'Entertainment': 72,
        'Food & Beverage': 65,
        'E-commerce': 80,
        'SaaS': 85,
        'Other': 50
    };

    // Risk Level based on budget and industry
    const getRiskLevel = (budget, industry) => {
        const highRiskIndustries = ['Technology', 'Finance', 'E-commerce', 'SaaS'];
        const mediumRiskIndustries = ['Healthcare', 'Education', 'Retail', 'Entertainment'];
        
        if (budget > 500000) return 'High';
        if (budget > 200000) {
            if (highRiskIndustries.includes(industry)) return 'Medium';
            return 'Low';
        }
        if (highRiskIndustries.includes(industry)) return 'High';
        if (mediumRiskIndustries.includes(industry)) return 'Medium';
        return 'Low';
    };

    const riskLevel = getRiskLevel(project.budget || 0, project.industry);
    const marketScore = marketScores[project.industry] || 65;
    const competitionLevel = competitionLevels[project.industry] || 'Medium';
    const growthPotential = growthPotentials[project.industry] || 65;

    // Generate SWOT analysis
    const generateSWOT = (project, industry) => {
        const swotData = {
            strengths: [
                'Strong market demand',
                'Innovative approach',
                'Scalable business model'
            ],
            weaknesses: [
                'Limited initial funding',
                'Market entry challenges',
                'Competitive pressure'
            ],
            opportunities: [
                'Growing market segment',
                'Technology advancement',
                'Strategic partnerships'
            ],
            threats: [
                'Market competition',
                'Regulatory changes',
                'Economic uncertainty'
            ]
        };

        // Customize based on industry
        if (industry === 'Technology') {
            swotData.strengths.push('Tech-savvy team', 'Rapid innovation potential');
            swotData.weaknesses.push('High R&D costs', 'Rapid technology changes');
            swotData.opportunities.push('AI integration', 'Cloud adoption');
            swotData.threats.push('Technology disruption', 'IP challenges');
        } else if (industry === 'Healthcare') {
            swotData.strengths.push('Regulatory compliance', 'Essential service');
            swotData.weaknesses.push('High regulatory barriers', 'Long sales cycles');
            swotData.opportunities.push('Digital health growth', 'Aging population');
            swotData.threats.push('Regulatory changes', 'Privacy concerns');
        } else if (industry === 'Finance') {
            swotData.strengths.push('Financial expertise', 'Strong compliance');
            swotData.weaknesses.push('High competition', 'Regulatory complexity');
            swotData.opportunities.push('Digital banking', 'Blockchain integration');
            swotData.threats.push('Cyber attacks', 'Regulatory changes');
        } else if (industry === 'Education') {
            swotData.strengths.push('Educational expertise', 'Strong content library');
            swotData.weaknesses.push('Technology adoption', 'Student engagement');
            swotData.opportunities.push('Online learning', 'AI tutors');
            swotData.threats.push('Competition', 'Technology changes');
        }

        return swotData;
    };

    // Generate recommendations
    const generateRecommendations = (project, riskLevel) => {
        const recommendations = [
            {
                category: 'Market Strategy',
                priority: 'High',
                description: 'Focus on targeted marketing campaigns to reach your core audience effectively'
            },
            {
                category: 'Financial Planning',
                priority: 'High',
                description: 'Optimize budget allocation for maximum ROI and sustainable growth'
            },
            {
                category: 'Competitive Positioning',
                priority: 'Medium',
                description: 'Differentiate your offering with a unique value proposition'
            }
        ];

        if (riskLevel === 'High') {
            recommendations.push({
                category: 'Risk Mitigation',
                priority: 'High',
                description: 'Develop a comprehensive risk management strategy to address potential challenges'
            });
        }

        if (project.budget && project.budget < 100000) {
            recommendations.push({
                category: 'Funding Strategy',
                priority: 'High',
                description: 'Consider seeking additional funding from investors or explore bootstrapping options'
            });
        }

        if (project.industry === 'Technology') {
            recommendations.push({
                category: 'Innovation',
                priority: 'Medium',
                description: 'Invest in R&D and stay updated with emerging technologies to maintain competitive edge'
            });
        }

        return recommendations;
    };

    // Generate success probability
    const calculateSuccessProbability = (project) => {
        let score = 60; // Base score
        
        // Industry factor
        if (['Technology', 'Healthcare', 'SaaS'].includes(project.industry)) score += 10;
        else if (['Education', 'Energy', 'E-commerce'].includes(project.industry)) score += 5;
        
        // Budget factor
        if (project.budget) {
            if (project.budget > 500000) score += 10;
            else if (project.budget > 200000) score += 5;
            else if (project.budget < 50000) score -= 5;
        }
        
        // Business model factor
        if (['B2B', 'SaaS', 'Subscription'].includes(project.business_model)) score += 10;
        else if (['B2C', 'Marketplace'].includes(project.business_model)) score += 5;
        
        return Math.min(Math.max(score, 20), 95);
    };

    const successProbability = calculateSuccessProbability(project);

    // Generate key metrics
    const keyMetrics = [
        {
            label: 'Market Potential',
            value: `${marketScore}%`,
            description: 'Based on industry size and growth trends',
            color: 'blue'
        },
        {
            label: 'Competition Level',
            value: competitionLevel,
            description: 'Competitive landscape analysis',
            color: competitionLevel === 'High' ? 'orange' : competitionLevel === 'Medium' ? 'yellow' : 'green'
        },
        {
            label: 'Growth Potential',
            value: `${growthPotential}%`,
            description: 'Projected market growth rate',
            color: 'green'
        },
        {
            label: 'Risk Level',
            value: riskLevel,
            description: 'Based on investment and market factors',
            color: riskLevel === 'High' ? 'red' : riskLevel === 'Medium' ? 'orange' : 'green'
        },
        {
            label: 'Success Probability',
            value: `${successProbability}%`,
            description: 'AI-powered success prediction',
            color: successProbability > 70 ? 'green' : successProbability > 50 ? 'orange' : 'red'
        }
    ];

    // Generate market trends
    const generateMarketTrends = (industry) => {
        const trends = {
            'Technology': [
                { label: 'AI Adoption', value: 85, trend: 'up' },
                { label: 'Cloud Migration', value: 78, trend: 'up' },
                { label: 'Cybersecurity', value: 72, trend: 'up' },
                { label: 'Data Privacy', value: 65, trend: 'up' }
            ],
            'Healthcare': [
                { label: 'Digital Health', value: 82, trend: 'up' },
                { label: 'Telemedicine', value: 76, trend: 'up' },
                { label: 'AI Diagnostics', value: 70, trend: 'up' },
                { label: 'Wearable Tech', value: 65, trend: 'up' }
            ],
            'Finance': [
                { label: 'Digital Banking', value: 80, trend: 'up' },
                { label: 'Blockchain', value: 72, trend: 'up' },
                { label: 'AI Trading', value: 68, trend: 'up' },
                { label: 'InsurTech', value: 62, trend: 'up' }
            ],
            'Education': [
                { label: 'Online Learning', value: 78, trend: 'up' },
                { label: 'EdTech Tools', value: 72, trend: 'up' },
                { label: 'Virtual Classrooms', value: 68, trend: 'up' },
                { label: 'Gamification', value: 62, trend: 'up' }
            ],
            'Retail': [
                { label: 'E-commerce', value: 82, trend: 'up' },
                { label: 'Omnichannel', value: 74, trend: 'up' },
                { label: 'Personalization', value: 68, trend: 'up' },
                { label: 'Sustainability', value: 62, trend: 'up' }
            ],
            'Energy': [
                { label: 'Renewable Energy', value: 84, trend: 'up' },
                { label: 'Smart Grid', value: 76, trend: 'up' },
                { label: 'Energy Storage', value: 70, trend: 'up' },
                { label: 'Solar Power', value: 66, trend: 'up' }
            ],
            'Real Estate': [
                { label: 'PropTech', value: 78, trend: 'up' },
                { label: 'Smart Buildings', value: 70, trend: 'up' },
                { label: 'Virtual Tours', value: 65, trend: 'up' },
                { label: 'Blockchain Title', value: 58, trend: 'up' }
            ]
        };

        return trends[industry] || trends['Technology'];
    };

    return {
        keyMetrics,
        swot: generateSWOT(project, project.industry),
        recommendations: generateRecommendations(project, riskLevel),
        marketTrends: generateMarketTrends(project.industry),
        successProbability,
        riskLevel,
        competitionLevel,
        marketScore,
        growthPotential
    };
}

module.exports = new ProjectController();
