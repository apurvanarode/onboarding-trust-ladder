# Onboarding Trust Ladder

**Hackathon Submission** — A competence-driven developer onboarding simulator.

New developers earn access to progressively sensitive environments by demonstrating real readiness — signing compliance docs, passing a diagnostic quiz, and completing graded tasks — rather than having access granted on day one or handed out all at once. Access grows automatically as trust is proven.

---

## Problem Statement

Traditional onboarding typically grants every new hire full repository access and proximity to production systems from the moment they join. There is no verification of whether they understand security policies, can navigate the codebase safely, or have the skill level required for the environments they can touch. This creates measurable security and code-quality risk: a developer who hasn't read the compliance docs can accidentally expose secrets; one who doesn't yet understand the deployment pipeline can push breaking changes. The current model conflates tenure with trust, and grants access by default rather than by evidence.

---

## Solution

The Onboarding Trust Ladder replaces time-based access with a five-tier system where each tier is unlocked by a specific, verifiable milestone. Access only grows forward — it cannot be self-granted or skipped.

| Tier | Name | Unlocked By |
|------|------|-------------|
| 0 | **Sandbox** | Default — available on day one |
| 1 | **Dev Environment** | Signing all required compliance documents |
| 2 | **Read Access** | Diagnostic quiz score ≥ 60 |
| 3 | **Write Access** | At least one submitted task scoring ≥ 70 |
| 4 | **Full Team Access** | Average of ≥ 2 task scores is ≥ 85 |

Each tier unlocks a concrete set of permissions (listed in the dashboard) and reflects a genuine checkpoint: legal/policy awareness, technical comprehension, and hands-on delivery quality.

---

## Architecture

The project is made up of three independent pieces that communicate over a defined REST API contract.

### 1. Sample Buggy Express API (`sample-project/`)
A deliberately flawed Node.js/Express application that serves as the training ground. It contains realistic bugs — unhandled errors, missing validation, insecure defaults — so that new developers practice on something representative of real legacy codebases rather than toy examples. Task grading is based on how a developer describes their fix in a PR summary.

### 2. Backend (`backend/`)
A Node.js/Express server with five domain modules:

- **`compliance`** — Tracks which policy documents have been signed and gates Tier 2 unlock.
- **`resources`** — Serves the onboarding checklist of tools, credentials, and access items.
- **`diagnostics`** — Manages a pool of multiple-choice quiz questions and scores responses.
- **`scoring`** — Grades individual task submissions using keyword-weighted scoring against the PR summary text.
- **`accessTiers`** — Aggregates compliance status, diagnostic score, and task scores to compute the current tier and its associated permissions.

All five modules expose endpoints defined in the API Contract below. The backend holds all state in-process (no database required for the hackathon build).

### 3. Frontend Dashboard (`frontend/index.html`)
A single-page HTML/CSS/JS dashboard that visualises the developer's journey through the five tiers. Key features include:

- Live tier indicator showing current access level and what's needed to advance.
- Compliance checklist with one-click signing.
- Diagnostic quiz interface with real-time score feedback.
- Task submission form for PR summaries with graded feedback.
- **Before/After toggle** — switches the view between the traditional "grant everything on day one" model and the trust-ladder model, making the security improvement immediately visible.

---

## What's Simulated vs. Real

This project was scoped for a 30-hour hackathon. The following are intentional simulations, not production-ready integrations:

**Access control is simulated.** Tier unlocks update state in the backend's in-memory store. They are not connected to any real IAM system, GitHub org permissions, cloud RBAC, or SSO provider. In a production version, each tier transition would trigger a real provisioning call (e.g. GitHub Teams API, AWS IAM, Okta group membership).

**Task grading is simulated.** PR summary scoring uses keyword-weighted heuristics plus a small random variance component — it is not a real code review. A developer submits a plain-text description of what they fixed, and the scorer looks for signal words (error handling, validation, sanitisation, test coverage, etc.) to produce a 0–100 score with qualitative feedback. A production version would integrate with a real code review API or an LLM-assisted review pipeline.

These were deliberate scope decisions. The architecture is intentionally structured so that both of these simulated layers can be replaced with real integrations without changing the tier logic or the frontend contract.

---

## How to Run

**Prerequisites:** Node.js 18+ and npm.

**Step 1 — Start the backend:**
```bash
cd backend
npm install
npm start
```
The backend runs on `http://localhost:5000` by default.

**Step 2 — Start the sample buggy project:**
```bash
cd sample-project
npm install
npm start
```
The sample API runs on `http://localhost:4000` by default and is the target for task-based exercises.

**Step 3 — Open the frontend:**

Open `frontend/index.html` directly in a browser. No build step required. The dashboard connects to the backend at `localhost:5000`.

---

## API Contract

Backend exposes these REST endpoints. Everyone codes against this contract independently:

```
GET  /api/compliance/status          → { signed: boolean, missing: string[] }
POST /api/compliance/sign            → { docId: string } → { signed: boolean }

GET  /api/resources/checklist        → { tools: [...], credentials: [...], access: [...] }

GET  /api/diagnostics/tasks          → [{ id, question, options, difficulty }]
POST /api/diagnostics/submit         → { taskId, answerIndex: number } → { correct: boolean }

GET  /api/tasks/current              → { id, title, description, difficulty }
POST /api/tasks/submit               → { taskId, prSummary } → { score, feedback }

GET  /api/tier/status                → { complianceSigned: boolean, diagnosticScore: number, taskScores: number[], currentTier: number, tierLabel: string, unlockedAccess: string[] }

GET  /api/team/structure             → { modules: [{ name, owner, contact }] }
```
