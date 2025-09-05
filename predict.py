# predict.py
import os, sys, joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "model_xgb.pkl")

def ensure_model():
    if not os.path.exists(MODEL_PATH):
        sys.exit(f"❌ Model not found at {MODEL_PATH}. Train first:  python train.py")
    if os.path.getsize(MODEL_PATH) < 1024:
        sys.exit(f"❌ Model file looks too small: {MODEL_PATH}")
    print(f"✅ Using model: {MODEL_PATH}")

def predict_example():
    model = joblib.load(MODEL_PATH)
    # Input = [protein_g, carbs_g, fat_g]
    X = np.array([[30, 60, 10]])
    yhat = model.predict(X)
    print("Predicted calories:", float(yhat[0]))

if __name__ == "__main__":
    ensure_model()
    predict_example()