# check_data.py
import pandas as pd
import numpy as np

df = pd.read_csv("data.csv")
# Filter for meal entries - they have meal_type values like 'dinner', 'snack', etc.
meals = df[df["meal_type"].notna()].copy()
for col in ["protein_g","carbs_g","fat_g","calories_kcal"]:
    if col not in meals.columns:
        meals[col] = np.nan

print("Total rows:", len(df))
print("Meal rows:", len(meals))
print("With all macros present:", meals[["protein_g","carbs_g","fat_g"]].notna().all(axis=1).sum())
print("With calories present:", meals["calories_kcal"].notna().sum())

mask_full = meals[["protein_g","carbs_g","fat_g","calories_kcal"]].notna().all(axis=1)
print("Usable rows (macros + calories):", mask_full.sum())
print("\nFirst 10 problem rows missing any of macros/calories:")
print(meals[~mask_full].head(10)[["date","meal_type","items","quantities","protein_g","carbs_g","fat_g","calories_kcal"]])
