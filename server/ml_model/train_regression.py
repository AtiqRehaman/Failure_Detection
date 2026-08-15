import pandas as pd
import numpy as np

from catboost import CatBoostRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib


# ============================================================
# CONFIG
# ============================================================

DATASET = "startup_risk_training_dataset_v3.csv"
MODEL_PATH = "startup_risk_multireg_model.cbm"

RANDOM_STATE = 42


FEATURES = [
    "Industry",
    "Business_Model",
    "Target_Market_Size",
    "Budget_INR",
    "Employees_Count",
    "Founder_Experience_Years"
]

CATEGORICAL_FEATURES = [
    "Industry",
    "Business_Model",
    "Target_Market_Size"
]

RISK_TARGETS = [
    "Financial_Risk",
    "Market_Risk",
    "Technical_Risk",
    "Business_Risk",
    "Regulatory_Risk"
]


# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv(DATASET)

print("=" * 70)
print("DATASET")
print("=" * 70)

print("Shape:", df.shape)


# ============================================================
# FEATURES
# ============================================================

X = df[FEATURES].copy()

Y = df[RISK_TARGETS].copy()


# ============================================================
# PREPROCESSING
# ============================================================

for col in CATEGORICAL_FEATURES:
    X[col] = X[col].fillna("Unknown").astype(str)

NUMERICAL_FEATURES = [
    "Budget_INR",
    "Employees_Count",
    "Founder_Experience_Years"
]

for col in NUMERICAL_FEATURES:
    X[col] = pd.to_numeric(
        X[col],
        errors="coerce"
    )

    X[col] = X[col].fillna(
        X[col].median()
    )


cat_indices = [
    X.columns.get_loc(col)
    for col in CATEGORICAL_FEATURES
]


# ============================================================
# TRAIN / VALIDATION / TEST SPLIT
# ============================================================

X_train, X_temp, y_train, y_temp = train_test_split(
    X,
    Y,
    test_size=0.30,
    random_state=RANDOM_STATE
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp,
    y_temp,
    test_size=0.50,
    random_state=RANDOM_STATE
)


print("\n" + "=" * 70)
print("DATA SPLIT")
print("=" * 70)

print("Training   :", len(X_train))
print("Validation :", len(X_val))
print("Testing    :", len(X_test))


# ============================================================
# CATBOOST MULTI-REGRESSION
# ============================================================

model = CatBoostRegressor(
    iterations=1500,
    learning_rate=0.03,
    depth=6,

    loss_function="MultiRMSE",

    l2_leaf_reg=5,

    random_seed=RANDOM_STATE,

    od_type="Iter",
    od_wait=100,

    verbose=100
)


# ============================================================
# TRAIN
# ============================================================

print("\n" + "=" * 70)
print("TRAINING RISK MODEL")
print("=" * 70)

model.fit(
    X_train,
    y_train,

    cat_features=cat_indices,

    eval_set=(X_val, y_val),

    use_best_model=True
)


# ============================================================
# PREDICTION
# ============================================================

predictions = model.predict(X_test)

predictions = np.asarray(predictions)

print("\nPrediction shape:", predictions.shape)


# ============================================================
# EVALUATE EACH RISK DIMENSION
# ============================================================

print("\n" + "=" * 70)
print("RISK MODEL PERFORMANCE")
print("=" * 70)

results = []

for i, target in enumerate(RISK_TARGETS):

    actual = y_test[target].values
    predicted = predictions[:, i]

    # Keep predictions in valid risk range
    predicted = np.clip(
        predicted,
        0,
        100
    )

    mae = mean_absolute_error(
        actual,
        predicted
    )

    rmse = np.sqrt(
        mean_squared_error(
            actual,
            predicted
        )
    )

    r2 = r2_score(
        actual,
        predicted
    )

    results.append({
        "Risk": target,
        "MAE": mae,
        "RMSE": rmse,
        "R2": r2
    })

    print(f"\n{target}")
    print(f"MAE  : {mae:.4f}")
    print(f"RMSE : {rmse:.4f}")
    print(f"R²   : {r2:.4f}")


results_df = pd.DataFrame(results)


# ============================================================
# OVERALL METRICS
# ============================================================

overall_mae = mean_absolute_error(
    y_test,
    predictions
)

overall_rmse = np.sqrt(
    mean_squared_error(
        y_test,
        predictions
    )
)

print("\n" + "=" * 70)
print("OVERALL RISK MODEL")
print("=" * 70)

print(f"Overall MAE  : {overall_mae:.4f}")
print(f"Overall RMSE : {overall_rmse:.4f}")


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

importance = model.get_feature_importance()

importance_df = pd.DataFrame({
    "Feature": FEATURES,
    "Importance": importance
})

importance_df = importance_df.sort_values(
    "Importance",
    ascending=False
)

print("\n" + "=" * 70)
print("FEATURE IMPORTANCE")
print("=" * 70)

print(
    importance_df.to_string(
        index=False
    )
)


# ============================================================
# SAVE MODEL
# ============================================================

model.save_model(
    MODEL_PATH
)

print("\n" + "=" * 70)
print("MODEL SAVED")
print("=" * 70)

print(MODEL_PATH)


# ============================================================
# SAVE CONFIG
# ============================================================

config = {
    "features": FEATURES,
    "categorical_features": CATEGORICAL_FEATURES,
    "risk_targets": RISK_TARGETS,
    "model_type": "CatBoostRegressor",
    "loss_function": "MultiRMSE"
}

joblib.dump(
    config,
    "startup_risk_model_config.pkl"
)

print(
    "Config saved: "
    "startup_risk_model_config.pkl"
)