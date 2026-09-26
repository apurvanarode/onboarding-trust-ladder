/**
 * accessTiers.js
 *
 * Express router implementing the "trust ladder" — the core differentiating
 * feature of the onboarding project.
 *
 * ACCESS GROWS WITH PROVEN COMPETENCE, NOT WITH TIME.
 *
 * A new hire starts in a locked-down Sandbox and earns progressively wider
 * access only by demonstrating readiness at each stage:
 *
 *   Tier 0 – Sandbox only          (default starting state)
 *   Tier 1 – Dev environment        unlocked when compliance is fully signed
 *   Tier 2 – Read access to repo    unlocked when diagnosticScore >= 60
 *   Tier 3 – Write access (non-critical modules)
 *                                   unlocked when first real task score >= 70
 *   Tier 4 – Full team access       unlocked when average taskScore >= 85
 *                                   across at least 2 completed tasks
 *
 * State is persisted in backend/data/state.json so it survives server restarts.
 * Other modules (compliance, diagnostic, tasks) call POST /api/tier/recompute
 * after they mutate state.json, triggering a fresh tier evaluation.
 *
 * Mounted at /api/tier by the main server file.
 */

'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const STATE_PATH = path.join(__dirname, '..', 'data', 'state.json');

// ---------------------------------------------------------------------------
// Default state — used when state.json is absent or malformed.
// ---------------------------------------------------------------------------

const DEFAULT_STATE = {
  complianceSigned: false,
  diagnosticScore: 0,
  taskScores: [],
  currentTier: 0,
  unlockedAccess: ['Sandbox'],
};

// ---------------------------------------------------------------------------
// Tier definitions
// Each tier has a human-readable label and the list of access grants it adds.
// ---------------------------------------------------------------------------

const TIERS = [
  { tier: 0, label: 'Tier 0: Sandbox Only',                access: ['Sandbox'] },
  { tier: 1, label: 'Tier 1: Dev Environment Access',      access: ['Sandbox', 'Dev Environment'] },
  { tier: 2, label: 'Tier 2: Read Access',                 access: ['Sandbox', 'Dev Environment', 'Repo Read'] },
  { tier: 3, label: 'Tier 3: Write Access (Non-Critical)', access: ['Sandbox', 'Dev Environment', 'Repo Read', 'Repo Write (Non-Critical)'] },
  { tier: 4, label: 'Tier 4: Full Team Access',            access: ['Sandbox', 'Dev Environment', 'Repo Read', 'Repo Write (Non-Critical)', 'Full Team Access'] },
];

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

/**
 * Read state.json from disk.
 * If the file does not exist or cannot be parsed, returns DEFAULT_STATE so
 * the application always has a valid starting point.
 * @returns {object} The current state object.
 */
function readState() {
  try {
    const raw = fs.readFileSync(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    // Merge with defaults so any missing keys are populated.
    return Object.assign({}, DEFAULT_STATE, parsed);
  } catch (_) {
    return Object.assign({}, DEFAULT_STATE);
  }
}

/**
 * Write the given state object back to state.json atomically (sync write).
 * @param {object} state
 */
function writeState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

// ---------------------------------------------------------------------------
// Tier evaluation — the heart of the trust ladder
// ---------------------------------------------------------------------------

/**
 * Determine the highest tier the hire has earned based solely on current
 * state values. This is a full recalculation every time — never an increment
 * — so it is always correct regardless of the order events arrive.
 *
 * Rules (each is a prerequisite for all higher tiers):
 *   Tier 1  complianceSigned === true
 *   Tier 2  diagnosticScore >= 60   (implies Tier 1)
 *   Tier 3  taskScores has at least one entry >= 70  (implies Tier 2)
 *   Tier 4  taskScores has >= 2 entries AND their average >= 85  (implies Tier 3)
 *
 * @param {object} state
 * @returns {number} The tier number (0–4) the hire currently qualifies for.
 */
function computeTier(state) {
  const { complianceSigned, diagnosticScore, taskScores } = state;

  // Each entry in taskScores may be a plain number or an object { taskId, score, submittedAt }.
  // Extract the numeric value uniformly before any comparison.
  const scores = taskScores.map((s) => (typeof s === 'object' && s !== null ? s.score : s));

  // Tier 4: full team access — needs >= 2 tasks and an average score of 85+
  if (
    complianceSigned &&
    diagnosticScore >= 60 &&
    scores.length >= 2 &&
    scores.some((s) => s >= 70) &&
    scores.reduce((sum, s) => sum + s, 0) / scores.length >= 85
  ) {
    return 4;
  }

  // Tier 3: write access to non-critical modules — needs at least one task scored 70+
  if (
    complianceSigned &&
    diagnosticScore >= 60 &&
    scores.some((s) => s >= 70)
  ) {
    return 3;
  }

  // Tier 2: read access to repo — needs a diagnostic score of 60 or higher
  if (complianceSigned && diagnosticScore >= 60) {
    return 2;
  }

  // Tier 1: dev environment — needs all compliance documents signed
  if (complianceSigned) {
    return 1;
  }

  // Tier 0: sandbox only — the default starting state
  return 0;
}

// ---------------------------------------------------------------------------
// Response builder
// ---------------------------------------------------------------------------

/**
 * Build the standard response payload shared by both routes.
 * Includes the raw state plus a human-readable tier label and the full list
 * of currently unlocked access grants.
 * @param {object} state
 * @returns {object}
 */
function buildResponse(state) {
  const tierDef = TIERS[state.currentTier];
  return {
    complianceSigned: state.complianceSigned,
    diagnosticScore: state.diagnosticScore,
    taskScores: state.taskScores,
    currentTier: state.currentTier,
    tierLabel: tierDef.label,
    unlockedAccess: state.unlockedAccess,
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/tier/status
 *
 * Returns the current tier state plus a human-readable label and the list of
 * currently unlocked access grants. No side effects.
 */
router.get('/status', (req, res) => {
  const state = readState();
  res.json(buildResponse(state));
});

/**
 * POST /api/tier/recompute
 *
 * Re-evaluates state.json against all tier rules, updates currentTier and
 * unlockedAccess, persists the result, and returns the new status in the same
 * shape as GET /status.
 *
 * Called by other modules (compliance, diagnostic, tasks) after they update
 * state.json so that the tier advances immediately upon qualification.
 * This route never trusts the stored currentTier — it always derives the
 * correct tier from the raw fact fields (complianceSigned, diagnosticScore,
 * taskScores) to stay consistent even if events arrive out of order.
 */
router.post('/recompute', (req, res) => {
  const state = readState();

  // Derive the correct tier from scratch.
  const newTier = computeTier(state);
  const tierDef = TIERS[newTier];

  state.currentTier = newTier;
  state.unlockedAccess = tierDef.access;

  writeState(state);

  res.json(buildResponse(state));
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Reusable recompute helper — called directly by other modules after they
// mutate state.json, so tier advancement is synchronous with no HTTP round-trip.
// ---------------------------------------------------------------------------

/**
 * Re-evaluate tier rules against the current state.json, persist the result,
 * and return the standard tier-status payload.
 *
 * @returns {{ currentTier: number, tierLabel: string, unlockedAccess: string[], complianceSigned: boolean, diagnosticScore: number, taskScores: Array }}
 */
function recomputeTier() {
  const state = readState();
  const newTier = computeTier(state);
  const tierDef = TIERS[newTier];

  state.currentTier = newTier;
  state.unlockedAccess = tierDef.access;

  writeState(state);

  return buildResponse(state);
}

module.exports = router;
module.exports.recomputeTier = recomputeTier;
