from inference import predict_startup


startup = {
    "Industry": "SaaS",
    "Business_Model": "SaaS",
    "Target_Market_Size": "Large",
    "Budget_INR": 5000000,
    "Employees_Count": 50,
    "Founder_Experience_Years": 15
}


result = predict_startup(startup)


print("\n" + "=" * 70)
print("COMPLETE ML ANALYSIS")
print("=" * 70)

print(
    f"\nSuccess Probability: "
    f"{result['success_probability']}%"
)

print(
    f"Overall Risk Score: "
    f"{result['overall_risk_score']}"
)

print(
    f"Confidence Rating: "
    f"{result['confidence_rating']}%"
)

print(
    f"System Evaluation: "
    f"{result['system_evaluation']}"
)

print("\nRisk Distribution:")

for risk, value in result[
    "risk_distribution"
].items():

    print(
        f"  {risk.capitalize():12}: {value}"
    )