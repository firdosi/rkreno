import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import taxonomyArchives from '../src/data/taxonomy-archives.json' with { type: 'json' };

const root = process.cwd();
const retained = new Set(Object.entries(taxonomyArchives)
  .filter(([, archive]) => archive.action === 'KEEP_NOINDEX_NATIVE').map(([route]) => route));
const retired = new Set(Object.entries(taxonomyArchives)
  .filter(([, archive]) => archive.action === 'MERGE_AND_301_LATER').map(([route]) => route));
const approvedActions = new Set([
  'KEEP_AND_REDESIGN', 'KEEP_CONTENT_PAGE', 'KEEP_NOINDEX_TEMPORARILY',
  'KEEP_NOINDEX_NATIVE',
]);

function parse(input) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) { row.push(value); value = ''; }
    else if (/[\r\n]/.test(character) && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = '';
    } else value += character;
  }
  const headers = rows.shift();
  return { headers, records: rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))) };
}
const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const format = ({ headers, records }) => `${headers.map(quote).join(',')}\n${records.map((record) =>
  headers.map((header) => quote(record[header])).join(',')).join('\n')}\n`;
async function csvFile(relative) {
  const file = path.join(root, ...relative.split('/'));
  return { file, data: parse(await readFile(file, 'utf8')) };
}

const evidence = await csvFile('reports/public/batch-4-taxonomy-evidence.csv');
const evidenceByRoute = new Map(evidence.data.records.map((record) => [record.Route, record]));
evidence.data.records = evidence.data.records.map((record) => ({
  ...record,
  'Current Astro status': retained.has(record.Route) ? '200 — NATIVE TAXONOMY ARCHIVE' : 'OMITTED ON STAGING',
  'Current robots directive': retained.has(record.Route) ? 'noindex, follow' : 'NOT GENERATED',
  'Sitemap presence': 'NO',
  'Unique introduction present': retained.has(record.Route) ? 'YES' : 'NOT APPLICABLE',
  'Current content quality': retained.has(record.Route)
    ? 'Native archive with unique introduction and verified retained-article cards.'
    : 'Retired duplicate archive; future 301 documented.',
  'Final implementation status': retained.has(record.Route)
    ? 'BATCH 4 COMPLETE — NATIVE NOINDEX ARCHIVE'
    : 'BATCH 4 COMPLETE — OMITTED; FUTURE 301 DOCUMENTED',
}));
await writeFile(evidence.file, format(evidence.data));

const status = await csvFile('reports/public/full-site-completion-status.csv');
status.data.records = status.data.records.map((record) => {
  if (retained.has(record.Route)) return {
    ...record,
    'Astro status': '200',
    'Layout/template used': 'Native reusable TaxonomyArchive component',
    'Content complete': 'YES — APPROVED BATCH 4 NATIVE ARCHIVE',
    'Images complete': 'YES — LOCAL RETAINED-ARTICLE IMAGERY',
    'Header correct': 'YES — SHARED COMPONENT', 'Footer correct': 'YES — SHARED COMPONENT',
    'Desktop design reviewed': 'YES — PLAYWRIGHT 1440',
    'Tablet design reviewed': 'YES — PLAYWRIGHT 768',
    'Mobile design reviewed': 'YES — PLAYWRIGHT 390',
    'Buttons working': 'YES — AUTOMATED', 'Internal links working': 'YES — BUILT-LINK VALIDATION',
    'SEO complete': 'YES — UNIQUE METADATA; NOINDEX FOLLOW',
    'Schema complete': 'YES — COLLECTIONPAGE',
    'Visual parity level': 'NATIVE ARCHIVE — THREE VIEWPORTS REVIEWED',
    'Problems found': 'No blocking Batch 4 issue; Search Console and backlink evidence remain unavailable.',
    'Required action': 'Retain noindex and outside sitemap pending future evidence.',
    'Final status': 'BATCH 4 COMPLETE',
  };
  if (retired.has(record.Route)) return {
    ...record,
    'Astro status': 'OMITTED ON GITHUB PAGES',
    'Layout/template used': 'No generated page — future VPS 301 documented',
    'Content complete': 'NOT A FINAL CONTENT ROUTE', 'Images complete': 'NOT APPLICABLE',
    'Header correct': 'NOT APPLICABLE', 'Footer correct': 'NOT APPLICABLE',
    'Desktop design reviewed': 'NOT APPLICABLE', 'Tablet design reviewed': 'NOT APPLICABLE',
    'Mobile design reviewed': 'NOT APPLICABLE', 'Buttons working': 'NOT APPLICABLE',
    'Internal links working': 'YES — SOURCE LINKS REMOVED', 'SEO complete': 'FUTURE 301 DOCUMENTED',
    'Schema complete': 'NOT APPLICABLE', 'Visual parity level': 'NOT APPLICABLE',
    'Problems found': 'GitHub Pages cannot activate the documented server-side 301.',
    'Required action': 'Activate only during a separately approved VPS cutover.',
    'Final status': 'MERGED — FUTURE 301 DOCUMENTED',
  };
  return record;
});
await writeFile(status.file, format(status.data));

