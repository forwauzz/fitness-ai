# predict.py
import os, sys, joblib, json
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "model_xgb.pkl")
META_PATH = os.path.join(os.path.dirname(__file__), "models", "metadata.json")
PROFILE_PATH = os.path.join(os.path.dirname(__file__), "profile.json")

def ensure_model():
    if not os.path.exists(MODEL_PATH):
        sys.exit(f"❌ Model not found at {MODEL_PATH}. Train first:  python train.py")
    if os.path.getsize(MODEL_PATH) < 1024:
        sys.exit(f"❌ Model file looks too small: {MODEL_PATH}")
    print(f"✅ Using model: {MODEL_PATH}")

def load_profile():
    """Load user profile for personalization features"""
    if not os.path.exists(PROFILE_PATH):
        return None
    try:
        with open(PROFILE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return None

def predict_with_profile(protein_g, carbs_g, fat_g, items=""):
    """Predict calories with profile integration"""
    model = joblib.load(MODEL_PATH)
    
    # Load metadata to get feature schema
    try:
        with open(META_PATH, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        feature_cols = metadata.get("schema", ["protein_g","carbs_g","fat_g"])
    except:
        feature_cols = ["protein_g","carbs_g","fat_g"]
    
    # Load profile
    profile = load_profile()
    
    # Build feature vector
    features = [protein_g, carbs_g, fat_g]
    
    # Add profile features if available
    if profile and profile.get("preferences") and len(feature_cols) > 3:
        favorite_foods = set(profile["preferences"].get("favorite_foods", []))
        favorite_snacks = set(profile["preferences"].get("favorite_snacks", []))
        grocery_items = set(profile["preferences"].get("grocery_items", []))
        
        has_favorite_food = 1 if any(food.lower() in items.lower() for food in favorite_foods) else 0
        has_favorite_snack = 1 if any(snack.lower() in items.lower() for snack in favorite_snacks) else 0
        has_grocery_item = 1 if any(item.lower() in items.lower() for item in grocery_items) else 0
        
        macro_prefs = profile.get("dietary_patterns", {}).get("macro_preferences", {})
        profile_protein_ratio = macro_prefs.get("protein_ratio", 0.0)
        profile_carbs_ratio = macro_prefs.get("carbs_ratio", 0.0)
        profile_fat_ratio = macro_prefs.get("fat_ratio", 0.0)
        
        learning_metrics = profile.get("learning_metrics", {})
        personalization_score = learning_metrics.get("personalization_score", 0.0)
        
        features.extend([has_favorite_food, has_favorite_snack, has_grocery_item,
                        profile_protein_ratio, profile_carbs_ratio, profile_fat_ratio,
                        personalization_score])
    
    # Pad with zeros if needed
    while len(features) < len(feature_cols):
        features.append(0.0)
    
    X = np.array([features])
    yhat = model.predict(X)
    return float(yhat[0])

def predict_example():
    # Input = [protein_g, carbs_g, fat_g]
    calories = predict_with_profile(30, 60, 10, "chicken rice")
    print("Predicted calories:", calories)

if __name__ == "__main__":
    ensure_model()
    predict_example()