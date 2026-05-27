import { useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePredict = async () => {
    setError("");
    setResult(null);
    const features = input.split(",").map(Number);
    if (features.length !== 30) {
      setError("Please enter exactly 30 comma-separated values.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("https://fraud-detection-api-5nmq.onrender.com/predict", { features });
      const newResult = res.data;
      setResult(newResult);
      setHistory((prev) => [{ ...newResult, id: Date.now() }, ...prev.slice(0, 9)]);
    } catch (err) {
      setError("API error. Make sure Flask is running.");
    }
    setLoading(false);
  };

  const chartData = [
    { name: "Legit", value: history.filter((h) => h.label === "LEGIT").length },
    { name: "Fraud", value: history.filter((h) => h.label === "FRAUD").length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", fontFamily: "Inter, sans-serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#38bdf8", marginBottom: 8 }}>
            Fraud Detection System
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            SMOTE-Enriched XGBoost Model — Real-Time Prediction
          </p>
        </div>

        {/* Input */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 8 }}>
            Enter 30 comma-separated transaction features:
          </label>
          <textarea
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0,-1.35,0.07,2.53,1.37,-0.33,0.46,0.23,0.09,0.36,-0.08,-0.27,-0.83,-0.41,-0.50,-1.18,-0.02,-0.02,-0.16,1.77,0.37,-1.18,0.01,-0.02,0.24,0.77,0.90,-0.68,-0.32,0.0"
            style={{
              width: "100%", background: "#0f172a", border: "1px solid #334155",
              borderRadius: 8, color: "#f1f5f9", padding: 12, fontSize: 13,
              resize: "vertical", boxSizing: "border-box"
            }}
          />
          {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p>}
          <button
            onClick={handlePredict}
            disabled={loading}
            style={{
              marginTop: 16, background: "#38bdf8", color: "#0f172a", border: "none",
              borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Analyzing..." : "Analyze Transaction"}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div style={{
            background: result.label === "FRAUD" ? "#450a0a" : "#052e16",
            border: `1px solid ${result.label === "FRAUD" ? "#dc2626" : "#16a34a"}`,
            borderRadius: 12, padding: 24, marginBottom: 24, textAlign: "center"
          }}>
            <div style={{ fontSize: 48 }}>{result.label === "FRAUD" ? "🚨" : "✅"}</div>
            <div style={{
              fontSize: 28, fontWeight: 700, marginTop: 8,
              color: result.label === "FRAUD" ? "#f87171" : "#4ade80"
            }}>
              {result.label}
            </div>
            <div style={{ color: "#94a3b8", marginTop: 8, fontSize: 14 }}>
              Fraud Probability: <strong style={{ color: "#f1f5f9" }}>
                {(result.fraud_probability * 100).toFixed(2)}%
              </strong>
            </div>
          </div>
        )}

        {/* Chart */}
        {history.length > 0 && (
          <div style={{ background: "#1e293b", borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#94a3b8" }}>
              Session Summary
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "none" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={index === 1 ? "#dc2626" : "#16a34a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div style={{ background: "#1e293b", borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#94a3b8" }}>
              Recent Transactions
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "#64748b" }}>#</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "#64748b" }}>Label</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "#64748b" }}>Fraud Probability</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "8px 12px", color: "#64748b" }}>{i + 1}</td>
                    <td style={{ padding: "8px 12px", color: h.label === "FRAUD" ? "#f87171" : "#4ade80", fontWeight: 600 }}>
                      {h.label}
                    </td>
                    <td style={{ padding: "8px 12px", color: "#f1f5f9" }}>
                      {(h.fraud_probability * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}