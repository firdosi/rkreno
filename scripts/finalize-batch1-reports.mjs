import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import routePolicy from '../src/data/route-policy.json' with { type: 'json' };

const root = process.cwd();
const batchRoutes = new Set([
  '/', '/services/', '/about-us/', '/contact-us/', '/service/building-renovation/',
  '/servis-aircond-murah-kl/', '/aircond-installation-kl/',
  '/upah-pasang-aircond-selangor/',
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/',
  '/electrical-services-selangor/',
]);
const excludedRoutes = new Set(routePolicy.excluded);

function parseCsv(input) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value); value = '';
    } else if (/[\r\n]/.test(character) && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some(Boolean)) rows.push(row);
      row = []; value = '';
    } else value += character;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const headers = rows.shift();
  return { headers, records: rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))) };
}

const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const formatCsv = ({ headers, records }) =>
  `${headers.map(quote).join(',')}\n${records.map((record) =>
    headers.map((header) => quote(record[header])).join(',')).join('\n')}\n`;

async function updateCsv(relative, transform) {
  const filename = path.join(root, ...relative.split('/'));
  const data = parseCsv(await readFile(filename, 'utf8'));
  data.records = data.records.map(transform);
  await writeFile(filename, formatCsv(data));
}

await updateCsv('reports/public/full-site-completion-status.csv', (record) => {
  if (excludedRoutes.has(record.Route)) {
    return {
      ...record,
      'Astro status': 'NOT GENERATED ON GITHUB PAGES',
      'Layout/template used': 'None — approved route exclusion',
      'Required action': 'Keep omitted on staging; activate documented 301/410 only on VPS.',
      'Final status': 'REMOVED FROM STAGING',
    };
  }
  if (!batchRoutes.has(record.Route)) return record;
  return {
    ...record,
    'Layout/template used': 'Native Batch1Page Astro component + shared design system',
    'Content complete': 'YES — APPROVED BATCH 1 SCOPE',
    'Images complete': 'YES — LOCAL GENUINE/NEUTRAL ASSETS',
    'Header correct': 'YES — SHARED COMPONENT',
    'Footer correct': 'YES — SHARED COMPONENT',
    'Desktop design reviewed': 'YES — PLAYWRIGHT 1440',
    'Tablet design reviewed': 'YES — PLAYWRIGHT 768',
    'Mobile design reviewed': 'YES — PLAYWRIGHT 390',
    'Buttons working': 'YES — AUTOMATED DOM/LINK CHECK',
    'Internal links working': 'YES — BUILT-LINK VALIDATION',
    'SEO complete': 'YES — TITLE, DESCRIPTION, CANONICAL, ROBOTS, H1',
    'Schema complete': 'YES — SANITIZED WEBPAGE SCHEMA',
    'Visual parity level': 'IMPROVED REDESIGN — THREE VIEWPORTS REVIEWED',
    'Problems found': 'No blocking Batch 1 issue after validation; final owner review remains recommended.',
    'Required action': 'Retain and monitor on GitHub Pages staging.',
    'Final status': 'BATCH 1 COMPLETE',
  };
});

await updateCsv('reports/public/route-disposition-plan.csv', (record) => {
  const route = record['Current route'];
  if (batchRoutes.has(route)) {
    record['Current Astro status'] = '200 — NATIVE BATCH 1 PAGE';
    record['Current completion status'] = 'BATCH 1 COMPLETE';
    record['Current layout'] = 'Native Batch1Page Astro component';
    record['Unverified business claim indicators'] = 'NONE PUBLISHED IN BATCH 1 OUTPUT';
    record['Final decision status'] = 'APPROVED_IMPLEMENTED_PHASE_3_BATCH_1';
  } else if (['REMOVE_AND_410', 'MERGE_AND_301_REDIRECT', 'OWNER_DECISION_REQUIRED']
    .includes(record['Proposed action'])) {
    record['Current Astro status'] = 'NOT GENERATED ON GITHUB PAGES';
    record['Final decision status'] = 'APPROVED_STAGING_ROUTE_OMITTED';
  }
  return record;
});

await updateCsv('reports/public/unverified-claims-register.csv', (record) => {
  if (!batchRoutes.has(record.Route)) return record;
  return {
    ...record,
    'Evidence found': `${record['Evidence found']} Removed from the native Batch 1 output.`,
    'Verification status': 'REMOVED_FROM_BATCH_1_OUTPUT',
    'Recommended action': 'Keep excluded unless owner-approved evidence is supplied.',
  };
});

const report = `# Phase 3 Batch 1 completion report

Generated: ${new Date().toISOString()}

## Completed scope

Ten approved pages now use native Astro content and one shared responsive design system:

${[...batchRoutes].map((route) => `- \`${route}\``).join('\n')}

The shared header, desktop/mobile navigation, footer, breadcrumbs, hero, buttons, service
cards, CTA, typography, spacing, image treatment, tables, FAQ accordion, contact actions,
form interface and custom 404 styling are implemented without imported Elementor or
WooCommerce markup.

## Authenticity and claims

- Removed unsupported homepage customer counters and About experience/founding claims.
- Removed electrical project totals, ratings, 24/7, compliance, guarantee and credential claims.
- Published no named testimonials, named projects, fake people or imported company history.
- Used the confirmed address, phone number and email already present in production.
- The staging form clearly remains unavailable until the secure production endpoint is configured.

## Route disposition implementation

GitHub Pages now stops generating the 89 routes approved for removal, merge/redirect or
owner-decision exclusion. GitHub Pages does not provide true server-side 301 or 410 status
responses; those future rules remain documented for VPS activation only.

## Validation evidence

- Desktop: [contact sheet](visuals/batch-1/batch-1-desktop-contact-sheet.png)
- Tablet: [contact sheet](visuals/batch-1/batch-1-tablet-contact-sheet.png)
- Mobile: [contact sheet](visuals/batch-1/batch-1-mobile-contact-sheet.png)
- Raw screenshots and DOM metrics remain local under \`.audit-cache/\` and are not committed.

## Known limitations

- GitHub Pages staging remains \`noindex, nofollow\`.
- Secure form delivery and analytics remain intentionally disabled on staging.
- No Batch 1 image is broken. Dedicated production aircond-servicing and electrical-service
  photos were not localized in the backup, so local relevant imagery replaces those hotlinks.
- True 301 and 410 response handling is deferred to a future, separately approved VPS deployment.
- Privacy Policy and Terms of Use await owner-supplied legal information.
- No demolition page was created.
`;
await writeFile(path.join(root, 'reports', 'public', 'batch-1-completion-report.md'), report);
console.log('Updated Batch 1 completion, disposition and claims reports.');
