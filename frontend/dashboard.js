/* ─────────────────────────────────────────────────────────
   dashboard.js  —  Onboarding Trust Ladder (mock data)
   Plain vanilla JS, no framework, no build step.
───────────────────────────────────────────────────────── */

// ── MOCK API CONTRACT ──────────────────────────────────────
const MOCK_STATE = {
  developer: {
    id: "dev-001",
    name: "Alex Chen",
    title: "Junior Developer",
    startDate: "2024-06-10",
    currentStep: 2          // 0-indexed; Alex is on step 2 (Read Access)
  },

  steps: [
    { id: "sandbox",     label: "Sandbox",         short: "1" },
    { id: "dev-env",     label: "Dev Env",          short: "2" },
    { id: "read-access", label: "Read Access",      short: "3" },
    { id: "write-access",label: "Write Access",     short: "4" },
    { id: "full-team",   label: "Full Team Access", short: "5" }
  ],

  compliance: [
    { id: "c1", label: "Security Awareness Training",    status: "done",    note: "Completed 2024-06-11" },
    { id: "c2", label: "NDA Signed",                     status: "done",    note: "Completed 2024-06-10" },
    { id: "c3", label: "Acceptable Use Policy",          status: "done",    note: "Completed 2024-06-10" },
    { id: "c4", label: "Data Classification Review",     status: "warn",    note: "Awaiting manager sign-off" },
    { id: "c5", label: "GDPR Acknowledgement",           status: "done",    note: "Completed 2024-06-12" },
    { id: "c6", label: "2FA Enrolled",                   status: "done",    note: "Completed 2024-06-11" },
    { id: "c7", label: "Device Encryption Verified",     status: "pending", note: "Scheduled for today" },
    { id: "c8", label: "Vulnerability Scan Baseline",    status: "pending", note: "Step 3 prerequisite" }
  ],

  tasks: {
    "sandbox": {
      title: "Spin Up Sandbox Environment",
      description: "Provision your isolated sandbox instance, verify toolchain installation, and confirm networking rules are applied correctly.",
      diagnostics: [
        { key: "sandbox_provisioned",  label: "Sandbox Instance",    value: "Active",    state: "ok"   },
        { key: "docker_version",       label: "Docker Version",      value: "24.0.5",    state: "ok"   },
        { key: "node_version",         label: "Node.js Version",     value: "20.11.1",   state: "ok"   },
        { key: "network_policy",       label: "Network Policy",      value: "Isolated",  state: "ok"   }
      ],
      result: { type: "success", message: "✓ Sandbox is healthy. All toolchain checks passed. Proceed to Dev Environment setup." }
    },
    "dev-env": {
      title: "Configure Development Environment",
      description: "Clone the core repositories, install project dependencies, and verify IDE integration with the internal package registry.",
      diagnostics: [
        { key: "repo_access",          label: "Repo Access (GitLab)", value: "Granted",  state: "ok"   },
        { key: "deps_installed",       label: "npm install",          value: "Clean",    state: "ok"   },
        { key: "registry_auth",        label: "Internal Registry",    value: "Authed",   state: "ok"   },
        { key: "lint_pass",            label: "ESLint Baseline",      value: "0 errors", state: "ok"   }
      ],
      result: { type: "success", message: "✓ Dev environment configured. Linting baseline committed. Ready for read-access promotion." }
    },
    "read-access": {
      title: "Read Access Diagnostic",
      description: "Verify read permissions across all production-adjacent services. This check confirms no write capabilities are inadvertently exposed before the next promotion.",
      diagnostics: [
        { key: "prod_db_read",         label: "Prod DB  (read)",      value: "Allowed",  state: "ok"   },
        { key: "prod_db_write",        label: "Prod DB  (write)",     value: "Denied",   state: "ok"   },
        { key: "s3_read",              label: "S3 Bucket (read)",     value: "Allowed",  state: "ok"   },
        { key: "s3_write",             label: "S3 Bucket (write)",    value: "Denied",   state: "ok"   },
        { key: "secrets_vault",        label: "Secrets Vault",        value: "No access",state: "warn" },
        { key: "audit_log",            label: "Audit Log Trail",      value: "Active",   state: "ok"   }
      ],
      result: { type: "warning", message: "⚠ Read access verified. Secrets Vault exposure is expected at this level — flagged for review before Write Access promotion." }
    },
    "write-access": {
      title: "Write Access Gate",
      description: "Peer-reviewed PRs merged, deployment pipeline permissions scoped, and branch protection rules confirmed on all critical repositories.",
      diagnostics: [
        { key: "prs_merged",           label: "Reviewed PRs Merged",  value: "3 / 3",    state: "ok"   },
        { key: "pipeline_scope",       label: "Pipeline Permissions", value: "Scoped",    state: "ok"   },
        { key: "branch_protection",    label: "Branch Protection",    value: "Enforced",  state: "ok"   },
        { key: "deploy_preview",       label: "Preview Deploy",       value: "Success",   state: "ok"   }
      ],
      result: { type: "success", message: "✓ Write-access gate cleared. PR record meets the 3-merge threshold. Pipeline permissions locked to non-production." }
    },
    "full-team": {
      title: "Full Team Access Promotion",
      description: "Final trust verification: on-call rotation added, SSO group membership updated, and tech lead sign-off recorded. Welcome to the team!",
      diagnostics: [
        { key: "oncall_added",         label: "On-call Rotation",     value: "Added",     state: "ok"   },
        { key: "sso_groups",           label: "SSO Group Membership", value: "Synced",    state: "ok"   },
        { key: "techlead_signoff",     label: "Tech Lead Sign-off",   value: "Recorded",  state: "ok"   },
        { key: "trust_score",          label: "Final Trust Score",    value: "94 / 100",  state: "ok"   }
      ],
      result: { type: "success", message: "🎉 Full Team Access granted. Alex is fully onboarded. Trust Ladder complete." }
    }
  },

  resources: [
    { id: "r1", label: "Internal Wiki — Getting Started",  status: "done",    note: "wiki.corp/onboarding" },
    { id: "r2", label: "Architecture Overview (Confluence)", status: "done",  note: "Reviewed 2024-06-12"  },
    { id: "r3", label: "Runbook: Deploy to Staging",        status: "warn",   note: "Read-only until step 4" },
    { id: "r4", label: "On-call Handbook",                  status: "pending",note: "Available at step 5"  },
    { id: "r5", label: "API Reference Docs",                status: "done",   note: "Bookmarked"           },
    { id: "r6", label: "Incident Response Protocol",        status: "pending",note: "Available at step 5"  }
  ],

  team: [
    { name: "Sam Rivera",    role: "Engineering Manager",  color: "#2563eb", initials: "SR" },
    { name: "Jordan Lee",    role: "Tech Lead",            color: "#7c3aed", initials: "JL" },
    { name: "Priya Nair",    role: "Senior Engineer",      color: "#0891b2", initials: "PN" },
    { name: "Marcus Webb",   role: "Security Champion",    color: "#16a34a", initials: "MW" },
    { name: "Alex Chen",     role: "Junior Developer ★",   color: "#d97706", initials: "AC" }
  ],

  // Score per completed step (cumulative)
  scorePerStep: [14, 28, 44, 68, 100],
  // Partial score while a step is "in progress"
  activeStepScore: [7, 21, 36, 56, 82]
};

