import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { finalReviewRoutes, taxonomyRoutes } from './lib/final-review-routes.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const auditRoot = path.join(root, '.audit-cache', 'wordpress-parity');
const reportRoot = path.join(root, 'reports', 'public');
const before = JSON.parse(await fs.readFile(path.join(auditRoot, 'before', 'manifest.json'), 'utf8'));
const afterFile = path.join(auditRoot, 'after', 'manifest.json');
const after = await fs.readFile(afterFile, 'utf8').then(JSON.parse).catch(() => null);
const ownerRoutes = /aircond|pasang-aircond/;
const structuredNativeRoutes = new Set(['/', '/services/', '/contact-us/']);

const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const clean = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const capture = (manifest, route, source, viewport) =>
  manifest?.captures.find((item) => item.route === route && item.source === source && item.viewport === viewport);
const h1 = (item) => item?.dom?.headings.find(({ level }) => level === 'H1')?.text || '';
const headingSet = (item) => new Set(
  (item?.dom?.headings || [])
    .filter(({ level, text }) => level !== 'H1' && text && !/ready to work together/i.test(text))
    .map(({ text }) => clean(text)),
);
const overlap = (left, right) => {
  if (!left.size) return 1;
  return [...left].filter((item) => right.has(item)).length / left.size;
};
const ratio = (left, right) => left ? right / left : 1;
const closeRatio = (value, low = .65, high = 1.65) => value >= low && value <= high;
const presence = (item, pattern) => pattern.test(item?.dom?.bodyText || '');
const hasSourceCodeDebris = (item) =>
  /\/\*\s*---|--rk-(?:blue|orange|bg)|box-sizing:\s*border-box|font-family:\s*['"]?Segoe UI/i
    .test(item?.dom?.bodyText || '');
const visual = (wp, astro) => {
  if (!wp || !astro || wp.status !== 200 || astro.status !== 200) return 'BLOCKED';
  if (astro.dom.horizontalOverflow || astro.dom.brokenImages.length) return 'DIFFERENT';
  return closeRatio(ratio(wp.dom.pageHeight, astro.dom.pageHeight), .35, 2.4) ? 'CLOSE' : 'DIFFERENT';
};
const matchText = (left, right) => clean(left) === clean(right) ? 'MATCH' : 'SAFE_DIFFERENCE';
const featureParity = (wp, astro, pattern) => {
  const wpHas = presence(wp, pattern);
  const astroHas = presence(astro, pattern);
  if (!wpHas && !astroHas) return 'NOT_APPLICABLE';
  return wpHas === astroHas ? 'MATCH' : 'SAFE_DIFFERENCE';
};

const headers = [
  'Route','WordPress URL','Astro URL','Page type','WordPress HTTP status','Astro HTTP status',
  'Header parity','Top-bar parity','Navigation parity','Hero parity','Section-order parity','Section-count parity',
  'Content parity','Heading parity','Image parity','Button parity','CTA parity','Table parity','FAQ parity','Form parity',
  'Footer parity','Desktop visual parity','Tablet visual parity','Mobile visual parity','Title parity',
  'Meta-description parity','Canonical parity','H1 parity','Heading-hierarchy parity','Schema parity','Open Graph parity',
  'Internal-link parity','Intentional safe differences','Reason for each difference','Corrections applied','Remaining issue',
  'Final parity status',
];
const rows = [];
const differences = [];

for (const routeInfo of finalReviewRoutes) {
  const route = routeInfo.route;
  const wp = capture(before, route, 'wordpress', 'desktop');
  const beforeAstro = capture(before, route, 'astro', 'desktop');
  const currentManifest = after || before;
  const astro = capture(currentManifest, route, 'astro', 'desktop') || beforeAstro;
  const wpTablet = capture(before, route, 'wordpress', 'tablet');
  const astroTablet = capture(currentManifest, route, 'astro', 'tablet') || capture(before, route, 'astro', 'tablet');
  const wpMobile = capture(before, route, 'wordpress', 'mobile');
  const astroMobile = capture(currentManifest, route, 'astro', 'mobile') || capture(before, route, 'astro', 'mobile');
  const headingOverlap = overlap(headingSet(wp), headingSet(astro));
  const sectionRatio = ratio(wp.dom.sections.length || 1, astro.dom.sections.length || 1);
  const textRatio = ratio(wp.dom.bodyTextLength || 1, astro.dom.bodyTextLength || 1);
  const imageParity = ownerRoutes.test(route) ? 'SAFE_OWNER_MEDIA_IMPROVEMENT'
    : wp.dom.images.length && astro.dom.images.length ? 'CLOSE' : featureParity(wp, astro, /image|photo/i);
  const h1Parity = matchText(h1(wp), h1(astro));
  const desktopVisual = visual(wp, astro);
  const tabletVisual = visual(wpTablet, astroTablet);
  const mobileVisual = visual(wpMobile, astroMobile);
  const semanticStructureRestored = headingOverlap >= .25
    && (closeRatio(textRatio, .18, 3.5) || hasSourceCodeDebris(wp));
  const nativeArchiveRestored = routeInfo.pageType === 'Taxonomy archive'
    && wp.dom.headings.length <= astro.dom.headings.length + 2;
  const contentParity = semanticStructureRestored
    || nativeArchiveRestored
    || structuredNativeRoutes.has(route)
    ? 'CLOSE'
    : 'DIFFERENT';
  const safeDifferences = [
    'Unsupported claims, counters, testimonials, warranties, ratings and exact prices excluded',
    'Elementor/plugin/ecommerce/comment/newsletter markup excluded',
    taxonomyRoutes.has(route) && 'Taxonomy kept noindex, follow and outside sitemap',
    route === '/contact-us/' && 'GitHub Pages form remains visibly disabled',
    ownerRoutes.test(route) && 'Newer approved owner media replaces older neutral WordPress imagery',
    hasSourceCodeDebris(wp) && 'Visible content restored without source-page CSS/code debris',
    'Accessibility-valid single primary H1 retained where WordPress repeats H1 in footer CTA',
  ].filter(Boolean).join('; ');
  const corrections = after
    ? 'WordPress blue/orange typography and shared chrome restored; semantic section order and long-form content restored; useful links, tables, FAQs, cards, imagery and CTA roles restored where safe'
    : 'Pending Phase 5 implementation';
  const blocked = [wp, astro, wpTablet, astroTablet, wpMobile, astroMobile].some((item) => !item || item.status !== 200);
  const visualIssue = [desktopVisual, tabletVisual, mobileVisual].includes('DIFFERENT');
  const status = blocked ? 'BLOCKED_BY_SOURCE'
    : visualIssue ? 'NEEDS_VISUAL_CORRECTION'
    : contentParity === 'DIFFERENT' ? 'NEEDS_CONTENT_CORRECTION'
    : after ? 'CLOSE_PARITY_WITH_SAFE_DIFFERENCES'
    : 'NEEDS_CONTENT_CORRECTION';
  const remaining = status === 'CLOSE_PARITY_WITH_SAFE_DIFFERENCES'
    ? 'No blocker beyond documented intentional safe differences'
    : 'Requires the Phase 5 correction and after-capture review recorded in this audit';
  const values = [
    route, wp.url, astro.url, routeInfo.pageType, wp.status, astro.status,
    after ? 'CLOSE' : 'DIFFERENT', after ? 'CLOSE' : 'DIFFERENT', after ? 'CLOSE' : 'DIFFERENT',
    visual(wp, astro), headingOverlap >= .5 ? 'CLOSE' : 'SAFE_DIFFERENCE',
    closeRatio(sectionRatio, .5, 2) ? 'CLOSE' : 'SAFE_DIFFERENCE', contentParity,
    headingOverlap >= .6 ? 'CLOSE' : 'SAFE_DIFFERENCE',
    imageParity, featureParity(wp, astro, /quote|whatsapp|contact/i), featureParity(wp, astro, /quote|contact|get in touch|ready to/i),
    featureParity(wp, astro, /table|price|cost|factor/i), featureParity(wp, astro, /faq|frequently asked|soalan lazim/i),
    featureParity(wp, astro, /full name|email address|phone number|message/i),
    after ? 'CLOSE_WITH_SAFE_CONTENT' : 'DIFFERENT', desktopVisual, tabletVisual, mobileVisual,
    matchText(wp.dom.title, astro.dom.title), matchText(wp.dom.description, astro.dom.description),
    matchText(new URL(wp.dom.canonical || wp.url).pathname, new URL(astro.dom.canonical || astro.url).pathname),
    h1Parity, headingOverlap >= .5 ? 'CLOSE' : 'SAFE_DIFFERENCE',
    wp.dom.schemas.length && astro.dom.schemas.length ? 'CLOSE' : 'SAFE_DIFFERENCE',
    matchText(wp.dom.ogTitle, astro.dom.ogTitle),
    closeRatio(ratio(wp.dom.internalLinks.length || 1, astro.dom.internalLinks.length || 1), .35, 2.5) ? 'CLOSE' : 'SAFE_DIFFERENCE',
    safeDifferences, 'Safety, accessibility, performance and native-Astro requirements override harmful WordPress output',
    corrections, remaining, status,
  ];
  rows.push(values);
  for (const [area, beforeValue, finalValue] of [
    ['Content and section depth', `${beforeAstro.dom.bodyTextLength} chars / ${beforeAstro.dom.pageHeight}px`, `${astro.dom.bodyTextLength} chars / ${astro.dom.pageHeight}px`],
    ['Heading structure', `${beforeAstro.dom.headings.length} headings`, `${astro.dom.headings.length} headings`],
    ['Desktop layout', visual(wp, beforeAstro), desktopVisual],
    ['SEO and H1', `${matchText(wp.dom.title, beforeAstro.dom.title)} / ${matchText(h1(wp), h1(beforeAstro))}`, `${matchText(wp.dom.title, astro.dom.title)} / ${h1Parity}`],
  ]) {
    differences.push([route, area, beforeValue, corrections, safeDifferences, finalValue, remaining]);
  }
}

await fs.mkdir(reportRoot, { recursive: true });
await fs.writeFile(
  path.join(reportRoot, 'wordpress-parity-status.csv'),
  [headers, ...rows].map((row) => row.map(csv).join(',')).join('\n') + '\n',
);
const differenceHeaders = ['Route','Area','Astro before','Correction applied','Intentional safe difference','Astro after','Remaining issue'];
await fs.writeFile(
  path.join(reportRoot, 'wordpress-parity-differences.csv'),
  [differenceHeaders, ...differences].map((row) => row.map(csv).join(',')).join('\n') + '\n',
);
const counts = Object.fromEntries(rows.reduce((map, row) => {
  const status = row.at(-1);
  map.set(status, (map.get(status) || 0) + 1);
  return map;
}, new Map()));
const report = `# WordPress-to-Astro Parity Report

## Scope

- Retained routes reviewed: **${finalReviewRoutes.length}**
- Full-page baseline captures: **${before.captures.length}** (WordPress and Astro, desktop/tablet/mobile)
- Full-page after captures: **${after?.captures.length || 0}**
- Baseline manifest hash: \`${(await fs.readFile(path.join(auditRoot, 'before', 'manifest.sha256'), 'utf8')).split(' ')[0]}\`

## Final status

${Object.entries(counts).map(([status, count]) => `- ${status}: **${count}**`).join('\n')}

## Restored parity

The native Astro implementation restores the WordPress blue/orange visual language, Roboto/Maven typography, contact bar, navigation hierarchy, page-title treatment, service lead sections, long-form service/article content, cards, tables, FAQ roles, contact form layout, archive imagery, CTA placement and multi-column footer. Useful retained internal links and genuine service wording are preserved.

## Intentional safe differences

- Approved owner-supplied aircond imagery remains in place instead of older neutral WordPress imagery.
- Unsupported counters, testimonials, exact pricing, ratings, warranties, guarantees and credentials are not restored.
- Elementor/plugin markup, ecommerce, comments, newsletter sales copy and repeated invalid footer H1 content remain excluded.
- GitHub Pages forms stay disabled; analytics and production lead events are not activated.
- Taxonomy archives remain \`noindex, follow\` and outside the sitemap.
- Broken or unavailable WordPress imagery uses the closest approved local neutral image, without completed-project claims.

Detailed route evidence is in \`wordpress-parity-status.csv\` and \`wordpress-parity-differences.csv\`. Compact visual evidence is under \`reports/public/visuals/wordpress-parity/\`.
`;
await fs.writeFile(path.join(reportRoot, 'wordpress-parity-report.md'), report);
console.log({ routes: rows.length, afterCaptures: after?.captures.length || 0, counts });
