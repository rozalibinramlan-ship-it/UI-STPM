:root {
  --bg: #f0f5f1;
  --bg-2: #e8efe9;
  --panel: #ffffff;
  --panel-2: #f7faf8;
  --border: #d4e0d6;
  --border-soft: #e3ebe4;
  --text: #1f2d24;
  --text-mid: #4a5c50;
  --text-dim: #7a8c80;
  --accent: #4a8f5e;
  --accent-2: #5ea672;
  --accent-soft: #d9ecdf;
  --accent-glow: rgba(74, 143, 94, 0.12);
  --green: #3d8b52;
  --green-soft: #e3f2e7;
  --red: #c9584b;
  --red-soft: #fae7e4;
  --yellow: #c89b3c;
  --yellow-soft: #faf1dc;
  --radius: 14px;
  --radius-sm: 10px;
  --shadow: 0 1px 3px rgba(31, 45, 36, 0.04), 0 4px 12px rgba(31, 45, 36, 0.04);
  --shadow-hover: 0 2px 6px rgba(31, 45, 36, 0.06), 0 8px 24px rgba(31, 45, 36, 0.06);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

button { font-family: inherit; cursor: pointer; }
input, textarea, select { font-family: inherit; }

/* ===== HEADER ===== */
header {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-soft);
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.2px;
  display: flex;
  align-items: center;
  gap: 11px;
  cursor: pointer;
  color: var(--text);
}
.brand-mark {
  width: 30px; height: 30px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #ffffff;
  box-shadow: 0 2px 6px var(--accent-glow);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.85rem;
  color: var(--text-dim);
}

/* ===== CONTAINER ===== */
.container {
  max-width: 920px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

/* ===== HERO ===== */
.hero { text-align: center; margin-bottom: 40px; }
.hero h1 {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.8px;
  margin-bottom: 10px;
  color: var(--text);
}
.hero p {
  color: var(--text-dim);
  font-size: 0.95rem;
  font-weight: 400;
}

/* ===== SUBJECT GRID ===== */
.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}
.subject-card {
  background: var(--panel);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  padding: 24px 22px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
}
.subject-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  opacity: 0;
  transition: opacity 0.25s;
}
.subject-card:hover {
  border-color: var(--accent);
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}
.subject-card:hover::before { opacity: 1; }
.subject-card .s-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: var(--accent-soft);
  display: grid;
  place-items: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 16px;
  border: 1px solid rgba(74, 143, 94, 0.15);
}
.subject-card h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 5px;
  color: var(--text);
  letter-spacing: -0.2px;
}
.subject-card p {
  font-size: 0.8rem;
  color: var(--text-dim);
  font-weight: 400;
}

/* ===== PANEL ===== */
.panel {
  background: var(--panel);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  padding: 26px;
  margin-bottom: 18px;
  box-shadow: var(--shadow);
}
.panel h2 {
  font-size: 1.08rem;
  font-weight: 600;
  margin-bottom: 5px;
  color: var(--text);
  letter-spacing: -0.2px;
}
.panel .sub-text {
  font-size: 0.85rem;
  color: var(--text-dim);
  margin-bottom: 20px;
  font-weight: 400;
}

/* ===== TABS ===== */
.tabs {
  display: flex;
  gap: 6px;
  background: var(--panel);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  padding: 5px;
  margin-bottom: 22px;
  box-shadow: var(--shadow);
}
.tab {
  flex: 1;
  padding: 11px 16px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 0.88rem;
  font-weight: 500;
  transition: all 0.2s;
  text-align: center;
  letter-spacing: -0.1px;
}
.tab:hover { color: var(--text-mid); background: var(--panel-2); }
.tab.active {
  background: var(--accent);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 2px 6px var(--accent-glow);
}

/* ===== BUTTONS ===== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text-mid);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  letter-spacing: -0.1px;
}
.btn:hover:not(:disabled) {
  background: var(--panel-2);
  border-color: var(--accent);
  color: var(--accent);
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 2px 8px var(--accent-glow);
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-2);
  border-color: var(--accent-2);
  color: #ffffff;
  box-shadow: 0 4px 12px var(--accent-glow);
}
.btn-success {
  background: var(--green);
  border-color: var(--green);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(61, 139, 82, 0.15);
}
.btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
.btn-row.between { justify-content: space-between; }

/* ===== MODE CARDS ===== */
.mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 22px;
}
.mode-card {
  background: var(--panel);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  padding: 24px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  box-shadow: var(--shadow);
}
.mode-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}
.mode-card h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 7px;
  color: var(--text);
  letter-spacing: -0.2px;
}
.mode-card p {
  font-size: 0.83rem;
  color: var(--text-dim);
  line-height: 1.55;
  font-weight: 400;
}