// ── STATE ──────────────────────────────────────────────────
let state = {
  currentStep: MOCK_STATE.developer.currentStep,  // 0-indexed
  submitted: false,
  running: false
};

// ── INIT ───────────────────────────────────────────────────
function init() {
  renderProgressTrack();
  renderCompliance();
  renderResources();
  renderTeam();
  renderTask();
  renderScore();
}

// ── PROGRESS TRACK ─────────────────────────────────────────
function renderProgressTrack() {
  const track = document.getElementById("progressTrack");
  track.innerHTML = "";
  const { steps } = MOCK_STATE;
  const { currentStep } = state;

  steps.forEach((step, i) => {
    const cls = i < currentStep ? "done" : i === currentStep ? "active" : "";

    const node = document.createElement("li");
    node.className = "step-item";
    node.setAttribute("role", "listitem");

    const nodeInner = `
      <div class="step-node ${cls}" title="${step.label}">
        <div class="step-circle">${i < currentStep ? "✓" : step.short}</div>
        <span class="step-label-text">${step.label}</span>
      </div>`;

    node.innerHTML = nodeInner;

    if (i < steps.length - 1) {
      const connState = i < currentStep ? "done" : i === currentStep ? "active" : "";
      const connector = document.createElement("div");
      connector.className = `step-connector ${connState}`;
      node.appendChild(connector);
    }

    track.appendChild(node);
  });
}

// ── COMPLIANCE CHECKLIST ───────────────────────────────────
function renderCompliance() {
  const list = document.getElementById("complianceList");
  list.innerHTML = MOCK_STATE.compliance.map(item => checkItem(item)).join("");
}

// ── RESOURCES CHECKLIST ────────────────────────────────────
function renderResources() {
  const list = document.getElementById("resourceList");
  list.innerHTML = MOCK_STATE.resources.map(item => checkItem(item)).join("");
}

