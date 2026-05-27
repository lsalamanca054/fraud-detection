import pandas as pd

df = pd.read_csv("creditcard.csv")
fraud = df[df['Class']==1].head(5)

print('--- CONFIRMED FRAUD SAMPLES ---')
for i, (_, row) in enumerate(fraud.iterrows()):
    features = row.drop('Class').tolist()
    print(f"\nSample {i+1}:")
    print(','.join(map(str, features)))