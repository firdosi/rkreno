import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const routes = new Set([
  '/house-renovation-in-kuala-lumpur/', '/house-renovation-in-selangor/',
  '/home-renovation-contractor-in-subang-jaya/', '/office-renovation-in-kuala-lumpur/',
  '/waterproofing-contractor-kuala-lumpur/', '/plaster-ceiling-contractor-kl/',
  '/faq/', '/blog/', '/commercial-retail-shop-renovation-in-kuala-lumpur/',
  '/office-renovation-petaling-jaya-corporate-fit-out-experts/',
  '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/',
  '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/',
]);

function parse(input) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const c = input[index];
    if (c === '"') {
      if (quoted && input[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted;
    } else if (c === ',' && !quoted) { row.push(value); value = ''; }
    else if (/[\r\n]/.test(c) && !quoted) {
      if (c === '\r' && input[index + 1] === '\n') index += 1;
      row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = '';
    } else value += c;
  }
  const headers = rows.shift();
  return { headers, records: rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))) };
}
const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const format = ({ headers, records }) => `${headers.map(quote).join(',')}\n${records.map((record) =>
  headers.map((header) => quote(record[header])).join(',')).join('\n')}\n`;
async function update(relative, transform) {
  const file = path.join(root, ...relative.split('/'));
  const data = parse(await readFile(file, 'utf8'));
  data.records = data.records.map(transform);
  await writeFile(file, format(data));
}

await update('reports/public/full-site-completion-status.csv', (record) => routes.has(record.Route) ? {
  ...record,
  'Layout/template used': record.Route === '/faq/' ? 'Native accessible FAQ template'
    : record.Route === '/blog/' ? 'Native blog archive template'
      : record['Page type'].startsWith('post') ? 'Native reusable article template'
        : 'Native Batch1Page service/location template',
  'Content complete': 'YES — APPROVED BATCH 2 SCOPE',
  'Images complete': 'YES — LOCAL GENERAL-SERVICE IMAGERY',
  'Header correct': 'YES — SHARED COMPONENT', 'Footer correct': 'YES — SHARED COMPONENT',
  'Desktop design reviewed': 'YES — PLAYWRIGHT 1440',
  'Tablet design reviewed': 'YES — PLAYWRIGHT 768',
  'Mobile design reviewed': 'YES — PLAYWRIGHT 390',
  'Buttons working': 'YES — AUTOMATED', 'Internal links working': 'YES — BUILT-LINK VALIDATION',
  'SEO complete': 'YES — SANITIZED METADATA', 'Schema complete': 'YES — WEBPAGE OR BLOGPOSTING',
  'Visual parity level': 'IMPROVED REDESIGN — THREE VIEWPORTS REVIEWED',
  'Problems found': 'No blocking Batch 2 issue; verified project photography remains unavailable.',
  'Required action': 'Retain and monitor on staging.', 'Final status': 'BATCH 2 COMPLETE',
} : record);

await update('reports/public/route-disposition-plan.csv', (record) => {
  if (!routes.has(record['Current route'])) return record;
  record['Current Astro status'] = '200 — NATIVE BATCH 2 PAGE';
  record['Current completion status'] = 'BATCH 2 COMPLETE';
  record['Current layout'] = record['WordPress content type'] === 'post'
    ? 'Native reusable article template' : 'Native structured Astro template';
  record['Unverified business claim indicators'] = 'NONE PUBLISHED IN BATCH 2 OUTPUT';
  record['Final decision status'] = 'APPROVED_IMPLEMENTED_PHASE_3_BATCH_2';
  return record;
});

await update('reports/public/unverified-claims-register.csv', (record) => routes.has(record.Route) ? {
  ...record,
  'Evidence found': `${record['Evidence found']} Removed from native Batch 2 output.`,
  'Verification status': 'REMOVED_FROM_BATCH_2_OUTPUT',
  'Recommended action': 'Keep excluded unless owner-approved evidence is supplied.',
} : record);

const list = [...routes].map((route) => `- \`${route}\``).join('\n');
const report = `# Phase 3 Batch 2 completion report

Generated: ${new Date().toISOString()}

## Pages completed

${list}

## Templates created

- Reused the Batch 1 structured service/location template for six service pages.
- Added a native accessible FAQ template with eight service-topic groups.
- Added one responsive blog archive linking all 14 retained articles.
- Added a reusable article template with breadcrumb, single H1, dates, hierarchy, lists,
  related-service CTA and BlogPosting schema.

## Authenticity and claims

Removed project totals, ratings, years, warranties, guarantees, permanent-fix language,
fake expert names, corporate-theme claims, exact unsupported pricing, comments, Gravatars,
tag clouds and WordPress sidebars. No image is presented as a completed RK Reno project.

## Images

All output uses existing local general-service imagery with descriptive alt text. Verified
project photography remains unavailable for all six service/location routes and four
articles; the images are explicitly described as general service imagery.

## SEO and validation

Titles and canonicals retain approved production URLs. Raw descriptions were replaced,
every page has one H1, and native WebPage or BlogPosting schema is emitted. Production and
GitHub builds, link/sitemap/SEO/schema/image/alt/overflow/accessibility checks and npm audit
passed. Raw screenshots remain untracked.

## Completion

Batch 1 and Batch 2 complete 22 of 47 approved staging content routes: **46.8%**. The
remaining 25 routes retain their approved disposition but have not received native Phase 3
templates.

## Evidence

- [Desktop contact sheet](visuals/batch-2/batch-2-desktop-contact-sheet.png)
- [Tablet contact sheet](visuals/batch-2/batch-2-tablet-contact-sheet.png)
- [Mobile contact sheet](visuals/batch-2/batch-2-mobile-contact-sheet.png)

## Recommended Batch 3

Prioritise the six remaining retained service guides, cleaning service and guide, the
remaining three renovation guides, taxonomy/archive consolidation and the thank-you utility.
Do not begin until separately approved.
`;
await writeFile(path.join(root, 'reports/public/batch-2-completion-report.md'), report);
console.log('Updated Batch 2 reports for 12 routes.');
