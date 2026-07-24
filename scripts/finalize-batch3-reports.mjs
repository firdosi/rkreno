import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const routes = new Set([
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/',
  '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/',
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/',
  '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/',
  '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/',
  '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/',
  '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/',
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/',
  '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/',
  '/servis-cuci-rumah-kl/',
  '/thank-you/',
]);
const articles = new Set([...routes].slice(0, 9));
const approvedActions = new Set(['KEEP_AND_REDESIGN', 'KEEP_CONTENT_PAGE', 'KEEP_NOINDEX_TEMPORARILY']);

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

const status = await csvFile('reports/public/full-site-completion-status.csv');
status.data.records = status.data.records.map((record) => routes.has(record.Route) ? {
  ...record,
  'Layout/template used': articles.has(record.Route) ? 'Native reusable article template'
    : record.Route === '/servis-cuci-rumah-kl/' ? 'Native Batch1Page service design system'
      : 'Native Astro utility-page template',
  'Content complete': 'YES — APPROVED BATCH 3 SCOPE',
  'Images complete': record.Route === '/thank-you/'
    ? 'YES — NO IMAGE REQUIRED'
    : 'YES — LOCAL GENERAL-SERVICE IMAGERY; VERIFIED PROJECT PHOTOGRAPHY PENDING',
  'Header correct': 'YES — SHARED COMPONENT', 'Footer correct': 'YES — SHARED COMPONENT',
  'Desktop design reviewed': 'YES — PLAYWRIGHT 1440',
  'Tablet design reviewed': 'YES — PLAYWRIGHT 768',
  'Mobile design reviewed': 'YES — PLAYWRIGHT 390',
  'Buttons working': 'YES — AUTOMATED', 'Internal links working': 'YES — BUILT-LINK VALIDATION',
  'SEO complete': 'YES — SANITIZED METADATA', 'Schema complete': 'YES — SERVICE, WEBPAGE OR BLOGPOSTING',
  'Visual parity level': 'IMPROVED REDESIGN — THREE VIEWPORTS REVIEWED',
  'Problems found': record.Route === '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/'
    ? 'Seven source images remain unavailable; local general imagery is explicitly identified.'
    : 'No blocking Batch 3 issue; verified project photography remains unavailable.',
  'Required action': 'Retain and monitor on GitHub Pages staging.',
  'Final status': 'BATCH 3 COMPLETE',
} : record);
await writeFile(status.file, format(status.data));

const disposition = await csvFile('reports/public/route-disposition-plan.csv');
disposition.data.records = disposition.data.records.map((record) => {
  if (!routes.has(record['Current route'])) return record;
  record['Current Astro status'] = '200 — NATIVE BATCH 3 PAGE';
  record['Current completion status'] = 'BATCH 3 COMPLETE';
  record['Current layout'] = articles.has(record['Current route'])
    ? 'Native reusable article template'
    : record['Current route'] === '/thank-you/'
      ? 'Native Astro utility-page template'
      : 'Native structured service template';
  record['Unverified business claim indicators'] = 'NONE PUBLISHED IN BATCH 3 OUTPUT';
  record['Image dependency status'] = record['Current route'] === '/thank-you/'
    ? 'NOT_APPLICABLE'
    : 'LOCAL GENERAL-SERVICE IMAGE; VERIFIED PROJECT PHOTOGRAPHY UNAVAILABLE';
  record['Hotlinked image count'] = '0';
  record['Missing image count'] = '0';
  record['Final decision status'] = 'APPROVED_IMPLEMENTED_PHASE_3_BATCH_3';
  return record;
});
await writeFile(disposition.file, format(disposition.data));

const claims = await csvFile('reports/public/unverified-claims-register.csv');
claims.data.records = claims.data.records.map((record) => routes.has(record.Route) ? {
  ...record,
  'Evidence found': `${record['Evidence found']} Removed or rewritten in native Batch 3 output.`,
  'Verification status': 'REMOVED_FROM_BATCH_3_OUTPUT',
  'Recommended action': 'Keep excluded unless owner-approved evidence is supplied.',
} : record);
await writeFile(claims.file, format(claims.data));

const approvedRoutes = new Set(disposition.data.records
  .filter((record) => approvedActions.has(record['Proposed action']))
  .map((record) => record['Current route']));
const statusByRoute = new Map(status.data.records.map((record) => [record.Route, record['Final status']]));
const complete = [...approvedRoutes].filter((route) => /^BATCH [123] COMPLETE$/.test(statusByRoute.get(route) || '')).length;
const total = approvedRoutes.size;
const percentage = ((complete / total) * 100).toFixed(1);
const remaining = total - complete;

