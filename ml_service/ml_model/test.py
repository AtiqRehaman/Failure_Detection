# # ============================================================
# # TEST ONE STARTUP
# # ============================================================

# import pandas as pd
# from catboost import CatBoostClassifier

# samples = pd.DataFrame([
#     {
#         "Industry": "Healthcare",
#         "Business_Model": "B2B",
#         "Target_Market_Size": "Large",
#         "Budget_INR": 500000,
#         "Employees_Count": 20,
#         "Founder_Experience_Years": 8
#     },
#     {
#         "Industry": "SaaS",
#         "Business_Model": "SaaS",
#         "Target_Market_Size": "Large",
#         "Budget_INR": 5000000,
#         "Employees_Count": 50,
#         "Founder_Experience_Years": 15
#     },
#     {
#         "Industry": "Retail",
#         "Business_Model": "B2C",
#         "Target_Market_Size": "Small",
#         "Budget_INR": 75000,
#         "Employees_Count": 3,
#         "Founder_Experience_Years": 1
#     }
# ])

# categorical_features = [
#     "Industry",
#     "Business_Model",
#     "Target_Market_Size"
# ]

# # Make sure categorical columns are strings
# for col in [
#     "Industry",
#     "Business_Model",
#     "Target_Market_Size"
# ]:
#     samples[col] = samples[col].astype(str)


# model = CatBoostClassifier()

# model.load_model('startup_success_catboost.cbm')

# # Probability
# probabilities = model.predict_proba(samples)

# success_probability = probabilities[:, 1] * 100
# risk_probability = probabilities[:, 0] * 100

# prediction = model.predict(samples)
# print("\n" + "=" * 60)
# print("STARTUP SUCCESS PREDICTION")
# print("=" * 60)

# for i, probability in enumerate(probabilities):
#     print(f"\nStartup {i + 1}")
#     print("-" * 40)
#     print(f"Success Probability: {probability[1] * 100:.2f}%")
#     print(f"Risk Probability:    {probability[0] * 100:.2f}%")


import pandas as pd

df = pd.read_csv("startup_mock_data.csv")

# print(df["Success_Status"].value_counts())

# print(df["Success_Probability"].describe())

# print(
#     df.groupby("Success_Status")[
#         ["Budget_INR", "Employees_Count", "Founder_Experience_Years"]
#     ].mean()
# )

print(df["Success_Status"].value_counts())

print(df[
    [
        "Financial_Risk",
        "Market_Risk",
        "Technical_Risk",
        "Business_Risk",
        "Regulatory_Risk",
        "Overall_Risk_Score"
    ]
].describe())