/* ===== QUESTION ===== */
.q-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  font-size: 0.85rem;
  color: var(--text-dim);
  font-weight: 500;
}
.q-header strong { color: var(--text); font-weight: 600; }
.q-progress {
  height: 5px;
  background: var(--border-soft);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 22px;
}
.q-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 3px;
}
.q-text {
  font-size: 1.03rem;
  line-height: 1.65;
  margin-bottom: 22px;
  color: var(--text);
  font-weight: 500;
}

/* ===== OPTIONS ===== */
.option {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 15px 17px;
  background: var(--panel-2);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.18s;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--text-mid);
}
.option:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.option.selected {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--text);
}
.option.correct {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--text);
}
.option.wrong {
  border-color: var(--red);
  background: var(--red-soft);
  color: var(--text);
}
.option-letter {
  flex-shrink: 0;
  width: 28px; height: 28px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-dim);
  transition: all 0.18s;
}
.option.selected .option-letter {
  background: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
}
.option.correct .option-letter {
  background: var(--green);
  border-color: var(--green);
  color: #ffffff;
}
.option.wrong .option-letter {
  background: var(--red);
  border-color: var(--red);
  color: #ffffff;
}

/* ===== EXPLANATION ===== */
.explanation {
  margin-top: 18px;
  padding: 20px;
  background: var(--accent-soft);
  border: 1px solid rgba(74, 143, 94, 0.2);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  line-height: 1.75;
  white-space: pre-wrap;
  color: var(--text-mid);
  animation: fadeIn 0.35s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== TEXTBOOK ===== */
.textbook-content {
  font-size: 0.93rem;
  line-height: 1.8;
  white-space: pre-wrap;
  font-family: Georgia, "Times New Roman", serif;
  color: var(--text-mid);
}

/* ===== TIMER ===== */
.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 15px;
  background: var(--panel);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--text);
  box-shadow: var(--shadow);
}
.timer.warning {
  border-color: var(--yellow);
  color: var(--yellow);
  background: var(--yellow-soft);
}
.timer.danger {
  border-color: var(--red);
  color: var(--red);
  background: var(--red-soft);
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}

/* ===== LOADER ===== */
.loader {
  display: inline-block;
  width: 15px; height: 15px;
  border: 2px solid var(--accent);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
  padding: 50px 20px;
  color: var(--text-dim);
  font-size: 0.9rem;
  font-weight: 500;
}

/* ===== STATS ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}
.stat-box {
  background: var(--panel);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  padding: 20px;
  box-shadow: var(--shadow);
}
.stat-box .label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-dim);
  margin-bottom: 8px;
  font-weight: 600;
}
.stat-box .value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;
}
.stat-box .value.green { color: var(--green); }
.stat-box .value.red { color: var(--red); }

/* ===== RESULT ===== */
.result-score { text-align: center; padding: 36px 20px; }
.result-score .big {
  font-size: 3.8rem;
  font-weight: 800;
  letter-spacing: -2px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 10px;
}
.result-score .grade {
  font-size: 1rem;
  color: var(--text-dim);
  margin-bottom: 24px;
  font-weight: 500;
}

/* ===== ALERT ===== */
.alert {
  padding: 14px 18px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  margin-bottom: 18px;
  border: 1px solid;
  font-weight: 500;
}
.alert.error {
  background: var(--red-soft);
  border-color: rgba(201, 88, 75, 0.3);
  color: var(--red);
}
.alert.info {
  background: var(--accent-soft);
  border-color: rgba(74, 143, 94, 0.3);
  color: var(--accent);
}

.hidden { display: none !important; }

/* ===== MOBILE ===== */
@media (max-width: 600px) {
  header { padding: 14px 16px; }
  .container { padding: 24px 16px 50px; }
  .hero h1 { font-size: 1.55rem; }
  .mode-grid { grid-template-columns: 1fr; }
  .subject-grid { grid-template-columns: 1fr; }
  .header-right { font-size: 0.78rem; gap: 8px; }
  .panel { padding: 20px 18px; }
  .stat-box .value { font-size: 1.3rem; }
  .result-score .big { font-size: 2.8rem; }
}