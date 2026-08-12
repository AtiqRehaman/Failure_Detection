const { ProjectModel } = require('../models');

class ProjectController {
    async createProject(req, res, next) {
        try {
            // Get user_id from authenticated user (set by auth middleware)
            const userId = req.user?.userId;
            
            if (!userId) {
                return res.status(401).json({
                    status: 'error',
                    message: 'User not authenticated'
                });
            }

            const projectData = {
                user_id: userId,  // Add the user_id from the authenticated user
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
        'Manufacturing': 80,
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
        'Manufacturing': 72,
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
        const mediumRiskIndustries = ['Healthcare', 'Education', 'Retail', 'Entertainment', 'Manufacturing'];
        
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

    // Generate SWOT analysis based on industry
    const generateSWOT = (project, industry) => {
        const swotData = {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: []
        };

        // Industry-specific SWOT
        if (industry === 'Manufacturing') {
            swotData.strengths = [
                'Established production capabilities',
                'Quality control expertise',
                'Supply chain relationships',
                'Industry experience and knowledge'
            ];
            swotData.weaknesses = [
                'High initial capital investment required',
                'Equipment maintenance and upgrade costs',
                'Skilled labor shortage in specialized areas',
                'Slow technology adoption in traditional processes'
            ];
            swotData.opportunities = [
                'Smart manufacturing and Industry 4.0 adoption',
                'IoT and automation integration for efficiency',
                'Sustainable and green manufacturing methods',
                'Export market expansion opportunities'
            ];
            swotData.threats = [
                'International competition from low-cost countries',
                'Raw material price volatility',
                'Supply chain disruptions and logistics challenges',
                'Regulatory compliance and environmental standards'
            ];
        } else if (industry === 'Technology') {
            swotData.strengths = [
                'Strong market demand',
                'Innovative approach',
                'Scalable business model',
                'Tech-savvy team',
                'Rapid innovation potential'
            ];
            swotData.weaknesses = [
                'High R&D costs',
                'Rapid technology changes',
                'Limited initial funding',
                'Market entry challenges'
            ];
            swotData.opportunities = [
                'AI integration',
                'Cloud adoption',
                'Growing market segment',
                'Technology advancement'
            ];
            swotData.threats = [
                'Technology disruption',
                'IP challenges',
                'Market competition',
                'Regulatory changes'
            ];
        } else if (industry === 'Healthcare') {
            swotData.strengths = [
                'Regulatory compliance',
                'Essential service',
                'Strong market demand',
                'Innovative approach'
            ];
            swotData.weaknesses = [
                'High regulatory barriers',
                'Long sales cycles',
                'Limited initial funding',
                'Market entry challenges'
            ];
            swotData.opportunities = [
                'Digital health growth',
                'Aging population',
                'Growing market segment',
                'Technology advancement'
            ];
            swotData.threats = [
                'Regulatory changes',
                'Privacy concerns',
                'Market competition',
                'Economic uncertainty'
            ];
        } else if (industry === 'Finance') {
            swotData.strengths = [
                'Financial expertise',
                'Strong compliance',
                'Scalable business model',
                'Innovative approach'
            ];
            swotData.weaknesses = [
                'High competition',
                'Regulatory complexity',
                'Limited initial funding',
                'Market entry challenges'
            ];
            swotData.opportunities = [
                'Digital banking',
                'Blockchain integration',
                'Growing market segment',
                'Strategic partnerships'
            ];
            swotData.threats = [
                'Cyber attacks',
                'Regulatory changes',
                'Market competition',
                'Economic uncertainty'
            ];
        } else if (industry === 'Education') {
            swotData.strengths = [
                'Educational expertise',
                'Strong content library',
                'Scalable business model',
                'Innovative approach'
            ];
            swotData.weaknesses = [
                'Technology adoption challenges',
                'Student engagement difficulties',
                'Limited initial funding',
                'Market entry challenges'
            ];
            swotData.opportunities = [
                'Online learning growth',
                'AI tutors and personalization',
                'Growing market segment',
                'Technology advancement'
            ];
            swotData.threats = [
                'Competition from other platforms',
                'Technology changes',
                'Market competition',
                'Regulatory changes'
            ];
        } else if (industry === 'Retail') {
            swotData.strengths = [
                'Customer relationships',
                'Brand recognition',
                'Scalable business model',
                'Innovative approach'
            ];
            swotData.weaknesses = [
                'High competition',
                'Margins pressure',
                'Limited initial funding',
                'Market entry challenges'
            ];
            swotData.opportunities = [
                'E-commerce growth',
                'Omnichannel retail',
                'Growing market segment',
                'Strategic partnerships'
            ];
            swotData.threats = [
                'Online competitors',
                'Changing consumer behavior',
                'Market competition',
                'Economic uncertainty'
            ];
        } else {
            // Default SWOT for other industries
            swotData.strengths = [
                'Strong market demand',
                'Innovative approach',
                'Scalable business model'
            ];
            swotData.weaknesses = [
                'Limited initial funding',
                'Market entry challenges',
                'Competitive pressure'
            ];
            swotData.opportunities = [
                'Growing market segment',
                'Technology advancement',
                'Strategic partnerships'
            ];
            swotData.threats = [
                'Market competition',
                'Regulatory changes',
                'Economic uncertainty'
            ];
        }

        return swotData;
    };

    // Generate recommendations based on project data
    const generateRecommendations = (project, riskLevel) => {
        const recommendations = [];

        // Industry-specific recommendations
        if (project.industry === 'Manufacturing') {
            recommendations.push({
                category: 'Production Optimization',
                priority: 'High',
                description: 'Implement lean manufacturing principles to reduce waste and improve operational efficiency'
            });
            recommendations.push({
                category: 'Supply Chain Management',
                priority: 'High',
                description: 'Diversify suppliers and implement inventory management systems to reduce supply chain risks'
            });
            recommendations.push({
                category: 'Quality Control',
                priority: 'High',
                description: 'Invest in automated quality control systems to maintain product consistency and reduce defects'
            });
            recommendations.push({
                category: 'Technology Integration',
                priority: 'Medium',
                description: 'Explore IoT and smart manufacturing solutions to modernize production processes and improve efficiency'
            });
            recommendations.push({
                category: 'Workforce Development',
                priority: 'Medium',
                description: 'Invest in employee training and skill development to address labor shortages and improve productivity'
            });
        } else if (project.industry === 'Technology') {
            recommendations.push({
                category: 'Innovation Strategy',
                priority: 'High',
                description: 'Invest in R&D and stay updated with emerging technologies to maintain competitive edge'
            });
            recommendations.push({
                category: 'Market Strategy',
                priority: 'High',
                description: 'Focus on targeted marketing campaigns to reach your core audience effectively'
            });
            recommendations.push({
                category: 'Financial Planning',
                priority: 'High',
                description: 'Optimize budget allocation for maximum ROI and sustainable growth'
            });
        } else {
            recommendations.push({
                category: 'Market Strategy',
                priority: 'High',
                description: 'Focus on targeted marketing campaigns to reach your core audience effectively'
            });
            recommendations.push({
                category: 'Financial Planning',
                priority: 'High',
                description: 'Optimize budget allocation for maximum ROI and sustainable growth'
            });
            recommendations.push({
                category: 'Competitive Positioning',
                priority: 'Medium',
                description: 'Differentiate your offering with a unique value proposition'
            });
        }

        // Risk-based recommendations
        if (riskLevel === 'High') {
            recommendations.push({
                category: 'Risk Mitigation',
                priority: 'High',
                description: 'Develop a comprehensive risk management strategy to address potential challenges'
            });
        }

        // Budget-based recommendations
        if (project.budget && project.budget < 100000) {
            recommendations.push({
                category: 'Funding Strategy',
                priority: 'High',
                description: 'Consider seeking additional funding from investors or explore bootstrapping options'
            });
        } else if (project.budget && project.budget > 500000) {
            recommendations.push({
                category: 'Resource Optimization',
                priority: 'Medium',
                description: 'Optimize resource allocation to ensure efficient use of available capital'
            });
        }

        // Business model recommendations
        if (project.business_model === 'B2B') {
            recommendations.push({
                category: 'Client Acquisition',
                priority: 'High',
                description: 'Develop a strong B2B sales strategy and build relationships with key decision-makers'
            });
        } else if (project.business_model === 'B2C') {
            recommendations.push({
                category: 'Customer Acquisition',
                priority: 'High',
                description: 'Focus on customer experience and build brand loyalty through engagement'
            });
        }

        return recommendations;
    };

    // Calculate success probability
    const calculateSuccessProbability = (project) => {
        let score = 60; // Base score
        
        // Industry factor
        if (['Technology', 'Healthcare', 'SaaS'].includes(project.industry)) score += 10;
        else if (['Education', 'Energy', 'E-commerce', 'Manufacturing'].includes(project.industry)) score += 5;
        
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

    // Generate market trends based on industry
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
            'Manufacturing': [
                { label: 'Factory Automation', value: 82, trend: 'up' },
                { label: 'IoT Integration', value: 76, trend: 'up' },
                { label: 'Supply Chain Optimization', value: 70, trend: 'up' },
                { label: 'Quality Control Systems', value: 68, trend: 'up' }
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
                { label: 'E-commerce Growth', value: 82, trend: 'up' },
                { label: 'Omnichannel Retail', value: 74, trend: 'up' },
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
            ],
            'Agriculture': [
                { label: 'Smart Farming', value: 76, trend: 'up' },
                { label: 'Precision Agriculture', value: 70, trend: 'up' },
                { label: 'Drone Technology', value: 65, trend: 'up' },
                { label: 'Sustainable Practices', value: 60, trend: 'up' }
            ],
            'Transportation': [
                { label: 'EV Adoption', value: 78, trend: 'up' },
                { label: 'Autonomous Vehicles', value: 68, trend: 'up' },
                { label: 'Smart Logistics', value: 72, trend: 'up' },
                { label: 'Mobility as a Service', value: 62, trend: 'up' }
            ],
            'Entertainment': [
                { label: 'Streaming Services', value: 82, trend: 'up' },
                { label: 'Digital Content', value: 76, trend: 'up' },
                { label: 'Gaming Industry', value: 70, trend: 'up' },
                { label: 'AR/VR Experiences', value: 62, trend: 'up' }
            ],
            'Food & Beverage': [
                { label: 'Plant-Based Products', value: 74, trend: 'up' },
                { label: 'Food Delivery', value: 78, trend: 'up' },
                { label: 'Sustainable Packaging', value: 68, trend: 'up' },
                { label: 'Health-Conscious Options', value: 72, trend: 'up' }
            ],
            'E-commerce': [
                { label: 'Mobile Commerce', value: 84, trend: 'up' },
                { label: 'Social Commerce', value: 76, trend: 'up' },
                { label: 'Personalization', value: 72, trend: 'up' },
                { label: 'Fast Delivery', value: 68, trend: 'up' }
            ],
            'SaaS': [
                { label: 'Cloud Adoption', value: 88, trend: 'up' },
                { label: 'AI Integration', value: 82, trend: 'up' },
                { label: 'Mobile Solutions', value: 76, trend: 'up' },
                { label: 'Security Features', value: 72, trend: 'up' }
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