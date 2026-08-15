import pandas as pd
import numpy as np
from catboost import CatBoostClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    brier_score_loss,
    confusion_matrix,
    classification_report
)

# ============================================================
# CONFIG
# ============================================================

DATASET = "startup_risk_training_dataset_v3.csv"
MODEL_PATH = "startup_success_catboost.cbm"

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

TARGET = "Success_Status"


# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv(DATASET)

print("=" * 70)
print("DATASET")
print("=" * 70)

print("Shape:", df.shape)

print("\nTarget distribution:")
print(df[TARGET].value_counts())

print("\nTarget percentage:")
print(
    df[TARGET]
    .value_counts(normalize=True)
    .mul(100)
    .round(2)
)


# ============================================================
# PREPARE FEATURES
# ============================================================

X = df[FEATURES].copy()
y = df[TARGET].astype(int)


# Categorical columns
for col in CATEGORICAL_FEATURES:
    X[col] = X[col].fillna("Unknown").astype(str)


# Numerical columns
numerical_features = [
    "Budget_INR",
    "Employees_Count",
    "Founder_Experience_Years"
]

for col in numerical_features:
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
# TRAIN / VALIDATION / TEST
# ============================================================

X_train, X_temp, y_train, y_temp = train_test_split(
    X,
    y,
    test_size=0.30,
    stratify=y,
    random_state=RANDOM_STATE
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp,
    y_temp,
    test_size=0.50,
    stratify=y_temp,
    random_state=RANDOM_STATE
)

print("\n" + "=" * 70)
print("DATA SPLIT")
print("=" * 70)

print("Training   :", len(X_train))
print("Validation :", len(X_val))
print("Testing    :", len(X_test))


# ============================================================
# CATBOOST
# ============================================================

model = CatBoostClassifier(
    iterations=1500,
    learning_rate=0.03,
    depth=6,

    loss_function="Logloss",
    eval_metric="AUC",

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
print("TRAINING")
print("=" * 70)

model.fit(
    X_train,
    y_train,

    cat_features=cat_indices,

    eval_set=(X_val, y_val),

    use_best_model=True
)


# ============================================================
# TEST
# ============================================================

y_pred = (
    model
    .predict(X_test)
    .astype(int)
    .flatten()
)

y_prob = model.predict_proba(X_test)[:, 1]


# ============================================================
# METRICS
# ============================================================

accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)

auc = roc_auc_score(
    y_test,
    y_prob
)

brier = brier_score_loss(
    y_test,
    y_prob
)


print("\n" + "=" * 70)
print("MODEL PERFORMANCE")
print("=" * 70)

print(f"Accuracy   : {accuracy:.4f}")
print(f"Precision  : {precision:.4f}")
print(f"Recall     : {recall:.4f}")
print(f"F1 Score   : {f1:.4f}")
print(f"ROC-AUC    : {auc:.4f}")
print(f"Brier Score: {brier:.4f}")


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\n" + "=" * 70)
print("CLASSIFICATION REPORT")
print("=" * 70)

print(
    classification_report(
        y_test,
        y_pred,
        target_names=[
            "At Risk",
            "Viable"
        ],
        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\n" + "=" * 70)
print("CONFUSION MATRIX")
print("=" * 70)

print(confusion_matrix(y_test, y_pred))


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

importance = model.get_feature_importance()

importance_df = (
    pd.DataFrame({
        "Feature": FEATURES,
        "Importance": importance
    })
    .sort_values(
        "Importance",
        ascending=False
    )
)

print("\n" + "=" * 70)
print("FEATURE IMPORTANCE")
print("=" * 70)

print(
    importance_df.to_string(index=False)
)


# ============================================================
# SAVE
# ============================================================

model.save_model(MODEL_PATH)

print("\n" + "=" * 70)
print("MODEL SAVED")
print("=" * 70)

print(MODEL_PATH)