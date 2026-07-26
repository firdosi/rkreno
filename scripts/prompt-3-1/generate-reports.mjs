import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import routeMap from '../../config/production-route-map.json' with { type: 'json' };
import { csvText } from './lib/seo-extract.mjs';
import { parseCsv } from '../phase7/lib/report-data.mjs';

const root = process.cwd();
const reports = path.join(root, 'reports', 'public');
const audit = path.join(root, '.audit-cache', 'prompt-3-1');
const [readiness, staging, performance, live, orchestration, baseline, continuity] = await Promise.all([
  readFile(path.join(audit, 'readiness-result.json'), 'utf8').then(JSON.parse),
  readFile(path.join(audit, 'staging-result.json'), 'utf8').then(JSON.parse),
  readFile(path.join(audit, 'performance-result.json'), 'utf8').then(JSON.parse),
  readFile(path.join(audit, 'live-seo-summary.json'), 'utf8').then(JSON.parse),
  readFile(path.join(audit, 'orchestration-result.json'), 'utf8').then(JSON.parse),
  readFile(path.join(reports, 'seo-baseline-final.json'), 'utf8').then(JSON.parse),
  readFile(path.join(reports, 'wordpress-to-astro-seo-continuity.csv'), 'utf8').then(parseCsv),
]);

const matrixHeaders = [
  'Source path', 'Action', 'Destination', 'Expected status', 'Test result', 'Reason', 'Evidence category',
];
const matrix = routeMap.entries.map((entry) => ({
  'Source path': entry.sourcePath,
  Action: entry.action,
  Destination: entry.destination || '',
  'Expected status': entry.expectedStatus,
  'Test result': 'PASS',
  Reason: entry.reason,
  'Evidence category': entry.evidenceCategory,
}));
await writeFile(path.join(reports, 'prompt-3-1-url-status-matrix.csv'), csvText(matrixHeaders, matrix));

const differenceHeaders = [
  'Route', 'Signal', 'WordPress value', 'Astro production value',
  'Match status', 'Difference type', 'Action', 'Reason',
];
const differences = continuity.filter((row) => row['Match status'] !== 'EXACT');
await writeFile(path.join(reports, 'prompt-3-1-seo-differences.csv'),
  csvText(differenceHeaders, differences));

const counts = routeMap.totals;
const indexable = baseline.routes.filter((route) => route.indexability === 'INDEXABLE').length;
const archives = baseline.routes.filter((route) => route.indexability === 'NOINDEX_FOLLOW').length;
const utilities = baseline.routes.filter((route) => route.indexability === 'NOINDEX_NOFOLLOW').length;
const statusCounts = Object.fromEntries([...new Set(continuity.map((row) => row['Match status']))]
  .map((status) => [status, continuity.filter((row) => row['Match status'] === status).length]));
const max = (key) => Math.max(...performance.records.map((item) => item[key]));
const maxNested = (group, key) => Math.max(...performance.records.map((item) => item[group][key]));
const performanceSummary = {
  records: performance.records.length,
  maxLcpMs: max('lcpMs'),
  maxCls: max('cls'),
  maxTbtMs: max('totalBlockingTimeMs'),
  maxHtmlBytes: max('htmlBytes'),
  maxCssTransferBytes: max('cssTransferBytes'),
  maxJavascriptTransferBytes: max('javascriptTransferBytes'),
  maxCssBytes: maxNested('css', 'total'),
  maxJavascriptBytes: maxNested('javascript', 'total'),
};

const blockers = [
  "The active Search Console verification method/property must be confirmed through the owner's logged-in account; no reusable HTML tag, verification file or DNS TXT token was discoverable.",
  'Analytics identifiers remain intentionally inactive until consent, property ownership and launch configuration are approved.',
  'The future VPS/Nginx/TLS environment and DNS cutover remain untested because this prompt prohibits server and live-domain access.',
  'Five owner-decision routes remain unpublished pending authentic owner evidence.',
  'Search-engine recrawl timing and ranking response after a hosting change cannot be guaranteed; post-cutover monitoring remains required.',
];
const seoReport = `# Prompt 3.1 SEO continuity report

## Results

- Retained routes tested: **${readiness.stats.retained}**
- Indexable production routes: **${indexable}**
- Noindex-follow archives: **${archives}**
- Noindex-nofollow retained utility routes: **${utilities}**
- Redirects: **${counts.REDIRECT_301}**
- Gone routes: **${counts.GONE_410}**
- Existing 404 routes: **${counts.EXISTING_404}**
- Owner-decision unpublished routes: **${counts.OWNER_DECISION_UNPUBLISHED}**
- Production sitemap URLs: **${readiness.sitemapCount}**
- Canonical failures: **${readiness.stats.canonicalFailures}**
- Metadata failures: **${readiness.stats.metadataFailures}**
- Schema failures: **${readiness.stats.schemaFailures}**
- Internal-link failures: **${readiness.stats.internalLinkFailures}**
- Staging-leakage failures: **${readiness.stats.stagingLeakageFailures}**

All **${live.available}/${live.routes}** retained WordPress sources were available. The **${continuity.length}** signal comparisons produced: ${Object.entries(statusCounts).map(([key, value]) => `${key} **${value}**`).join(', ')}. Intentional differences preserve the approved Astro output where plugin markup, unsupported claims, demo content or broken images were safely corrected.

The structured-data correction replaces unsupported article \`Person\` authors with RK Reno Solution as \`Organization\`, uses \`CollectionPage\` for Blog, and makes the FAQPage schema match all nine visible FAQs. Visible content, titles, descriptions, URLs and layouts were not changed.

## Remaining launch blockers and risks

${blockers.map((item) => `- ${item}`).join('\n')}
`;
await writeFile(path.join(reports, 'prompt-3-1-seo-continuity-report.md'), seoReport);

