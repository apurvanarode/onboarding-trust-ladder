/* ─────────────────────────────────────────────────────────
   dashboard.js  —  Onboarding Trust Ladder
   Plain vanilla JS, no framework, no build step.
   Data source: http://localhost:5000 REST API
───────────────────────────────────────────────────────── */

const API = "http://localhost:5000";

// ── RUNTIME STATE ──────────────────────────────────────────
let state = {
  // populated after init fetches
  steps:           [],
  scorePerStep:    [],
  activeStepScore: [],
  scoreHints:      [],

  currentStep: 0,   // 0-indexed
  submitted:   false,
  running:     false,

  // cached task data for the active step
  currentTask:     null,  // { title, description, diagnostics, result }
};

// ── HELPERS ────────────────────────────────────────────────
/** Generic fetch wrapper — returns parsed JSON or throws a
 *  labelled error so callers can show a consistent message. */
async function apiFetch(path, options) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    throw new Error("Backend not reachable");
  }
}

/** Render a single loading placeholder inside an element. */
function showLoading(el, rows = 3) {
  el.innerHTML = Array.from({ length: rows })
    .map(() => `<li class="loading-placeholder">Loading…</li>`)
    .join("");
}

/** Render a single error line inside an element. */
function showError(el, message = "Backend not reachable") {
  el.innerHTML = `<li class="error-item">${message}</li>`;
}

// ── INIT ───────────────────────────────────────────────────
async function init() {
  // 1. Fetch tier/step metadata — everything else depends on currentStep
  try {
    const tier = await apiFetch("/api/tier/status");
    state.currentStep    = tier.currentStep    ?? 0;
    state.steps          = tier.steps          ?? [];
    state.scorePerStep   = tier.scorePerStep   ?? [];
    state.activeStepScore= tier.activeStepScore?? [];
    state.scoreHints     = tier.scoreHints     ?? [];

    // ── TRUST SCORE PANEL ──────────────────────────────────
    // /api/tier/status returns { complianceSigned, diagnosticScore,
    // taskScores, currentTier, tierLabel, unlockedAccess }
    const score = tier.diagnosticScore ?? 0;
    document.getElementById("scoreValue").textContent = `${score} / 100`;
    document.getElementById("scoreFill").style.width  = `${score}%`;
    document.getElementById("scoreHint").textContent  = tier.tierLabel ?? "";
  } catch (e) {
    // Render skeleton UI with error notices if tier fetch fails entirely
    renderProgressTrackError();
    renderError("complianceList",  "Backend not reachable");
    renderError("resourceList",    "Backend not reachable");
    renderError("teamList",        "Backend not reachable");
    renderTaskError("Backend not reachable");
    renderScoreError();
    return;
  }

  // 2. Render progress track immediately (data is now available)
  renderProgressTrack();

  // 3. Fire remaining fetches in parallel
  await Promise.all([
    loadAndRenderCompliance(),
    loadAndRenderResources(),
    loadAndRenderTeam(),
    loadAndRenderTask(),
  ]);
}

// ── PROGRESS TRACK ─────────────────────────────────────────
function renderProgressTrack() {
  const track = document.getElementById("progressTrack");
  track.innerHTML = "";
  const { steps, currentStep } = state;

  steps.forEach((step, i) => {
    const cls = i < currentStep ? "done" : i === currentStep ? "active" : "";

    const node = document.createElement("li");
    node.className = "step-item";
    node.setAttribute("role", "listitem");

    node.innerHTML = `
      <div class="step-node ${cls}" title="${step.label}">
        <div class="step-circle">${i < currentStep ? "✓" : step.short}</div>
        <span class="step-label-text">${step.label}</span>
      </div>`;

    if (i < steps.length - 1) {
      const connState = i < currentStep ? "done" : i === currentStep ? "active" : "";
      const connector = document.createElement("div");
      connector.className = `step-connector ${connState}`;
      node.appendChild(connector);
    }

    track.appendChild(node);
  });
}

