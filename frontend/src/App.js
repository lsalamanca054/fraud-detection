import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem,
  Select, FormControl, InputLabel, Chip, Avatar, IconButton,
  Divider, LinearProgress, Tooltip
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ShieldIcon from "@mui/icons-material/Shield";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BarChartIcon from "@mui/icons-material/BarChart";
import HistoryIcon from "@mui/icons-material/History";
import BoltIcon from "@mui/icons-material/Bolt";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SecurityIcon from "@mui/icons-material/Security";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const API = "https://fraud-detection-api-5nmq.onrender.com/predict";

const CATEGORIES = [
  { label: "Food & Dining", value: 0 },
  { label: "Gas & Transport", value: 1 },
  { label: "Grocery", value: 2 },
  { label: "Health & Fitness", value: 3 },
  { label: "Home", value: 4 },
  { label: "Kids & Pets", value: 5 },
  { label: "Misc Online", value: 6 },
  { label: "Personal Care", value: 7 },
  { label: "Shopping", value: 8 },
  { label: "Travel", value: 9 },
];

const SAMPLE_LEGIT = { amt: "25.50", category: "2", gender: "0", city_pop: "45000", age: "42", hour: "14", day: "2", month: "6", distance: "2.3", unix_time: "1371816830" };
const SAMPLE_FRAUD = { amt: "1000.00", category: "5", gender: "1", city_pop: "500", age: "35", hour: "23", day: "4", month: "1", distance: "50.5", unix_time: "1325376018" };
const defaultForm = { amt: "", category: "0", gender: "0", city_pop: "", age: "", hour: "", day: "", month: "", distance: "", unix_time: "" };

