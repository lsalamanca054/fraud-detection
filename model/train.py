import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix, f1_score
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

print("Loading dataset...")
train_df = pd.read_csv("fraudTrain.csv")
test_df = pd.read_csv("fraudTest.csv")

df = pd.concat([train_df, test_df], ignore_index=True)
print(f"Total shape: {df.shape}")
print(f"Fraud cases: {df['is_fraud'].sum()}")
print(f"Legit cases: {(df['is_fraud']==0).sum()}")

# Feature engineering
print("\nEngineering features...")
df['trans_date_trans_time'] = pd.to_datetime(df['trans_date_trans_time'])
df['hour'] = df['trans_date_trans_time'].dt.hour
df['day'] = df['trans_date_trans_time'].dt.dayofweek
df['month'] = df['trans_date_trans_time'].dt.month

df['dob'] = pd.to_datetime(df['dob'])
df['age'] = (pd.Timestamp('2020-01-01') - df['dob']).dt.days // 365

df['distance'] = np.sqrt(
    (df['lat'] - df['merch_lat'])**2 +
    (df['long'] - df['merch_long'])**2
)

# Encode categoricals
le = LabelEncoder()
df['category'] = le.fit_transform(df['category'].astype(str))
df['gender'] = le.fit_transform(df['gender'].astype(str))

features = ['amt', 'category', 'gender', 'city_pop', 'age', 'hour', 'day', 'month', 'distance', 'unix_time']

X = df[features]
y = df['is_fraud']

# Scale
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# SMOTE
print("Applying SMOTE...")
smote = SMOTE(random_state=42, sampling_strategy=0.3)
X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)
print(f"After SMOTE - Fraud: {y_train_bal.sum()}, Legit: {(y_train_bal==0).sum()}")

# Train XGBoost
print("\nTraining XGBoost...")
xgb = XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    scale_pos_weight=10,
    eval_metric="logloss",
    random_state=42
)
xgb.fit(X_train_bal, y_train_bal)

# Train Random Forest
print("Training Random Forest...")
rf = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1
)
rf.fit(X_train_bal, y_train_bal)

# Find best threshold for XGBoost
print("\nFinding best threshold for XGBoost...")
y_prob_xgb = xgb.predict_proba(X_test)[:, 1]
y_prob_rf = rf.predict_proba(X_test)[:, 1]

best_threshold = 0.5
best_f1 = 0
for thresh in np.arange(0.1, 0.9, 0.05):
    y_pred_thresh = (y_prob_xgb >= thresh).astype(int)
    f1 = f1_score(y_test, y_pred_thresh)
    if f1 > best_f1:
        best_f1 = f1
        best_threshold = thresh

print(f"Best XGBoost threshold: {best_threshold:.2f} | F1: {best_f1:.4f}")

# Evaluate both
print("\n--- XGBoost Results ---")
y_pred_xgb = (y_prob_xgb >= best_threshold).astype(int)
print(classification_report(y_test, y_pred_xgb))
print(f"ROC-AUC: {roc_auc_score(y_test, y_prob_xgb):.4f}")

print("\n--- Random Forest Results ---")
y_pred_rf = (y_prob_rf >= 0.5).astype(int)
print(classification_report(y_test, y_pred_rf))
print(f"ROC-AUC: {roc_auc_score(y_test, y_prob_rf):.4f}")

# Confusion matrix
cm = confusion_matrix(y_test, y_pred_xgb)
plt.figure(figsize=(6,4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["Legit","Fraud"],
            yticklabels=["Legit","Fraud"])
plt.title("XGBoost Confusion Matrix")
plt.savefig("confusion_matrix.png")

# Save
joblib.dump(xgb, "fraud_model.pkl")
joblib.dump(scaler, "scaler.pkl")
joblib.dump(float(best_threshold), "threshold.pkl")
joblib.dump(features, "features.pkl")
print("\nAll files saved.")