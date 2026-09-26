const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const STATE_PATH = path.join(__dirname, '../data/state.json');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ---------------------------------------------------------------------------
// Hardcoded task catalogue (single task for this prototype)
// Tied to the intentional bug in sample-project/src/routes/orders.js
// ---------------------------------------------------------------------------
const TASKS = [
  {
    id: 'task1',
    title: 'Fix missing amount validation',
    description:
      'In sample-project/src/routes/orders.js, POST /orders accepts any amount ' +
      'including negative numbers and zero. Add input validation so that the ' +
      'endpoint rejects requests where `amount` is missing, non-numeric, or ≤ 0, ' +
      'returning HTTP 400 with a descriptive error message.',
    difficulty: 'medium',
  },
];

// ---------------------------------------------------------------------------
// GET /api/tasks/current
// Returns the single active real-task for the onboarding ladder.
// ---------------------------------------------------------------------------
router.get('/current', (req, res) => {
  res.json(TASKS[0]);
});

// ---------------------------------------------------------------------------
// POST /api/tasks/submit
// Body: { taskId: string, prSummary: string }
//
// NOTE – PR grading is SIMULATED for this hackathon prototype.
// In a production system this endpoint would call the GitHub Checks API (or a
// CI webhook) to read actual test results and diff quality metrics.  Here we
// score purely on keyword presence in the submitted PR summary text so the
// end-to-end onboarding flow can be demonstrated without real CI integration.
// ---------------------------------------------------------------------------
router.post('/submit', (req, res) => {
  const { taskId, prSummary } = req.body;

  if (!taskId || prSummary === undefined) {
    return res.status(400).json({ error: 'taskId and prSummary are required' });
  }

  const task = TASKS.find((t) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: `Task '${taskId}' not found` });
  }

  // --- Simulated grading logic -------------------------------------------
  // Base score sits in the middle of the expected 70-95 range.
  // Each quality keyword found in the summary adds weight toward the ceiling.
  const QUALITY_KEYWORDS = ['validation', 'validate', 'check', 'test', 'guard', 'sanitize', 'sanitise', 'reject', 'error'];
  const BASE_SCORE = 70;
  const MAX_BONUS = 25; // 70 + 25 = 95 ceiling

  const summaryLower = String(prSummary).toLowerCase();
  const matchCount = QUALITY_KEYWORDS.filter((kw) => summaryLower.includes(kw)).length;

  // Each unique matched keyword is worth up to (MAX_BONUS / total keywords) points,
  // capped so the total never exceeds 95.
  const bonusPerKeyword = MAX_BONUS / QUALITY_KEYWORDS.length;
  const bonus = Math.min(MAX_BONUS, Math.round(matchCount * bonusPerKeyword));
  const score = BASE_SCORE + bonus;

  // Build human-readable feedback
  let feedback;
  if (score >= 90) {
    feedback = 'Excellent work! Your summary clearly describes input validation, error handling, and test coverage. The fix looks thorough.';
  } else if (score >= 80) {
    feedback = 'Good submission. You addressed the core validation gap. Consider also mentioning edge-case tests (zero, non-numeric) in future PR descriptions.';
  } else {
    feedback = 'Acceptable fix. To score higher, include keywords like "validation", "test", or "check" in your PR summary to signal what was covered.';
  }

  // Persist score to state.json -------------------------------------------------
  const state = readJSON(STATE_PATH);
  if (!Array.isArray(state.taskScores)) {
    state.taskScores = [];
  }
  state.taskScores.push({ taskId, score, submittedAt: new Date().toISOString() });
  writeJSON(STATE_PATH, state);

  res.json({ score, feedback });
});

module.exports = router;
