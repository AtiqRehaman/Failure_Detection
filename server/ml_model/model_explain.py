import pandas as pd

df = pd.read_csv("startup_risk_training_dataset.csv")

print("=" * 60)
print("SUCCESS PROBABILITY BY CLASS")
print("=" * 60)

print(
    df.groupby("Success_Status")["Success_Probability"]
      .agg(["count", "mean", "median", "min", "max"])
)


print("\n" + "=" * 60)
print("NUMERICAL FEATURE CORRELATION")
print("=" * 60)

numeric_cols = [
    "Budget_INR",
    "Employees_Count",
    "Founder_Experience_Years",
    "Success_Probability",
    "Success_Status",
    "Financial_Risk",
    "Market_Risk",
    "Technical_Risk",
    "Business_Risk",
    "Regulatory_Risk",
    "Overall_Risk_Score"
]

print(
    df[numeric_cols].corr()["Success_Status"]
      .sort_values()
)


print("\n" + "=" * 60)
print("SUCCESS RATE BY MARKET SIZE")
print("=" * 60)

print(
    df.groupby("Target_Market_Size")["Success_Status"]
      .mean()
)


print("\n" + "=" * 60)
print("SUCCESS RATE BY BUSINESS MODEL")
print("=" * 60)

print(
    df.groupby("Business_Model")["Success_Status"]
      .mean()
)


print("\n" + "=" * 60)
print("SUCCESS RATE BY INDUSTRY")
print("=" * 60)

print(
    df.groupby("Industry")["Success_Status"]
      .mean()
)