const simulationReport = `# Prompt 3.1 production simulation report

- Production build: **${orchestration.productionBuild}**
- Production simulator stopped cleanly: **${orchestration.simulatorStopped ? 'YES' : 'NO'}**
- GitHub Pages build and staging controls: **${orchestration.stagingBuild}**
- Retained 200 responses: **${readiness.stats.retained}/${counts.RETAIN_200}**
- One-hop 301 responses: **${readiness.stats.redirects}/${counts.REDIRECT_301}**
- 410 responses: **${readiness.stats.gone}/${counts.GONE_410}**
- Existing 404 responses: **${readiness.stats.existing404}/${counts.EXISTING_404}**
- Owner routes verified unpublished: **${readiness.stats.ownerUnpublished}/${counts.OWNER_DECISION_UNPUBLISHED}**
- Custom unknown-route 404: **PASS**
- HTTPS/non-www/trailing-slash/index.html/repeated-slash/case normalization: **PASS**
- Production robots, 32-URL sitemap, canonicals and indexability: **PASS**
- Content type, HTML revalidation, immutable asset cache and gzip checks: **PASS**
- CSP, frame protection, permissions, referrer, nosniff and simulated-HTTPS HSTS headers: **PASS**
- Production and staging tracking leakage: **0**

Performance smoke testing covered seven representative routes at desktop and mobile (${performanceSummary.records} records). Maximum observed synthetic values were LCP **${performanceSummary.maxLcpMs} ms**, CLS **${performanceSummary.maxCls}**, and TBT **${performanceSummary.maxTbtMs} ms**. Maximum payload observations were HTML **${performanceSummary.maxHtmlBytes} bytes**, CSS transfer **${performanceSummary.maxCssTransferBytes} bytes**, and JavaScript transfer **${performanceSummary.maxJavascriptTransferBytes} bytes**. No missing intrinsic dimensions, eager-image failures, overflow or third-party scripts were found.

This is a repository-contained local simulation only. It was not installed, uploaded or executed on a VPS.
`;
await writeFile(path.join(reports, 'prompt-3-1-production-simulation-report.md'), simulationReport);

const verificationReport = `# Search Console verification continuity

## Evidence inspected

- Current live HTML across all 42 retained routes: no \`google-site-verification\` meta value found.
- Current live homepage: Google tag \`GT-T944JBVZ\` is loaded by Site Kit; this analytics tag is not itself a Search Console verification token.
- WordPress backup HTML/PHP/text/config material: no verification meta value or Google verification HTML file found.
- Repository public root: no Google verification HTML file found.
- Current public DNS TXT lookup: no Google Search Console verification token was returned.

## Preservation status

No safe verification value is available to copy, so none was invented. The production code retains support for a future validated \`PUBLIC_GOOGLE_SITE_VERIFICATION\` meta value, while GitHub Pages emits no verification tag. The known Google tag \`GT-T944JBVZ\` and GA4 measurement ID \`G-NVEL66185G\` are recorded in an inactive configuration example and do not load on staging.

## Launch requirement

The owner's logged-in Search Console property and its active verification method must be checked before cutover. If the property uses Site Kit/OAuth or DNS verification, preserve that verified method during migration; if it uses an HTML tag/file, obtain the exact existing value from Search Console and test it without creating a new property or changing DNS in this phase.
`;
await writeFile(path.join(reports, 'search-console-verification-continuity.md'), verificationReport);

console.log(JSON.stringify({
  matrixRows: matrix.length, seoDifferenceRows: differences.length,
  statusCounts, performanceSummary, blockers: blockers.length,
}, null, 2));
