const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

// ====== SUBJEK STPM ======
const SUBJECTS = {
  physics:   "Physics STPM",
  biology:   "Biology STPM",
  addmaths:  "Additional Mathematics STPM",
  mgmtmaths: "Management Mathematics STPM",
  chemistry: "Chemistry STPM"
};

// ====== GROQ API KEYS ======
function getApiKeys() {
  return [
    process.env.GROQ_KEY_1,
    process.env.GROQ_KEY_2,
    process.env.GROQ_KEY_3,
    process.env.GROQ_KEY
  ].filter(k => k && k.trim().length > 0);
}

let currentKeyIndex = 0;

function getNextKey() {
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error("Tiada GROQ_KEY diset.");
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex++;
  return key;
}

// ====== PANGGIL GROQ ======
async function callGroq(prompt, maxTokens = 4096, attempt = 0) {
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error("Tiada GROQ_KEY diset.");

  const apiKey = getNextKey();
  const url = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: "You are an STPM examiner and tutor. Follow instructions exactly." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: maxTokens
      })
    });

    if (res.status === 429 || res.status === 503) {
      if (attempt < 5) {
        const wait = (attempt + 1) * 2000;
        console.log(`Rate limited (${res.status}). Retry ${attempt + 1} dalam ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        return callGroq(prompt, maxTokens, attempt + 1);
      }
      throw new Error("Rate limit exceeded. Sila tunggu sebentar dan cuba lagi.");
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Groq API error");

    const text = data.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Tiada respons dari AI.");
    return text;
  } catch (err) {
    if (attempt < 3 && !err.message.includes("Rate limit")) {
      console.log(`Network error: ${err.message}. Retrying...`);
      await new Promise(r => setTimeout(r, 2000));
      return callGroq(prompt, maxTokens, attempt + 1);
    }
    throw err;
  }
}

// ====== JANA 10 SOALAN ======
app.post("/api/questions", async (req, res) => {
  try {
    const { subject, semester, batchNumber = 1 } = req.body;
    if (!subject) return res.status(400).json({ error: "Subjek diperlukan." });

    const subjectName = SUBJECTS[subject] || subject;

    const prompt = `You are an STPM examiner. Generate 10 multiple-choice questions in English for:
Subject: ${subjectName}
Semester: ${semester || "All"}
Batch: ${batchNumber} (pick different topics each batch, avoid repetition)

STRICT FORMAT — respond ONLY with valid JSON, no markdown, no backticks:

{
  "questions": [
    {
      "id": 1,
      "question": "Full question text here?",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "answer": "A"
    }
  ]
}

Rules:
- Exactly 10 questions
- Mix of easy, medium, hard (STPM level)
- "answer" must be exactly A, B, C, or D
- No extra text outside the JSON
- Use real STPM syllabus content`;

    const raw = await callGroq(prompt);
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch (e) {
      return res.status(500).json({
        error: "Gagal parse respons AI. Sila cuba lagi.",
        preview: cleaned.slice(0, 300)
      });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(500).json({ error: "Format soalan tak sah dari AI." });
    }

    const valid = parsed.questions.filter(q =>
      q.question &&
      q.options &&
      q.options.A && q.options.B && q.options.C && q.options.D &&
      ["A", "B", "C", "D"].includes(q.answer)
    );

    if (valid.length === 0) return res.status(500).json({ error: "Tiada soalan sah dijana." });

    res.json({ questions: valid });
  } catch (err) {
    console.error("[/api/questions]", err);
    res.status(500).json({ error: err.message });
  }
});

// ====== HURAIAN JAWAPAN ======
app.post("/api/explain", async (req, res) => {
  try {
    const { subject, question, options, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ error: "Soalan dan jawapan diperlukan." });

    const optionsText = Object.entries(options || {}).map(([k, v]) => `${k}) ${v}`).join("\n");

    const prompt = `You are an STPM tutor. Explain this MCQ clearly and professionally in English.

Subject: ${SUBJECTS[subject] || subject}
Question: ${question}
Options:
${optionsText}
Correct Answer: ${answer}

Provide a structured explanation:

## Why ${answer} is correct
Clear concept explanation.

## Why other options are wrong
- Briefly explain each wrong option.

## Key concept to remember
The formula/definition/principle.

Keep it concise, exam-focused, and academic.`;

    const explanation = await callGroq(prompt, 2048);
    res.json({ explanation });
  } catch (err) {
    console.error("[/api/explain]", err);
    res.status(500).json({ error: err.message });
  }
});

// ====== BUKU TEKS ======
app.post("/api/textbook", async (req, res) => {
  try {
    const { subject, semester } = req.body;
    if (!subject) return res.status(400).json({ error: "Subjek diperlukan." });

    const subjectName = SUBJECTS[subject] || subject;

    const prompt = `You are an STPM teacher writing comprehensive textbook notes in English.

Subject: ${subjectName}
Semester: ${semester || "All"}

Write well-structured study notes covering ALL major topics for this subject and semester.

Structure:

# ${subjectName} — ${semester || "Full Syllabus"}

## Topic 1: [Topic Name]
### Key Concepts
- Concept 1
### Important Formulas / Definitions
- Formula
### Quick Example
Brief worked example.

## Topic 2: [Topic Name]
(repeat)

## Exam Tips
- Common mistakes
- Time management
- Key topics

Requirements:
- Cover all major topics
- Use markdown headings
- Include formulas
- Academic but clear`;

    const notes = await callGroq(prompt, 6000);
    res.json({ notes });
  } catch (err) {
    console.error("[/api/textbook]", err);
    res.status(500).json({ error: err.message });
  }
});

// ====== HEALTH CHECK ======
app.get("/api/health", (req, res) => {
  const keys = getApiKeys();
  res.json({
    status: "ok",
    service: "STPM Pro",
    provider: "groq",
    model: "openai/gpt-oss-120b",
    time: new Date().toISOString(),
    keyCount: keys.length,
    hasApiKey: keys.length > 0
  });
});

// ====== FALLBACK ======
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  const keys = getApiKeys();
  console.log(`✅ STPM Pro berjalan di port ${PORT}`);
  console.log(`🔑 Groq keys loaded: ${keys.length}`);
});