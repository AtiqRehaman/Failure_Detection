const { GoogleGenAI } = require("@google/genai");

class LLMService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || "gemini";
    this.localApiUrl = process.env.LOCAL_API_URL || "http://localhost:8000";

    if (this.provider === "gemini") {
      try {
        this.ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });
        console.log("LLM provider: Gemini.");
      } catch (error) {
        console.warn("Gemini unavailable; fallback mode enabled.");
        this.provider = "fallback";
        this.ai = null;
      }
    } else if (this.provider === "local") {
      console.log(`LLM provider: local (${this.localApiUrl}).`);
    } else {
      console.warn(
        `Unknown LLM provider: ${this.provider}; fallback mode enabled.`,
      );
      this.provider = "fallback";
      this.ai = null;
    }
  }

  // GENERATE EXPLANATION - Main Entry Point

  async generateExplanation(project, mlResults) {
    try {
      // Try AI first
      const result = await this.tryGenerateExplanation(project, mlResults);
      if (result) {
        return result;
      }

      // Fallback to rule-based
      return this.generateFallbackExplanation(project, mlResults);
    } catch (error) {
      console.error("❌ LLM generation error:", error);
      return this.generateFallbackExplanation(project, mlResults);
    }
  }

  async tryGenerateExplanation(project, mlResults) {
    try {
      const prompt = this.buildMLExplanationPrompt(project, mlResults);

      if (this.provider === "gemini" && this.ai) {
        return await this.generateWithGemini(prompt);
      } else if (this.provider === "local") {
        return await this.generateWithLocal(prompt);
      } else {
        return null;
      }
    } catch (error) {
      console.warn("⚠️ AI generation failed:", error.message);
      return null;
    }
  }

  // GENERATE WITH GEMINI

