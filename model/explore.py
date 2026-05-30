import pandas as pd

df = pd.read_csv("fraudTrain.csv")
print("Shape:", df.shape)
print("\nColumns:", df.columns.tolist())
print("\nFraud distribution:")
print(df['is_fraud'].value_counts())
print("\nSample row:")
print(df.head(2))