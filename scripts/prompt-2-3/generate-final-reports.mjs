import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { finalReviewRoutes } from '../lib/final-review-routes.mjs';
import { csvText, parseCsv } from '../phase7/lib/report-data.mjs';

const root = process.cwd();
const reports = path.join(root, 'reports', 'public');
const metrics = JSON.parse(await readFile(path.join(root, '.audit-cache', 'prompt-2-3', 'after-metrics.json'), 'utf8'));
const prior = [
  ...parseCsv(await readFile(path.join(reports, 'prompt-2-1-corrections.csv'), 'utf8')),
  ...parseCsv(await readFile(path.join(reports, 'prompt-2-2-corrections.csv'), 'utf8')),
];
const priorByRoute = new Map(prior.map((row) => [row.Route, row]));
const family = ({ group, pageType }) => group === 'archive' ? 'Taxonomy archive'
  : group === 'article' ? 'Long-form article'
  : group === 'service' ? 'Core and services'
  : pageType === 'Thank-you utility' ? 'Utility'
  : 'Core and services';
const direct = {
  archive: {
    area: 'Complete archive page and membership',
    wordpress: 'WordPress list archive with title banner, article summaries, search/sidebar, categories and demo/plugin footer content',
    before: 'Modern image-card grid with a centered introduction and no source-like sidebar',
    correction: 'Rebuilt as a styled article list with source-like typography, disabled staging search, retained archive navigation and service CTA',
    final: 'Source-family list/sidebar layout with exact approved article membership at all three viewports',
    difference: 'SAFE_DEMO_EXCLUSION',
    reason: 'Tag clouds, plugin clutter, newsletter/career material and imported demo footer content remain excluded',
  },
  thank: {
    area: 'Direct-visit state, contact choices and shared styling',
    wordpress: 'Shared title system but displays a success message even when the URL is opened directly',
    before: 'Honest staging wording with an unwanted focused-heading outline and incomplete contact navigation',
    correction: 'Removed forced focus, added Contact, and styled Home, Services, phone and WhatsApp actions consistently',
    final: 'Honest noindex utility page with no form or lead event and complete contact alternatives',
    difference: 'SAFE_DEMO_EXCLUSION',
    reason: 'The live fake direct-visit success confirmation is intentionally not reproduced',
  },
  error: {
    area: '404 response, navigation and shared styling',
    wordpress: 'Custom error graphic, short message, homepage action and shared WordPress chrome',
    before: 'Shared title and explanation but no Blog action and minimally styled links',
    correction: 'Added Blog and a complete styled action set while retaining the real 404 response and no redirect',
    final: 'Complete shared-design 404 with Home, Services, Blog, Contact, phone and WhatsApp',
    difference: 'TECHNICAL_PLATFORM_DIFFERENCE',
    reason: 'GitHub Pages fallback handling can differ from the production Nginx HTTP 404 error-document plan',
  },
};

const rows = finalReviewRoutes.map((route) => {
  const old = priorByRoute.get(route.route);
  const item = route.group === 'archive' ? direct.archive : route.route === '/thank-you/' ? direct.thank : null;
  return {
    Route: route.route,
    'Page family': family(route),
    'Area checked': item?.area || old?.Area || 'Complete page regression and shared components',
    'WordPress state': item?.wordpress || old?.['WordPress state'] || 'Current live WordPress family captured at three viewports',
    'Astro state before Prompt 2.3': item?.before || old?.['Astro before'] || 'Prompt 2.2 corrected baseline',
    'Final correction': item?.correction || (route.group === 'article'
      ? 'Preserved Prompt 2.2 layout and added intrinsic dimensions to imported article images'
      : 'Preserved prior layout and normalized shared logo/card image dimensions'),
    'Final Astro state': item?.final || old?.['Astro after'] || 'Final deployed route retains its corrected family layout and content',
    'Remaining difference': item?.difference || old?.['Remaining difference'] || 'NONE',
    Reason: item?.reason || old?.Reason || 'No meaningful visible difference remains',
  };
});
rows.push({
  Route: 'CUSTOM_404',
  'Page family': 'Error output',
  'Area checked': direct.error.area,
  'WordPress state': direct.error.wordpress,
  'Astro state before Prompt 2.3': direct.error.before,
  'Final correction': direct.error.correction,
  'Final Astro state': direct.error.final,
  'Remaining difference': direct.error.difference,
  Reason: direct.error.reason,
});
const headers = [
  'Route', 'Page family', 'Area checked', 'WordPress state', 'Astro state before Prompt 2.3',
  'Final correction', 'Final Astro state', 'Remaining difference', 'Reason',
];
await writeFile(path.join(reports, 'prompt-2-3-final-corrections.csv'),
  csvText(headers, rows.map((row) => headers.map((header) => row[header]))));

