/**
 * compliance.js
 *
 * Express router that simulates a compliance gate.
 * All three legal documents (NDA, data_handling_policy, open_source_license_policy)
 * must be signed before further onboarding access is granted.
 *
 * Mounted at /api/compliance by the main server file.
 */

const express = require('express');
const router = express.Router();

// In-memory tracking of which documents have been signed.
// Keys are the document filenames without extension.
// All documents start as unsigned (false).
const signatureStatus = {
  NDA: false,
  data_handling_policy: false,
  open_source_license_policy: false,
};

/**
 * Build the standard status response shared by both routes.
 * @returns {{ signed: boolean, missing: string[] }}
 */
function buildStatus() {
  const missing = Object.keys(signatureStatus).filter(
    (docId) => !signatureStatus[docId]
  );
  return {
    signed: missing.length === 0,
    missing,
  };
}

/**
 * GET /api/compliance/status
 *
 * Returns the current compliance status:
 *   { signed: boolean, missing: string[] }
 *
 * `signed` is true only when all 3 documents have been signed.
 * `missing` lists the document IDs (filename without extension) not yet signed.
 */
router.get('/status', (req, res) => {
  res.json(buildStatus());
});

/**
 * POST /api/compliance/sign
 *
 * Marks a document as signed.
 * Expects JSON body: { docId: string }
 * where docId is the filename without extension (e.g. "NDA").
 *
 * Returns the updated status in the same shape as GET /status.
 * Returns 400 if docId does not match one of the 3 known documents.
 */
router.post('/sign', (req, res) => {
  const { docId } = req.body;

  if (!Object.prototype.hasOwnProperty.call(signatureStatus, docId)) {
    return res.status(400).json({
      error: `Unknown document: "${docId}". Valid document IDs are: ${Object.keys(signatureStatus).join(', ')}.`,
    });
  }

  signatureStatus[docId] = true;
  res.json(buildStatus());
});

module.exports = router;
