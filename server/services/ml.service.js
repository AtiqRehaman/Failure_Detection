// server/services/ml.service.js
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

class MLService {
  constructor() {
    this.modelsLoaded = false;
    this.modelDir = process.env.ML_MODEL_DIR || "./ml_model";
    this.pythonScript = path.join(__dirname, "../ml_model/predict.py");
    this.initialized = false;
    this.loadingPromise = null;
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
      console.log("🔄 Loading ML models...");
      console.log(`📁 Model directory: ${this.modelDir}`);

      // Check if Python script exists
      if (!fs.existsSync(this.pythonScript)) {
        throw new Error(`Python script not found: ${this.pythonScript}`);
      }

      // Check if models exist
      const successModelPath = path.join(
        this.modelDir,
        "startup_success_catboost.cbm",
      );
      const riskModelPath = path.join(
        this.modelDir,
        "startup_risk_multireg_model.cbm",
      );
      const configPath = path.join(
        this.modelDir,
        "startup_risk_model_config.pkl",
      );

      console.log(
        `📄 Success model: ${successModelPath} - ${fs.existsSync(successModelPath) ? "✅ Found" : "❌ Not Found"}`,
      );
      console.log(
        `📄 Risk model: ${riskModelPath} - ${fs.existsSync(riskModelPath) ? "✅ Found" : "❌ Not Found"}`,
      );
      console.log(
        `📄 Config file: ${configPath} - ${fs.existsSync(configPath) ? "✅ Found" : "❌ Not Found"}`,
      );

      if (!fs.existsSync(successModelPath)) {
        throw new Error(`Success model not found: ${successModelPath}`);
      }
      if (!fs.existsSync(riskModelPath)) {
        throw new Error(`Risk model not found: ${riskModelPath}`);
      }

      // Test load models via Python using stdin
      console.log("🔧 Testing model loading...");
      const testResult = await this.runPythonWithStdin("test_load", null);
      if (!testResult.success) {
        throw new Error(`Model loading failed: ${testResult.error}`);
      }

      this.modelsLoaded = true;
      this.initialized = true;
      console.log("✅ ML models loaded successfully");
      return true;
    } catch (error) {
      console.error("❌ ML model initialization failed:", error.message);
      this.modelsLoaded = false;
      this.initialized = true;
      throw error;
    } finally {
      this.loadingPromise = null;
    }
  }

  // New method using stdin instead of command line arguments
  runPythonWithStdin(action, data) {
    return new Promise((resolve, reject) => {
      const pythonPath = process.env.PYTHON_PATH || "python";
      const args = ["-u", this.pythonScript, "--action", action];

      console.log(`🔧 Executing: ${pythonPath} ${args.join(" ")}`);

      const pythonProcess = spawn(pythonPath, args, {
        env: {
          ...process.env,
          ML_MODEL_DIR: this.modelDir,
          PYTHONUNBUFFERED: "1",
        },
      });

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error("Python process exited with code:", code);
          console.error("Stderr:", stderr);
          resolve({
            success: false,
            error: `Process exited with code ${code}`,
            stderr: stderr,
          });
          return;
        }

        try {
          // Remove any non-JSON output
          const jsonStart = stdout.indexOf("{");
          if (jsonStart === -1) {
            resolve({
              success: false,
              error: "No JSON found in output",
              stdout,
            });
            return;
          }
          const jsonStr = stdout.substring(jsonStart);
          const result = JSON.parse(jsonStr);
          resolve(result);
        } catch (e) {
          console.error("Failed to parse Python output:", stdout);
          resolve({
            success: false,
            error: "Failed to parse Python output",
            stdout,
          });
        }
      });

      // Send data via stdin if provided
      if (data) {
        pythonProcess.stdin.write(JSON.stringify(data));
        pythonProcess.stdin.end();
      } else {
        pythonProcess.stdin.end();
      }

      // Timeout after 60 seconds
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        resolve({ success: false, error: "Process timeout after 60 seconds" });
      }, 60000);

      pythonProcess.on("close", () => {
        clearTimeout(timeout);
      });
    });
  }

  // Keep old method for compatibility but use stdin
  async runPython(action, data = null) {
    return this.runPythonWithStdin(action, data);
  }

  async predictSuccess(features) {
    await this.initialize();
    if (!this.modelsLoaded) {
      throw new Error("ML models not loaded");
    }

    try {
      const result = await this.runPythonWithStdin("predict_success", features);
      if (!result.success) {
        throw new Error(result.error || "Prediction failed");
      }
      return result.data;
    } catch (error) {
      console.error("Success prediction error:", error);
      throw error;
    }
  }

  async predictRisk(features) {
    await this.initialize();
    if (!this.modelsLoaded) {
      throw new Error("ML models not loaded");
    }

    try {
      const result = await this.runPythonWithStdin("predict_risk", features);
      if (!result.success) {
        throw new Error(result.error || "Risk prediction failed");
      }
      return result.data;
    } catch (error) {
      console.error("Risk prediction error:", error);
      throw error;
    }
  }

  async predictFull(features) {
    await this.initialize();
    if (!this.modelsLoaded) {
      throw new Error("ML models not loaded");
    }

    try {
      // Convert feature names to match what Python expects
      const mlFeatures = {
        industry: features.industry || "Technology",
        business_model: features.business_model || "B2B",
        target_market_size: features.target_market_size || "Medium",
        budget_inr: parseFloat(features.budget_inr || 0),
        employees_count: parseInt(features.employees_count || 1),
        founder_experience_years: parseInt(
          features.founder_experience_years || 0,
        ),
      };

      console.log("🧠 Sending to ML:", mlFeatures);

      const result = await this.runPythonWithStdin("predict_full", mlFeatures);
      if (!result.success) {
        throw new Error(result.error || "Prediction failed");
      }

      const data = result.data;
      if (!data) {
        throw new Error("No data returned from ML prediction");
      }

      // Validate required fields
      const requiredFields = [
        "success_probability",
        "success_prediction",
        "overall_risk_score",
        "confidence_rating",
        "system_evaluation",
        "risk_distribution",
      ];
      for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return data;
    } catch (error) {
      console.error("Full prediction error:", error);
      throw error;
    }
  }

  isLoaded() {
    return this.modelsLoaded;
  }
}

// Create and export singleton instance
const mlService = new MLService();

// Auto-initialize on import
console.log("🧠 ML Service initializing...");
mlService.initialize().catch((err) => {
  console.error("⚠️ ML service auto-initialization failed:", err.message);
});

module.exports = mlService;
