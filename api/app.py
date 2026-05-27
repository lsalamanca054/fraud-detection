from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

model = joblib.load(os.path.join(os.path.dirname(__file__), "../model/fraud_model.pkl"))

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Fraud Detection API is running"})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        features = data.get("features")

        if not features or len(features) != 30:
            return jsonify({"error": "Provide exactly 30 features"}), 400

        input_array = np.array(features).reshape(1, -1)
        prediction = model.predict(input_array)[0]
        probability = model.predict_proba(input_array)[0][1]

        if probability < 0.30:
            triage = "LOW"
        elif probability < 0.70:
            triage = "MEDIUM"
        else:
            triage = "HIGH"

        return jsonify({
            "prediction": int(prediction),
            "label": "FRAUD" if prediction == 1 else "LEGIT",
            "fraud_probability": round(float(probability), 4),
            "triage": triage
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)