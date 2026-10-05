const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ====== STPM SUBJECTS ======
const SUBJECTS = {
  physics:   "Physics STPM",
  biology:   "Biology STPM",
  addmaths:  "Additional Mathematics STPM",
  mgmtmaths: "Management Mathematics STPM",
  chemistry: "Chemistry STPM"
};

// ====== GEMINI HELPER ======
async function callGemini(prompt, maxTokens = 4096) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxTokens
      }
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Gemini API error");
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) throw new Error("Empty response from AI.");
  return text;
}

// ====== ENDPOINT: GENERATE 10 QUESTIONS ======
app.post("/api/questions", async (req, res) => {
  try {
    const { subject, semester, batchNumber = 1 } = req.body;

    if (!subject) {
      return res.status(400).json({ error: "Subject is required." });
    }

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

    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({
        error: "Failed to parse AI response. Please try again.",
        preview: cleaned.slice(0, 300)
      });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(500).json({ error: "Invalid question format from AI." });
    }

    // Validate each question
    const valid = parsed.questions.filter(q =>
      q.question &&
      q.options &&
      q.options.A && q.options.B && q.options.C && q.options.D &&
      ["A", "B", "C", "D"].includes(q.answer)
    );

    if (valid.length === 0) {
      return res.status(500).json({ error: "No valid questions generated." });
    }

    res.json({ questions: valid });
  } catch (err) {
    console.error("[/api/questions]", err);
    res.status(500).json({ error: err.message });
  }
});

// ====== ENDPOINT: EXPLAIN ANSWER ======
app.post("/api/explain", async (req, res) => {
  try {
    const { subject, question, options, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "Question and answer required." });
    }

    const optionsText = Object.entries(options || {})
      .map(([k, v]) => `${k}) ${v}`)
      .join("\n");

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

Keep it concise, exam-focused, and academic. No fluff.`;

    const explanation = await callGemini(prompt, 2048);
    res.json({ explanation });
  } catch (err) {
    console.error("[/api/explain]", err);
    res.status(500).json({ error: err.message });
  }
});

// ====== ENDPOINT: TEXTBOOK NOTES ======
app.post("/api/textbook", async (req, res) => {
  try {
    const { subject, semester } = req.body;

    if (!subject) {
      return res.status(400).json({ error: "Subject is required." });
    }

    const subjectName = SUBJECTS[subject] || subject;

    const prompt = `You are an STPM teacher writing comprehensive textbook notes in English.

Subject: ${subjectName}
Semester: ${semester || "All"}

Write well-structured study notes covering ALL major topics for this subject and semester.

Structure your response EXACTLY like this:

# ${subjectName} — ${semester || "Full Syllabus"}

## Topic 1: [Topic Name]
### Key Concepts
- Concept 1
- Concept 2

### Important Formulas / Definitions
- Formula or definition

### Quick Example
Brief worked example.

## Topic 2: [Topic Name]
(repeat structure)

...

## Exam Tips
- Common mistakes to avoid
- Time management advice
- Key topics that appear frequently

Requirements:
- Cover all major syllabus topics
- Use clear markdown headings (##, ###)
- Include formulas where relevant
- Keep language academic but clear
- This is for STPM students, so be thorough but concise`;

    const notes = await callGemini(prompt, 6000);
    res.json({ notes });
  } catch (err) {
    console.error("[/api/textbook]", err);
    res.status(500).json({ error: err.message });
  }
});

// ====== HEALTH CHECK ======
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "STPM Pro",
    time: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY
  });
});

// ====== FALLBACK: SERVE index.html ======
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== START ======
app.listen(PORT, () => {
  console.log(`✅ STPM Pro running on port ${PORT}`);
  console.log(`🔑 Gemini API key: ${process.env.GEMINI_API_KEY ? "SET" : "MISSING"}`);
});