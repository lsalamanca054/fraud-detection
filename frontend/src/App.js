import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, Activity, BarChart2, Zap, Moon, Sun, RefreshCw, Clock, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const API = "https://fraud-detection-api-5nmq.onrender.com/predict";

const SAMPLE_LEGIT = [0,-1.3598071336738,-0.0727811733098497,2.53634673796914,1.37815522427443,-0.338320769942518,0.462387777762292,0.239598554061257,0.0986979012610507,0.363786969611213,-0.0827840783408287,-0.270710202219468,-0.838587050085416,-0.414575448522756,-0.503140859566824,-1.18026065070827,-0.0283809549048508,-0.0204783736659523,-0.165946098417795,1.77320987891443,0.379779592574863,-1.18755801255055,0.0133756894738265,-0.0210530534538215,0.247998153469754,0.771679401917229,0.909412262347719,-0.689280956490685,-0.327641833735251,0.0];
const SAMPLE_FRAUD = [-2.3122265423263,1.95199201064158,-1.60985073229769,3.9979055875468,-0.522187864667764,-1.42654531920595,-2.53738730624579,1.39165724829804,-2.77008927719433,-2.77227214465915,3.20203320709635,-2.89990738849473,-0.595221881324605,-4.28925378244217,0.389724120274487,-1.14074717980657,-2.83005567450437,-0.0168224681808257,0.416955705037907,0.126910559061474,0.517232370861764,-0.0350493686052974,-0.465211076182388,0.320198198514526,0.0445191674731724,0.177839798284401,0.261145002567677,-0.143275874698919,0.0,406.0];

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(true);
  const [stats, setStats] = useState({ total: 0, fraud: 0, legit: 0 });
  const [activeTab, setActiveTab] = useState("analyze");

  const t = dark ? {
    bg: "#060910", card: "rgba(255,255,255,0.04)", card2: "rgba(255,255,255,0.07)",
    border: "rgba(255,255,255,0.08)", text: "#f0f4ff", sub: "#6b7fa3",
    header: "rgba(6,9,16,0.85)"
  } : {
    bg: "#f0f4ff", card: "rgba(255,255,255,0.9)", card2: "rgba(255,255,255,0.6)",
    border: "rgba(0,0,30,0.08)", text: "#060910", sub: "#5a6a8a",
    header: "rgba(240,244,255,0.85)"
  };

  const handlePredict = async (featuresArray) => {
    setError(""); setResult(null);
    const features = featuresArray || input.split(",").map(Number);
    if (features.length !== 30 || features.some(isNaN)) {
      setError("Enter exactly 30 comma-separated numbers."); return;
    }
    setLoading(true);
    try {
      const res = await axios.post(API, { features });
      const r = { ...res.data, id: Date.now(), time: new Date().toLocaleTimeString() };
      setResult(r);
      setHistory(p => [r, ...p.slice(0, 19)]);
      setStats(p => ({ total: p.total+1, fraud: p.fraud+(r.label==="FRAUD"?1:0), legit: p.legit+(r.label==="LEGIT"?1:0) }));
    } catch { setError("API error. Try again."); }
    setLoading(false);
    setInput("");
  };

  const GaugeMeter = ({ value }) => {
    const pct = value * 100;
    const color = pct < 25 ? "#00d68f" : pct < 60 ? "#ffaa00" : "#ff3d71";
    const r = 70, cx = 100, cy = 100;
    const toXY = (deg) => {
      const rad = (deg - 90) * Math.PI / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };
    const start = toXY(-135), end = toXY(-135 + (pct/100)*270);
    const large = (pct/100)*270 > 180 ? 1 : 0;
    return (
      <div style={{ textAlign: "center" }}>
        <svg viewBox="0 0 200 160" width="100%" style={{ maxWidth: 260 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={t.border} strokeWidth="12" strokeDasharray="339 1000" strokeDashoffset="-85" strokeLinecap="round" />
          {pct > 0 && (
            <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`}
              fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
          )}
          <text x={cx} y={cy-8} textAnchor="middle" fill={color} fontSize="26" fontWeight="700" fontFamily="'Space Mono', monospace">{pct.toFixed(1)}%</text>
          <text x={cx} y={cy+12} textAnchor="middle" fill={t.sub} fontSize="11" fontFamily="'Syne', sans-serif">FRAUD RISK SCORE</text>
          <text x={cx} y={cy+130} textAnchor="middle" fill={t.sub} fontSize="10" fontFamily="'Syne', sans-serif">LOW</text>
          <text x={cx} y={cy+130} dx="60" textAnchor="middle" fill={t.sub} fontSize="10" fontFamily="'Syne', sans-serif">HIGH</text>
        </svg>
      </div>
    );
  };

  const areaData = history.slice().reverse().map((h, i) => ({ n: i+1, p: +(h.fraud_probability*100).toFixed(2) }));
  const pieData = [{ name: "Legit", value: stats.legit||1 }, { name: "Fraud", value: stats.fraud||0 }];

  const statCards = [
    { label: "Analyzed", value: stats.total, icon: <Activity size={16}/>, color: "#4f8ef7" },
    { label: "Flagged", value: stats.fraud, icon: <ShieldAlert size={16}/>, color: "#ff3d71" },
    { label: "Cleared", value: stats.legit, icon: <ShieldCheck size={16}/>, color: "#00d68f" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'Syne', sans-serif", transition: "background 0.3s, color 0.3s", overflowX: "hidden" }}>

      {/* Animated background grid */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <svg width="100%" height="100%" style={{ opacity: dark ? 0.04 : 0.06 }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={dark?"#4f8ef7":"#060910"} strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
        {dark && (
          <>
            <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)", top:-100, right:-100 }}/>
            <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,61,113,0.08) 0%, transparent 70%)", bottom:100, left:-50 }}/>
          </>
        )}
      </div>

      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:100, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", background: t.header, borderBottom:`1px solid ${t.border}`, padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg, #4f8ef7, #7b5cf0)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <ShieldCheck size={18} color="white"/>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:16, letterSpacing:"0.05em" }}>FRAUDSHIELD</div>
            <div style={{ fontSize:10, color:t.sub, letterSpacing:"0.1em" }}>SMOTE · XGBOOST · REAL-TIME</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(0,214,143,0.1)", border:"1px solid rgba(0,214,143,0.2)", padding:"5px 10px", borderRadius:20 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#00d68f", animation:"blink 2s ease-in-out infinite" }}/>
            <span style={{ fontSize:11, color:"#00d68f", fontWeight:600, letterSpacing:"0.08em" }}>LIVE</span>
          </div>
          <button onClick={() => setDark(!dark)} style={{ background: t.card2, border:`1px solid ${t.border}`, borderRadius:8, padding:"7px 10px", cursor:"pointer", color:t.text, display:"flex", alignItems:"center" }}>
            {dark ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
        </div>
      </div>

      <div style={{ position:"relative", zIndex:1, padding:"24px 16px", maxWidth:1000, margin:"0 auto" }}>

        {/* Stat Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:12, marginBottom:24 }}>
          {statCards.map((s,i) => (
            <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
              style={{ background: t.card, border:`1px solid ${t.border}`, borderRadius:14, padding:"12px 8px", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ background:`${s.color}18`, border:`1px solid ${s.color}33`, borderRadius:10, padding:8, color:s.color, flexShrink:0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:18, fontWeight:700, fontFamily:"'Space Mono', monospace" }}>{s.value}</div>
                <div style={{ fontSize:11, color:t.sub, letterSpacing:"0.06em" }}>{s.label.toUpperCase()}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:20, background: t.card, border:`1px solid ${t.border}`, borderRadius:12, padding:4, backdropFilter:"blur(10px)" }}>
          {[{id:"analyze",icon:<Zap size={14}/>},{id:"history",icon:<Clock size={14}/>},{id:"charts",icon:<TrendingUp size={14}/>}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex:1, padding:"9px 12px", borderRadius:9, border:"none", cursor:"pointer", fontWeight:600, fontSize:12,
                letterSpacing:"0.06em", textTransform:"uppercase", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                background: activeTab===tab.id ? "linear-gradient(135deg, #4f8ef7, #7b5cf0)" : "transparent",
                color: activeTab===tab.id ? "white" : t.sub }}>
              {tab.icon}{tab.id}
            </button>
          ))}
        </div>

        {/* Analyze Tab */}
        {activeTab==="analyze" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:16 }}>

            {/* Input */}
            <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
              style={{ background: t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:20, backdropFilter:"blur(10px)" }}>
              <div style={{ fontWeight:700, fontSize:13, letterSpacing:"0.08em", color:t.sub, marginBottom:16 }}>TRANSACTION INPUT</div>

              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <button onClick={() => setInput(SAMPLE_LEGIT.join(","))}
                  style={{ flex:1, padding:"8px 6px", borderRadius:8, border:"1px solid rgba(0,214,143,0.3)", background:"rgba(0,214,143,0.07)", color:"#00d68f", cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:"0.05em" }}>
                  ✓ LEGIT SAMPLE
                </button>
                <button onClick={() => setInput(SAMPLE_FRAUD.join(","))}
                  style={{ flex:1, padding:"8px 6px", borderRadius:8, border:"1px solid rgba(255,61,113,0.3)", background:"rgba(255,61,113,0.07)", color:"#ff3d71", cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:"0.05em" }}>
                  ⚠ FRAUD SAMPLE
                </button>
              </div>

              <textarea rows={7} value={input} onChange={e => setInput(e.target.value)}
                placeholder="0,-1.35,0.07,2.53,1.37,-0.33,0.46,0.23,..."
                style={{ width:"100%", background:"rgba(0,0,0,0.2)", border:`1px solid ${t.border}`, borderRadius:10, color:t.text,
                  padding:"12px", fontSize:11, resize:"vertical", boxSizing:"border-box", fontFamily:"'Space Mono', monospace",
                  lineHeight:1.8, outline:"none" }}/>

              {error && <motion.p initial={{opacity:0}} animate={{opacity:1}} style={{ color:"#ff3d71", fontSize:11, marginTop:8, fontFamily:"'Space Mono', monospace" }}>{error}</motion.p>}

              <button onClick={() => handlePredict()} disabled={loading}
                style={{ marginTop:14, width:"100%", background: loading ? t.card2 : "linear-gradient(135deg, #4f8ef7, #7b5cf0)",
                  color:"white", border:"none", borderRadius:10, padding:"13px", fontWeight:700, fontSize:12,
                  letterSpacing:"0.1em", cursor: loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading ? <><RefreshCw size={14} style={{animation:"spin 1s linear infinite"}}/> ANALYZING...</> : <><ShieldCheck size={14}/> ANALYZE TRANSACTION</>}
              </button>
            </motion.div>

          {/* Result */}
<motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
  style={{ background: t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:20, backdropFilter:"blur(10px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:320 }}>
  <AnimatePresence mode="wait">
    {!result && !loading && (
      <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ textAlign:"center", color:t.sub }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background: t.card2, border:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
          <ShieldCheck size={28} style={{ opacity:0.3 }}/>
        </div>
        <p style={{ fontSize:12, letterSpacing:"0.06em" }}>AWAITING TRANSACTION</p>
      </motion.div>
    )}
    {loading && (
      <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ textAlign:"center" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", border:"2px solid #4f8ef7", borderTopColor:"transparent", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }}/>
        <p style={{ color:t.sub, fontSize:12, letterSpacing:"0.06em" }}>SCANNING TRANSACTION...</p>
      </motion.div>
    )}
    {result && !loading && (
      <motion.div key="result" initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} style={{ width:"100%", textAlign:"center" }}>
        <GaugeMeter value={result.fraud_probability}/>
        <motion.div initial={{y:10,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.2}}>
          <div style={{ fontSize:28, fontWeight:800, letterSpacing:"0.1em", color: result.label==="FRAUD"?"#ff3d71":"#00d68f", margin:"8px 0 4px" }}>
            {result.label==="FRAUD" ? "🚨" : "✅"} {result.label}
          </div>
          <div style={{ fontSize:11, color:t.sub, letterSpacing:"0.06em", marginBottom:10 }}>
            CONFIDENCE: <span style={{ color:t.text, fontFamily:"'Space Mono', monospace" }}>{((1-result.fraud_probability)*100).toFixed(1)}%</span>
          </div>

          {/* Triage Badge */}
          <div style={{ marginBottom:12 }}>
            <span style={{
              display:"inline-block", padding:"4px 14px", borderRadius:20,
              fontSize:11, fontWeight:700, letterSpacing:"0.08em",
              background: result.triage==="HIGH" ? "rgba(255,61,113,0.15)" : result.triage==="MEDIUM" ? "rgba(255,170,0,0.15)" : "rgba(0,214,143,0.15)",
              color: result.triage==="HIGH" ? "#ff3d71" : result.triage==="MEDIUM" ? "#ffaa00" : "#00d68f",
              border: `1px solid ${result.triage==="HIGH" ? "rgba(255,61,113,0.3)" : result.triage==="MEDIUM" ? "rgba(255,170,0,0.3)" : "rgba(0,214,143,0.3)"}`
            }}>
              TRIAGE: {result.triage}
            </span>
          </div>

          <div style={{ background: result.label==="FRAUD" ? "rgba(255,61,113,0.08)" : "rgba(0,214,143,0.08)",
            border:`1px solid ${result.label==="FRAUD"?"rgba(255,61,113,0.25)":"rgba(0,214,143,0.25)"}`,
            borderRadius:10, padding:"10px 16px", fontSize:11, color: result.label==="FRAUD"?"#ff3d71":"#00d68f", letterSpacing:"0.04em" }}>
            {result.triage==="HIGH" ? "⚠ High risk. Block transaction and alert analyst immediately." :
             result.triage==="MEDIUM" ? "⚡ Medium risk. Flag for secondary verification (OTP required)." :
             "✔ Low risk. Transaction cleared. Safe to process."}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>
</div>
)}

        {/* History Tab */}
        {activeTab==="history" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            style={{ background: t.card, border:`1px solid ${t.border}`, borderRadius:16, overflow:"hidden", backdropFilter:"blur(10px)" }}>
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${t.border}`, fontWeight:700, fontSize:12, letterSpacing:"0.08em", color:t.sub, display:"flex", alignItems:"center", gap:8 }}>
              <Activity size={14} color="#4f8ef7"/> TRANSACTION LOG
            </div>
            {history.length===0 ? (
              <div style={{ padding:40, textAlign:"center", color:t.sub, fontSize:12, letterSpacing:"0.06em" }}>NO TRANSACTIONS YET</div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background: t.card2 }}>
                      {["#","TIME","VERDICT","RISK SCORE","STATUS"].map(h => (
                        <th key={h} style={{ padding:"11px 16px", textAlign:"left", color:t.sub, fontWeight:600, fontSize:10, letterSpacing:"0.08em", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h,i) => (
                      <motion.tr key={h.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
                        style={{ borderBottom:`1px solid ${t.border}` }}>
                        <td style={{ padding:"11px 16px", color:t.sub, fontFamily:"'Space Mono', monospace" }}>{String(i+1).padStart(2,"0")}</td>
                        <td style={{ padding:"11px 16px", color:t.sub, fontFamily:"'Space Mono', monospace", whiteSpace:"nowrap" }}>{h.time}</td>
                        <td style={{ padding:"11px 16px", fontWeight:700, letterSpacing:"0.06em", color: h.label==="FRAUD"?"#ff3d71":"#00d68f" }}>{h.label}</td>
                        <td style={{ padding:"11px 16px", fontFamily:"'Space Mono', monospace" }}>{(h.fraud_probability*100).toFixed(2)}%</td>
                        <td style={{ padding:"11px 16px" }}>
                          <span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, letterSpacing:"0.06em",
                            background: h.label==="FRAUD"?"rgba(255,61,113,0.12)":"rgba(0,214,143,0.12)",
                            color: h.label==="FRAUD"?"#ff3d71":"#00d68f",
                            border:`1px solid ${h.label==="FRAUD"?"rgba(255,61,113,0.25)":"rgba(0,214,143,0.25)"}` }}>
                            {h.label==="FRAUD"?"FLAGGED":"CLEARED"}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Charts Tab */}
        {activeTab==="charts" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:16 }}>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
              style={{ background: t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:20, backdropFilter:"blur(10px)" }}>
              <div style={{ fontWeight:700, fontSize:11, letterSpacing:"0.08em", color:t.sub, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                <BarChart2 size={13} color="#4f8ef7"/> RISK PROBABILITY TREND
              </div>
              {areaData.length===0 ? <div style={{ color:t.sub, textAlign:"center", padding:40, fontSize:11 }}>NO DATA YET</div> : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="n" stroke={t.sub} fontSize={10} tickLine={false}/>
                    <YAxis stroke={t.sub} fontSize={10} tickLine={false}/>
                    <Tooltip contentStyle={{ background: dark?"#0f1825":"#fff", border:`1px solid ${t.border}`, borderRadius:8, fontSize:11 }}/>
                    <Area type="monotone" dataKey="p" stroke="#4f8ef7" fill="url(#g1)" strokeWidth={2} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
              style={{ background: t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:20, backdropFilter:"blur(10px)" }}>
              <div style={{ fontWeight:700, fontSize:11, letterSpacing:"0.08em", color:t.sub, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                <Activity size={13} color="#7b5cf0"/> DETECTION BREAKDOWN
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    <Cell fill="#00d68f"/>
                    <Cell fill="#ff3d71"/>
                  </Pie>
                  <Tooltip contentStyle={{ background: dark?"#0f1825":"#fff", border:`1px solid ${t.border}`, borderRadius:8, fontSize:11 }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:4 }}>
                {[{l:"Legit",c:"#00d68f"},{l:"Fraud",c:"#ff3d71"}].map(x => (
                  <div key={x.l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:t.sub }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:x.c }}/>
                    {x.l.toUpperCase()}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Model Info Card */}
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
              style={{ background: t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:20, backdropFilter:"blur(10px)", gridColumn:"1 / -1" }}>
              <div style={{ fontWeight:700, fontSize:11, letterSpacing:"0.08em", color:t.sub, marginBottom:16 }}>MODEL PERFORMANCE</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))", gap:12 }}>
                {[
                  { label:"ROC-AUC", value:"0.9760", color:"#4f8ef7" },
                  { label:"Recall", value:"87%", color:"#00d68f" },
                  { label:"Precision", value:"35%", color:"#ffaa00" },
                  { label:"Training Set", value:"454K", color:"#7b5cf0" },
                  { label:"Algorithm", value:"XGBoost", color:"#4f8ef7" },
                  { label:"Balancing", value:"SMOTE", color:"#00d68f" },
                ].map((m,i) => (
                  <div key={i} style={{ background: t.card2, border:`1px solid ${t.border}`, borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ fontSize:16, fontWeight:700, color:m.color, fontFamily:"'Space Mono', monospace" }}>{m.value}</div>
                    <div style={{ fontSize:10, color:t.sub, marginTop:4, letterSpacing:"0.06em" }}>{m.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        textarea:focus { outline:1px solid #4f8ef7 !important; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#334155; border-radius:2px; }
        button:hover { opacity:0.85; transition:opacity 0.2s; }
        @media(max-width:480px){
          .stat-grid { grid-template-columns: repeat(3,1fr) !important; }
        }
      `}</style>
    </div>
  );
}