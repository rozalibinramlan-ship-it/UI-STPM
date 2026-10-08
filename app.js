/* ============================================================
   STPM PRO — APP LOGIC
   ============================================================ */

const SUBJECTS = [
  { id: "physics",   name: "Physics",                icon: "⚛" },
  { id: "biology",   name: "Biology",                icon: "🧬" },
  { id: "addmaths",  name: "Additional Mathematics", icon: "∑" },
  { id: "mgmtmaths", name: "Management Mathematics", icon: "📊" },
  { id: "chemistry", name: "Chemistry",              icon: "⚗" }
];

const SEMESTERS = ["Semester 1", "Semester 2", "Semester 3"];
const TOTAL_QUESTIONS = 100;
const EXAM_DURATION = 90 * 60;

let state = {
  view: "home",
  subject: null,
  semester: "Semester 1",
  mode: "practice",
  questions: [],
  currentIndex: 0,
  answers: {},
  flagged: {},
  revealed: {},
  explanations: {},
  batchNumber: 1,
  loading: false,
  error: null,
  timer: EXAM_DURATION,
  timerInterval: null,
  textbookContent: null,
  _recorded: {}
};

const STORAGE_KEY = "stpm_pro_v1";
const STATS_KEY = "stpm_pro_stats_v1";

function saveProgress() {
  const save = {
    subject: state.subject,
    semester: state.semester,
    mode: state.mode,
    questions: state.questions,
    currentIndex: state.currentIndex,
    answers: state.answers,
    flagged: state.flagged,
    revealed: state.revealed,
    explanations: state.explanations,
    batchNumber: state.batchNumber,
    savedAt: Date.now()
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); } catch (e) {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

function getStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; }
  catch { return {}; }
}