export default function App() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(false);
  const [stats, setStats] = useState({ total: 0, fraud: 0, legit: 0 });
  const [activeTab, setActiveTab] = useState("analyze");

  const theme = createTheme({
    palette: {
      mode: dark ? "dark" : "light",
      primary: { main: "#2563eb" },
      secondary: { main: "#7c3aed" },
      success: { main: "#16a34a" },
      error: { main: "#dc2626" },
      warning: { main: "#d97706" },
      background: {
        default: dark ? "#0f172a" : "#f8fafc",
        paper: dark ? "#1e293b" : "#ffffff",
      },
    },
    typography: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: dark ? "0 1px 3px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.08)",
            border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 600, borderRadius: 8 }
        }
      }
    }
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const loadSample = (sample) => { setForm(sample); setResult(null); setError(""); };

  const handlePredict = async () => {
    setError(""); setResult(null);
    const transaction = {
      amt: parseFloat(form.amt),
      category: parseInt(form.category),
      gender: parseInt(form.gender),
      city_pop: parseInt(form.city_pop),
      age: parseInt(form.age),
      hour: parseInt(form.hour),
      day: parseInt(form.day),
      month: parseInt(form.month),
      distance: parseFloat(form.distance),
      unix_time: parseInt(form.unix_time),
    };
 if (Object.values(transaction).some(isNaN)) {
  setError("Please fill in all fields correctly."); return;
}
if (transaction.amt <= 0) {
  setError("Transaction amount must be greater than 0."); return;
}
if (transaction.hour < 0 || transaction.hour > 23) {
  setError("Hour must be between 0 and 23."); return;
}
if (transaction.day < 0 || transaction.day > 6) {
  setError("Day must be between 0 (Monday) and 6 (Sunday)."); return;
}
if (transaction.month < 1 || transaction.month > 12) {
  setError("Month must be between 1 and 12."); return;
}
if (transaction.age < 13 || transaction.age > 110) {
  setError("Cardholder age must be between 13 and 110."); return;
}
if (transaction.city_pop < 1 || transaction.city_pop > 40000000) {
  setError("City population must be between 1 and 40,000,000."); return;
}
if (transaction.distance < 0) {
  setError("Distance cannot be negative."); return;
}
if (transaction.unix_time < 0) {
  setError("Unix timestamp cannot be negative."); return;
}
    setLoading(true);
    try {
      const res = await axios.post(API, { transaction });
      const r = { ...res.data, id: Date.now(), time: new Date().toLocaleTimeString(), amt: form.amt };
      setResult(r);
      setHistory(p => [r, ...p.slice(0, 19)]);
      setStats(p => ({ total: p.total + 1, fraud: p.fraud + (r.label === "FRAUD" ? 1 : 0), legit: p.legit + (r.label === "LEGIT" ? 1 : 0) }));
      setForm(defaultForm);
    } catch { setError("API error. Please try again."); }
    setLoading(false);
  };

  const triageColor = (t) => t === "HIGH" ? "#dc2626" : t === "MEDIUM" ? "#d97706" : "#16a34a";
  const areaData = history.slice().reverse().map((h, i) => ({ n: i + 1, p: +(h.fraud_probability * 100).toFixed(2) }));
  const pieData = [{ name: "Legit", value: stats.legit || 1 }, { name: "Fraud", value: stats.fraud || 0 }];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary", transition: "all 0.3s" }}>

        {/* Header */}
        <Box sx={{
  position: "sticky", top: 0, zIndex: 100,
  bgcolor: dark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
  backdropFilter: "blur(12px)",
  borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
  px: { xs: 2, md: 4 }, py: 1.5,
  display: "flex", alignItems: "center", justifyContent: "space-between",
  overflow: "hidden"
}}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38, borderRadius: 2 }}>
              <SecurityIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography fontWeight={700} fontSize={16} letterSpacing={0.5}>FraudShield</Typography>
              <Typography fontSize={10} color="text.secondary">AI-Powered Transaction Security</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip
              size="small"
              label="● Live"
              sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 600, fontSize: 11, border: "1px solid #bbf7d0" }}
            />
            <Tooltip title={dark ? "Light mode" : "Dark mode"}>
              <IconButton onClick={() => setDark(!dark)} size="small">
                {dark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Hero Banner */}
       <Box sx={{
  background: dark
    ? "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)"
    : "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
  px: { xs: 2, md: 6 }, py: { xs: 3, md: 5 },
  overflow: "hidden"
}}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="white" sx={{ fontSize: { xs: 22, md: 30 } }}>
              Fraud Detection System
            </Typography>
            <Typography color="rgba(255,255,255,0.75)" fontSize={13} mt={0.5}>
              SMOTE-Enriched XGBoost · Real-Time Flask API · ROC-AUC 0.9971
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
              {["XGBoost", "SMOTE", "Real-Time", "Flask API"].map(tag => (
                <Chip key={tag} label={tag} size="small"
                  sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", fontSize: 10, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)" }} />
              ))}
            </Box>
          </Box>
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2, flexWrap: "wrap" }}>
  {[
    { label: "ROC-AUC", value: "0.9971", icon: <TrendingUpIcon /> },
    { label: "Recall", value: "87%", icon: <ShieldIcon /> },
    { label: "F1-Score", value: "0.70", icon: <AccountBalanceIcon /> },
  ].map((m, i) => (
              <Box key={i} sx={{ bgcolor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2, px: 2, py: 1.5, textAlign: "center", minWidth: 80 }}>
                <Typography color="white" fontWeight={700} fontSize={18}>{m.value}</Typography>
                <Typography color="rgba(255,255,255,0.7)" fontSize={10}>{m.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: 3 }}>

          {/* Stat Cards */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: { xs: 1, md: 2 }, mb: 3 }}>
            {[
              { label: "Analyzed", value: stats.total, color: "#2563eb", bg: "#eff6ff", icon: <BarChartIcon /> },
              { label: "Flagged", value: stats.fraud, color: "#dc2626", bg: "#fef2f2", icon: <WarningAmberIcon /> },
              { label: "Cleared", value: stats.legit, color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircleIcon /> },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card>
                  <CardContent sx={{ py: "12px !important", px: { xs: "10px !important", md: "16px !important" } }}>
  <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.8, md: 1.5 }, flexWrap: "wrap" }}>
    <Avatar sx={{ bgcolor: dark ? `${s.color}22` : s.bg, color: s.color, width: { xs: 28, md: 36 }, height: { xs: 28, md: 36 }, borderRadius: 2, display: { xs: "none", md: "flex" } }}>
      {s.icon}
    </Avatar>
    <Box>
      <Typography fontWeight={700} fontSize={{ xs: 16, md: 20 }}>{s.value}</Typography>
      <Typography fontSize={{ xs: 10, md: 11 }} color="text.secondary" noWrap>{s.label}</Typography>
    </Box>
  </Box>
