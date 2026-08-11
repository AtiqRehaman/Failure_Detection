const { GoogleGenAI } = require("@google/genai");

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || "gemini";
    this.localApiUrl =
      process.env.LOCAL_API_URL ||
      "https://cartoons-toward-transcripts-connected.trycloudflare.com";

    if (this.provider === "gemini") {
      this.ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
      console.log("✅ AI Service initialized with Gemini");
    } else if (this.provider === "local") {
      console.log(
        `✅ AI Service initialized with Local LLM at: ${this.localApiUrl}`,
      );
    } else {
      console.log(
        `⚠️ Unknown provider: ${this.provider}, falling back to gemini`,
      );
      this.provider = "gemini";
      this.ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
    }
  }

  // ===================================================
  // ENHANCE WITH GEMINI - STRUCTURED JSON RESPONSE
  // ===================================================

  async enhanceWithGemini(ruleBasedData, project) {
    try {
      const prompt = this.buildStructuredPrompt(ruleBasedData, project);

      const response = await this.ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      });

      const text =
        response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.error("No response from Gemini");
        return ruleBasedData;
      }

      let aiData = this.safeParseJSON(text);

      if (!aiData) {
        console.error("Failed to parse Gemini response, using rule-based data");
        return ruleBasedData;
      }

      return this.mergeWithRuleBasedData(aiData, ruleBasedData);
    } catch (error) {
      console.error("Gemini enhancement error:", error);
      return ruleBasedData;
    }
  }

  // ===================================================
  // ENHANCE WITH LOCAL LLM
  // ===================================================

  async enhanceWithLocal(ruleBasedData, project) {
    try {
      const prompt = this.buildStructuredPrompt(ruleBasedData, project);

      const response = await fetch(`${this.localApiUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          system_prompt:
            "You are a professional business analyst. Return ONLY valid JSON matching the schema. Do not include any other text.",
          temperature: 0.3,
          max_tokens: 2048,
          top_p: 0.95,
        }),
      });

      if (!response.ok) {
        console.error(
          `Local LLM API error: ${response.status} ${response.statusText}`,
        );
        return ruleBasedData;
      }

      const data = await response.json();
      const text = data.response || data.text || data.generated_text;

      if (!text) {
        console.error("No response from Local LLM");
        return ruleBasedData;
      }

      let aiData = this.safeParseJSON(text);

      if (!aiData) {
        console.error(
          "Failed to parse Local LLM response, using rule-based data",
        );
        return ruleBasedData;
      }

      return this.mergeWithRuleBasedData(aiData, ruleBasedData);
    } catch (error) {
      console.error("Local LLM enhancement error:", error);
      return ruleBasedData;
    }
  }

  // ===================================================
  // SAFE JSON PARSING
  // ===================================================

  safeParseJSON(text) {
    if (!text) return null;

    let cleaned = text.trim();
    cleaned = cleaned.replace(/```json\s*/g, "").replace(/```\s*/g, "");

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      try {
        let bracketCount = 0;
        let lastValidIndex = -1;
        let inString = false;
        let escapeNext = false;

        for (let i = 0; i < cleaned.length; i++) {
          const char = cleaned[i];

          if (escapeNext) {
            escapeNext = false;
            continue;
          }

          if (char === "\\") {
            escapeNext = true;
            continue;
          }

          if (char === '"' && !escapeNext) {
            inString = !inString;
          }

          if (!inString) {
            if (char === "{") bracketCount++;
            if (char === "}") {
              bracketCount--;
              if (bracketCount === 0) {
                lastValidIndex = i;
                break;
              }
            }
          }
        }

        if (lastValidIndex > 0) {
          const validJson = cleaned.substring(0, lastValidIndex + 1);
          return JSON.parse(validJson);
        }
      } catch (e2) {
        try {
          let jsonStr = cleaned;
          jsonStr = jsonStr.replace(/,\s*}/g, "}");
          jsonStr = jsonStr.replace(/,\s*\]/g, "]");
          jsonStr = jsonStr.replace(
            /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
            '$1"$2":',
          );
          jsonStr = jsonStr.replace(/'/g, '"');
          jsonStr = jsonStr.replace(/\/\/.*$/gm, "");
          jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, "");
          return JSON.parse(jsonStr);
        } catch (e3) {
          return null;
        }
      }
    }

    return null;
  }

  // ===================================================
  // BUILD STRUCTURED PROMPT (Without Recommendations)
  // ===================================================

  buildStructuredPrompt(ruleBasedData, project) {
    const jsonSchema = {
      type: "object",
      properties: {
        risks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              score: { type: "number" },
              description: { type: "string" },
              priority: {
                type: "string",
                enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
              },
              mitigation: { type: "string" },
            },
            required: [
              "category",
              "score",
              "description",
              "priority",
              "mitigation",
            ],
          },
        },
        swot: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            threats: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
          },
          required: [
            "strengths",
            "weaknesses",
            "opportunities",
            "threats",
            "summary",
          ],
        },
        prediction: {
          type: "object",
          properties: {
            successProbability: { type: "number" },
            overallRisk: { type: "number" },
            confidence: { type: "number" },
            keyDrivers: { type: "array", items: { type: "string" } },
            keyChallenges: { type: "array", items: { type: "string" } },
            timeline: { type: "string" },
          },
          required: [
            "successProbability",
            "overallRisk",
            "confidence",
            "keyDrivers",
            "keyChallenges",
            "timeline",
          ],
        },
      },
      required: ["risks", "swot", "prediction"],
    };

    return `
You are a professional business analyst. Enhance the following project analysis with professional, human-readable explanations.

⚠️ CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON matching the schema below
2. DO NOT change any scores - keep them exactly as provided
3. ONLY improve descriptions, explanations, and summaries
4. Make it sound like a professional consulting report
5. Keep JSON string values simple - avoid special characters

PROJECT DETAILS:
Name: ${project.project_name}
Industry: ${project.industry || "General"}
Business Model: ${project.business_model || "N/A"}
Target Market: ${project.target_market || "N/A"}
Budget: $${project.budget || 0}
Description: ${project.description || "No description provided"}

RULE-BASED ANALYSIS (KEEP THESE SCORES):
${JSON.stringify(
  {
    risks:
      ruleBasedData.risks?.map((r) => ({
        category: r.category,
        score: r.score,
        priority: r.priority,
      })) || [],
    swot: ruleBasedData.swot || {},
    prediction: {
      successProbability: ruleBasedData.prediction?.successProbability || 60,
      overallRisk: ruleBasedData.prediction?.overallRisk || 40,
      confidence: ruleBasedData.prediction?.confidence || 85,
    },
  },
  null,
  2,
)}

RESPONSE JSON SCHEMA:
${JSON.stringify(jsonSchema, null, 2)}

Generate enhanced professional analysis following this exact schema.
Return ONLY the JSON object, no other text.
`;
  }

  // ===================================================
  // MERGE AI DATA WITH RULE-BASED DATA
  // ===================================================

  mergeWithRuleBasedData(aiData, ruleBasedData) {
    const defaultRisks = ruleBasedData.risks || [];
    const defaultSWOT = ruleBasedData.swot || {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      summary: "SWOT analysis summary",
    };
    const defaultPrediction = ruleBasedData.prediction || {
      successProbability: 60,
      overallRisk: 40,
      confidence: 85,
      keyDrivers: ["Market potential"],
      keyChallenges: ["Competition"],
      timeline: "12-18 months",
    };

    return {
      risks:
        aiData.risks?.map((aiRisk, index) => ({
          category:
            aiRisk.category || defaultRisks[index]?.category || "General",
          score: defaultRisks[index]?.score || aiRisk.score || 50,
          description:
            aiRisk.description ||
            defaultRisks[index]?.description ||
            "Risk assessment",
          priority:
            aiRisk.priority || defaultRisks[index]?.priority || "MEDIUM",
          mitigation:
            aiRisk.mitigation ||
            defaultRisks[index]?.mitigation ||
            "Develop mitigation strategy",
        })) || defaultRisks,

      swot: {
        strengths: aiData.swot?.strengths || defaultSWOT.strengths,
        weaknesses: aiData.swot?.weaknesses || defaultSWOT.weaknesses,
        opportunities: aiData.swot?.opportunities || defaultSWOT.opportunities,
        threats: aiData.swot?.threats || defaultSWOT.threats,
        summary: aiData.swot?.summary || defaultSWOT.summary,
      },

      prediction: {
        successProbability:
          defaultPrediction.successProbability ||
          aiData.prediction?.successProbability ||
          60,
        overallRisk:
          defaultPrediction.overallRisk || aiData.prediction?.overallRisk || 40,
        confidence:
          defaultPrediction.confidence || aiData.prediction?.confidence || 85,
        keyDrivers: aiData.prediction?.keyDrivers ||
          defaultPrediction.keyDrivers || ["Market potential"],
        keyChallenges: aiData.prediction?.keyChallenges ||
          defaultPrediction.keyChallenges || ["Competition"],
        timeline:
          aiData.prediction?.timeline ||
          defaultPrediction.timeline ||
          "12-18 months",
      },
    };
  }

  // ===================================================
  // GENERIC AI ENHANCE METHOD
  // ===================================================

  async enhanceWithAI(ruleBasedData, project) {
    if (this.provider === "gemini") {
      return await this.enhanceWithGemini(ruleBasedData, project);
    } else if (this.provider === "local") {
      return await this.enhanceWithLocal(ruleBasedData, project);
    } else {
      console.warn(`Unknown provider: ${this.provider}, using rule-based only`);
      return ruleBasedData;
    }
  }

  // ===================================================
  // RULE-BASED ENGINE
  // ===================================================

  generateRuleBasedRiskAnalysis(project) {
    const industryScores = {
      Technology: {
        financial: 60,
        market: 80,
        technical: 70,
        business: 50,
        regulatory: 40,
      },
      Healthcare: {
        financial: 70,
        market: 75,
        technical: 80,
        business: 60,
        regulatory: 90,
      },
      Finance: {
        financial: 85,
        market: 70,
        technical: 75,
        business: 65,
        regulatory: 85,
      },
      Manufacturing: {
        financial: 55,
        market: 60,
        technical: 50,
        business: 45,
        regulatory: 60,
      },
      Retail: {
        financial: 50,
        market: 70,
        technical: 40,
        business: 55,
        regulatory: 35,
      },
      Education: {
        financial: 45,
        market: 65,
        technical: 55,
        business: 40,
        regulatory: 50,
      },
      Energy: {
        financial: 60,
        market: 65,
        technical: 70,
        business: 50,
        regulatory: 70,
      },
      "E-commerce": {
        financial: 55,
        market: 75,
        technical: 60,
        business: 50,
        regulatory: 45,
      },
      "Real Estate": {
        financial: 50,
        market: 55,
        technical: 45,
        business: 50,
        regulatory: 55,
      },
      Transportation: {
        financial: 55,
        market: 60,
        technical: 55,
        business: 45,
        regulatory: 60,
      },
      Agriculture: {
        financial: 50,
        market: 55,
        technical: 45,
        business: 40,
        regulatory: 50,
      },
      Entertainment: {
        financial: 60,
        market: 70,
        technical: 55,
        business: 55,
        regulatory: 40,
      },
      "Food & Beverage": {
        financial: 55,
        market: 65,
        technical: 45,
        business: 50,
        regulatory: 55,
      },
    };

    const industry = project.industry || "Technology";
    const scores = industryScores[industry] || industryScores["Technology"];

    let budgetAdjustment = 0;
    if (project.budget) {
      if (project.budget < 50000) budgetAdjustment = 15;
      else if (project.budget < 200000) budgetAdjustment = 5;
      else if (project.budget > 1000000) budgetAdjustment = -10;
    }

    const categories = [
      "Financial",
      "Market",
      "Technical",
      "Business",
      "Regulatory",
    ];
    const risks = categories.map((cat) => {
      let score = scores[cat.toLowerCase()] || 50;
      if (cat === "Financial") score += budgetAdjustment;
      score = Math.min(Math.max(Math.round(score), 0), 100);

      return {
        category: cat,
        score: score,
        description: `${cat} risk assessment`,
        priority: this.getPriorityFromScore(score),
        mitigation: `Develop ${cat} risk mitigation strategy`,
      };
    });

    const overallRisk = Math.round(
      risks.reduce((sum, r) => sum + r.score, 0) / risks.length,
    );

    return { risks, overallRisk };
  }

  generateRuleBasedSWOT(project) {
    const industry = project.industry || "General";
    let swotData = {
      strengths: [
        "Strong market demand",
        "Innovative approach",
        "Scalable business model",
        "Experienced team",
      ],
      weaknesses: [
        "Limited initial funding",
        "Market entry challenges",
        "Competitive pressure",
        "Resource constraints",
      ],
      opportunities: [
        "Growing market segment",
        "Technology advancement",
        "Strategic partnerships",
        "New customer segments",
      ],
      threats: [
        "Market competition",
        "Regulatory changes",
        "Economic uncertainty",
        "Technology disruption",
      ],
      summary:
        "Project shows potential but requires careful planning and execution.",
    };

    if (industry === "Technology") {
      swotData.strengths = [
        "Tech-savvy team",
        "Rapid innovation potential",
        "Scalable solutions",
        "High market demand",
      ];
      swotData.weaknesses = [
        "High R&D costs",
        "Rapid technology changes",
        "Talent acquisition challenges",
        "IP protection needs",
      ];
      swotData.opportunities = [
        "AI integration",
        "Cloud adoption",
        "Emerging markets",
        "Digital transformation",
      ];
      swotData.threats = [
        "Technology disruption",
        "IP challenges",
        "Competition",
        "Talent poaching",
      ];
    } else if (industry === "Healthcare") {
      swotData.strengths = [
        "Regulatory compliance expertise",
        "Essential service",
        "High barrier to entry",
        "Strong demand",
      ];
      swotData.weaknesses = [
        "High regulatory barriers",
        "Long sales cycles",
        "High compliance costs",
        "Slow adoption",
      ];
      swotData.opportunities = [
        "Digital health growth",
        "Aging population",
        "Telemedicine",
        "AI diagnostics",
      ];
      swotData.threats = [
        "Regulatory changes",
        "Privacy concerns",
        "Competition",
        "Technology disruption",
      ];
    }

    return swotData;
  }

  generateRuleBasedPrediction(project, risks) {
    let successScore = 60;

    const industryBonus = {
      Technology: 10,
      Healthcare: 12,
      Finance: 5,
      Manufacturing: 8,
      Retail: 3,
      Education: 8,
      Energy: 10,
      "E-commerce": 7,
      "Real Estate": 4,
      Transportation: 6,
      Agriculture: 5,
      Entertainment: 8,
      "Food & Beverage": 6,
      SaaS: 15,
    };
    successScore += industryBonus[project.industry] || 5;

    const modelBonus = {
      B2B: 10,
      SaaS: 15,
      Subscription: 12,
      B2C: 5,
      Marketplace: 8,
      B2G: 7,
      C2C: 4,
      Freemium: 6,
      Advertising: 5,
      "Direct Sales": 8,
      Franchise: 6,
    };
    successScore += modelBonus[project.business_model] || 5;

    if (project.budget) {
      if (project.budget > 500000) successScore += 10;
      else if (project.budget > 200000) successScore += 5;
      else if (project.budget < 50000) successScore -= 10;
    }

    if (risks && risks.length > 0) {
      const avgRisk = risks.reduce((sum, r) => sum + r.score, 0) / risks.length;
      successScore -= avgRisk * 0.2;
    }

    const finalScore = Math.min(Math.max(Math.round(successScore), 20), 95);

    return {
      successProbability: finalScore,
      overallRisk: 100 - finalScore,
      confidence: 85,
      keyDrivers: [
        "Market potential",
        "Business model viability",
        "Team capabilities",
      ],
      keyChallenges: ["Competition", "Resource allocation", "Market entry"],
      timeline: "12-18 months to market",
    };
  }

  // ===================================================
  // MAIN PUBLIC METHODS (No Recommendations)
  // ===================================================

  async generateRiskAnalysis(project) {
    const ruleBasedData = this.generateRuleBasedRiskAnalysis(project);
    const enhancedData = await this.enhanceWithAI(
      {
        risks: ruleBasedData.risks,
        swot: this.generateRuleBasedSWOT(project),
        prediction: this.generateRuleBasedPrediction(
          project,
          ruleBasedData.risks,
        ),
      },
      project,
    );
    return enhancedData || ruleBasedData;
  }

  async generateSWOTAnalysis(project) {
    const ruleBasedData = this.generateRuleBasedSWOT(project);
    const enhancedData = await this.enhanceWithAI(
      {
        risks: this.generateRuleBasedRiskAnalysis(project).risks,
        swot: ruleBasedData,
        prediction: this.generateRuleBasedPrediction(project, []),
      },
      project,
    );
    return enhancedData?.swot || ruleBasedData;
  }

  async generateSuccessPrediction(project) {
    const risks = this.generateRuleBasedRiskAnalysis(project);
    const ruleBasedData = this.generateRuleBasedPrediction(
      project,
      risks.risks,
    );
    const enhancedData = await this.enhanceWithAI(
      {
        risks: risks.risks,
        swot: this.generateRuleBasedSWOT(project),
        prediction: ruleBasedData,
      },
      project,
    );
    return enhancedData?.prediction || ruleBasedData;
  }

  getPriorityFromScore(score) {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }
}

module.exports = new AIService();
