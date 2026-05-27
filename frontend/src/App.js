import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, Activity, BarChart2, Upload, Zap, Moon, Sun, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const API = "https://fraud-detection-api-5nmq.onrender.com/predict";

const SAMPLE_LEGIT = [0,-1.3598071336738,-0.0727811733098497,2.53634673796914,1.37815522427443,-0.338320769942518,0.462387777762292,0.239598554061257,0.0986979012610507,0.363786969611213,-0.0827840783408287,-0.270710202219468,-0.838587050085416,-0.414575448522756,-0.503140859566824,-1.18026065070827,-0.0283809549048508,-0.0204783736659523,-0.165946098417795,1.77320987891443,0.379779592574863,-1.18755801255055,0.0133756894738265,-0.0210530534538215,0.247998153469754,0.771679401917229,0.909412262347719,-0.689280956490685,-0.327641833735251,0.0];

const SAMPLE_FRAUD = [-1.3598071336738,1.1918658643,-0.9350866,-0.2374,-1.437954,-2.984617,-3.163276,-2.892415,-0.104,-0.451,-0.219,-0.234,-0.165,-0.382,-0.503,-1.18,-0.028,-0.020,0.085,0.379,-1.187,0.013,-0.021,0.247,0.771,-0.689,-0.327,0.0,-1.2,400.0];

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(true);
  const [stats, setStats] = useState({ total: 0, fraud: 0, legit: 0 });
  const [activeTab, setActiveTab] = useState("analyze");

  const bg = dark ? "#0a0f1e" : "#f0f4ff";
  const card = dark ? "#0f172a" : "#ffffff";
  const card2 = dark ? "#1e293b" : "#f8faff";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const sub = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "#1e293b" : "#e2e8f0";

  const handlePredict = async (featuresArray) => {
    setError("");
    setResult(null);
    const features = featuresArray || input.split(",").map(Number);
    if (features.length !== 30 || features.some(isNaN)) {
      setError("Please enter exactly 30 valid comma-separated numbers.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(API, { features });
      const newResult = { ...res.data, id: Date.now(), time: new Date().toLocaleTimeString() };
      setResult(newResult);
      setHistory((prev) => [newResult, ...prev.slice(0, 19)]);
      setStats((prev) => ({
        total: prev.total + 1,
        fraud: prev.fraud + (newResult.label === "FRAUD" ? 1 : 0),
        legit: prev.legit + (newResult.label === "LEGIT" ? 1 : 0),
      }));
    } catch {
      setError("API error. Please try again.");
    }
    setLoading(false);
  };

  const areaData = history.slice().reverse().map((h, i) => ({
    name: i + 1,
    probability: +(h.fraud_probability * 100).toFixed(2),
  }));

  const pieData = [
    { name: "Legit", value: stats.legit || 1 },
    { name: "Fraud", value: stats.fraud || 0 },
  ];

  const GaugeMeter = ({ value }) => {
    const pct = value * 100;
    const color = pct < 30 ? "#22c55e" : pct < 70 ? "#f59e0b" : "#ef4444";
    const rotation = -90 + pct * 1.8;
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <svg viewBox="0 0 200 110" width="220">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={border} strokeWidth="16" strokeLinecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
            strokeDasharray={`${pct * 2.51} 251`} />
          <g transform={`rotate(${rotation}, 100, 100)`}>
            <line x1="100" y1="100" x2="100" y2="30" stroke={text} strokeWidth="3" strokeLinecap="round" />
            <circle cx="100" cy="100" r="6" fill={color} />
          </g>
          <text x="100" y="88" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold">{pct.toFixed(1)}%</text>
          <text x="100" y="105" textAnchor="middle" fill={sub} fontSize="11">Fraud Risk</text>
        </svg>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'Inter', sans-serif", transition: "all 0.3s" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: card }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: 10, padding: 8 }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>FraudShield</div>
            <div style={{ fontSize: 11, color: sub }}>Real-Time Detection System</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#22c55e22", padding: "6px 12px", borderRadius: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>API Live</span>
          </div>
          <button onClick={() => setDark(!dark)} style={{ background: card2, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: text }}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: "24px 32px 0" }}>
        {[
          { label: "Total Analyzed", value: stats.total, icon: <Activity size={18} />, color: "#3b82f6" },
          { label: "Fraud Detected", value: stats.fraud, icon: <ShieldAlert size={18} />, color: "#ef4444" },
          { label: "Legit Transactions", value: stats.legit, icon: <ShieldCheck size={18} />, color: "#22c55e" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ background: s.color + "22", borderRadius: 10, padding: 10, color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: sub }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, padding: "24px 32px 0" }}>
        {["analyze", "history", "charts"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, textTransform: "capitalize",
              background: activeTab === tab ? "linear-gradient(135deg, #3b82f6, #8b5cf6)" : card2,
              color: activeTab === tab ? "white" : sub }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Analyze Tab */}
        {activeTab === "analyze" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

            {/* Input Panel */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={18} color="#3b82f6" /> Transaction Input
              </div>

              {/* Quick Load Buttons */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button onClick={() => { setInput(SAMPLE_LEGIT.join(",")); }}
                  style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid #22c55e`, background: "#22c55e11", color: "#22c55e", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  Load Legit Sample
                </button>
                <button onClick={() => { setInput(SAMPLE_FRAUD.join(",")); }}
                  style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid #ef4444`, background: "#ef444411", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  Load Fraud Sample
                </button>
              </div>

              <textarea rows={6} value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Paste 30 comma-separated transaction features..."
                style={{ width: "100%", background: bg, border: `1px solid ${border}`, borderRadius: 10, color: text,
                  padding: 12, fontSize: 12, resize: "vertical", boxSizing: "border-box", fontFamily: "monospace", lineHeight: 1.6 }} />

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</motion.p>
              )}

              <button onClick={() => handlePredict()} disabled={loading}
                style={{ marginTop: 14, width: "100%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  color: "white", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: 15,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <><RefreshCw size={16} className="spin" /> Analyzing...</> : <><ShieldCheck size={16} /> Analyze Transaction</>}
              </button>
            </motion.div>

            {/* Result Panel */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <AnimatePresence mode="wait">
                {!result && !loading && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ textAlign: "center", color: sub }}>
                    <ShieldCheck size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ fontSize: 14 }}>Submit a transaction to see results</p>
                  </motion.div>
                )}
                {loading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                    <p style={{ color: sub, fontSize: 14 }}>Analyzing transaction...</p>
                  </motion.div>
                )}
                {result && !loading && (
                  <motion.div key="result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    style={{ width: "100%", textAlign: "center" }}>
                    <GaugeMeter value={result.fraud_probability} />
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color: result.label === "FRAUD" ? "#ef4444" : "#22c55e", marginBottom: 8 }}>
                        {result.label === "FRAUD" ? "🚨" : "✅"} {result.label}
                      </div>
                      <div style={{ fontSize: 13, color: sub }}>
                        Confidence: <strong style={{ color: text }}>{((1 - result.fraud_probability) * 100).toFixed(1)}%</strong>
                      </div>
                      <div style={{ marginTop: 16, background: result.label === "FRAUD" ? "#ef444411" : "#22c55e11",
                        border: `1px solid ${result.label === "FRAUD" ? "#ef4444" : "#22c55e"}`,
                        borderRadius: 10, padding: "10px 20px", fontSize: 13, color: result.label === "FRAUD" ? "#ef4444" : "#22c55e" }}>
                        {result.label === "FRAUD" ? "⚠️ This transaction has been flagged. Review immediately." : "✔ Transaction appears safe to process."}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${border}`, fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={18} color="#3b82f6" /> Transaction History
            </div>
            {history.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: sub }}>No transactions analyzed yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: card2 }}>
                    {["#", "Time", "Label", "Fraud Probability", "Status"].map((h) => (
                      <th key={h} style={{ padding: "12px 20px", textAlign: "left", color: sub, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <motion.tr key={h.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={{ padding: "12px 20px", color: sub }}>{i + 1}</td>
                      <td style={{ padding: "12px 20px", color: sub }}>{h.time}</td>
                      <td style={{ padding: "12px 20px", fontWeight: 700, color: h.label === "FRAUD" ? "#ef4444" : "#22c55e" }}>{h.label}</td>
                      <td style={{ padding: "12px 20px" }}>{(h.fraud_probability * 100).toFixed(2)}%</td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: h.label === "FRAUD" ? "#ef444422" : "#22c55e22",
                          color: h.label === "FRAUD" ? "#ef4444" : "#22c55e" }}>
                          {h.label === "FRAUD" ? "Flagged" : "Cleared"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}

        {/* Charts Tab */}
        {activeTab === "charts" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart2 size={18} color="#3b82f6" /> Fraud Probability Trend
              </div>
              {areaData.length === 0 ? <div style={{ color: sub, textAlign: "center", padding: 40 }}>No data yet</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke={sub} fontSize={11} />
                    <YAxis stroke={sub} fontSize={11} />
                    <Tooltip contentStyle={{ background: card, border: `1px solid ${border}`, borderRadius: 8, color: text }} />
                    <Area type="monotone" dataKey="probability" stroke="#3b82f6" fill="url(#grad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart2 size={18} color="#8b5cf6" /> Legit vs Fraud Breakdown
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ background: card, border: `1px solid ${border}`, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 8 }}>
                {[{ label: "Legit", color: "#22c55e" }, { label: "Fraud", color: "#ef4444" }].map((l) => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
                    <span style={{ color: sub }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        textarea:focus { outline: 1px solid #3b82f6; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>
    </div>
  );
}