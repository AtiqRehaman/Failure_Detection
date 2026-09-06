// server/services/ml.service.js
class MLService {
  constructor() {
    this.modelsLoaded = false;
    this.pythonApiUrl = (
      process.env.PYTHON_API_URL || "http://localhost:10000"
    ).replace(/\/$/, "");
    this.initialized = false;
    this.loadingPromise = null;
    this.useFallback = true;
  }

  async initialize() {
    if (this.initialized) {
      return this.modelsLoaded;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this._loadModels();
    return this.loadingPromise;
  }

  async _loadModels() {
    try {
      const response = await fetch(`${this.pythonApiUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      const health = await response.json();

      if (response.ok && health.status === "healthy" && health.ml_available) {
        this.modelsLoaded = true;
        this.useFallback = false;
      } else {
        console.warn(
          "⚠️ Docker ML service is unavailable. Using fallback mode.",
        );
        this.modelsLoaded = false;
        this.useFallback = true;
      }

      this.initialized = true;
      return this.modelsLoaded;
    } catch (error) {
      console.warn(
        `⚠️ Docker ML service health check failed: ${error.message}`,
      );
      this.modelsLoaded = false;
      this.initialized = true;
      this.useFallback = true;
      return false;
    } finally {
      this.loadingPromise = null;
    }
  }

  async requestDockerPrediction(features) {
    const response = await fetch(`${this.pythonApiUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features }),
      signal: AbortSignal.timeout(60000),
    });

    const result = await response.json();
    if (!response.ok || result.status !== "success") {
      throw new Error(result.detail || "Docker ML prediction failed");
    }

    return result.data;
  }

  async predictFull(features) {
    await this.initialize();

    console.log("[ML] Prediction request:", {
      ...features,
      model_loaded: this.modelsLoaded,
      fallback_enabled: this.useFallback,
    });

    // If models not loaded, use fallback predictions
    if (!this.modelsLoaded || this.useFallback) {
      console.warn("[ML] Using fallback predictions (models not loaded)");
      const fallbackResult = this.generateFallbackPredictions(features);
      console.log("[ML] Fallback response:", fallbackResult);
      return fallbackResult;
    }

    try {
      const result = await this.requestDockerPrediction(features);
      console.log("[ML] Docker model response:", result);
      return result;
    } catch (error) {
      console.error("[ML] Docker prediction error:", error.message);
      const fallbackResult = this.generateFallbackPredictions(features);
      console.log("[ML] Fallback response after Docker error:", fallbackResult);
      return fallbackResult;
    }
  }

  generateFallbackPredictions(features) {
    const industry = features.industry || "Technology";
    const budget = features.budget_inr || 0;
    const employees = features.employees_count || 1;
    const experience = features.founder_experience_years || 0;

    // Calculate base score
    let baseScore = 60;

    // Industry bonus
    const industryBonus = {
      Technology: 10,
      Healthcare: 12,
      Finance: 5,
      Manufacturing: 8,
      Retail: 3,
      Education: 8,
      Energy: 10,
      "E-commerce": 7,
      Entertainment: 8,
      "Food & Beverage": 6,
      SaaS: 15,
      "Real Estate": 4,
      Transportation: 6,
      Agriculture: 5,
      Other: 3,
    };
    baseScore += industryBonus[industry] || 5;

    // Business model bonus
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
      Other: 3,
    };
    baseScore += modelBonus[features.business_model] || 5;

    // Budget factor
    if (budget > 500000) baseScore += 10;
    else if (budget > 200000) baseScore += 5;
    else if (budget < 50000) baseScore -= 10;
    else if (budget < 100000) baseScore -= 5;

    // Employees factor
    if (employees > 50) baseScore += 8;
    else if (employees > 20) baseScore += 5;
    else if (employees < 3) baseScore -= 5;

    // Experience factor
    if (experience > 10) baseScore += 8;
    else if (experience > 5) baseScore += 5;
    else if (experience < 2) baseScore -= 5;

    const successProb = Math.min(Math.max(Math.round(baseScore), 20), 95);
    const overallRisk = Math.min(Math.max(100 - successProb + 5, 5), 80);

    return {
      success_probability: successProb,
      success_prediction: successProb >= 50 ? "Viable" : "At Risk",
      overall_risk_score: overallRisk,
      confidence_rating: Math.max(successProb, 100 - successProb),
      system_evaluation:
        successProb >= 80
          ? "Very Strong Potential"
          : successProb >= 65
            ? "Strong Potential"
            : successProb >= 50
              ? "Moderate Potential"
              : successProb >= 35
                ? "High Attention Required"
                : "High Risk",
      risk_distribution: {
        financial: Math.max(
          0,
          Math.min(80, 70 - successProb / 2 + Math.random() * 10),
        ),
        market: Math.max(
          0,
          Math.min(70, 60 - successProb / 3 + Math.random() * 10),
        ),
        technical: Math.max(
          0,
          Math.min(65, 55 - successProb / 4 + Math.random() * 10),
        ),
        business: Math.max(
          0,
          Math.min(75, 65 - successProb / 2.5 + Math.random() * 10),
        ),
        regulatory: Math.max(
          0,
          Math.min(60, 50 - successProb / 5 + Math.random() * 10),
        ),
      },
    };
  }

  isLoaded() {
    return this.modelsLoaded && !this.useFallback;
  }
}

const mlService = new MLService();
mlService.initialize().catch((err) => {
  console.error("⚠️ ML service initialization failed:", err.message);
});

module.exports = mlService;