function renderProgressTrackError() {
  const track = document.getElementById("progressTrack");
  track.innerHTML = `<li class="step-item"><span style="color:#b91c1c;font-size:.8rem">Backend not reachable</span></li>`;
}

// ── COMPLIANCE CHECKLIST ───────────────────────────────────
async function loadAndRenderCompliance() {
  const list = document.getElementById("complianceList");
  showLoading(list, 6);
  try {
    const data = await apiFetch("/api/compliance/status");
    // Response shape: { signed: boolean, missing: string[] }
    const allDocs = ["NDA", "data_handling_policy", "open_source_license_policy"];
    const missingSet = new Set(data.missing ?? []);
    list.innerHTML = allDocs.map(doc => {
      const isSigned = !missingSet.has(doc);
      const label = doc.replace(/_/g, " ");
      return `
        <li data-doc-id="${doc}">
          <span class="check-icon ${isSigned ? "done" : "pending"}">${isSigned ? "✓" : "○"}</span>
          <span class="check-text">${label}</span>
        </li>`;
    }).join("");

    // Attach click handlers to unsigned items
    list.querySelectorAll("li[data-doc-id]").forEach(item => {
      const docId = item.dataset.docId;
      const icon  = item.querySelector(".check-icon");
      if (icon && icon.classList.contains("pending")) {
        item.style.cursor = "pointer";
        item.addEventListener("click", async () => {
          item.style.cursor = "default";
          icon.textContent  = "…";
          try {
            await apiFetch("/api/compliance/sign", {
              method: "POST",
              body: JSON.stringify({ docId }),
            });
            icon.textContent = "✓";
            icon.classList.replace("pending", "done");
          } catch (err) {
            icon.textContent = "○";
            item.style.cursor = "pointer";
          }
        });
      }
    });
  } catch (e) {
    showError(list, e.message);
  }
}

// ── RESOURCES CHECKLIST ────────────────────────────────────
async function loadAndRenderResources() {
  const list = document.getElementById("resourceList");
  showLoading(list, 4);
  try {
    const data = await apiFetch("/api/resources/checklist");
    // Response shape: { tools: string[], credentials: string[], access: string[] }
    const sections = [
      { heading: "Tools",       items: data.tools       ?? [] },
      { heading: "Credentials", items: data.credentials ?? [] },
      { heading: "Access",      items: data.access      ?? [] },
    ];
    list.innerHTML = sections.map(({ heading, items }) => `
      <li class="resource-section-heading">${heading}</li>
      ${items.map(item => `
        <li>
          <span class="check-icon pending">○</span>
          <span class="check-text">${item}</span>
        </li>`).join("")}
    `).join("");
  } catch (e) {
    showError(list, e.message);
  }
}

// ── TEAM ───────────────────────────────────────────────────
async function loadAndRenderTeam() {
  const list = document.getElementById("teamList");
  showLoading(list, 4);
  try {
    // API: GET /api/team/structure → { modules: [{ name, owner, role, contact, askMeAbout }] }
    const data = await apiFetch("/api/team/structure");
    const modules = data.modules ?? [];
    list.innerHTML = modules.map(m => `
      <li class="team-member">
        <div class="member-info">
          <div class="member-name">${m.name}</div>
          <div class="member-role">${m.owner} — ${m.role}</div>
          <div class="member-ask">Ask me about: ${m.askMeAbout}</div>
        </div>
      </li>`).join("");
  } catch (e) {
    showError(list, e.message);
  }
}

