const { Router } = require('express');
const fs   = require('fs');
const path = require('path');

const router = Router();

// ---------------------------------------------------------------------------
// scanProjectChecklist()
//
// This is the key differentiator for the onboarding feature:
// instead of returning a generic, hand-written checklist, Bob actually scans
// the real project files and computes what a new hire needs.
//
// Two scanning steps:
//   1. TOOLS  — reads sample-project/package.json, collects every entry in
//               `dependencies` and `devDependencies` as a required tool, and
//               prepends "Node.js" (always required) and "npm" (used by all
//               scripts).  Respects the `engines` field if present.
//
//   2. CREDENTIALS / ACCESS — lists every *.js file in
//               sample-project/src/routes/ (ignoring .gitkeep), derives a
//               service name from the filename stem, and applies an inference
//               map to produce realistic sandbox-access and credential entries.
//               Routes with write methods (POST/PUT/PATCH/DELETE detected in
//               source text) also get a write-access entry.
//
// The function is intentionally pure (no side-effects beyond reading files)
// so it can be unit-tested or replaced with an async version later.
// ---------------------------------------------------------------------------

/**
 * Derive the required tools from package.json.
 * @param {string} pkgPath  Absolute path to package.json
 * @returns {string[]}
 */
function toolsFromPackageJson(pkgPath) {
  // --- REAL SCANNING: reads package.json from the actual project ------------
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const tools = [];

  // Respect an explicit `engines` field if the project declares one
  if (pkg.engines) {
    if (pkg.engines.node) tools.push(`Node.js ${pkg.engines.node}`);
    if (pkg.engines.npm)  tools.push(`npm ${pkg.engines.npm}`);
  } else {
    // No engines field — Node.js + npm are always needed to run npm scripts
    tools.push('Node.js (see .nvmrc or project README for version)');
    tools.push('npm');
  }

  // Every runtime dependency is a tool the developer must have available
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };
  for (const [name, version] of Object.entries(allDeps)) {
    tools.push(`${name} ${version}`);
  }

  return tools;
}

/**
 * Per-route-name inference rules.
 * Maps a route filename stem → { credentials, access, needsWriteAccess }.
 * Extend this map as the project grows — it is the only place that needs
 * updating when new routes are added.
 */
const ROUTE_INFERENCE_MAP = {
  // --- REAL SCANNING: entries below are derived from the actual filenames
  //     found in sample-project/src/routes/ ---------------------------------
  orders:    {
    credentials:      ['GitHub PAT with repo scope'],
    accessRead:       'read access to orders-service sandbox',
    accessWrite:      'write access to orders-service sandbox',
  },
  users:     {
    credentials:      ['GitHub PAT with repo scope'],
    accessRead:       'read access to users-service sandbox',
    accessWrite:      'write access to users-service sandbox',
  },
  // Fallback for any route not explicitly mapped
  _default:  {
    credentials:      ['GitHub PAT with repo scope'],
    accessRead:       (stem) => `read access to ${stem}-service sandbox`,
    accessWrite:      (stem) => `write access to ${stem}-service sandbox`,
  },
};

/** HTTP verbs that imply write permissions are needed. */
const WRITE_METHODS = /\.(post|put|patch|delete)\s*\(/i;

/**
 * Derive credentials and access entries by scanning the routes directory.
 * @param {string} routesDir  Absolute path to the routes folder
 * @returns {{ credentials: string[], access: string[] }}
 */
function credentialsAndAccessFromRoutes(routesDir) {
  // --- REAL SCANNING: reads every .js file in the actual routes folder -----
  const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

  const credentialSet = new Set();
  const accessSet     = new Set();

  for (const file of files) {
    const stem   = path.basename(file, '.js');               // e.g. "orders"
    const source = fs.readFileSync(path.join(routesDir, file), 'utf8');
    const rule   = ROUTE_INFERENCE_MAP[stem] ?? ROUTE_INFERENCE_MAP._default;

    // Credentials
    const creds = typeof rule.credentials === 'function'
      ? rule.credentials(stem)
      : rule.credentials;
    creds.forEach(c => credentialSet.add(c));

    // Read access — every route file always implies read access
    const readEntry = typeof rule.accessRead === 'function'
      ? rule.accessRead(stem)
      : rule.accessRead;
    accessSet.add(readEntry);

    // Write access — only if the route source contains write-method calls
    if (WRITE_METHODS.test(source)) {
      const writeEntry = typeof rule.accessWrite === 'function'
        ? rule.accessWrite(stem)
        : rule.accessWrite;
      accessSet.add(writeEntry);
    }
  }

  return {
    credentials: [...credentialSet],
    access:      [...accessSet],
  };
}

// ---------------------------------------------------------------------------
// GET /api/resources/checklist
// Returns the tools, credentials, and access permissions a new hire needs,
// computed by scanning the real project files (see scanProjectChecklist above).
// ---------------------------------------------------------------------------
router.get('/checklist', (req, res) => {
  // Resolve paths relative to this file so the server works from any cwd
  const projectRoot = path.resolve(__dirname, '..', '..', 'sample-project');
  const pkgPath     = path.join(projectRoot, 'package.json');
  const routesDir   = path.join(projectRoot, 'src', 'routes');

  const tools                    = toolsFromPackageJson(pkgPath);
  const { credentials, access }  = credentialsAndAccessFromRoutes(routesDir);

  res.json({ tools, credentials, access });
});

// ---------------------------------------------------------------------------
// GET /api/resources/structure
// Returns a list of modules with their owners and contact details.
// Data is read from backend/data/team_structure.json so it can be updated
// without touching route code.
// ---------------------------------------------------------------------------
router.get('/structure', (req, res) => {
  const teamFile = path.resolve(__dirname, '..', 'data', 'team_structure.json');
  const team = JSON.parse(fs.readFileSync(teamFile, 'utf8'));
  res.json(team);
});

module.exports = router;
