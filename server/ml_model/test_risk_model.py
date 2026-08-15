import pandas as pd
import numpy as np
from catboost import CatBoostRegressor


# ============================================================
# LOAD MODEL
# ============================================================

MODEL_PATH = "startup_risk_multireg_model.cbm"

model = CatBoostRegressor()
model.load_model(MODEL_PATH)


# ============================================================
# TEST STARTUPS
# ============================================================

samples = pd.DataFrame([
    {
        "Industry": "Healthcare",
        "Business_Model": "B2B",
        "Target_Market_Size": "Large",
        "Budget_INR": 500000,
        "Employees_Count": 20,
        "Founder_Experience_Years": 8
    },

    {
        "Industry": "SaaS",
        "Business_Model": "SaaS",
        "Target_Market_Size": "Large",
        "Budget_INR": 5000000,
        "Employees_Count": 50,
        "Founder_Experience_Years": 15
    },

    {
        "Industry": "Retail",
        "Business_Model": "B2C",
        "Target_Market_Size": "Small",
        "Budget_INR": 75000,
        "Employees_Count": 3,
        "Founder_Experience_Years": 1
    }
])


# ============================================================
# CATEGORICAL FEATURES
# ============================================================

categorical_features = [
    "Industry",
    "Business_Model",
    "Target_Market_Size"
]

for column in categorical_features:
    samples[column] = samples[column].astype(str)


# ============================================================
# PREDICT
# ============================================================

predictions = model.predict(samples)

predictions = np.asarray(predictions)

# Keep every risk value within 0–100
predictions = np.clip(
    predictions,
    0,
    100
)


# ============================================================
# DISPLAY RESULTS
# ============================================================

risk_names = [
    "Financial Risk",
    "Market Risk",
    "Technical Risk",
    "Business Risk",
    "Regulatory Risk"
]


for i, prediction in enumerate(predictions):

    financial = prediction[0]
    market = prediction[1]
    technical = prediction[2]
    business = prediction[3]
    regulatory = prediction[4]

    # ========================================================
    # OVERALL RISK
    # ========================================================

    overall_risk = (
        0.25 * financial +
        0.20 * market +
        0.15 * technical +
        0.25 * business +
        0.15 * regulatory
    )

    overall_risk = np.clip(
        overall_risk,
        0,
        100
    )

    print("\n" + "=" * 70)
    print(f"STARTUP {i + 1}")
    print("=" * 70)

    print(
        f"Industry:             {samples.iloc[i]['Industry']}"
    )

    print(
        f"Business Model:       {samples.iloc[i]['Business_Model']}"
    )

    print(
        f"Target Market:        {samples.iloc[i]['Target_Market_Size']}"
    )

    print(
        f"Budget:               ₹{samples.iloc[i]['Budget_INR']:,.0f}"
    )

    print(
        f"Employees:            {samples.iloc[i]['Employees_Count']}"
    )

    print(
        f"Founder Experience:   "
        f"{samples.iloc[i]['Founder_Experience_Years']} years"
    )

    print("\nRISK DISTRIBUTION")
    print("-" * 40)

    print(f"Financial Risk:       {financial:.2f}")
    print(f"Market Risk:          {market:.2f}")
    print(f"Technical Risk:       {technical:.2f}")
    print(f"Business Risk:        {business:.2f}")
    print(f"Regulatory Risk:      {regulatory:.2f}")

    print("-" * 40)

    print(
        f"Overall Risk Score:   {overall_risk:.2f}"
    )