// ── TASK PANEL ─────────────────────────────────────────────
async function loadAndRenderTask() {
  // Show skeleton
  document.getElementById("taskTitle").textContent = "Loading…";
  document.getElementById("taskDesc").textContent  = "";
  document.getElementById("diagnosticsBlock").innerHTML =
    `<div class="diag-row"><span class="diag-key">Loading diagnostics…</span></div>`;

  try {
    // Fetch current task metadata and diagnostics in parallel
    const [taskData, diagData] = await Promise.all([
      apiFetch("/api/tasks/current"),
      apiFetch("/api/diagnostics/tasks"),
    ]);

    // Normalise: backend may return the active step's task directly,
    // or an array keyed by step id — handle both shapes.
    const task = taskData.task ?? taskData;
    const diagnostics = Array.isArray(diagData)
      ? diagData
      : (diagData.tasks ?? diagData.diagnostics ?? diagData.items ?? []);

    state.currentTask = {
      id:          task.id          ?? "",
      title:       task.title       ?? "",
      description: task.description ?? "",
      diagnostics: diagnostics,
      result:      task.result      ?? null,
      totalTasks:  diagnostics.length,
    };

    // Total steps: prefer tier steps array; fall back to diagnostics task count
    const stepCount = state.steps.length || diagnostics.length;
    document.getElementById("stepLabel").textContent  =
      `Step ${state.currentStep + 1} of ${stepCount}`;
    document.getElementById("taskStatus").textContent =
      state.submitted ? "Complete" : "In Progress";

    renderTaskFromCache();
  } catch (e) {
    renderTaskError(e.message);
  }
}

/** Render task panel from state.currentTask (no network). */
function renderTaskFromCache() {
  const task = state.currentTask;
  if (!task) return;

  const totalSteps = state.steps.length || task.totalTasks || 0;
  document.getElementById("stepLabel").textContent  =
    `Step ${state.currentStep + 1} of ${totalSteps}`;
  document.getElementById("taskStatus").textContent =
    state.submitted ? "Complete" : "In Progress";
  document.getElementById("taskTitle").textContent  = task.title;
  document.getElementById("taskDesc").textContent   = task.description;

  // diagnostics — shape: { id, question, options: string[], difficulty }
  const block = document.getElementById("diagnosticsBlock");
  block.innerHTML = task.diagnostics.map((d, i) => `
    ${i > 0 ? '<div class="diag-separator"></div>' : ""}
    <div class="diag-row" data-diag-id="${d.id}">
      <span class="diag-key">${d.question}</span>
      <span class="diag-val">${d.difficulty}</span>
    </div>`).join("");

  // Attach click handlers so each row expands into an option picker
  block.querySelectorAll(".diag-row[data-diag-id]").forEach((row, i) => {
    row.style.cursor = "pointer";
    row.addEventListener("click", () => showDiagOptions(row, task.diagnostics[i]));
  });

  // buttons + result
  const submitBtn   = document.getElementById("submitBtn");
  const nextBtn     = document.getElementById("nextBtn");
  const resultBlock = document.getElementById("resultBlock");

  resultBlock.style.display = "none";
  resultBlock.className     = "result-block";

  const isLast = state.currentStep === state.steps.length - 1;

  if (state.submitted && task.result) {
    submitBtn.style.display = "none";
    nextBtn.style.display   = isLast ? "none" : "inline-block";

    resultBlock.style.display = "block";
    resultBlock.className     = `result-block ${task.result.type}`;
    resultBlock.textContent   = task.result.message;
  } else {
    submitBtn.textContent   = "Run Diagnostic";
    // Only re-enable if no submission is currently in flight.
    submitBtn.disabled      = state.running;
    submitBtn.style.display = "inline-block";
    nextBtn.style.display   = "none";
  }
}


/** Expand a diagnostic row into an option picker; submit the chosen answer. */
function showDiagOptions(row, diag) {
  // Prevent re-expanding if already showing options
  if (row.querySelector(".diag-options")) return;

  const optionsEl = document.createElement("div");
  optionsEl.className = "diag-options";
  optionsEl.innerHTML = diag.options.map((opt, idx) => `
    <button class="diag-option-btn" data-idx="${idx}">${opt}</button>
  `).join("");

  row.appendChild(optionsEl);

  optionsEl.querySelectorAll(".diag-option-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation(); // don't re-trigger the row click
      const answerIndex = Number(btn.dataset.idx);
      optionsEl.querySelectorAll(".diag-option-btn").forEach(b => b.disabled = true);
      btn.textContent = "Submitting…";
      try {
        await apiFetch("/api/diagnostics/submit", {
          method: "POST",
          body: JSON.stringify({ taskId: diag.id, answerIndex }),
        });
        btn.textContent += " ✓";
      } catch (err) {
        btn.textContent = "Error — retry";
        btn.disabled = false;
      }
    });
  });
}