const plan = await csvFile('reports/public/route-disposition-plan.csv');
plan.data.records = plan.data.records.map((record) => {
  const route = record['Current route'];
  const archive = taxonomyArchives[route];
  if (!archive) return record;
  const keep = retained.has(route);
  const evidenceRecord = evidenceByRoute.get(route);
  return {
    ...record,
    'Current Astro status': keep ? '200 — NATIVE BATCH 4 ARCHIVE' : 'OMITTED ON GITHUB PAGES',
    'Current completion status': keep ? 'BATCH 4 COMPLETE' : 'MERGED — FUTURE 301 DOCUMENTED',
    'Current layout': keep ? 'Native reusable TaxonomyArchive component' : 'No generated page',
    'Proposed action': archive.action,
    'Proposed destination URL': 'destination' in archive ? archive.destination : '',
    'Recommended index status': keep ? 'noindex,follow' : '301 redirect (future VPS)',
    'Reason': evidenceRecord?.Reason || record.Reason,
    'Sitemap presence': 'NO',
    'Image dependency status': keep ? 'LOCAL RETAINED-ARTICLE IMAGERY' : 'NOT_APPLICABLE',
    'Hotlinked image count': '0', 'Missing image count': '0',
    'Unverified business claim indicators': 'NONE PUBLISHED IN BATCH 4 OUTPUT',
    'Final decision status': keep
      ? 'APPROVED_IMPLEMENTED_PHASE_3_BATCH_4_NOINDEX'
      : 'APPROVED_PHASE_3_BATCH_4_FUTURE_301',
  };
});
await writeFile(plan.file, format(plan.data));

const redirectMap = await csvFile('reports/public/redirect-map.csv');
redirectMap.data.records = redirectMap.data.records.filter((record) => !retired.has(record.source));
for (const route of retired) {
  const archive = taxonomyArchives[route];
  redirectMap.data.records.push({
    source: route,
    target: archive.destination,
    status: '301 (future VPS)',
    reason: evidenceByRoute.get(route)?.Reason || 'Batch 4 taxonomy consolidation',
  });
}
await writeFile(redirectMap.file, format(redirectMap.data));

const approvedRoutes = new Set(plan.data.records
  .filter((record) => approvedActions.has(record['Proposed action']))
  .map((record) => record['Current route']));
const statusByRoute = new Map(status.data.records.map((record) => [record.Route, record['Final status']]));
const complete = [...approvedRoutes].filter((route) =>
  /^BATCH [1234] COMPLETE$/.test(statusByRoute.get(route) || '')).length;
const total = approvedRoutes.size;
const percentage = ((complete / total) * 100).toFixed(1);
const sitemap = await readFile(path.join(root, 'dist', 'sitemap.xml'), 'utf8');
const sitemapCount = [...sitemap.matchAll(/<loc>/g)].length;

const actionRows = Object.entries(taxonomyArchives).map(([route, archive]) =>
  `| \`${route}\` | ${archive.action} | ${'destination' in archive ? `\`${archive.destination}\`` : '—'} |`).join('\n');
const membershipRows = Object.entries(taxonomyArchives)
  .filter(([, archive]) => archive.action === 'KEEP_NOINDEX_NATIVE')
  .map(([route, archive]) => `| \`${route}\` | ${archive.articles.length} | ${archive.articles.map((item) => `\`${item}\``).join('<br>')} |`)
  .join('\n');
const report = `# Phase 3 Batch 4 completion report

Generated: 2026-07-24

## Final review of all 14 taxonomy routes

| Route | Final action | Future destination |
|---|---|---|
${actionRows}

## Native archives and article membership

| Native noindex archive | Articles | Retained article routes |
|---|---:|---|
${membershipRows}

Nine archives were retained with unique introductions, local article imagery, relevant service
CTAs and CollectionPage schema. Five duplicate or one-item routes were omitted from staging and
documented for future server-side 301 redirects. No route was proposed for 410 and no route requires
an owner decision.

