// server/services/recommendation.service.js
const { pool } = require('../config/database');
const llmService = require('./llm.service');

class RecommendationService {
    constructor() {
        this.MAX_REFINEMENTS = 1;
    }

    async generateRecommendations(projectId) {
        try {
            console.log(`📋 Generating recommendations for project: ${projectId}`);
            
            // Step 1: Collect analysis context
            const context = await this.collectAnalysisContext(projectId);
            
            if (!context || !context.risks || context.risks.length === 0) {
                return {
                    status: 'insufficient_data',
                    message: 'No risk data available for recommendations. Please generate analysis first.'
                };
            }

            // Step 2: Build compact context
            const compactContext = this.buildCompactContext(context);
            
            // Step 3: Generate recommendations using LLM
            const result = await this.generateWithLLM(compactContext);
            
            // Step 4: Store recommendations in database
            if (result.recommendations && result.recommendations.length > 0) {
                await this.storeRecommendations(projectId, result);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Recommendation generation error:', error);
            return this.generateFallbackRecommendations();
        }
    }

    async collectAnalysisContext(projectId) {
        try {
            // Get project
            const projectResult = await pool.query(
                'SELECT * FROM projects WHERE project_id = $1',
                [projectId]
            );
            
            if (projectResult.rows.length === 0) {
                throw new Error('Project not found');
            }
            const project = projectResult.rows[0];

            // Get risks
            const riskResult = await pool.query(
                'SELECT * FROM risk_assessments WHERE project_id = $1 AND is_latest = true',
                [projectId]
            );
            const risks = riskResult.rows;

            // Get SWOT
            const swotResult = await pool.query(
                'SELECT * FROM swot_analysis WHERE project_id = $1 AND is_latest = true',
                [projectId]
            );
            const swot = swotResult.rows[0];

            // Get prediction
            const predictionResult = await pool.query(
                'SELECT * FROM success_predictions WHERE project_id = $1 AND is_latest = true',
                [projectId]
            );
            const prediction = predictionResult.rows[0];

            return {
                project,
                risks,
                swot,
                prediction
            };
        } catch (error) {
            console.error('❌ Error collecting analysis context:', error);
            throw error;
        }
    }

    buildCompactContext(context) {
        const { project, risks, swot, prediction } = context;

        // Sort risks by score (highest first)
        const sortedRisks = [...risks].sort((a, b) => 
            parseFloat(b.risk_score) - parseFloat(a.risk_score)
        );

        // Build compact context
        return {
            project_summary: {
                name: project.project_name,
                industry: project.industry,
                business_model: project.business_model,
                target_market: project.target_market_size,
                budget: project.budget,
                employees: project.employees_count,
                founder_experience: project.founder_experience_years,
                description: project.description
            },
            high_priority_risks: sortedRisks
                .filter(r => r.priority_level === 'HIGH' || r.priority_level === 'CRITICAL')
                .map(r => ({
                    category: r.risk_category,
                    score: r.risk_score,
                    priority: r.priority_level,
                    description: r.risk_description
                })),
            all_risks: sortedRisks.map(r => ({
                category: r.risk_category,
                score: r.risk_score,
                priority: r.priority_level
            })),
            swot: swot ? {
                strengths: swot.strengths || [],
                weaknesses: swot.weaknesses || [],
                opportunities: swot.opportunities || [],
                threats: swot.threats || [],
                summary: swot.summary || ''
            } : null,
            prediction: prediction ? {
                success_probability: prediction.success_probability,
                overall_risk: prediction.overall_risk_score,
                confidence: prediction.confidence_rating,
                evaluation: prediction.system_evaluation
            } : null
        };
    }

    async generateWithLLM(context) {
        try {
            // Build prompt
            const prompt = this.buildRecommendationPrompt(context);
            
            // Use llm.service to generate recommendations
            let result = await llmService.generateRecommendations(prompt);
            
            // If result is valid, return it
            if (result && result.recommendations && result.recommendations.length > 0) {
                return {
                    ...result,
                    llm_provider: llmService.provider || 'local',
                    refined: false
                };
            }
            
            // Otherwise use fallback
            return this.generateFallbackRecommendations();
            
        } catch (error) {
            console.error('❌ LLM generation error:', error);
            return this.generateFallbackRecommendations();
        }
    }

    buildRecommendationPrompt(context) {
        const highRisks = context.high_priority_risks || [];
        const allRisks = context.all_risks || [];
        
        return `You are Senken, a strategic business advisor for startups and projects.

PROJECT SUMMARY:
- Name: ${context.project_summary.name}
- Industry: ${context.project_summary.industry}
- Business Model: ${context.project_summary.business_model}
- Target Market: ${context.project_summary.target_market}
- Budget: ₹${context.project_summary.budget || 0}
- Employees: ${context.project_summary.employees || 'N/A'}
- Founder Experience: ${context.project_summary.founder_experience || 0} years

RISK ASSESSMENT:
${allRisks.map(r => `- ${r.category}: ${r.score}% (${r.priority})`).join('\n')}

HIGH PRIORITY RISKS:
${highRisks.length > 0 ? highRisks.map(r => `- ${r.category}: ${r.score}% - ${r.description || ''}`).join('\n') : 'None identified'}

${context.swot ? `
SWOT ANALYSIS:
Strengths: ${context.swot.strengths.join(', ')}
Weaknesses: ${context.swot.weaknesses.join(', ')}
Opportunities: ${context.swot.opportunities.join(', ')}
Threats: ${context.swot.threats.join(', ')}
` : ''}

${context.prediction ? `
SUCCESS PREDICTION:
- Success Probability: ${context.prediction.success_probability}%
- Overall Risk: ${context.prediction.overall_risk}%
- Confidence: ${context.prediction.confidence}%
- Evaluation: ${context.prediction.evaluation}
` : ''}

Generate 3-5 strategic recommendations focusing on the highest priority risks.

Return a JSON object with this structure:
{
    "summary": "Strategic overview (2-3 sentences)",
    "recommendations": [
        {
            "title": "Recommendation title",
            "priority": "high/medium/low",
            "risk_addressed": "Risk category this addresses",
            "reasoning": "Why this recommendation",
            "action": "Specific action steps",
            "expected_impact": "Expected outcome"
        }
    ],
    "improvement_suggestions": [
        {
            "title": "Improvement title",
            "reasoning": "Why this improvement",
            "action": "Action steps",
            "expected_impact": "Expected outcome"
        }
    ]
}

Return ONLY valid JSON. No other text.`;
    }

    async storeRecommendations(projectId, result) {
        try {
            // Mark existing recommendations as not latest
            await pool.query(
                `UPDATE recommendations 
                 SET is_latest = false 
                 WHERE project_id = $1`,
                [projectId]
            );

            let storedCount = 0;

            // Store each recommendation
            for (const rec of result.recommendations || []) {
                const priority = rec.priority === 'high' ? 'HIGH' : 
                               rec.priority === 'medium' ? 'MEDIUM' : 
                               rec.priority === 'low' ? 'LOW' : 'MEDIUM';
                
                await pool.query(
                    `INSERT INTO recommendations 
                     (project_id, recommendation_text, category, risk_mitigation, 
                      priority, expected_impact, implementation_steps, is_latest) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
                    [
                        projectId,
                        rec.action || rec.title || '',
                        'Strategic',
                        rec.action || '',
                        priority,
                        rec.expected_impact || '',
                        JSON.stringify({
                            reasoning: rec.reasoning || '',
                            risk_addressed: rec.risk_addressed || '',
                            title: rec.title || ''
                        })
                    ]
                );
                storedCount++;
            }

            // Store improvement suggestions
            for (const imp of result.improvement_suggestions || []) {
                await pool.query(
                    `INSERT INTO recommendations 
                     (project_id, recommendation_text, category, priority, 
                      expected_impact, is_latest) 
                     VALUES ($1, $2, $3, $4, $5, true)`,
                    [
                        projectId,
                        imp.action || imp.title || '',
                        'Improvement',
                        'MEDIUM',
                        imp.expected_impact || ''
                    ]
                );
                storedCount++;
            }

            console.log(`✅ Stored ${storedCount} recommendations for project ${projectId}`);
        } catch (error) {
            console.error('❌ Error storing recommendations:', error);
        }
    }

    generateFallbackRecommendations() {
        return {
            summary: "Based on the project analysis, the following strategic recommendations are suggested to mitigate risks and improve success probability.",
            recommendations: [
                {
                    title: "Develop a Comprehensive Risk Management Plan",
                    priority: "high",
                    risk_addressed: "Overall Risk",
                    reasoning: "Structured risk management is essential for project success.",
                    action: "Create a risk register, assign owners, and establish monitoring mechanisms.",
                    expected_impact: "Reduces overall project risk"
                },
                {
                    title: "Secure Additional Funding Sources",
                    priority: "high",
                    risk_addressed: "Financial Risk",
                    reasoning: "Financial stability is critical for project sustainability.",
                    action: "Explore grants, investor networks, and strategic partnerships.",
                    expected_impact: "Provides financial buffer"
                },
                {
                    title: "Build Strategic Partnerships",
                    priority: "medium",
                    risk_addressed: "Market Risk",
                    reasoning: "Partnerships can accelerate market entry and reduce risks.",
                    action: "Identify and engage potential partners in the industry.",
                    expected_impact: "Accelerates market validation"
                },
                {
                    title: "Validate Market Fit Early",
                    priority: "medium",
                    risk_addressed: "Market Risk",
                    reasoning: "Early validation reduces market entry risks.",
                    action: "Run pilot programs and gather customer feedback.",
                    expected_impact: "Improves product-market fit"
                },
                {
                    title: "Invest in Team Development",
                    priority: "medium",
                    risk_addressed: "Business Risk",
                    reasoning: "A strong team improves execution and reduces risks.",
                    action: "Hire key roles and provide training.",
                    expected_impact: "Improves execution capability"
                }
            ],
            improvement_suggestions: [
                {
                    title: "Enhance Team Capabilities",
                    reasoning: "Additional expertise can improve execution.",
                    action: "Hire key roles or engage experienced advisors.",
                    expected_impact: "Improves execution capability"
                },
                {
                    title: "Implement Regular Progress Reviews",
                    reasoning: "Regular reviews help identify issues early.",
                    action: "Schedule weekly progress reviews with key stakeholders.",
                    expected_impact: "Early issue detection"
                },
                {
                    title: "Develop a Strong Value Proposition",
                    reasoning: "A clear value proposition differentiates from competitors.",
                    action: "Refine messaging and positioning based on customer insights.",
                    expected_impact: "Increases customer acquisition"
                }
            ],
            llm_provider: 'fallback',
            refined: false
        };
    }
}

module.exports = new RecommendationService();