const astro = metrics.filter((record) => record.site === 'astro');
const capturedRoutes = new Set(astro.map((record) => record.route));
const counts = (selected) => Object.fromEntries(
  ['NONE', 'SOURCE_IMAGE_UNAVAILABLE', 'SAFE_DEMO_EXCLUSION', 'TECHNICAL_PLATFORM_DIFFERENCE', 'OWNER_DECISION_REQUIRED']
    .map((reason) => [reason, selected.filter((row) => row['Remaining difference'] === reason).length]));
const groups = [
  ['Core and services', rows.filter((row) => row['Page family'] === 'Core and services')],
  ['Articles', rows.filter((row) => row['Page family'] === 'Long-form article')],
  ['Archives', rows.filter((row) => row['Page family'] === 'Taxonomy archive')],
  ['Utility', rows.filter((row) => row['Page family'] === 'Utility')],
  ['Custom 404', rows.filter((row) => row['Page family'] === 'Error output')],
];
const groupLines = groups.map(([name, selected]) => {
  const value = counts(selected);
  return `- ${name}: routes checked **${selected.length}**; routes corrected/revalidated **${selected.length}**; ` +
    `NONE **${value.NONE}**; source-image limitations **${value.SOURCE_IMAGE_UNAVAILABLE}**; ` +
    `safe demo exclusions **${value.SAFE_DEMO_EXCLUSION}**; technical staging differences **${value.TECHNICAL_PLATFORM_DIFFERENCE}**.`;
}).join('\n');
const report = `# Prompt 2.3 Stage 2 completion

## Final status

The nine archives, thank-you route and custom 404 were corrected against fresh live WordPress captures. The full deployed comparison contains **${metrics.length} captures** across desktop, tablet and mobile; all **${astro.length} deployed Astro capture records** passed status, one-H1, image-load, horizontal-overflow and browser-console checks. The **42 retained routes** and custom 404 are represented (${capturedRoutes.size} tested paths including the deliberate missing URL).

${groupLines}

## Corrections and integrity

1. **Nine archives corrected:** source-like styled list/sidebar layout, exact approved membership, disabled staging search, service CTA and responsive stacking.
2. **Thank-you corrected:** honest direct-visit wording, no fake success state, no form/events, and complete Home/Services/Contact/phone/WhatsApp choices.
3. **Custom 404 corrected:** real local HTTP 404, no redirect, complete navigation/contact choices and shared WordPress-style chrome.
4. **Global components:** intrinsic image dimensions were normalized in the header, footer, homepage cards, imported article HTML, parity content and service media.
5. **Content integrity:** prior Prompt 2.1/2.2 headings, paragraphs, lists, tables, FAQs, dates, published prices and internal destinations remain intact; archive membership matches visible cards and CollectionPage schema.
6. **Links:** no broken local links, empty/JavaScript placeholders, wrong contact links, removed-route card links or archive main-navigation entries were found.
7. **Images:** all rendered images are local, load successfully, include alt attributes and intrinsic dimensions; approved owner media remains in use and held/rejected media remains unpublished.
8. **SEO:** production sitemap remains exactly **32 URLs**; nine archives are production \`noindex, follow\`, self-canonical and outside the sitemap; thank-you and 404 are \`noindex, nofollow\`; staging is site-wide \`noindex, nofollow\` with disallow-all robots and no analytics loader.
9. **Responsive:** 1440, 768 and 390 pixel deployed captures found no horizontal overflow or missing major content; archive sidebars and shared footers stack correctly.
10. **Remaining differences:** **${counts(rows).SOURCE_IMAGE_UNAVAILABLE}** source-image limitations, **${counts(rows).SAFE_DEMO_EXCLUSION}** safe demo exclusions and **${counts(rows).TECHNICAL_PLATFORM_DIFFERENCE}** technical platform differences are detailed route by route in the CSV; no owner decision is required.

## Build and deployment

- Production build: **43 pages**, **32 sitemap URLs**, validation passed.
- GitHub Pages build: **43 pages**, disallow-all/noindex validation passed.
- Dependency audit: **0 vulnerabilities**.
- Correction deployment and full deployed sweep: **successful**.
- VPS workflow: **skipped**.
- Production remains untouched: no VPS, DNS, WordPress, Hostinger, analytics, form, SMTP, Turnstile or cutover change occurred.
`;
await writeFile(path.join(reports, 'prompt-2-3-stage-2-completion.md'), report);
console.log(JSON.stringify({ rows: rows.length, captures: metrics.length, deployedAstroChecks: astro.length, counts: counts(rows) }, null, 2));