async generateWithGemini(prompt) {
  if (!this.ai) {
    throw new Error("Gemini not initialized");
  }

  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        config: {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      });

      const text =
        response.text ||
        response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("No response from Gemini");
      }

      // Gemini was requested to return JSON, so parse it directly.
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.warn(
          `⚠️ Gemini returned invalid JSON (attempt ${
            attempt + 1
          }/${maxRetries + 1})`,
        );

        throw new Error(`Invalid Gemini JSON: ${parseError.message}`);
      }
    } catch (error) {
      const message = error?.message || String(error);

      // Detect transient Gemini errors
      const isRetryable =
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("429") ||
        message.includes("500") ||
        message.includes("502") ||
        message.includes("504") ||
        message.includes("high demand") ||
        message.includes("overloaded");

      // Last attempt → let caller trigger fallback
      if (attempt === maxRetries || !isRetryable) {
        console.error("❌ Gemini generation error:", message);
        return null;
      }

      // Exponential backoff + small jitter
      const delay =
        baseDelay * Math.pow(2, attempt) +
        Math.floor(Math.random() * 500);

      console.warn(
        `⚠️ Gemini temporarily unavailable. Retrying in ${delay}ms...`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
}

  // GENERATE WITH LOCAL LLM

  async generateWithLocal(prompt) {
    try {
      // Check if local API URL is configured
      if (!this.localApiUrl || this.localApiUrl === "http://localhost:8000") {
        throw new Error("Local LLM URL not configured");
      }

      const response = await fetch(`${this.localApiUrl}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          system_prompt:
            "You are a professional business analyst. Return ONLY valid JSON.",
          temperature: 0.3,
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Local LLM error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.response || data.text;

      if (!text) {
        throw new Error("No response from Local LLM");
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (error) {
      console.error("❌ Local LLM generation error:", error.message);
      return null;
    }
  }

  // BUILD ML EXPLANATION PROMPT

  buildMLExplanationPrompt(project, mlResults) {
  const isGemini = this.provider === "gemini";

  if (isGemini) {
    return `
You are a professional business analyst.

Use the following ML results as FACTS. Do not change, recalculate, or contradict them.

Return ONLY valid JSON. Keep ALL text concise.

PROJECT:
Name: ${project.project_name}
Industry: ${project.industry}
Business Model: ${project.business_model}
Market Size: ${project.target_market_size}
Budget: ₹${project.budget || 0}
Employees: ${project.employees_count || 1}
Founder Experience: ${project.founder_experience_years || 0} years
Description: ${project.description || "N/A"}

ML RESULTS:
Success Probability: ${mlResults.success_probability}%
Success Prediction: ${mlResults.success_prediction}
Overall Risk: ${mlResults.overall_risk_score}%
Confidence: ${mlResults.confidence_rating}%
Evaluation: ${mlResults.system_evaluation}
Financial Risk: ${mlResults.risk_distribution.financial}%
Market Risk: ${mlResults.risk_distribution.market}%
Technical Risk: ${mlResults.risk_distribution.technical}%
Business Risk: ${mlResults.risk_distribution.business}%
Regulatory Risk: ${mlResults.risk_distribution.regulatory}%

Generate:

1. MITIGATING STRATEGIES
Provide exactly 2 short strategies for each risk category.
Each strategy must be actionable and under 15 words.

2. SWOT
Provide exactly 3 concise items for each category.
Each item must be under 12 words.
Summary must be under 35 words.

3. EXECUTIVE SUMMARY
Provide one concise paragraph under 80 words.

4. RECOMMENDATIONS
Provide exactly 3 recommendations focused on the highest risks.
Each field must be concise:
- title
- priority
- risk_addressed
- reasoning
- action
- expected_impact

Each field must be under 25 words.

5. IMPROVEMENT SUGGESTIONS
Provide exactly 2 suggestions.
Keep every field under 25 words.

JSON FORMAT:
{
  "mitigating_strategies": {
    "financial": ["strategy1", "strategy2"],
    "market": ["strategy1", "strategy2"],
    "technical": ["strategy1", "strategy2"],
    "business": ["strategy1", "strategy2"],
    "regulatory": ["strategy1", "strategy2"]
  },
  "swot": {
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2", "weakness3"],
    "opportunities": ["opportunity1", "opportunity2", "opportunity3"],
    "threats": ["threat1", "threat2", "threat3"],
    "summary": "Brief SWOT summary"
  },
  "executive_summary": "Brief executive summary",
  "recommendations": [
    {
      "title": "Recommendation",
      "priority": "high",
      "risk_addressed": "Risk category",
      "reasoning": "Brief reason",
      "action": "Specific action",
      "expected_impact": "Expected impact"
    }
  ],
  "improvement_suggestions": [
    {
      "title": "Improvement",
      "reasoning": "Brief reason",
      "action": "Specific action",
      "expected_impact": "Expected impact"
    }
  ]
}

Return ONLY the JSON object. Do not use markdown or code fences.
`;
  }

  // Detailed prompt for local LLM
  return `
You are a professional business analyst. Based on the following ML analysis results, provide a comprehensive qualitative explanation.

CRITICAL INSTRUCTIONS:
1. Use the ML results as FACTS - DO NOT change or override them
2. Provide professional, human-readable explanations
3. Return ONLY valid JSON

PROJECT DETAILS:
- Name: ${project.project_name}
- Industry: ${project.industry}
- Business Model: ${project.business_model}
- Target Market Size: ${project.target_market_size}
- Budget: ₹${project.budget || 0}
- Employees: ${project.employees_count || 1}
- Founder Experience: ${project.founder_experience_years || 0} years
- Description: ${project.description || "No description provided"}

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
For each risk area (Financial, Market, Technical, Business, Regulatory), provide 2-3 specific, actionable strategies based on the risk scores.

2. SWOT MATRIX:
- Strengths: 4-5 internal positive factors
- Weaknesses: 4-5 internal negative factors
- Opportunities: 4-5 external positive factors
- Threats: 4-5 external negative factors
- Summary: Overall assessment

3. EXECUTIVE SUMMARY:
Provide a concise summary of the project's viability and key recommendations.

4. STRATEGIC RECOMMENDATIONS:
Provide 3-5 actionable recommendations focused on the highest-priority risks.
Each recommendation must include:
title, priority, risk_addressed, reasoning, action, expected_impact.

Also provide 2-4 improvement suggestions.

Format the response as JSON:
{
  "mitigating_strategies": {
    "financial": ["strategy1", "strategy2", "strategy3"],
    "market": ["strategy1", "strategy2", "strategy3"],
    "technical": ["strategy1", "strategy2", "strategy3"],
    "business": ["strategy1", "strategy2", "strategy3"],
    "regulatory": ["strategy1", "strategy2", "strategy3"]
  },
  "swot": {
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2", "weakness3"],
    "opportunities": ["opportunity1", "opportunity2", "opportunity3"],
    "threats": ["threat1", "threat2", "threat3"],
    "summary": "Overall SWOT summary"
  },
  "executive_summary": "Brief executive summary",
  "recommendations": [
    {
      "title": "Recommendation title",
      "priority": "high/medium/low",
      "risk_addressed": "Risk category",
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

Return ONLY valid JSON.
`;
}

  // RECOMMENDATION GENERATION (Milestone 3)

  async generateRecommendations(prompt) {
    try {
      let result = null;

      if (this.provider === "gemini" && this.ai) {
        result = await this.generateWithGemini(prompt);
      } else if (this.provider === "local") {
        result = await this.generateWithLocal(prompt);
      }

      if (
        result &&
        result.recommendations &&
        result.recommendations.length > 0
      ) {
        return result;
      }

      // Fallback to static recommendations
      return this.generateFallbackRecommendations();
    } catch (error) {
      console.error("❌ Recommendation generation error:", error);
      return this.generateFallbackRecommendations();
    }
  }

  generateFallbackRecommendations() {
    return {
      summary:
        "Based on the project analysis, the following strategic recommendations are suggested to mitigate risks and improve success probability.",
      recommendations: [
        {
          title: "Develop a Comprehensive Risk Management Plan",
          priority: "high",
          risk_addressed: "Overall Risk",
          reasoning:
            "Structured risk management is essential for project success. Identifying and addressing risks early can prevent major setbacks.",
          action:
            "Create a risk register, assign risk owners, establish monitoring mechanisms, and conduct regular risk reviews.",
          expected_impact:
            "Reduces overall project risk and improves decision-making",
        },
        {
          title: "Secure Additional Funding Sources",
          priority: "high",
          risk_addressed: "Financial Risk",
          reasoning:
            "Financial stability is critical for project sustainability. Diverse funding sources reduce dependency on single investors.",
          action:
            "Explore government grants, angel investor networks, venture capital, and strategic partnerships.",
          expected_impact: "Provides financial buffer and reduces funding risk",
        },
        {
          title: "Build Strategic Partnerships",
          priority: "medium",
          risk_addressed: "Market Risk",
          reasoning:
            "Partnerships can accelerate market entry, reduce costs, and provide access to established customer bases.",
          action:
            "Identify potential partners in the industry, develop partnership proposals, and establish mutual benefit agreements.",
          expected_impact:
            "Accelerates market validation and customer acquisition",
        },
        {
          title: "Validate Market Fit Early",
          priority: "medium",
          risk_addressed: "Market Risk",
          reasoning:
            "Early validation reduces market entry risks and helps refine the product offering.",
          action:
            "Run pilot programs, gather customer feedback, and iterate based on insights.",
          expected_impact:
            "Improves product-market fit and reduces development waste",
        },
        {
          title: "Invest in Team Development",
          priority: "medium",
          risk_addressed: "Business Risk",
          reasoning:
            "A strong team improves execution, reduces risks, and enhances overall project success.",
          action:
            "Hire key roles, provide training, and establish clear roles and responsibilities.",
          expected_impact:
            "Improves execution capability and reduces operational risks",
        },
      ],
      improvement_suggestions: [
        {
          title: "Enhance Team Capabilities",
          reasoning:
            "Additional expertise can improve execution and reduce risks.",
          action: "Hire key roles or engage experienced advisors and mentors.",
          expected_impact:
            "Improves execution capability and strategic guidance",
        },
        {
          title: "Implement Regular Progress Reviews",
          reasoning:
            "Regular reviews help identify issues early and keep the project on track.",
          action:
            "Schedule weekly progress reviews with key stakeholders and team members.",
          expected_impact:
            "Early issue detection and improved project outcomes",
        },
        {
          title: "Develop a Strong Value Proposition",
          reasoning:
            "A clear value proposition differentiates from competitors and attracts customers.",
          action:
            "Refine messaging and positioning based on customer insights and market research.",
          expected_impact: "Increases customer acquisition and retention",
        },
        {
          title: "Create a Marketing Strategy",
          reasoning:
            "A well-defined marketing strategy ensures effective customer acquisition.",
          action:
            "Develop a digital marketing plan, content strategy, and customer acquisition funnel.",
          expected_impact: "Improves brand visibility and customer acquisition",
        },
      ],
      llm_provider: "fallback",
      refined: false,
    };
  }

  // FALLBACK EXPLANATION (Rule-based - Static)

  generateFallbackExplanation(project, mlResults) {
    const riskLevel = mlResults.overall_risk_score;
    let riskDescription = "Moderate";
    if (riskLevel < 30) riskDescription = "Low";
    else if (riskLevel < 55) riskDescription = "Moderate";
    else if (riskLevel < 70) riskDescription = "High";
    else riskDescription = "Very High";

    const successLevel = mlResults.success_probability;
    let successDescription = "moderate";
    if (successLevel >= 80) successDescription = "strong";
    else if (successLevel >= 65) successDescription = "good";
    else if (successLevel >= 50) successDescription = "moderate";
    else successDescription = "limited";

    return {
      mitigating_strategies: {
        financial: [
          "Develop a detailed financial plan with clear budget allocations",
          "Secure additional funding through investors, grants, or loans",
          "Implement cost optimization measures and regular financial monitoring",
          "Create a financial contingency plan for unexpected expenses",
        ],
        market: [
          "Conduct thorough market research to validate target segments",
          "Develop a strong value proposition and clear messaging",
          "Build strategic partnerships with complementary businesses",
          "Create a customer acquisition strategy and sales funnel",
        ],
        technical: [
          "Invest in R&D and modern technology stack",
          "Build a skilled technical team with relevant expertise",
          "Implement agile development practices for rapid iteration",
          "Establish robust testing and quality assurance processes",
        ],
        business: [
          "Refine business model and revenue streams for sustainability",
          "Focus on customer acquisition and retention strategies",
          "Develop a scalable operations model",
          "Create clear metrics and KPIs for business performance",
        ],
        regulatory: [
          "Engage legal and compliance experts early in the process",
          "Stay updated on regulatory changes in the industry",
          "Implement compliance monitoring systems and processes",
          "Document all regulatory compliance procedures",
        ],
      },
      swot: {
        strengths: [
          "Strong market demand and opportunity",
          "Innovative approach and unique value proposition",
          "Scalable business model with growth potential",
          "Experienced and dedicated team",
          "Competitive advantage in target market",
        ],
        weaknesses: [
          "Limited initial funding and resources",
          "Market entry challenges and competition",
          "Competitive pressure from established players",
          "Resource constraints and skill gaps",
          "Dependency on key team members",
        ],
        opportunities: [
          "Growing market segment with increasing demand",
          "Technology advancement enabling innovation",
          "Strategic partnerships and collaborations",
          "New customer segments and markets",
          "Government initiatives and support programs",
        ],
        threats: [
          "Market competition from established players",
          "Regulatory changes and compliance requirements",
          "Economic uncertainty and market volatility",
          "Technology disruption and rapid changes",
          "Talent competition and retention challenges",
        ],
        summary: `The project shows ${successDescription} potential with ${riskDescription} overall risk. ${successLevel >= 70 ? "Recommended to proceed with proper planning and risk mitigation." : "Recommend careful evaluation and risk mitigation before proceeding."}`,
      },
      executive_summary: `Based on ML analysis, this project has a ${mlResults.success_probability}% success probability with ${riskDescription} overall risk. The system evaluation indicates "${mlResults.system_evaluation || "Moderate Potential"}". Key areas requiring attention include ${Object.entries(
        mlResults.risk_distribution,
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([k, v]) => `${k} (${v}%)`)
        .join(
          " and ",
        )}. The project shows ${successDescription} market potential with ${riskDescription} risk. Recommended focus areas include strengthening the business model, securing adequate funding, and building strategic partnerships to mitigate identified risks.`,
      recommendations: this.generateFallbackRecommendations().recommendations,
      improvement_suggestions:
        this.generateFallbackRecommendations().improvement_suggestions,
    };
  }
}

module.exports = new LLMService();
