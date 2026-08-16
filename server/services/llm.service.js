// server/services/llm.service.js
const { GoogleGenAI } = require("@google/genai");

class LLMService {
    constructor() {
        this.provider = process.env.AI_PROVIDER || "gemini";
        this.localApiUrl = process.env.LOCAL_API_URL || "http://localhost:8000";
        
        if (this.provider === "gemini") {
            this.ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY,
            });
            console.log("✅ LLM Service initialized with Gemini");
        } else if (this.provider === "local") {
            console.log(`✅ LLM Service initialized with Local LLM at: ${this.localApiUrl}`);
        } else {
            console.log(`⚠️ Unknown provider: ${this.provider}, falling back to gemini`);
            this.provider = "gemini";
            this.ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY,
            });
        }
    }

    async generateExplanation(project, mlResults) {
        try {
            const prompt = this.buildMLExplanationPrompt(project, mlResults);
            
            if (this.provider === "gemini") {
                return await this.generateWithGemini(prompt);
            } else if (this.provider === "local") {
                return await this.generateWithLocal(prompt);
            } else {
                return this.generateFallbackExplanation(project, mlResults);
            }
        } catch (error) {
            console.error("LLM generation error:", error);
            return this.generateFallbackExplanation(project, mlResults);
        }
    }

    buildMLExplanationPrompt(project, mlResults) {
    return `
You are a professional business analyst. Based on the following ML analysis results, provide a comprehensive qualitative explanation.

CRITICAL INSTRUCTIONS:
1. Use the ML results as FACTS - DO NOT change or override them
2. Provide professional, human-readable explanations
3. For mitigating strategies, provide SPECIFIC, ACTIONABLE strategies based on the risk scores
4. Return ONLY valid JSON

PROJECT DETAILS:
- Name: ${project.project_name}
- Industry: ${project.industry}
- Business Model: ${project.business_model}
- Target Market Size: ${project.target_market_size}
- Budget: ₹${project.budget || 0}
- Employees: ${project.employees_count || 1}
- Founder Experience: ${project.founder_experience_years || 0} years
- Description: ${project.description || 'No description provided'}

ML ANALYSIS RESULTS (DO NOT CHANGE THESE):
- Success Probability: ${mlResults.success_probability}%
- Success Prediction: ${mlResults.success_prediction}
- Overall Risk Score: ${mlResults.overall_risk_score}%
- Confidence Rating: ${mlResults.confidence_rating}%
- System Evaluation: ${mlResults.system_evaluation}
- Risk Distribution:
  - Financial Risk: ${mlResults.risk_distribution.financial}%
  - Market Risk: ${mlResults.risk_distribution.market}%
  - Technical Risk: ${mlResults.risk_distribution.technical}%
  - Business Risk: ${mlResults.risk_distribution.business}%
  - Regulatory Risk: ${mlResults.risk_distribution.regulatory}%

Based on these ML results, provide:

1. MITIGATING STRATEGIES:
   For each risk area (Financial, Market, Technical, Business, Regulatory), provide 3-4 specific, actionable strategies.
   
   IMPORTANT: The strategies should be tailored to the risk score:
   - If risk score > 70: Provide urgent, high-priority mitigation strategies
   - If risk score > 40: Provide preventive strategies
   - If risk score < 40: Provide monitoring strategies

2. SWOT MATRIX:
   - Strengths: 4-5 internal positive factors based on the project and ML results
   - Weaknesses: 4-5 internal negative factors based on the project and ML results
   - Opportunities: 4-5 external positive factors based on the project and ML results
   - Threats: 4-5 external negative factors based on the project and ML results
   - Summary: A brief overall assessment

3. EXECUTIVE SUMMARY:
   A concise summary of the project's viability and key recommendations (2-3 paragraphs).

4. RECOMMENDED ACTIONS:
   List 5-7 specific, prioritized actions based on the ML results.

Format the response as JSON:
{
    "mitigating_strategies": {
        "financial": ["strategy1", "strategy2", "strategy3", "strategy4"],
        "market": ["strategy1", "strategy2", "strategy3", "strategy4"],
        "technical": ["strategy1", "strategy2", "strategy3", "strategy4"],
        "business": ["strategy1", "strategy2", "strategy3", "strategy4"],
        "regulatory": ["strategy1", "strategy2", "strategy3", "strategy4"]
    },
    "swot": {
        "strengths": ["strength1", "strength2", "strength3", "strength4"],
        "weaknesses": ["weakness1", "weakness2", "weakness3", "weakness4"],
        "opportunities": ["opportunity1", "opportunity2", "opportunity3", "opportunity4"],
        "threats": ["threat1", "threat2", "threat3", "threat4"],
        "summary": "Overall SWOT summary"
    },
    "executive_summary": "Brief executive summary",
    "recommended_actions": [
        {
            "action": "Action description",
            "priority": "HIGH/MEDIUM/LOW",
            "impact": "Expected impact"
        }
    ]
}

Return ONLY valid JSON.`;
}

    async generateWithGemini(prompt) {
        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ],
                config: {
                    temperature: 0.3,
                    topK: 20,
                    topP: 0.8,
                    maxOutputTokens: 2048,
                    responseMimeType: "application/json",
                }
            });

            const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                throw new Error("No response from Gemini");
            }

            // Safely parse JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(text);
        } catch (error) {
            console.error("Gemini generation error:", error);
            throw error;
        }
    }

    async generateWithLocal(prompt) {
        try {
            const response = await fetch(`${this.localApiUrl}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt,
                    system_prompt: "You are a professional business analyst. Return ONLY valid JSON.",
                    temperature: 0.3,
                    max_tokens: 2048
                })
            });

            if (!response.ok) {
                throw new Error(`Local LLM error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.response || data.text;
            
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(text);
        } catch (error) {
            console.error("Local LLM generation error:", error);
            throw error;
        }
    }

    generateFallbackExplanation(project, mlResults) {
        // Rule-based fallback when LLM fails
        const riskLevel = mlResults.overall_risk_score;
        let riskDescription = "Moderate";
        if (riskLevel < 30) riskDescription = "Low";
        else if (riskLevel < 55) riskDescription = "Moderate";
        else if (riskLevel < 70) riskDescription = "High";
        else riskDescription = "Very High";

        // Generate strategies based on risk scores
        const getStrategies = (riskScore, category) => {
            if (riskScore > 70) {
                return [
                    `Develop comprehensive ${category.toLowerCase()} risk management plan`,
                    `Consult with ${category.toLowerCase()} experts for mitigation`,
                    `Implement regular ${category.toLowerCase()} risk monitoring`
                ];
            } else if (riskScore > 40) {
                return [
                    `Implement ${category.toLowerCase()} risk controls`,
                    `Monitor ${category.toLowerCase()} risk indicators`,
                    `Develop contingency plans for ${category.toLowerCase()} risks`
                ];
            } else {
                return [
                    `Maintain current ${category.toLowerCase()} risk management practices`,
                    `Review ${category.toLowerCase()} risk periodically`,
                    `Document ${category.toLowerCase()} risk procedures`
                ];
            }
        };

        return {
            mitigating_strategies: {
                financial: getStrategies(mlResults.risk_distribution.financial, 'Financial'),
                market: getStrategies(mlResults.risk_distribution.market, 'Market'),
                technical: getStrategies(mlResults.risk_distribution.technical, 'Technical'),
                business: getStrategies(mlResults.risk_distribution.business, 'Business'),
                regulatory: getStrategies(mlResults.risk_distribution.regulatory, 'Regulatory')
            },
            swot: {
                strengths: [
                    "Strong market demand",
                    "Innovative approach",
                    "Scalable business model",
                    "Experienced team"
                ],
                weaknesses: [
                    "Limited initial funding",
                    "Market entry challenges",
                    "Competitive pressure",
                    "Resource constraints"
                ],
                opportunities: [
                    "Growing market segment",
                    "Technology advancement",
                    "Strategic partnerships",
                    "New customer segments"
                ],
                threats: [
                    "Market competition",
                    "Regulatory changes",
                    "Economic uncertainty",
                    "Technology disruption"
                ],
                summary: `The project shows ${mlResults.success_probability >= 70 ? 'strong' : 'moderate'} potential with ${riskDescription} risk. ${mlResults.success_probability >= 70 ? 'Recommended to proceed with proper planning.' : 'Recommend careful planning and risk mitigation.'}`
            },
            executive_summary: `Based on ML analysis, this project has a ${mlResults.success_probability}% success probability with ${riskDescription} overall risk. The system evaluation indicates "${mlResults.system_evaluation}". Key areas requiring attention include ${Object.entries(mlResults.risk_distribution).sort((a,b) => b[1] - a[1]).slice(0, 2).map(([k,v]) => `${k} (${v}%)`).join(' and ')}.`,
            recommended_actions: [
                {
                    action: "Validate market fit through pilot programs",
                    priority: "HIGH",
                    impact: "Reduces market risk and validates assumptions"
                },
                {
                    action: "Secure additional funding for growth",
                    priority: "HIGH",
                    impact: "Ensures adequate resources for execution"
                },
                {
                    action: "Build strategic partnerships",
                    priority: "MEDIUM",
                    impact: "Accelerates market entry and reduces risk"
                },
                {
                    action: "Develop a detailed risk mitigation plan",
                    priority: "HIGH",
                    impact: "Reduces overall project risk"
                },
                {
                    action: "Invest in team development",
                    priority: "MEDIUM",
                    impact: "Improves execution capability"
                }
            ]
        };
    }
}

module.exports = new LLMService();