const taxonomy = [
  '/category/commercial/', '/category/hvac-guides/', '/category/interior-design/',
  '/category/maintenance/', '/category/renovation/', '/category/servis-pembersihan/',
  '/category/technical-guides/', '/tag/aircond-maintenance/', '/tag/cleaning/',
  '/tag/guide/', '/tag/interior-finishing/', '/tag/office-fit-out/',
  '/tag/pemasangan-aircond/', '/tag/waterproofing/',
];
const routeList = [...routes].map((route) => `- \`${route}\``).join('\n');
const taxonomyList = taxonomy.map((route) => `- \`${route}\``).join('\n');
const report = `# Phase 3 Batch 3 completion report

Generated: 2026-07-24

## Routes completed

${routeList}

## Templates and content

- Reused and improved the native article template for all nine Batch 3 articles, adding
  published/modified dates, optional H3 sections, responsive tables and page-specific related links.
- Reused the Batch 1 service design system for the cleaning landing page.
- Added a focused, accessible utility template for the thank-you route.
- The blog archive links all 14 retained articles. All 14 now use native structured templates;
  none uses the generic legacy renderer.

## Authenticity and metadata

Removed or rewrote fake experts and employee names, credentials, ratings, customer/project totals,
warranties, guarantees, permanent-fix language, cheapest/best claims, productivity promises,
emergency and 24/7 claims, fixed completion claims, unsupported exact pricing, imported examples,
testimonials and product recommendations. Titles and descriptions are natural and route-specific.
Production canonicals remain on \`https://rkrenosolution.com/\`. The thank-you route is noindex,
nofollow and excluded from the sitemap; it does not emit a lead event on page view.

## Images

The WordPress backup contained no matching Batch 3 source files. Eight referenced January source
images and all seven deep-cleaning article images return HTTP 404 in production. Existing local,
approved general-service imagery was substituted and described neutrally; it is not presented as
customer-project photography. Verified project photography remains unavailable for all ten Batch 3
content routes. The thank-you utility requires no image.

| Route | Local substitution | Photography status |
|---|---|---|
| Aircond installation guide | \`Plaster-ceiling-and-aircond-installation-dd789b38.jpg\` | General service image; verified project image unavailable |
| Electrical guide | \`Renovation-planning-and-project-drawings-6cfdb2fc.jpg\` | Neutral planning image; verified electrical project image unavailable |
| Kuala Lumpur renovation guide | \`Home-renovation-service-in-KL-422b205c.jpg\` | General service image; two production sources return 404 |
| Selangor renovation guide | \`Modern-building-renovation-and-property-improvement-b1ec6039.jpg\` | General service image; two production sources return 404 |
| Office renovation guide | \`Office-renovation-service-in-Selangor-7928d19d.jpg\` | General service image; production source returns 404 |
| Deep-cleaning guide | \`detailed-kitchen-cleaning-kl-67669628.jpg\` | General cleaning image; seven production sources return 404 |
| PU injection guide | \`Bathroom-waterproofing-service-in-KL-3293ca94.jpg\` | General waterproofing image; production source returns 404 |
| Aircond servicing guide | \`Plaster-ceiling-and-aircond-installation-dd789b38.jpg\` | General service image; production source returns 404 |
| Home-cleaning guide | \`detailed-kitchen-cleaning-kl-67669628.jpg\` | General cleaning image; production source returns 404 |
| Home-cleaning service | \`detailed-kitchen-cleaning-kl-67669628.jpg\` | Existing localized general cleaning image; verified project image unavailable |

## Validation

Production and GitHub staging builds, built-link and sitemap validation, Batch 3 SEO/schema/archive
checks, native-template checks, remote-image and missing-alt checks, three-viewport overflow review,
mobile navigation, accessibility basics, heading hierarchy, thank-you indexing rules, claims review,
private-file tracking and dependency audit passed. Compact visual evidence is published below.

## Completion

The completion register calculates **${complete} of ${total} approved routes (${percentage}%)**.
There are **${remaining} approved routes remaining**.

## Visual evidence

- [Desktop contact sheet](visuals/batch-3/batch-3-desktop-contact-sheet.png)
- [Tablet contact sheet](visuals/batch-3/batch-3-tablet-contact-sheet.png)
- [Mobile contact sheet](visuals/batch-3/batch-3-mobile-contact-sheet.png)

## Recommended Batch 4 (not started)

${taxonomyList}
`;
await writeFile(path.join(root, 'reports/public/batch-3-completion-report.md'), report);

const fullReportPath = path.join(root, 'reports/public/full-site-completion-report.md');
let fullReport = await readFile(fullReportPath, 'utf8');
fullReport = fullReport.replace(/^## Phase 3 Batch 3 update[\s\S]*?(?=^## Phase 3 Batch 2 update)/m, '');
fullReport = fullReport.replace('# RK Reno full-site completion audit\n', `# RK Reno full-site completion audit

## Phase 3 Batch 3 update — 24 July 2026

Eleven additional approved routes now use native Astro templates: nine retained articles, the
Kuala Lumpur cleaning service and the thank-you utility. The completion register calculates
${complete} of ${total} approved routes complete (${percentage}%), with ${remaining} remaining.
The blog archive links all 14 retained articles and all 14 use native structured templates.
See the [Batch 3 completion report](batch-3-completion-report.md).

`);
await writeFile(fullReportPath, fullReport);
console.log(`Updated Batch 3 reports: ${complete} of ${total} (${percentage}%).`);
