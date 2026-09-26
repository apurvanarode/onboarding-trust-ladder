const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const TASK_BANK_PATH = path.join(__dirname, '../data/task_bank.json');
const STATE_PATH = path.join(__dirname, '../data/state.json');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// GET /api/diagnostics/tasks
// Returns all tasks without correctIndex to avoid leaking answers.
router.get('/tasks', (req, res) => {
  const tasks = readJSON(TASK_BANK_PATH);
  const sanitized = tasks.map(({ correctIndex, ...rest }) => rest);
  res.json(sanitized);
});

// POST /api/diagnostics/submit
// Body: { taskId: string, answerIndex: number }
// Checks answer, updates diagnosticScore (+20 per correct, capped at 100).
router.post('/submit', (req, res) => {
  const { taskId, answerIndex } = req.body;

  if (taskId === undefined || answerIndex === undefined) {
    return res.status(400).json({ error: 'taskId and answerIndex are required' });
  }

  const tasks = readJSON(TASK_BANK_PATH);
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: `Task '${taskId}' not found` });
  }

  const correct = task.correctIndex === answerIndex;

  if (correct) {
    const state = readJSON(STATE_PATH);
    state.diagnosticScore = Math.min(100, state.diagnosticScore + 20);
    writeJSON(STATE_PATH, state);

    // TODO: call accessTiers.js /recompute after updating diagnosticScore
    // so that the user's access tier is recalculated based on the new score.
  }

  res.json({ correct });
});

module.exports = router;