function checkItem({ label, status, note }) {
  const icons = { done: "✓", warn: "!", fail: "✕", pending: "○" };
  return `
    <li>
      <span class="check-icon ${status}">${icons[status] || "○"}</span>
      <span class="check-text">
        ${label}
        ${note ? `<span class="check-note">${note}</span>` : ""}
      </span>
    </li>`;
}

// ── TEAM ───────────────────────────────────────────────────
function renderTeam() {
  const list = document.getElementById("teamList");
  list.innerHTML = MOCK_STATE.team.map(m => `
    <li class="team-member">
      <div class="avatar" style="background:${m.color}">${m.initials}</div>
      <div class="member-info">
        <div class="member-name">${m.name}</div>
        <div class="member-role">${m.role}</div>
      </div>
    </li>`).join("");
}

// ── TASK PANEL ─────────────────────────────────────────────
function renderTask() {
  const stepId   = MOCK_STATE.steps[state.currentStep].id;
  const stepName = MOCK_STATE.steps[state.currentStep].label;
  const task     = MOCK_STATE.tasks[stepId];

  document.getElementById("stepLabel").textContent  = `Step ${state.currentStep + 1} of ${MOCK_STATE.steps.length}`;
  document.getElementById("taskStatus").textContent = state.submitted ? "Complete" : "In Progress";
  document.getElementById("taskTitle").textContent  = task.title;
  document.getElementById("taskDesc").textContent   = task.description;

  // diagnostics
  const block = document.getElementById("diagnosticsBlock");
  block.innerHTML = task.diagnostics.map((d, i) => `
    ${i > 0 ? '<div class="diag-separator"></div>' : ""}
    <div class="diag-row">
      <span class="diag-key">${d.label}</span>
      <span class="diag-val ${d.state}">${d.value}</span>
    </div>`).join("");

  // buttons
  const submitBtn = document.getElementById("submitBtn");
  const nextBtn   = document.getElementById("nextBtn");
  const resultBlock = document.getElementById("resultBlock");

  resultBlock.style.display = "none";
  resultBlock.className     = "result-block";

  const isLast = state.currentStep === MOCK_STATE.steps.length - 1;

  if (state.submitted) {
    submitBtn.style.display = "none";
    nextBtn.style.display   = isLast ? "none" : "inline-block";

    resultBlock.style.display = "block";
    resultBlock.className     = `result-block ${task.result.type}`;
    resultBlock.textContent   = task.result.message;
  } else {
    submitBtn.textContent   = "Run Diagnostic";
    submitBtn.disabled      = false;
    submitBtn.style.display = "inline-block";
    nextBtn.style.display   = "none";
  }
}

// ── SCORE ──────────────────────────────────────────────────
function renderScore() {
  const { currentStep, submitted } = state;
  const total = MOCK_STATE.steps.length;
  const score = submitted
    ? MOCK_STATE.scorePerStep[currentStep]
    : currentStep > 0
      ? MOCK_STATE.scorePerStep[currentStep - 1] + Math.round((MOCK_STATE.scorePerStep[currentStep] - MOCK_STATE.scorePerStep[currentStep - 1]) / 2)
      : MOCK_STATE.activeStepScore[currentStep];

  document.getElementById("scoreValue").textContent = `${score} / 100`;
  document.getElementById("scoreFill").style.width  = `${score}%`;

  const hints = [
    "Complete the Sandbox step to unlock Dev Env.",
    "Dev Env configured — read access diagnostic is next.",
    "Read access verified — working toward write permissions.",
    "Write access granted — final promotion awaiting approval.",
    "🎉 All steps complete! Alex is fully onboarded."
  ];
  document.getElementById("scoreHint").textContent =
    (submitted && currentStep === total - 1) ? hints[4] : hints[currentStep];
}

// ── HANDLERS ───────────────────────────────────────────────
function handleSubmit() {
  if (state.running) return;
  state.running = true;

  const btn = document.getElementById("submitBtn");
  btn.textContent = "Running…";
  btn.disabled    = true;

  // simulate async diagnostic (500 ms)
  setTimeout(() => {
    state.submitted = true;
    state.running   = false;
    renderTask();
    renderScore();
    renderCompliance();
  }, 500);
}

function handleNext() {
  if (state.currentStep >= MOCK_STATE.steps.length - 1) return;
  state.currentStep += 1;
  state.submitted    = false;
  state.running      = false;
  renderProgressTrack();
  renderTask();
  renderScore();
  renderCompliance();
  renderResources();
}

// ── BOOT ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