function renderTaskError(message) {
  document.getElementById("stepLabel").textContent  = "";
  document.getElementById("taskStatus").textContent = "";
  document.getElementById("taskTitle").textContent  = "Error";
  document.getElementById("taskDesc").textContent   = message;
  document.getElementById("diagnosticsBlock").innerHTML = "";
  document.getElementById("submitBtn").style.display = "none";
  document.getElementById("nextBtn").style.display   = "none";
  const rb = document.getElementById("resultBlock");
  rb.style.display = "block";
  rb.className     = "result-block warning";
  rb.textContent   = message;
}

// ── SCORE ──────────────────────────────────────────────────
// Score panel is now rendered directly from /api/tier/status data in init().
// renderScore() is kept as a no-op so existing callers don't break.
function renderScore() { /* populated by init() via /api/tier/status */ }

function renderScoreError() {
  document.getElementById("scoreValue").textContent = "— / 100";
  document.getElementById("scoreFill").style.width  = "0%";
  document.getElementById("scoreHint").textContent  = "Backend not reachable";
}

// ── SHARED ERROR RENDERER ──────────────────────────────────
function renderError(listId, message) {
  showError(document.getElementById(listId), message);
}

// ── HANDLERS ───────────────────────────────────────────────
async function handleSubmit() {
  if (state.running) return;
  state.running = true;

  const btn = document.getElementById("submitBtn");
  btn.textContent = "Running…";
  btn.disabled    = true;

  try {
    const taskId    = state.currentTask?.id ?? "";
    const prSummary = `Fix applied: ${state.currentTask?.title ?? ""}`;

    // Submit the current task only — /api/diagnostics/submit is called
    // separately when the user selects an answer to a diagnostic question.
    const taskResult = await apiFetch("/api/tasks/submit", {
      method: "POST",
      body: JSON.stringify({ taskId, prSummary }),
    });

    const updatedDiagnostics =
      taskResult.diagnostics ?? state.currentTask?.diagnostics ?? [];
    const updatedResult =
      taskResult.result ?? state.currentTask?.result ?? null;

    state.currentTask = {
      ...state.currentTask,
      diagnostics: updatedDiagnostics,
      result:      updatedResult,
    };

    state.submitted = true;
    state.running   = false;
    renderTaskFromCache();

    // Refresh Trust Score from /api/tier/status
    try {
      const tier  = await apiFetch("/api/tier/status");
      const score = tier.diagnosticScore ?? 0;
      document.getElementById("scoreValue").textContent = `${score} / 100`;
      document.getElementById("scoreFill").style.width  = `${score}%`;
      document.getElementById("scoreHint").textContent  = tier.tierLabel ?? "";
    } catch (_) { /* score refresh is best-effort */ }

    // Refresh compliance after a submission (sign-off states may have changed)
    loadAndRenderCompliance();
  } catch (e) {
    state.running = false;
    btn.textContent = "Run Diagnostic";
    btn.disabled    = false;

    const rb = document.getElementById("resultBlock");
    rb.style.display = "block";
    rb.className     = "result-block warning";
    rb.textContent   = e.message;
  }
}

async function handleNext() {
  if (state.currentStep >= state.steps.length - 1) return;
  state.currentStep += 1;
  state.submitted    = false;
  state.running      = false;
  state.currentTask  = null;

  // Optimistically re-render structural elements, then reload data
  renderProgressTrack();
  renderScore();

  await Promise.all([
    loadAndRenderTask(),
    loadAndRenderCompliance(),
    loadAndRenderResources(),
  ]);
}

// ── BOOT ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Attach button listeners exactly once — never inside render functions.
  document.getElementById("submitBtn").addEventListener("click", handleSubmit);
  document.getElementById("nextBtn").addEventListener("click", handleNext);
  init();
});
