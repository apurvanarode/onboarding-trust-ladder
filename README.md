\# Onboarding Trust Ladder





\## API Contract



Backend exposes these REST endpoints. Everyone codes against this contract independently:



GET  /api/compliance/status          → { signed: boolean, missing: string\[] }

POST /api/compliance/sign            → { docId: string } → { signed: boolean }



GET  /api/resources/checklist        → { tools: \[...], credentials: \[...], access: \[...] }



GET  /api/diagnostics/tasks          → \[{ id, question, options, difficulty }]

POST /api/diagnostics/submit         → { taskId, answer } → { correct: boolean, newScore: number }



GET  /api/tasks/current              → { id, title, description, difficulty }

POST /api/tasks/submit               → { taskId, prSummary } → { score, feedback }



GET  /api/tier/status                → { currentTier: number, score: number, unlockedAccess: string\[] }



GET  /api/team/structure             → { modules: \[{ name, owner, contact }] }

