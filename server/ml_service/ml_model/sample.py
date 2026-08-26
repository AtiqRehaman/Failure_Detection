import pandas as pd

df = pd.read_csv("startup_risk_training_dataset_v3.csv")

risk_columns = [
    "Financial_Risk",
    "Market_Risk",
    "Technical_Risk",
    "Business_Risk",
    "Regulatory_Risk",
    "Overall_Risk_Score"
]

print("=" * 70)
print("RISK TARGET DISTRIBUTION")
print("=" * 70)

print(
    df[risk_columns].describe().T[
        ["mean", "std", "min", "25%", "50%", "75%", "max"]
    ]
)

print("\n" + "=" * 70)
print("RISK PERCENTILES")
print("=" * 70)

for column in risk_columns:
    print(f"\n{column}")
    print(
        df[column].quantile(
            [0.10, 0.25, 0.50, 0.75, 0.90]
        )
    )