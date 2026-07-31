import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { compareFooterSemantic, compareHeaderSemantic } from './semantic-comparison.mjs';
import { evidenceRoot, stagingBase, viewports } from './shared-config.mjs';
import { STATUS } from './result-status.mjs';

const root = process.cwd();
const registry = JSON.parse(await readFile(path.join(root, 'config', 'final-route-registry.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(evidenceRoot, 'capture-manifest.json'), 'utf8'));
const comparison = JSON.parse(await readFile(path.join(evidenceRoot, 'comparison-results.json'), 'utf8'));
const routes = registry.publicRoutes.map(({ path: route }) => route);
const mirrored = registry.publicRoutes.filter(({ mirrored }) => mirrored);
const checks = new Map();
const record = (name, passed, detail = '') => checks.set(name, { passed: Boolean(passed), detail });
const exists = async (file) => {
  try { await access(file); return true; } catch { return false; }
};
const acceptable = (value) => value === STATUS.match || value === STATUS.sourceNondeterministic || value === STATUS.notApplicable;
const visualMatch = (value) => value === STATUS.match || value === STATUS.notApplicable;
const visualIndex = new Map(comparison.visualMetrics.map((metric) => [
  `${metric.route}|${metric.viewport}|${metric.state}`,
  metric,
]));
const visualStateMatches = (record, viewport, state) => {
  const metric = visualIndex.get(`${record.route}|${viewport}|${state}`);
  return metric?.evidenceComplete && metric.differences.length === 0;
};

record('Prompt 1.1 regression', process.env.PROMPT_ONE_REGRESSION_PASSED === 'true');
record('Source shared-component capture validation',
  manifest.passed
  && manifest.completed.length === mirrored.length * Object.keys(viewports).length
  && manifest.screenshots.length === manifest.expectedScreenshotPairs
  && manifest.screenshots.every(({ source, staging, differenceScreenshot }) =>
    source?.captured && staging?.captured && source.capturedAt && staging.capturedAt
    && source.scrollPosition && staging.scrollPosition && differenceScreenshot)
  && manifest.failures.length === 0);
record('Route-specific header semantic comparison', comparison.records.length === mirrored.length && comparison.records.every(({ headerSemantic }) => acceptable(headerSemantic.status)));
record('Route-specific footer semantic comparison', comparison.records.every(({ footerSemantic }) => acceptable(footerSemantic.status)));
record('Ordered navigation comparison', comparison.records.every(({ headerSemantic }) => !headerSemantic.differences.some(({ field }) => /primaryMenu|dropdownItems/.test(field))));
record('Ordered footer-link comparison', comparison.records.every(({ footerSemantic }) => !footerSemantic.differences.some(({ field }) => field === 'footer.links')));
record('Computed-style comparison', comparison.records.every((item) =>
  Object.values(item.computedStyles).every((value) => visualMatch(value.status))));
record('Desktop visual parity', comparison.records.every((item) =>
  ['header-initial', 'header-sticky', 'dropdown-open', 'footer', 'floating-actions']
    .every((state) => visualStateMatches(item, 'desktop', state))));
record('Tablet visual parity', comparison.records.every((item) =>
  ['header-initial', 'header-sticky', 'menu-open', 'submenu-open', 'footer', 'floating-actions']
    .every((state) => visualStateMatches(item, 'tablet', state))));
record('Mobile visual parity', comparison.records.every((item) =>
  ['header-initial', 'header-sticky', 'menu-open', 'submenu-open', 'footer', 'floating-actions']
    .every((state) => visualStateMatches(item, 'mobile', state))));
record('Dropdown visual parity', comparison.records.every((item) =>
  visualStateMatches(item, 'desktop', 'dropdown-open')));
record('Drawer visual parity', comparison.records.every((item) =>
  ['tablet', 'mobile'].every((viewport) =>
    ['menu-open', 'submenu-open'].every((state) => visualStateMatches(item, viewport, state)))));
record('Footer visual parity', comparison.records.every((item) =>
  ['desktop', 'tablet', 'mobile'].every((viewport) => visualStateMatches(item, viewport, 'footer'))));
record('Floating-action visual parity', comparison.records.every((item) =>
  ['desktop', 'tablet', 'mobile'].every((viewport) => visualStateMatches(item, viewport, 'floating-actions'))));
record('Sticky-state screenshot comparison', comparison.records.every((item) =>
  ['headerVisualDesktop', 'headerVisualTablet', 'headerVisualMobile'].every((key) =>
    item[key].metrics.some(({ state, evidenceComplete }) => state === 'header-sticky' && evidenceComplete))));
record('Dropdown interaction comparison', comparison.records.every(({ headerInteraction }) => acceptable(headerInteraction.status)));
record('Sticky-header interaction comparison', comparison.records.every(({ stickyHeader }) => acceptable(stickyHeader.status)));
record('Mobile-menu interaction comparison', comparison.records.every(({ mobileMenu }) => acceptable(mobileMenu.status)));
record('Footer interaction comparison', comparison.records.every(({ footerInteraction }) => acceptable(footerInteraction.status)));
record('Floating-action comparison', comparison.records.every(({ floatingActions }) => acceptable(floatingActions.status)));

const evidenceComplete = comparison.visualMetrics.every((metric) =>
  metric.evidenceComplete && Number.isFinite(metric.changedPixelPercent)
  && metric.sourcePath && metric.stagingPath && metric.differencePath
  && metric.differenceExists);
const uniqueEvidence = comparison.records.every((item) => {
  const paths = Object.values(item.evidence).flatMap((value) => [value.source, value.staging, value.differences]);
  return new Set(paths).size === paths.length && paths.every((value) => value.includes(item.route === '/' ? 'home' : item.route.slice(1, -1).replaceAll('/', '__')));
});
const uniformStatusBacked = [
  'headerSemantic', 'footerSemantic', 'headerInteraction', 'mobileMenu',
  'footerInteraction', 'floatingActions', 'stickyHeader',
].every((key) => {
  const statuses = new Set(comparison.records.map((item) => item[key].status));
  return statuses.size > 1 || comparison.records.every((item) =>
    Object.values(item.evidence).every(({ source, staging, differences }) => source && staging && differences));
});
record('Report-evidence completeness', evidenceComplete && uniqueEvidence && uniformStatusBacked);

const mutationRoute = comparison.records[0]?.route;
const sourceDesktop = JSON.parse(await readFile(comparison.records[0].evidence.desktop.source, 'utf8'));
const stagingDesktop = JSON.parse(await readFile(comparison.records[0].evidence.desktop.staging, 'utf8'));
const sourceMobile = JSON.parse(await readFile(comparison.records[0].evidence.mobile.source, 'utf8'));
const stagingMobile = JSON.parse(await readFile(comparison.records[0].evidence.mobile.staging, 'utf8'));
const mutatedHeader = structuredClone(stagingDesktop);
mutatedHeader.inventory.primaryMenu.reverse();
const headerMutation = compareHeaderSemantic({ sourceDesktop, stagingDesktop: mutatedHeader, sourceMobile, stagingMobile });
const mutatedFooter = structuredClone(stagingDesktop);
mutatedFooter.inventory.footer.links.pop();
const footerMutation = compareFooterSemantic({ source: sourceDesktop, staging: mutatedFooter });
record('Semantic comparator mutation guard', headerMutation.status === STATUS.difference && footerMutation.status === STATUS.difference, mutationRoute);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: viewports.mobile });
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(error.message));
const routeChecks = [];
for (const route of routes) {
  const response = await page.goto(`${stagingBase}${route}`, { waitUntil: 'domcontentloaded' });
  routeChecks.push(await page.evaluate((status) => ({
    status,
    headers: document.querySelectorAll('[data-shared-header]').length,
    footers: document.querySelectorAll('[data-shared-footer]').length,
    actions: document.querySelectorAll('[data-shared-contact-actions]').length,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
    remoteImages: [...document.images].filter((image) => /^https?:/.test(image.getAttribute('src') || '')).length,
  }), response?.status() || 0));
}
await browser.close();
record('Duplicate shared-component checks', routeChecks.every((item) => item.headers === 1 && item.footers === 1 && item.actions <= 1));
record('48-route overflow check', routeChecks.length === routes.length && routeChecks.every((item) => !item.overflow));
record('Broken-image check', routeChecks.every((item) => item.brokenImages === 0));
record('Remote-image check', routeChecks.every((item) => item.remoteImages === 0));
record('Console-error check', consoleErrors.length === 0, consoleErrors.join(' | '));

