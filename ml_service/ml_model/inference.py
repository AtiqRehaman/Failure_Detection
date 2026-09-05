import numpy as np
import pandas as pd

from catboost import CatBoostClassifier, CatBoostRegressor


SUCCESS_MODEL_PATH = "startup_success_catboost.cbm"
RISK_MODEL_PATH = "startup_risk_multireg_model.cbm"


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


# ============================================================
# LOAD MODELS
# ============================================================

success_model = CatBoostClassifier()

success_model.load_model(
    SUCCESS_MODEL_PATH
)


risk_model = CatBoostRegressor()

risk_model.load_model(
    RISK_MODEL_PATH
)


# ============================================================
# SYSTEM EVALUATION
# ============================================================

def get_system_evaluation(
    success_probability,
    overall_risk
):

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


# ============================================================
# CONFIDENCE
# ============================================================

def calculate_confidence(success_probability):
    confidence = max(
        success_probability,
        100 - success_probability
    )

    return round(confidence, 2)


# ============================================================
# MAIN PREDICTION
# ============================================================

def predict_startup(data):

    # --------------------------------------------------------
    # Create DataFrame
    # --------------------------------------------------------

    sample = pd.DataFrame([{
        "Industry": data["Industry"],
        "Business_Model": data["Business_Model"],
        "Target_Market_Size": data["Target_Market_Size"],
        "Budget_INR": data["Budget_INR"],
        "Employees_Count": data["Employees_Count"],
        "Founder_Experience_Years":
            data["Founder_Experience_Years"]
    }])


    # --------------------------------------------------------
    # Categorical conversion
    # --------------------------------------------------------

    for column in CATEGORICAL_FEATURES:
        sample[column] = (
            sample[column]
            .fillna("Unknown")
            .astype(str)
        )


    # --------------------------------------------------------
    # Success prediction
    # --------------------------------------------------------

    success_probabilities = (
        success_model
        .predict_proba(sample)[0]
    )

    success_probability = (
        float(success_probabilities[1])
        * 100
    )

    success_prediction = int(
        success_model
        .predict(sample)[0]
    )


    # --------------------------------------------------------
    # Risk prediction
    # --------------------------------------------------------

    risk_prediction = (
        risk_model
        .predict(sample)[0]
    )

    risk_prediction = np.clip(
        risk_prediction,
        0,
        100
    )


    financial_risk = float(
        risk_prediction[0]
    )

    market_risk = float(
        risk_prediction[1]
    )

    technical_risk = float(
        risk_prediction[2]
    )

    business_risk = float(
        risk_prediction[3]
    )

    regulatory_risk = float(
        risk_prediction[4]
    )


    # --------------------------------------------------------
    # Overall Risk
    # --------------------------------------------------------

    overall_risk = (
        0.25 * financial_risk +
        0.20 * market_risk +
        0.15 * technical_risk +
        0.25 * business_risk +
        0.15 * regulatory_risk
    )

    overall_risk = float(
        np.clip(
            overall_risk,
            0,
            100
        )
    )


    # --------------------------------------------------------
    # Confidence
    # --------------------------------------------------------

    confidence = calculate_confidence(
        success_probability
    )


    # --------------------------------------------------------
    # System Evaluation
    # --------------------------------------------------------

    evaluation = get_system_evaluation(
        success_probability,
        overall_risk
    )


    # --------------------------------------------------------
    # Final ML result
    # --------------------------------------------------------

    result = {

        "success_probability":
            round(success_probability, 2),

        "success_prediction":
            success_prediction,

        "overall_risk_score":
            round(overall_risk, 2),

        "confidence_rating":
            confidence,

        "system_evaluation":
            evaluation,

        "risk_distribution": {

            "financial":
                round(financial_risk, 2),

            "market":
                round(market_risk, 2),

            "technical":
                round(technical_risk, 2),

            "business":
                round(business_risk, 2),

            "regulatory":
                round(regulatory_risk, 2)
        }
    }

    return result