function recordAnswer(subjectId, isCorrect) {
  const stats = getStats();
  if (!stats[subjectId]) stats[subjectId] = { correct: 0, total: 0 };
  stats[subjectId].total++;
  if (isCorrect) stats[subjectId].correct++;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ===== NAVIGATION ===== */
function goHome() {
  stopTimer();
  state.view = "home";
  state.subject = null;
  state.questions = [];
  state.currentIndex = 0;
  state.answers = {};
  state.flagged = {};
  state.revealed = {};
  state.explanations = {};
  state.textbookContent = null;
  state.error = null;
  state._recorded = {};
  render();
}

function selectSubject(subjectId) {
  state.subject = SUBJECTS.find(s => s.id === subjectId);
  state.view = "subject";
  state.questions = [];
  state.currentIndex = 0;
  state.answers = {};
  state.flagged = {};
  state.revealed = {};
  state.explanations = {};
  state.textbookContent = null;
  state.batchNumber = 1;
  state.error = null;
  state._recorded = {};
  render();
}

function setSemester(sem) {
  state.semester = sem;
  state.textbookContent = null;
  render();
}

function selectMode(mode) {
  state.mode = mode;
  state.view = mode === "exam" ? "exam" : "practice";
  state.questions = [];
  state.currentIndex = 0;
  state.answers = {};
  state.flagged = {};
  state.revealed = {};
  state.explanations = {};
  state.batchNumber = 1;
  state.error = null;
  state._recorded = {};
  render();
  loadQuestions();
  if (mode === "exam") startTimer();
}

function switchTab(tab) {
  if (tab === "textbook") {
    state.view = "textbook";
    render();
    if (!state.textbookContent && !state.loading) loadTextbook();
  } else {
    state.view = "subject";
    render();
  }
}

function resumeSession() {
  const saved = loadProgress();
  if (!saved) return;
  const subj = SUBJECTS.find(s => s.id === saved.subject);
  if (!subj) return;

  state.subject = subj;
  state.semester = saved.semester || "Semester 1";
  state.mode = saved.mode || "practice";
  state.questions = saved.questions || [];
  state.currentIndex = saved.currentIndex || 0;
  state.answers = saved.answers || {};
  state.flagged = saved.flagged || {};
  state.revealed = saved.revealed || {};
  state.explanations = saved.explanations || {};
  state.batchNumber = saved.batchNumber || 1;
  state.view = state.mode === "exam" ? "exam" : "practice";
  state.error = null;
  state._recorded = {};
  render();
  if (state.mode === "exam") startTimer();
}

function discardSession() {
  clearProgress();
  goHome();
}

/* ===== API ===== */
async function loadQuestions() {
  state.loading = true;
  state.error = null;
  render();

  try {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: state.subject.id,
        semester: state.semester,
        batchNumber: state.batchNumber
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (!data.questions || !data.questions.length) throw new Error("No questions received.");

    const startIdx = state.questions.length;
    const newQs = data.questions.map((q, i) => ({ ...q, id: startIdx + i + 1 }));
    state.questions = [...state.questions, ...newQs];
    state.loading = false;
    saveProgress();
    render();
  } catch (err) {
    state.loading = false;
    state.error = err.message || "Failed to load questions. Please wait a moment and try again.";
    render();
  }
}

async function loadExplanation(qIndex) {
  if (state.explanations[qIndex]) return;
  state.loading = true;
  render();

  try {
    const q = state.questions[qIndex];
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: state.subject.id,
        question: q.question,
        options: q.options,
        answer: q.answer
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    state.explanations[qIndex] = data.explanation;
    saveProgress();
  } catch (err) {
    state.explanations[qIndex] = "Error: " + (err.message || "Failed to load explanation.");
  } finally {
    state.loading = false;
    render();
  }
}

async function loadTextbook() {
  state.loading = true;
  state.error = null;
  render();

  try {
    const res = await fetch("/api/textbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: state.subject.id,
        semester: state.semester
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    state.textbookContent = data.notes;
  } catch (err) {
    state.error = err.message || "Failed to load textbook. Please wait a moment and try again.";
  } finally {
    state.loading = false;
    render();
  }
}

/* ===== ANSWER ===== */
function selectAnswer(letter) {
  const i = state.currentIndex;
  const q = state.questions[i];
  if (!q) return;
  if (state.mode === "exam" && state.answers[i]) return;
  if (state.mode === "practice" && state.revealed[i]) return;

  state.answers[i] = letter;

  if (!state._recorded[i]) {
    state._recorded[i] = true;
    recordAnswer(state.subject.id, letter === q.answer);
  }
  saveProgress();
  render();
}

function revealAnswer() {
  state.revealed[state.currentIndex] = true;
  saveProgress();
  render();
}

function toggleFlag() {
  const i = state.currentIndex;
  state.flagged[i] = !state.flagged[i];
  saveProgress();
  render();
}

function nextQuestion() {
  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex++;
    saveProgress();
    render();
    if (
      state.mode === "practice" &&
      state.currentIndex >= state.questions.length - 2 &&
      state.questions.length < TOTAL_QUESTIONS &&
      !state.loading
    ) {
      state.batchNumber++;
      loadQuestions();
    }
  }
}

function prevQuestion() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    saveProgress();
    render();
  }
}