</CardContent>
                </Card>
              </motion.div>
            ))}
          </Box>

          {/* Tabs */}
          <Box sx={{ display: "flex", gap: 1, mb: 3, bgcolor: "background.paper", borderRadius: 2, p: 0.5, border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
            {[
              { id: "analyze", label: "Analyze", icon: <BoltIcon fontSize="small" /> },
              { id: "history", label: "History", icon: <HistoryIcon fontSize="small" /> },
              { id: "charts", label: "Charts", icon: <BarChartIcon fontSize="small" /> },
            ].map(tab => (
              <Button key={tab.id} onClick={() => setActiveTab(tab.id)} startIcon={tab.icon} fullWidth
                variant={activeTab === tab.id ? "contained" : "text"}
                color={activeTab === tab.id ? "primary" : "inherit"}
                sx={{ py: 1, fontSize: 12, color: activeTab === tab.id ? "white" : "text.secondary" }}>
                {tab.label}
              </Button>
            ))}
          </Box>

          {/* Analyze Tab */}
          {activeTab === "analyze" && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>

              {/* Form */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                      <AccountBalanceIcon color="primary" fontSize="small" />
                      <Typography fontWeight={700} fontSize={14}>Transaction Details</Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1.5, mb: 2.5 }}>
                      <Button fullWidth variant="outlined" color="success" size="small"
                        onClick={() => loadSample(SAMPLE_LEGIT)}
                        sx={{ borderRadius: 2, fontSize: 11, py: 1 }}>
                        ✓ Legit Sample
                      </Button>
                      <Button fullWidth variant="outlined" color="error" size="small"
                        onClick={() => loadSample(SAMPLE_FRAUD)}
                        sx={{ borderRadius: 2, fontSize: 11, py: 1 }}>
                        ⚠ Fraud Sample
                      </Button>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      <TextField fullWidth label="Amount (₦)" name="amt" value={form.amt}
                        onChange={handleChange} size="small" type="number" placeholder="e.g. 250.00"
                        sx={{ gridColumn: "1 / -1" }} />

                      <FormControl fullWidth size="small">
                        <InputLabel>Category</InputLabel>
                        <Select name="category" value={form.category} onChange={handleChange} label="Category">
                          {CATEGORIES.map(c => <MenuItem key={c.value} value={String(c.value)}>{c.label}</MenuItem>)}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth size="small">
                        <InputLabel>Gender</InputLabel>
                        <Select name="gender" value={form.gender} onChange={handleChange} label="Gender">
                          <MenuItem value="0">Female</MenuItem>
                          <MenuItem value="1">Male</MenuItem>
                          <MenuItem value="2">Other</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField fullWidth label="City Population" name="city_pop" value={form.city_pop} onChange={handleChange} size="small" type="number" placeholder="e.g. 45000" />
                      <TextField fullWidth label="Cardholder Age" name="age" value={form.age} onChange={handleChange} size="small" type="number" placeholder="e.g. 35" />
                      <TextField fullWidth label="Hour (0-23)" name="hour" value={form.hour} onChange={handleChange} size="small" type="number" placeholder="e.g. 23" />
                      <TextField fullWidth label="Day (0=Mon, 6=Sun)" name="day" value={form.day} onChange={handleChange} size="small" type="number" placeholder="e.g. 4" />
                      <TextField fullWidth label="Month (1-12)" name="month" value={form.month} onChange={handleChange} size="small" type="number" placeholder="e.g. 1" />
                      <TextField fullWidth label="Distance (km)" name="distance" value={form.distance} onChange={handleChange} size="small" type="number" placeholder="e.g. 50.5" />
                      <TextField fullWidth label="Unix Timestamp" name="unix_time" value={form.unix_time} onChange={handleChange} size="small" type="number" placeholder="e.g. 1325376018" sx={{ gridColumn: "1 / -1" }} />
                    </Box>

                    {error && (
                      <Typography color="error" fontSize={12} mt={1.5}>{error}</Typography>
                    )}

                    <Button fullWidth variant="contained" color="primary" size="large"
                      onClick={handlePredict} disabled={loading}
                      startIcon={loading ? null : <ShieldIcon />}
                      sx={{ mt: 2.5, py: 1.4, fontSize: 13, fontWeight: 700, borderRadius: 2 }}>
                      {loading ? "Analyzing Transaction..." : "Analyze Transaction"}
                    </Button>
                    {loading && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Result */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <CardContent sx={{ p: 3 }}>
                    <AnimatePresence mode="wait">
                      {!result && !loading && (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <Box sx={{ textAlign: "center", py: 6 }}>
                            <Avatar sx={{ width: 64, height: 64, bgcolor: dark ? "rgba(37,99,235,0.1)" : "#eff6ff", mx: "auto", mb: 2 }}>
                              <ShieldIcon sx={{ color: "primary.main", fontSize: 32, opacity: 0.4 }} />
                            </Avatar>
                            <Typography color="text.secondary" fontSize={13}>Awaiting transaction</Typography>
                            <Typography color="text.secondary" fontSize={12} mt={0.5}>Fill the form or load a sample to begin</Typography>
                          </Box>
                        </motion.div>
                      )}

                      {result && !loading && (
                        <motion.div key="result" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                          <Box sx={{ textAlign: "center" }}>

                            {/* Icon */}
                            <Avatar sx={{
  width: 72, height: 72, mx: "auto", mb: 2,
  bgcolor: result.triage === "HIGH" ? "#fef2f2" : result.triage === "MEDIUM" ? "#fffbeb" : "#f0fdf4",
  border: `2px solid ${result.triage === "HIGH" ? "#fecaca" : result.triage === "MEDIUM" ? "#fde68a" : "#bbf7d0"}`
}}>
                              {result.triage === "HIGH"
  ? <WarningAmberIcon sx={{ color: "#dc2626", fontSize: 36 }} />
  : result.triage === "MEDIUM"
  ? <WarningAmberIcon sx={{ color: "#d97706", fontSize: 36 }} />
  : <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 36 }} />}
                            </Avatar>

                            <Typography fontWeight={800} fontSize={28} color={result.label === "FRAUD" ? "error.main" : "success.main"}>
                              {result.label}
                            </Typography>

                            <Typography color="text.secondary" fontSize={12} mt={0.5} mb={2}>
                              Fraud Probability: <strong>{(result.fraud_probability * 100).toFixed(2)}%</strong>
                            </Typography>

                            {/* Progress Bar */}
                            <Box sx={{ mb: 2 }}>
                              <LinearProgress variant="determinate" value={result.fraud_probability * 100}
                                sx={{
                                  height: 8, borderRadius: 4,
                                  bgcolor: dark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                                  "& .MuiLinearProgress-bar": {
                                    bgcolor: result.fraud_probability > 0.7 ? "#dc2626" : result.fraud_probability > 0.3 ? "#d97706" : "#16a34a",
                                    borderRadius: 4
                                  }
                                }} />
                            </Box>

                            {/* Triage Badge */}
                            <Chip label={`Triage: ${result.triage}`} size="small"
                              sx={{
                                mb: 2, fontWeight: 700, fontSize: 11,
                                bgcolor: result.triage === "HIGH" ? "#fef2f2" : result.triage === "MEDIUM" ? "#fffbeb" : "#f0fdf4",
                                color: triageColor(result.triage),
                                border: `1px solid ${result.triage === "HIGH" ? "#fecaca" : result.triage === "MEDIUM" ? "#fde68a" : "#bbf7d0"}`
                              }} />

                            <Divider sx={{ my: 2 }} />

                            {/* Verdict Box */}
                            <Box sx={{
                              bgcolor: result.label === "FRAUD" ? (dark ? "rgba(220,38,38,0.1)" : "#fef2f2") : (dark ? "rgba(22,163,74,0.1)" : "#f0fdf4"),
                              border: `1px solid ${result.label === "FRAUD" ? "#fecaca" : "#bbf7d0"}`,
                              borderRadius: 2, p: 2
                            }}>
                              <Typography fontSize={12} color={result.label === "FRAUD" ? "error.main" : "success.main"} fontWeight={500}>
                                {result.triage === "HIGH" ? "⚠ High risk detected. Block transaction and alert analyst immediately." :
                                  result.triage === "MEDIUM" ? "⚡ Medium risk. Flag for secondary verification (OTP required)." :
                                    "✔ Low risk. Transaction cleared. Safe to process."}
                              </Typography>
                            </Box>
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ px: 3, py: 2, borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 1 }}>
                    <HistoryIcon color="primary" fontSize="small" />
                    <Typography fontWeight={700} fontSize={14}>Transaction Log</Typography>
                    <Chip label={`${history.length} records`} size="small" sx={{ ml: "auto", fontSize: 10 }} />
                  </Box>
                  {history.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
                      <Typography fontSize={13}>No transactions analyzed yet</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc" }}>
                            {["#", "Time", "Amount", "Verdict", "Risk %", "Triage", "Status"].map(h => (
                              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.05em" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((h, i) => (
                            <tr key={h.id} style={{ borderTop: dark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #f1f5f9" }}>
                              <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{String(i + 1).padStart(2, "0")}</td>
                              <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{h.time}</td>
                              <td style={{ padding: "12px 16px", fontWeight: 600 }}>₦{parseFloat(h.amt).toFixed(2)}</td>
                              <td style={{ padding: "12px 16px", fontWeight: 700, color: h.label === "FRAUD" ? "#dc2626" : "#16a34a" }}>{h.label}</td>
                              <td style={{ padding: "12px 16px" }}>{(h.fraud_probability * 100).toFixed(2)}%</td>
                              <td style={{ padding: "12px 16px" }}>
                                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: h.triage === "HIGH" ? "#fef2f2" : h.triage === "MEDIUM" ? "#fffbeb" : "#f0fdf4", color: triageColor(h.triage) }}>
                                  {h.triage}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: h.label === "FRAUD" ? "#fef2f2" : "#f0fdf4", color: h.label === "FRAUD" ? "#dc2626" : "#16a34a" }}>
                                  {h.label === "FRAUD" ? "Flagged" : "Cleared"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Charts Tab */}
          {activeTab === "charts" && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography fontWeight={700} fontSize={13} mb={2}>Risk Probability Trend</Typography>
                    {areaData.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}><Typography fontSize={12}>No data yet</Typography></Box>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={areaData}>
                          <defs>
                            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="n" fontSize={10} tickLine={false} />
                          <YAxis fontSize={10} tickLine={false} />
                          <RTooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                          <Area type="monotone" dataKey="p" stroke="#2563eb" fill="url(#g1)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography fontWeight={700} fontSize={13} mb={2}>Detection Breakdown</Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                          <Cell fill="#16a34a" />
                          <Cell fill="#dc2626" />
                        </Pie>
                        <RTooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mt: 1 }}>
                      {[{ l: "Legit", c: "#16a34a" }, { l: "Fraud", c: "#dc2626" }].map(x => (
                        <Box key={x.l} sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: x.c }} />
                          <Typography fontSize={11} color="text.secondary">{x.l}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ gridColumn: "1 / -1" }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography fontWeight={700} fontSize={13} mb={2.5}>Model Performance Metrics</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 2 }}>
                      {[
                        { label: "ROC-AUC", value: "0.9971", color: "#2563eb" },
                        { label: "Recall", value: "87%", color: "#16a34a" },
                        { label: "F1-Score", value: "0.70", color: "#d97706" },
                        { label: "Precision", value: "58%", color: "#7c3aed" },
                        { label: "Algorithm", value: "XGBoost", color: "#2563eb" },
                        { label: "Balancing", value: "SMOTE", color: "#16a34a" },
                      ].map((m, i) => (
                        <Box key={i} sx={{ bgcolor: dark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0", borderRadius: 2, p: 2 }}>
                          <Typography fontWeight={700} fontSize={18} color={m.color}>{m.value}</Typography>
                          <Typography fontSize={11} color="text.secondary" mt={0.5}>{m.label}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: "center", py: 3, borderTop: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0", mt: 4 }}>
          <Typography fontSize={12} color="text.secondary">
            FraudShield · Built with XGBoost + SMOTE + Flask · Bowen University 2026
          </Typography>
        </Box>
      </Box>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
      `}</style>
    </ThemeProvider>
  );
}