import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

print("Loading dataset...")
df = pd.read_csv("creditcard.csv")

print(f"Dataset shape: {df.shape}")
print(f"Fraud cases: {df['Class'].sum()}")
print(f"Legit cases: {(df['Class'] == 0).sum()}")

X = df.drop("Class", axis=1)
y = df["Class"]

scaler = StandardScaler()
X["Amount"] = scaler.fit_transform(X[["Amount"]])
X["Time"] = scaler.fit_transform(X[["Time"]])

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Applying SMOTE...")
smote = SMOTE(random_state=42)
X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)

print("Training XGBoost model...")
model = XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    scale_pos_weight=100,
    eval_metric="logloss",
    random_state=42
)
model.fit(X_train_bal, y_train_bal)

# Find best threshold
print("\nFinding best threshold...")
y_prob = model.predict_proba(X_test)[:, 1]

best_threshold = 0.5
best_f1 = 0
from sklearn.metrics import f1_score

for thresh in np.arange(0.1, 0.9, 0.05):
    y_pred_thresh = (y_prob >= thresh).astype(int)
    f1 = f1_score(y_test, y_pred_thresh)
    if f1 > best_f1:
        best_f1 = f1
        best_threshold = thresh

print(f"Best threshold: {best_threshold:.2f} with F1: {best_f1:.4f}")

y_pred = (y_prob >= best_threshold).astype(int)

print("\n--- Model Evaluation ---")
print(classification_report(y_test, y_pred))
print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob):.4f}")

cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(6, 4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["Legit", "Fraud"],
            yticklabels=["Legit", "Fraud"])
plt.title("Confusion Matrix")
plt.savefig("confusion_matrix.png")
print("Confusion matrix saved.")

joblib.dump(model, "fraud_model.pkl")
joblib.dump(float(best_threshold), "threshold.pkl")
print(f"Model saved. Threshold saved: {best_threshold:.2f}")