/* ===== TIMER ===== */
function startTimer() {
  stopTimer();
  state.timer = EXAM_DURATION;
  state.timerInterval = setInterval(() => {
    state.timer--;
    if (state.timer <= 0) {
      stopTimer();
      finishExam();
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function updateTimerDisplay() {
  const el = document.getElementById("timerDisplay");
  if (!el) return;
  el.textContent = formatTime(state.timer);
  const wrap = el.closest(".timer");
  if (wrap) {
    wrap.classList.remove("warning", "danger");
    if (state.timer <= 60) wrap.classList.add("danger");
    else if (state.timer <= 300) wrap.classList.add("warning");
  }
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function finishExam() {
  stopTimer();
  state.view = "result";
  render();
}

/* ===== RENDER ===== */
function render() {
  const app = document.getElementById("app");
  const headerRight = document.getElementById("headerRight");

  if (state.view === "exam" && state.timerInterval) {
    headerRight.innerHTML = `<div class="timer"><span id="timerDisplay">${formatTime(state.timer)}</span></div>`;
  } else {
    headerRight.innerHTML = "";
  }

  if (state.view === "home") app.innerHTML = renderHome();
  else if (state.view === "subject") app.innerHTML = renderSubject();
  else if (state.view === "practice") app.innerHTML = renderPractice();
  else if (state.view === "exam") app.innerHTML = renderExam();
  else if (state.view === "textbook") app.innerHTML = renderTextbook();
  else if (state.view === "result") app.innerHTML = renderResult();
  else if (state.view === "stats") app.innerHTML = renderStats();
}

function renderHome() {
  const stats = getStats();
  const saved = loadProgress();
  let resumeBanner = "";

  if (saved && saved.subject && saved.questions && saved.questions.length > 0) {
    const subj = SUBJECTS.find(s => s.id === saved.subject);
    if (subj) {
      resumeBanner = `
        <div class="panel" style="border-color: var(--accent); background: var(--accent-soft);">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
            <div>
              <h2>Resume Session</h2>
              <p class="sub-text" style="margin:0;">
                ${subj.name} · ${saved.mode === "exam" ? "Exam Mode" : "Practice Mode"} · Question ${saved.currentIndex + 1} of ${saved.questions.length}
              </p>
            </div>
            <div class="btn-row">
              <button class="btn btn-primary" onclick="resumeSession()">Resume</button>
              <button class="btn" onclick="discardSession()">Discard</button>
            </div>
          </div>
        </div>
      `;
    }
  }

  return `
    <div class="hero">
      <h1>STPM Pro</h1>
      <p>Exam preparation platform · 5 subjects · AI-powered</p>
    </div>
    ${resumeBanner}
    <div class="panel" style="margin-bottom:22px;">
      <div class="btn-row between" style="align-items:center;">
        <div>
          <h2>Your Progress</h2>
          <p class="sub-text" style="margin:0;">Track your performance across subjects</p>
        </div>
        <button class="btn" onclick="state.view='stats'; render();">View Stats</button>
      </div>
    </div>
    <div class="subject-grid">
      ${SUBJECTS.map(s => {
        const st = stats[s.id];
        const pct = st && st.total > 0 ? Math.round((st.correct / st.total) * 100) : null;
        return `
          <div class="subject-card" onclick="selectSubject('${s.id}')">
            <div class="s-icon">${s.icon}</div>
            <h3>${s.name}</h3>
            <p>${pct !== null ? `${pct}% accuracy · ${st.total} attempted` : "Not started"}</p>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderSubject() {
  const subj = state.subject;
  const stats = getStats()[subj.id];

  return `
    <div class="hero" style="text-align:left; margin-bottom:22px;">
      <h1 style="font-size:1.55rem;">${subj.name}</h1>
      <p>${stats && stats.total > 0 ? `Accuracy: ${Math.round((stats.correct/stats.total)*100)}% (${stats.correct}/${stats.total})` : "No attempts yet"}</p>
    </div>

    <div class="panel">
      <h2>Select Semester</h2>
      <p class="sub-text">Choose the semester you want to focus on</p>
      <div class="btn-row">
        ${SEMESTERS.map(sem => `
          <button class="btn ${state.semester === sem ? 'btn-primary' : ''}" onclick="setSemester('${sem}')">
            ${sem}
          </button>
        `).join("")}
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="switchTab('practice')">Practice & Exam</button>
      <button class="tab" onclick="switchTab('textbook')">Textbook</button>
    </div>

    <div class="mode-grid">
      <div class="mode-card" onclick="selectMode('practice')">
        <h3>Practice Mode</h3>
        <p>100 questions · Instant feedback · Explanations · No time limit</p>
      </div>
      <div class="mode-card" onclick="selectMode('exam')">
        <h3>Exam Mode</h3>
        <p>100 questions · 90 minute timer · No feedback until submission</p>
      </div>
    </div>
  `;
}

function renderPractice() {
  if (state.loading && state.questions.length === 0) {
    return `<div class="loading-box"><div class="loader"></div> Generating questions...</div>`;
  }
  if (state.error) {
    return `
      <div class="alert error">${escapeHtml(state.error)}</div>
      <button class="btn btn-primary" onclick="loadQuestions()">Retry</button>
    `;
  }
  if (state.questions.length === 0) {
    return `<div class="loading-box"><div class="loader"></div> Loading...</div>`;
  }

  const i = state.currentIndex;
  const q = state.questions[i];
  const revealed = state.revealed[i];
  const flagged = state.flagged[i];
  const total = Math.max(TOTAL_QUESTIONS, state.questions.length);
  const progressPct = ((i + 1) / total) * 100;
  const explanation = state.explanations[i];

  return `
    <div class="q-header">
      <span>Question <strong>${i + 1}</strong> of ${total}</span>
      <button class="btn" style="padding:6px 13px; font-size:0.8rem;" onclick="toggleFlag()">
        ${flagged ? "★ Flagged" : "☆ Flag"}
      </button>
    </div>
    <div class="q-progress"><div class="q-progress-fill" style="width:${progressPct}%"></div></div>

    <div class="panel">
      <div class="q-text">${escapeHtml(q.question)}</div>
      ${Object.entries(q.options).map(([letter, text]) => {
        let cls = "option";
        if (revealed) {
          if (letter === q.answer) cls += " correct";
          else if (state.answers[i] === letter) cls += " wrong";
        } else if (state.answers[i] === letter) {
          cls += " selected";
        }
        return `
          <div class="${cls}" onclick="selectAnswer('${letter}')">
            <div class="option-letter">${letter}</div>
            <div>${escapeHtml(text)}</div>
          </div>
        `;
      }).join("")}

      ${!revealed ? `
        <div class="btn-row" style="margin-top:18px;">
          <button class="btn btn-primary" onclick="revealAnswer()" ${!state.answers[i] ? 'disabled' : ''}>Show Answer</button>
        </div>
      ` : `
        <div class="btn-row" style="margin-top:18px;">
          <button class="btn btn-primary" onclick="loadExplanation(${i})">${explanation ? "Refresh Explanation" : "Explain"}</button>
        </div>
      `}

      ${explanation ? `<div class="explanation">${escapeHtml(explanation)}</div>` : ""}
      ${revealed && state.loading && !explanation ? `<div class="loading-box"><div class="loader"></div> Loading explanation...</div>` : ""}
    </div>

    <div class="btn-row between">
      <button class="btn" onclick="prevQuestion()" ${i === 0 ? "disabled" : ""}>← Previous</button>
      <button class="btn btn-primary" onclick="nextQuestion()" ${i >= state.questions.length - 1 && state.questions.length >= TOTAL_QUESTIONS ? "disabled" : ""}>Next →</button>
    </div>
  `;
}

function renderExam() {
  if (state.loading && state.questions.length === 0) {
    return `<div class="loading-box"><div class="loader"></div> Generating exam questions...</div>`;
  }
  if (state.error) {
    return `
      <div class="alert error">${escapeHtml(state.error)}</div>
      <button class="btn btn-primary" onclick="loadQuestions()">Retry</button>
    `;
  }
  if (state.questions.length === 0) {
    return `<div class="loading-box"><div class="loader"></div> Loading...</div>`;
  }

  const i = state.currentIndex;
  const q = state.questions[i];
  const flagged = state.flagged[i];
  const answered = Object.keys(state.answers).length;
  const total = state.questions.length;
  const progressPct = ((i + 1) / total) * 100;

  return `
    <div class="q-header">
      <span>Question <strong>${i + 1}</strong> of ${total} · Answered: ${answered}</span>
      <button class="btn" style="padding:6px 13px; font-size:0.8rem;" onclick="toggleFlag()">
        ${flagged ? "★ Flagged" : "☆ Flag"}
      </button>
    </div>
    <div class="q-progress"><div class="q-progress-fill" style="width:${progressPct}%"></div></div>

    <div class="panel">
      <div class="q-text">${escapeHtml(q.question)}</div>
      ${Object.entries(q.options).map(([letter, text]) => {
        let cls = "option";
        if (state.answers[i] === letter) cls += " selected";
        return `
          <div class="${cls}" onclick="selectAnswer('${letter}')">
            <div class="option-letter">${letter}</div>
            <div>${escapeHtml(text)}</div>
          </div>
        `;
      }).join("")}
    </div>

    <div class="btn-row between">
      <button class="btn" onclick="prevQuestion()" ${i === 0 ? "disabled" : ""}>← Previous</button>
      <button class="btn btn-primary" onclick="nextQuestion()" ${i >= total - 1 ? "disabled" : ""}>Next →</button>
    </div>

    <div style="margin-top:22px; text-align:center;">
      <button class="btn btn-success" onclick="finishExam()">Submit Exam</button>
    </div>
  `;
}

function renderTextbook() {
  if (state.loading && !state.textbookContent) {
    return `<div class="loading-box"><div class="loader"></div> Generating textbook notes...</div>`;
  }
  if (state.error) {
    return `
      <div class="alert error">${escapeHtml(state.error)}</div>
      <button class="btn btn-primary" onclick="loadTextbook()">Retry</button>
    `;
  }
  if (!state.textbookContent) {
    return `<div class="loading-box"><div class="loader"></div> Loading...</div>`;
  }

  return `
    <div class="panel">
      <div class="textbook-content">${escapeHtml(state.textbookContent)}</div>
    </div>
    <button class="btn" onclick="switchTab('practice')">← Back to Practice</button>
  `;
}

function renderResult() {
  const total = state.questions.length;
  let correct = 0;
  for (let i = 0; i < total; i++) {
    if (state.answers[i] === state.questions[i].answer) correct++;
  }
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  let grade = "F";
  if (pct >= 80) grade = "A";
  else if (pct >= 70) grade = "B";
  else if (pct >= 60) grade = "C";
  else if (pct >= 50) grade = "D";
  else if (pct >= 40) grade = "E";

  return `
    <div class="panel">
      <div class="result-score">
        <div class="big">${pct}%</div>
        <div class="grade">Grade: ${grade} · ${correct} / ${total} correct</div>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn btn-primary" onclick="selectSubject('${state.subject.id}')">Back to Subject</button>
      <button class="btn" onclick="goHome()">Home</button>
    </div>
  `;
}

function renderStats() {
  const stats = getStats();
  const totalAttempts = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
  const totalCorrect = Object.values(stats).reduce((sum, s) => sum + s.correct, 0);
  const overallPct = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  return `
    <div class="hero" style="text-align:left; margin-bottom:22px;">
      <h1 style="font-size:1.55rem;">Statistics</h1>
      <p>Your performance overview</p>
    </div>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="label">Total Attempts</div>
        <div class="value">${totalAttempts}</div>
      </div>
      <div class="stat-box">
        <div class="label">Correct</div>
        <div class="value green">${totalCorrect}</div>
      </div>
      <div class="stat-box">
        <div class="label">Overall Accuracy</div>
        <div class="value">${overallPct}%</div>
      </div>
    </div>

    <div class="panel">
      <h2>By Subject</h2>
      <p class="sub-text">Breakdown per subject</p>
      ${SUBJECTS.map(s => {
        const st = stats[s.id] || { correct: 0, total: 0 };
        const pct = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
        return `
          <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border-soft);">
            <span style="font-weight:500;">${s.name}</span>
            <span style="color:var(--text-dim); font-size:0.85rem;">${st.correct}/${st.total} · ${pct}%</span>
          </div>
        `;
      }).join("")}
    </div>

    <button class="btn" onclick="goHome()">← Back to Home</button>
  `;
}

/* ===== INIT ===== */
render();