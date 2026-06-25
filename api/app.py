from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import deque
import joblib
import math
import numpy as np
import os
import time

app = Flask(__name__)
CORS(app)

base = os.path.dirname(__file__)
model = joblib.load(os.path.join(base, "../model/fraud_model.pkl"))
scaler = joblib.load(os.path.join(base, "../model/scaler.pkl"))
threshold = joblib.load(os.path.join(base, "../model/threshold.pkl"))

LATENCY_TARGET_MS = 200
inference_latencies = deque(maxlen=1000)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Fraud Detection API is running", "threshold": threshold})

@app.route("/metrics", methods=["GET"])
def metrics():
    if not inference_latencies:
        return jsonify({"count": 0})
    latencies = sorted(inference_latencies)
    count = len(latencies)
    p95_index = math.ceil(count * 0.95) - 1
    p95 = latencies[p95_index]
    under_target = sum(1 for l in latencies if l <= LATENCY_TARGET_MS)
    return jsonify({
        "count": count,
        "avg_latency_ms": round(sum(latencies) / count, 2),
        "p95_latency_ms": round(p95, 2),
        "max_latency_ms": round(latencies[-1], 2),
        "latency_target_ms": LATENCY_TARGET_MS,
        "sub_target_rate": round(under_target / count, 4)
    })

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # Accept either raw features array or named fields
        if "features" in data:
            features = data["features"]
            if len(features) != 10:
                return jsonify({"error": "Provide exactly 10 features: amt, category, gender, city_pop, age, hour, day, month, distance, unix_time"}), 400
            input_array = np.array(features).reshape(1, -1)

        elif "transaction" in data:
            t = data["transaction"]
            input_array = np.array([[
                t.get("amt", 0),
                t.get("category", 0),
                t.get("gender", 0),
                t.get("city_pop", 0),
                t.get("age", 0),
                t.get("hour", 0),
                t.get("day", 0),
                t.get("month", 0),
                t.get("distance", 0),
                t.get("unix_time", 0)
            ]])
        else:
            return jsonify({"error": "Provide either 'features' array or 'transaction' object"}), 400

        inference_start = time.perf_counter()
        input_scaled = scaler.transform(input_array)
        probability = model.predict_proba(input_scaled)[0][1]
        latency_ms = round((time.perf_counter() - inference_start) * 1000, 2)
        inference_latencies.append(latency_ms)

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
            "triage": triage,
            "latency_ms": latency_ms,
            "meets_sla": latency_ms <= LATENCY_TARGET_MS
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)