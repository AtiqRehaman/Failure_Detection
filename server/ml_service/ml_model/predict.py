#!/usr/bin/env python3
"""
ML Prediction Service for CatBoost Models
"""

import sys
import json
import os
import pickle
import argparse
import traceback
import warnings
import numpy as np
import pandas as pd

warnings.filterwarnings('ignore')

# Global model instances
SUCCESS_MODEL = None
RISK_MODEL = None
MODELS_LOADED = False

CATEGORICAL_FEATURES = [
    "Industry",
    "Business_Model",
    "Target_Market_Size"
]

FEATURES = [
    "Industry",
    "Business_Model",
    "Target_Market_Size",
    "Budget_INR",
    "Employees_Count",
    "Founder_Experience_Years"
]

RISK_NAMES = [
    "financial",
    "market",
    "technical",
    "business",
    "regulatory"
]

def load_models():
    """Load models once at startup"""
    global SUCCESS_MODEL, RISK_MODEL, MODELS_LOADED
    
    if MODELS_LOADED:
        return {"success": True, "message": "Models already loaded"}
    
    MODEL_DIR = os.environ.get('ML_MODEL_DIR', './ml_model')
    print(f"📁 Loading models from: {MODEL_DIR}", file=sys.stderr)
    
    try:
        from catboost import CatBoostClassifier, CatBoostRegressor
        
        # Load success model
        success_path = os.path.join(MODEL_DIR, 'startup_success_catboost.cbm')
        if not os.path.exists(success_path):
            return {"success": False, "error": f"Success model not found: {success_path}"}
        print(f"✅ Loading success model from: {success_path}", file=sys.stderr)
        SUCCESS_MODEL = CatBoostClassifier()
        SUCCESS_MODEL.load_model(success_path)
        
        # Load risk model
        risk_path = os.path.join(MODEL_DIR, 'startup_risk_multireg_model.cbm')
        if not os.path.exists(risk_path):
            return {"success": False, "error": f"Risk model not found: {risk_path}"}
        print(f"✅ Loading risk model from: {risk_path}", file=sys.stderr)
        RISK_MODEL = CatBoostRegressor()
        RISK_MODEL.load_model(risk_path)
        
        MODELS_LOADED = True
        print("✅ All models loaded successfully!", file=sys.stderr)
        return {"success": True, "message": "Models loaded successfully"}
    except Exception as e:
        print(f"❌ Error loading models: {str(e)}", file=sys.stderr)
        return {"success": False, "error": str(e)}

def get_system_evaluation(success_probability, overall_risk):
    if success_probability >= 80 and overall_risk < 30:
        return "Very Strong Potential"
    elif success_probability >= 65 and overall_risk < 40:
        return "Strong Potential"
    elif success_probability >= 50 and overall_risk < 55:
        return "Moderate Potential"
    elif success_probability >= 35 and overall_risk < 70:
        return "High Attention Required"
    else:
        return "High Risk"

def calculate_confidence(success_probability):
    confidence = max(success_probability, 100 - success_probability)
    return round(confidence, 2)

def predict_full(features):
    """Full prediction"""
    try:
        if SUCCESS_MODEL is None or RISK_MODEL is None:
            return {"success": False, "error": "Models not loaded"}
        
        # Create DataFrame
        sample = pd.DataFrame([{
            "Industry": features.get('industry', 'Technology'),
            "Business_Model": features.get('business_model', 'B2B'),
            "Target_Market_Size": features.get('target_market_size', 'Medium'),
            "Budget_INR": float(features.get('budget_inr', 0)),
            "Employees_Count": int(features.get('employees_count', 1)),
            "Founder_Experience_Years": int(features.get('founder_experience_years', 0))
        }])
        
        # Convert categorical
        for column in CATEGORICAL_FEATURES:
            sample[column] = sample[column].fillna("Unknown").astype(str)
        
        # Success prediction
        success_probabilities = SUCCESS_MODEL.predict_proba(sample)[0]
        success_probability = float(success_probabilities[1]) * 100
        success_prediction = int(SUCCESS_MODEL.predict(sample)[0])
        
        # Risk prediction
        risk_prediction = RISK_MODEL.predict(sample)[0]
        risk_prediction = np.clip(risk_prediction, 0, 100)
        
        # Extract risks
        if len(risk_prediction) >= 5:
            financial_risk = float(risk_prediction[0])
            market_risk = float(risk_prediction[1])
            technical_risk = float(risk_prediction[2])
            business_risk = float(risk_prediction[3])
            regulatory_risk = float(risk_prediction[4])
        else:
            financial_risk = float(risk_prediction[0]) if len(risk_prediction) > 0 else 50
            market_risk = float(risk_prediction[1]) if len(risk_prediction) > 1 else 50
            technical_risk = float(risk_prediction[2]) if len(risk_prediction) > 2 else 50
            business_risk = float(risk_prediction[3]) if len(risk_prediction) > 3 else 50
            regulatory_risk = float(risk_prediction[4]) if len(risk_prediction) > 4 else 50
        
        # Overall risk
        overall_risk = (
            0.25 * financial_risk +
            0.20 * market_risk +
            0.15 * technical_risk +
            0.25 * business_risk +
            0.15 * regulatory_risk
        )
        overall_risk = float(np.clip(overall_risk, 0, 100))
        
        # Confidence
        confidence = calculate_confidence(success_probability)
        
        # Evaluation
        evaluation = get_system_evaluation(success_probability, overall_risk)
        
        return {
            "success": True,
            "data": {
                "success_probability": round(success_probability, 2),
                "success_prediction": "Viable" if success_prediction == 1 else "At Risk",
                "overall_risk_score": round(overall_risk, 2),
                "confidence_rating": confidence,
                "system_evaluation": evaluation,
                "risk_distribution": {
                    "financial": round(financial_risk, 2),
                    "market": round(market_risk, 2),
                    "technical": round(technical_risk, 2),
                    "business": round(business_risk, 2),
                    "regulatory": round(regulatory_risk, 2)
                }
            }
        }
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}", file=sys.stderr)
        return {"success": False, "error": str(e)}

def test_load():
    return load_models()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--action', required=True)
    args = parser.parse_args()
    
    # Read JSON from stdin
    data = {}
    try:
        stdin_data = sys.stdin.read()
        if stdin_data and stdin_data.strip():
            data = json.loads(stdin_data)
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "error": f"Invalid JSON input: {str(e)}"}), file=sys.stdout)
        return
    
    # Load models if not already
    if args.action != 'test_load' and not MODELS_LOADED:
        load_result = load_models()
        if not load_result['success']:
            print(json.dumps(load_result), file=sys.stdout)
            return
    
    # Execute action
    if args.action == 'test_load':
        result = load_models()
    elif args.action == 'predict_full':
        result = predict_full(data)
    else:
        result = {"success": False, "error": f"Unknown action: {args.action}"}
    
    print(json.dumps(result), file=sys.stdout)

if __name__ == '__main__':
    main()