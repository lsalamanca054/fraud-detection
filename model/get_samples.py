import pandas as pd

df = pd.read_csv('creditcard.csv')
fraud = df[df['Class']==1].head(3)
legit = df[df['Class']==0].head(3)

print('--- FRAUD SAMPLES ---')
for _, row in fraud.iterrows():
    print(','.join(map(str, row.drop('Class').tolist())))
    print()

print('--- LEGIT SAMPLES ---')
for _, row in legit.iterrows():
    print(','.join(map(str, row.drop('Class').tolist())))
    print()