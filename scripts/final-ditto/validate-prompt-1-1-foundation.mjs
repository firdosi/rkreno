import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { loadRegistry, root, routeSlug, validateRegistry } from './lib/route-registry.mjs';

const checks = [];
const record = (name, errors = []) => checks.push({ name, passed: errors.length === 0, errors });
const registryResult = await validateRegistry();
record('route registry', registryResult.errors);
const registry = registryResult.registry;

const snapshotErrors = [];
const cache = path.join(root, '.audit-cache', 'prompt-1-1');
let manifest;
try {
  manifest = JSON.parse(await readFile(path.join(cache, 'live-wordpress', 'manifest.json'), 'utf8'));
} catch {
  snapshotErrors.push('Missing source manifest.');
}
if (manifest) {
  if (manifest.routes.length !== registry.expectedTotals.mirroredRoutes) {
    snapshotErrors.push(`Source manifest contains ${manifest.routes.length} routes.`);
  }
  if (!manifest.screenshotCapture) snapshotErrors.push('Source screenshot capture is not recorded.');
  for (const route of registry.publicRoutes.filter(({ mirrored }) => mirrored)) {
    const slug = routeSlug(route.path);
    for (const file of [
      path.join(cache, 'source-html', `${slug}.html`),
      path.join(cache, 'source-semantics', `${slug}.json`),
      path.join(cache, 'source-interactions', `${slug}.json`),
      ...Object.keys(manifest.viewports || {}).map((viewport) =>
        path.join(cache, 'source-screenshots', viewport, `${slug}.png`)),
    ]) {
      try { await access(file); } catch { snapshotErrors.push(`Missing ${path.relative(root, file)}`); }
    }
    const capture = manifest.routes.find(({ path: item }) => item === route.path);
    for (const viewport of Object.keys(manifest.viewports || {})) {
      if (capture?.captures?.[viewport]?.status !== 200) {
        snapshotErrors.push(`${route.path}: invalid ${viewport} source capture`);
      }
    }
  }
}
record('source snapshot', snapshotErrors);

const reportErrors = [];
const requiredReports = [
  'prompt-1-1-truthful-baseline.md',
  'prompt-1-1-bidirectional-parity.json',
  'prompt-1-1-bidirectional-parity.csv',
  'prompt-1-1-interaction-inventory.json',
  'prompt-1-1-interaction-differences.csv',
  'prompt-1-1-source-claim-register.md',
  'prompt-1-1-route-registry-summary.md',
];
for (const file of requiredReports) {
  try { await access(path.join(root, 'reports', 'public', file)); } catch { reportErrors.push(`Missing ${file}`); }
}
let parity;
try {
  parity = JSON.parse(await readFile(path.join(
    root, 'reports', 'public', 'prompt-1-1-bidirectional-parity.json',
  ), 'utf8'));
} catch {
  reportErrors.push('Bidirectional parity JSON is invalid.');
}
if (parity) {
  if (parity.routes.length !== registry.expectedTotals.publicRoutes) {
    reportErrors.push(`Parity report has ${parity.routes.length} routes.`);
  }
  for (const route of parity.routes.filter(({ status }) => status === 'MATCH')) {
    const unresolved = Object.values(route.differences || {}).some((value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value));
    if (unresolved) reportErrors.push(`${route.route}: MATCH hides a difference.`);
  }
}
record('report schemas and no hidden failures', reportErrors);

const falseExactErrors = [];
for (const file of [
  path.join(root, 'reports', 'public', 'final-content-parity.csv'),
  path.join(root, 'reports', 'public', 'final-ditto-review', 'index.html'),
  path.join(root, 'scripts', 'final-ditto', 'generate-reports.mjs'),
  path.join(root, 'scripts', 'final-ditto', 'validate-build.mjs'),
]) {
  const content = await readFile(file, 'utf8');
  if (/\bEXACT\b/.test(content)) falseExactErrors.push(`${path.relative(root, file)} contains EXACT.`);
}
const semanticSource = await readFile(path.join(
  root, 'scripts', 'final-ditto', 'lib', 'semantic-inventory.mjs',
), 'utf8');
if (/\.includes\([^)]*\)/.test(semanticSource)) {
  falseExactErrors.push('Semantic inventory contains containment comparison.');
}
record('false-exact detection', falseExactErrors);

const safetyErrors = [];
const tracked = (await readFile(path.join(root, '.gitignore'), 'utf8')).split(/\r?\n/);
for (const required of ['.audit-cache/', 'wp-old-site-backup/', '/Media/']) {
  if (!tracked.includes(required)) safetyErrors.push(`.gitignore lacks ${required}`);
}
const workflow = await readFile(path.join(root, '.github', 'workflows', 'deploy-vps.yml'), 'utf8');
if (!workflow.includes("github.event_name == 'workflow_dispatch'")
  || !workflow.includes("RKRENO_VPS_DEPLOY_ENABLED == 'true'")) {
  safetyErrors.push('VPS workflow can run without explicit manual enablement.');
}
const trackedFiles = await readdir(root).catch(() => []);
if (!trackedFiles.length) safetyErrors.push('Repository root unreadable.');
record('ignore and VPS workflow safety', safetyErrors);

export const foundationChecks = checks;
export const foundationPassed = checks.every(({ passed }) => passed);
console.log(JSON.stringify({ passed: foundationPassed, checks }, null, 2));
if (!foundationPassed) process.exitCode = 1;