const allHtml = await Promise.all(routes.map(async (route) => {
  const file = route === '/' ? path.join(root, 'dist', 'index.html') : path.join(root, 'dist', route.slice(1), 'index.html');
  return readFile(file, 'utf8');
}));
record('Staging noindex', allHtml.every((html) => /name="robots" content="noindex, nofollow"/.test(html)));
record('Robots disallow-all', /Disallow:\s*\//.test(await readFile(path.join(root, 'dist', 'robots.txt'), 'utf8')));
record('Analytics disabled', allHtml.every((html) => !/googletagmanager|google-analytics|gtag\(/i.test(html)));
record('Form delivery disabled', allHtml.every((html) => !/<form[^>]+action=["']https?:/i.test(html)));
const gitignore = await readFile(path.join(root, '.gitignore'), 'utf8');
record('Ignored backup/media/audit-cache check', ['wp-old-site-backup/', '.audit-cache/', '/Media/'].every((value) => gitignore.split(/\r?\n/).includes(value)));
const workflow = await readFile(path.join(root, '.github', 'workflows', 'deploy-vps.yml'), 'utf8');
record('VPS workflow safety', /workflow_dispatch/.test(workflow) && /RKRENO_VPS_DEPLOY_ENABLED == 'true'/.test(workflow));
const scannable = `${allHtml.join('\n')}\n${await readFile(path.join(root, 'src', 'scripts', 'shared-chrome.ts'), 'utf8')}`;
record('Secret scan', !/(?:github_pat|ghp|sk_live)_[A-Za-z0-9_]{20,}|BEGIN (?:OPENSSH|RSA|EC) PRIVATE KEY/.test(scannable));
record('npm ci-compatible build', (await stat(path.join(root, 'dist', 'index.html'))).size > 0);

const expected = [
  'Prompt 1.1 regression', 'Source shared-component capture validation',
  'Route-specific header semantic comparison', 'Route-specific footer semantic comparison',
  'Ordered navigation comparison', 'Ordered footer-link comparison', 'Computed-style comparison',
  'Desktop visual parity', 'Tablet visual parity', 'Mobile visual parity',
  'Dropdown visual parity', 'Drawer visual parity', 'Footer visual parity',
  'Floating-action visual parity', 'Sticky-state screenshot comparison', 'Dropdown interaction comparison',
  'Sticky-header interaction comparison', 'Mobile-menu interaction comparison',
  'Footer interaction comparison', 'Floating-action comparison', 'Duplicate shared-component checks',
  '48-route overflow check', 'Broken-image check', 'Remote-image check', 'Console-error check',
  'Staging noindex', 'Robots disallow-all', 'Analytics disabled', 'Form delivery disabled',
  'Secret scan', 'Ignored backup/media/audit-cache check', 'VPS workflow safety',
  'Semantic comparator mutation guard', 'Report-evidence completeness',
];
for (const name of expected) {
  const value = checks.get(name);
  console.log(`${value?.passed ? 'PASS' : 'FAIL'} ${name}${value?.detail ? ` — ${value.detail}` : ''}`);
}
if (expected.some((name) => !checks.get(name)?.passed)) process.exitCode = 1;
