# train.py
import json, os, time, joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, KFold, LeaveOneOut
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.linear_model import LinearRegression
from xgboost import XGBRegressor

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH   = os.path.join(ARTIFACT_DIR, "model_xgb.pkl")
META_PATH    = os.path.join(ARTIFACT_DIR, "metadata.json")
DATA_PATH    = os.path.join(os.path.dirname(__file__), "data.csv")

os.makedirs(ARTIFACT_DIR, exist_ok=True)

def load_frame():
    df = pd.read_csv(DATA_PATH)

    # Filter for meal entries - they have meal_type values like 'dinner', 'snack', etc.
    meals = df[df["meal_type"].notna()].copy()
    for col in ["protein_g", "carbs_g", "fat_g", "calories_kcal"]:
        if col not in meals.columns:
            meals[col] = np.nan

    # If calories missing but macros present, synthesize with 4/4/9
    need_cals = meals["calories_kcal"].isna()
    have_macros = meals[["protein_g","carbs_g","fat_g"]].notna().all(axis=1)
    synth_mask = need_cals & have_macros
    meals.loc[synth_mask, "calories_kcal"] = (
        4*meals.loc[synth_mask, "protein_g"] +
        4*meals.loc[synth_mask, "carbs_g"] +
        9*meals.loc[synth_mask, "fat_g"]
    )
    meals["label_is_synthetic"] = synth_mask & meals["calories_kcal"].notna()

    # keep rows with complete macros + calories now (real or synthetic)
    meals = meals.dropna(subset=["protein_g","carbs_g","fat_g","calories_kcal"]).copy()

    X = meals[["protein_g","carbs_g","fat_g"]].astype(float).values
    y = meals["calories_kcal"].astype(float).values
    return meals, X, y

def main():
    meals, X, y = load_frame()
    n = len(y)
    if n == 0:
        raise SystemExit("❌ No usable rows. You need macros (protein_g, carbs_g, fat_g) and/or calories_kcal.")

    print(f"Using {n} samples (synthetic labels: {int(meals['label_is_synthetic'].sum())}).")
    metrics = {}

    if n >= 10:
        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=42)
        model = XGBRegressor(n_estimators=300, max_depth=4, learning_rate=0.08,
                             subsample=0.9, colsample_bytree=0.9, random_state=42)
        model.fit(X_tr, y_tr)
        yp = model.predict(X_te)
        metrics["r2"] = float(r2_score(y_te, yp))
        metrics["mae"] = float(mean_absolute_error(y_te, yp))
        cv_note = "holdout 25%"
    elif n >= 3:
        # Small dataset → CV
        k = 3 if n >= 6 else n
        model = XGBRegressor(n_estimators=200, max_depth=3, learning_rate=0.1,
                             subsample=0.9, colsample_bytree=0.9, random_state=42)
        r2s, maes = [], []
        splitter = (KFold(n_splits=k, shuffle=True, random_state=42)
                    if n >= 6 else LeaveOneOut())
        for tr, te in splitter.split(X):
            model.fit(X[tr], y[tr])
            yp = model.predict(X[te])
            r2s.append(r2_score(y[te], yp) if len(te) > 1 else float("nan"))
            maes.append(mean_absolute_error(y[te], yp))
        metrics["r2_mean"]  = float(np.nanmean(r2s))
        metrics["mae_mean"] = float(np.mean(maes))
        cv_note = "KFold CV" if n >= 6 else "LOO CV"
        model.fit(X, y)  # final fit on all data
    else:
        # n = 1–2 → linear baseline
        model = LinearRegression()
        model.fit(X, y)
        metrics["r2"] = float("nan"); metrics["mae"] = float("nan")
        cv_note = "baseline (too few samples)"

    joblib.dump(model, MODEL_PATH)
    metadata = {
        "saved_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model_path": MODEL_PATH,
        "n_samples": int(n),
        "cv_note": cv_note,
        "metrics": metrics,
        "schema": ["protein_g","carbs_g","fat_g"],
        "label": "calories_kcal (real or synthetic via 4/4/9)",
    }
    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"✅ Model saved to: {MODEL_PATH}")
    print(f"ℹ️ Metadata saved to: {META_PATH}")
    print(f"🔎 Metrics: {metadata['metrics']} ({cv_note})")

if __name__ == "__main__":
    main()