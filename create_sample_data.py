import pandas as pd
import numpy as np

# Create sample meal data programmatically
data = {
    'date': ['2025-09-02', '2025-09-02', '2025-09-03', '2025-09-03', '2025-09-03'],
    'entry_type': ['meal', 'meal', 'meal', 'meal', 'meal'],
    'meal_type': ['dinner', 'snack', 'dinner', 'lunch', 'snack'],
    'items': ['chicken breast; rice; olive oil', 'mini rice crispies', 'sweet potatoes; sausage', 'steak; veggies; sweet potatoes', 'yogurt; cashews'],
    'quantities': ['150 g; 100 g; 1 tbsp', '17 g', '100 g; 1', '208 g; 203 g; 162 g', '160 g; 20 g'],
    'calories_kcal': [450, 68, 320, 520, 280],
    'protein_g': [35, 1, 18, 42, 12],
    'carbs_g': [45, 13, 35, 35, 25],
    'fat_g': [15, 1, 12, 18, 15],
    'workout_type': [np.nan, np.nan, np.nan, np.nan, np.nan],
    'duration_min': [np.nan, np.nan, np.nan, np.nan, np.nan],
    'distance_km': [np.nan, np.nan, np.nan, np.nan, np.nan],
    'goal_type': [np.nan, np.nan, np.nan, np.nan, np.nan],
    'goal_value': [np.nan, np.nan, np.nan, np.nan, np.nan],
    'goal_notes': [np.nan, np.nan, np.nan, np.nan, np.nan],
    'notes': [np.nan, np.nan, np.nan, np.nan, np.nan]
}

df = pd.DataFrame(data)
df.to_csv('data.csv', index=False)

print("✅ Created sample data with 5 meals")
print("Meals with complete macro/calorie data:", df[['protein_g','carbs_g','fat_g','calories_kcal']].notna().all(axis=1).sum())
print("\nFirst meal:")
print(df.iloc[0][['items', 'calories_kcal', 'protein_g', 'carbs_g', 'fat_g']])
