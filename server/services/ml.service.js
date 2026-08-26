// server/services/ml.service.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class MLService {
    constructor() {
        this.modelsLoaded = false;
        this.modelDir = process.env.ML_MODEL_DIR || './ml_model';
        this.pythonScript = path.join(__dirname, '../ml_model/predict.py');
        this.initialized = false;
        this.loadingPromise = null;
        // Use fallback mode by default
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
            console.log('🔄 Loading ML models...');
            console.log(`📁 Model directory: ${this.modelDir}`);
            
            // Check if Python script exists
            if (!fs.existsSync(this.pythonScript)) {
                console.warn(`⚠️ Python script not found: ${this.pythonScript}`);
                this.modelsLoaded = false;
                this.initialized = true;
                this.useFallback = true;
                return false;
            }

            // Check if models exist
            const successModelPath = path.join(this.modelDir, 'startup_success_catboost.cbm');
            const riskModelPath = path.join(this.modelDir, 'startup_risk_multireg_model.cbm');
            const configPath = path.join(this.modelDir, 'startup_risk_model_config.pkl');

            console.log(`📄 Success model: ${successModelPath} - ${fs.existsSync(successModelPath) ? '✅ Found' : '❌ Not Found'}`);
            console.log(`📄 Risk model: ${riskModelPath} - ${fs.existsSync(riskModelPath) ? '✅ Found' : '❌ Not Found'}`);
            console.log(`📄 Config file: ${configPath} - ${fs.existsSync(configPath) ? '✅ Found' : '❌ Not Found'}`);

            if (!fs.existsSync(successModelPath) || !fs.existsSync(riskModelPath)) {
                console.warn('⚠️ Model files not found. Using fallback mode.');
                this.modelsLoaded = false;
                this.initialized = true;
                this.useFallback = true;
                return false;
            }

            // Test load models via Python
            console.log('🔧 Testing model loading...');
            const testResult = await this.runPythonWithStdin('test_load', null);
            
            if (testResult.success) {
                this.modelsLoaded = true;
                this.useFallback = false;
                console.log('✅ ML models loaded successfully');
            } else {
                console.warn(`⚠️ Model loading failed: ${testResult.error || 'Unknown error'}`);
                this.modelsLoaded = false;
                this.useFallback = true;
            }
            
            this.initialized = true;
            return this.modelsLoaded;
        } catch (error) {
            console.error('❌ ML model initialization failed:', error.message);
            this.modelsLoaded = false;
            this.initialized = true;
            this.useFallback = true;
            return false;
        } finally {
            this.loadingPromise = null;
        }
    }

    runPythonWithStdin(action, data) {
        return new Promise((resolve) => {
            const pythonPath = process.env.PYTHON_PATH || 'python';
            const args = ['-u', this.pythonScript, '--action', action];
            
            console.log(`🔧 Executing: ${pythonPath} ${args.join(' ')}`);
            
            const pythonProcess = spawn(pythonPath, args, {
                env: {
                    ...process.env,
                    ML_MODEL_DIR: this.modelDir,
                    PYTHONUNBUFFERED: '1'
                }
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                if (stderr.includes('Error') || stderr.includes('error')) {
                    console.error('Python stderr:', stderr);
                }
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('Python process exited with code:', code);
                    resolve({ success: false, error: stderr || `Process exited with code ${code}` });
                    return;
                }

                try {
                    const jsonStart = stdout.indexOf('{');
                    if (jsonStart === -1) {
                        resolve({ success: false, error: 'No JSON found in output' });
                        return;
                    }
                    const jsonStr = stdout.substring(jsonStart);
                    const result = JSON.parse(jsonStr);
                    resolve(result);
                } catch (e) {
                    console.error('Failed to parse Python output:', stdout);
                    resolve({ success: false, error: 'Failed to parse Python output' });
                }
            });

            if (data) {
                pythonProcess.stdin.write(JSON.stringify(data));
                pythonProcess.stdin.end();
            } else {
                pythonProcess.stdin.end();
            }

            const timeout = setTimeout(() => {
                pythonProcess.kill();
                resolve({ success: false, error: 'Process timeout after 60 seconds' });
            }, 60000);

            pythonProcess.on('close', () => {
                clearTimeout(timeout);
            });
        });
    }

    async predictFull(features) {
        await this.initialize();
        
        // If models not loaded, use fallback predictions
        if (!this.modelsLoaded || this.useFallback) {
            console.log('⚠️ Using fallback predictions (models not loaded)');
            return this.generateFallbackPredictions(features);
        }

        try {
            const result = await this.runPythonWithStdin('predict_full', features);
            if (!result.success) {
                console.error('Prediction failed:', result.error);
                return this.generateFallbackPredictions(features);
            }
            return result.data;
        } catch (error) {
            console.error('❌ Prediction error:', error);
            return this.generateFallbackPredictions(features);
        }
    }

    generateFallbackPredictions(features) {
        const industry = features.industry || 'Technology';
        const budget = features.budget_inr || 0;
        const employees = features.employees_count || 1;
        const experience = features.founder_experience_years || 0;
        
        // Calculate base score
        let baseScore = 60;
        
        // Industry bonus
        const industryBonus = {
            'Technology': 10,
            'Healthcare': 12,
            'Finance': 5,
            'Manufacturing': 8,
            'Retail': 3,
            'Education': 8,
            'Energy': 10,
            'E-commerce': 7,
            'Entertainment': 8,
            'Food & Beverage': 6,
            'SaaS': 15,
            'Real Estate': 4,
            'Transportation': 6,
            'Agriculture': 5,
            'Other': 3
        };
        baseScore += industryBonus[industry] || 5;
        
        // Business model bonus
        const modelBonus = {
            'B2B': 10,
            'SaaS': 15,
            'Subscription': 12,
            'B2C': 5,
            'Marketplace': 8,
            'B2G': 7,
            'C2C': 4,
            'Freemium': 6,
            'Advertising': 5,
            'Direct Sales': 8,
            'Franchise': 6,
            'Other': 3
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
            success_prediction: successProb >= 50 ? 'Viable' : 'At Risk',
            overall_risk_score: overallRisk,
            confidence_rating: Math.max(successProb, 100 - successProb),
            system_evaluation: successProb >= 80 ? 'Very Strong Potential' :
                               successProb >= 65 ? 'Strong Potential' :
                               successProb >= 50 ? 'Moderate Potential' :
                               successProb >= 35 ? 'High Attention Required' : 'High Risk',
            risk_distribution: {
                financial: Math.max(0, Math.min(80, 70 - (successProb / 2) + Math.random() * 10)),
                market: Math.max(0, Math.min(70, 60 - (successProb / 3) + Math.random() * 10)),
                technical: Math.max(0, Math.min(65, 55 - (successProb / 4) + Math.random() * 10)),
                business: Math.max(0, Math.min(75, 65 - (successProb / 2.5) + Math.random() * 10)),
                regulatory: Math.max(0, Math.min(60, 50 - (successProb / 5) + Math.random() * 10))
            }
        };
    }

    isLoaded() {
        return this.modelsLoaded && !this.useFallback;
    }
}

const mlService = new MLService();
mlService.initialize().catch(err => {
    console.error('⚠️ ML service initialization failed:', err.message);
});

module.exports = mlService;