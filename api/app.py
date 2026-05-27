from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

base = os.path.dirname(__file__)
model = joblib.load(os.path.join(base, "../model/fraud_model.pkl"))
threshold = joblib.load(os.path.join(base, "../model/threshold.pkl"))

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Fraud Detection API is running", "threshold": threshold})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        features = data.get("features")

        if not features or len(features) != 30:
            return jsonify({"error": "Provide exactly 30 features"}), 400

        input_array = np.array(features).reshape(1, -1)
        probability = model.predict_proba(input_array)[0][1]
        prediction = int(probability >= threshold)

        if probability < 0.30:
            triage = "LOW"
        elif probability < 0.70:
            triage = "MEDIUM"
        else:
            triage = "HIGH"

        return jsonify({
            "prediction": prediction,
            "label": "FRAUD" if prediction == 1 else "LEGIT",
            "fraud_probability": round(float(probability), 4),
            "triage": triage
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)