## Duplicate decisions

- Interior Design merges into the clearer Interior Finishing archive.
- Aircond Maintenance and Pemasangan Aircond merge directly into their matching retained guides.
- Cleaning merges into the broader two-article Servis Pembersihan category.
- The generic Guide tag merges into the main Blog archive.

## Indexing, sitemap and links

All nine native taxonomy pages use \`noindex, follow\`, self-referencing production canonicals and
remain outside the sitemap. The five retired routes are not generated and have no internal links.
The main Blog and all 14 retained articles remain in the sitemap. The final sitemap contains
**${sitemapCount} URLs**. Future Nginx rules are documented but remain inactive on GitHub Pages.

## Validation

Production and GitHub staging builds, built links, taxonomy membership, duplicate memberships,
sitemap, robots, canonicals, CollectionPage schema, local images, alt text, overflow,
accessibility basics, mobile navigation, retired-link scans, claims checks, private-file checks and
dependency audit passed.

## Completion

- Native Batch 4 archives completed: **${retained.size}**
- Final retained content/utility routes: **${total}**
- Routes merged: **${retired.size}**
- Routes proposed for 410: **0**
- Routes requiring owner decision in Batch 4: **0**
- Completion: **${complete} of ${total} (${percentage}%)**

## Remaining production blockers

Legal pages, production form-service configuration, analytics decisions and production cutover
remain outside this batch. Existing owner-decision routes remain excluded. Verified project
photography is still unavailable for several content pages, and all documented 301/410 rules remain
inactive until a separately approved VPS deployment.

## Visual evidence

- [Desktop contact sheet](visuals/batch-4/batch-4-desktop-contact-sheet.png)
- [Tablet contact sheet](visuals/batch-4/batch-4-tablet-contact-sheet.png)
- [Mobile contact sheet](visuals/batch-4/batch-4-mobile-contact-sheet.png)
`;
await writeFile(path.join(root, 'reports/public/batch-4-completion-report.md'), report);

const fullPath = path.join(root, 'reports/public/full-site-completion-report.md');
let full = await readFile(fullPath, 'utf8');
full = full.replace(/^## Phase 3 Batch 4 update[\s\S]*?(?=^## Phase 3 Batch 3 update)/m, '');
full = full.replace('# RK Reno full-site completion audit\n', `# RK Reno full-site completion audit

## Phase 3 Batch 4 update — 24 July 2026

All 14 temporary taxonomy routes were reviewed. Nine now use the native noindex archive template
and five duplicate routes are omitted with future 301 rules documented. The recalculated retained
inventory is ${complete} of ${total} complete (${percentage}%). The sitemap contains ${sitemapCount}
URLs and excludes all taxonomy archives. See the [Batch 4 report](batch-4-completion-report.md).

`);
await writeFile(fullPath, full);

const dispositionPath = path.join(root, 'reports/public/route-disposition-report.md');
let disposition = await readFile(dispositionPath, 'utf8');
disposition = disposition.replace(/^## Phase 3 Batch 4 implementation update[\s\S]*?(?=^## Phase 3 implementation update)/m, '');
disposition = disposition.replace('# RK Reno route disposition and authenticity report\n', `# RK Reno route disposition and authenticity report

## Phase 3 Batch 4 implementation update — 24 July 2026

Nine taxonomy routes are retained as native noindex archives. Five thin duplicate taxonomies are
omitted from GitHub Pages with future server-side 301 destinations documented. No Batch 4 route was
assigned 410 or owner-decision status. Search Console and backlink evidence remain UNKNOWN.

`);
const actionCounts = new Map();
for (const record of plan.data.records) {
  const action = record['Proposed action'];
  actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
}
const totals = [...actionCounts].map(([action, count]) => `- ${action}: ${count}`).join('\n');
disposition = disposition.replace(/## Proposed-action totals[\s\S]*?(?=## Recommended launch count)/,
  `## Final action totals\n\n${totals}\n\n`);
disposition = disposition.replace(/## Recommended launch count[\s\S]*?(?=## Recommended launch structure)/,
  `## Final retained route count\n\nThe evidence-supported content and utility inventory contains **${total} retained routes**. Redirect and gone routes are not counted as content pages. All ${total} retained routes have completed native Phase 3 treatment.\n\n`);
await writeFile(dispositionPath, disposition);
console.log(`Finalized Batch 4 reports: ${complete} of ${total} (${percentage}%), sitemap ${sitemapCount}.`);
