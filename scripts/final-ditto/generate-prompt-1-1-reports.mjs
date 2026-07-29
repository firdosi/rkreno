import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inventoryHtml } from './lib/semantic-inventory.mjs';
import { builtHtmlPath, loadRegistry, root, routeSlug } from './lib/route-registry.mjs';

const registry = await loadRegistry();
const reports = path.join(root, 'reports', 'public');
const parity = JSON.parse(await readFile(path.join(
  reports, 'prompt-1-1-bidirectional-parity.json',
), 'utf8'));
const interaction = JSON.parse(await readFile(path.join(
  reports, 'prompt-1-1-interaction-inventory.json',
), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(
  root, '.audit-cache', 'prompt-1-1', 'live-wordpress', 'manifest.json',
), 'utf8'));
const visual = await readFile(path.join(reports, 'prompt-1-1-visual-comparison.json'), 'utf8')
  .then(JSON.parse).catch(() => ({ routes: [] }));
const count = (status) => parity.routes.filter((route) => route.status === status).length;
const routeList = (routes) => routes.length
  ? routes.map(({ route }) => `\`${route}\``).join(', ') : 'None';
const semanticDiffs = parity.routes.filter(({ status }) => status === 'DIFFERENCE');
const visualDiffs = visual.routes.filter(({ status }) => status === 'FAIL');
const visualUntested = registry.publicRoutes.filter(({ mirrored }) => mirrored)
  .filter(({ path: route }) => !visual.routes.some((item) => item.route === route));
const interactionDiffs = interaction.routes.filter(({ wordpress, astro, behavior }) =>
  wordpress && (Object.keys(astro).some((field) =>
    Number(wordpress[field] || 0) !== Number(astro[field] || 0))
    || Object.values(behavior).some((value) => value !== 'MATCH')));
const diffByGroup = (group) => semanticDiffs.filter((route) => route.validationGroup === group);
const corePaths = new Set(['/', '/services/', '/about-us/', '/contact-us/', '/faq/', '/blog/']);
const headerDiffs = semanticDiffs.filter(({ differences }) => differences.headerDifference);
const footerDiffs = semanticDiffs.filter(({ differences }) => differences.footerDifference);

await mkdir(reports, { recursive: true });
await writeFile(path.join(reports, 'prompt-1-1-truthful-baseline.md'), [
  '# Prompt 1.1 truthful baseline',
  '',
  `Source snapshot date: ${manifest.capturedAt}`,
  '',
  `- Mirrored WordPress routes: ${registry.expectedTotals.mirroredRoutes}`,
  `- Semantic MATCH routes: ${count('MATCH')}`,
  `- Semantic DIFFERENCE routes: ${count('DIFFERENCE')}`,
  `- Visual FAIL routes: ${visualDiffs.length}`,
  `- Visual NOT_TESTED routes: ${visualUntested.length}`,
  `- Interaction DIFFERENCE routes: ${interactionDiffs.length}`,
  `- SOURCE_ASSET_MISSING routes: ${count('SOURCE_ASSET_MISSING')}`,
  `- NEW_PAGE routes: ${count('NEW_PAGE')}`,
  '',
  '## Difference groups',
  '',
  `- Header differences: ${headerDiffs.length}`,
  `- Footer differences: ${footerDiffs.length}`,
  `- Homepage differences: ${routeList(semanticDiffs.filter(({ route }) => route === '/'))}`,
  `- Core-page differences: ${routeList(semanticDiffs.filter(({ route }) => corePaths.has(route)))}`,
  `- Service differences: ${routeList(diffByGroup('service'))}`,
  `- Article differences: ${routeList(diffByGroup('article'))}`,
  `- Archive differences: ${routeList(diffByGroup('archive'))}`,
  `- Restored-page differences: ${routeList(diffByGroup('held'))}`,
  '',
  '## Validation limitations',
  '',
  '- A route remains DIFFERENCE when visual or interaction behavior has not been tested.',
  '- Pixel comparisons use a zero-difference PASS rule; no tolerance converts a visible difference into PASS.',
  '- SOURCE_ASSET_MISSING is reserved for the seven documented cleaning images and is not assigned while other differences remain.',
  '- The source snapshot is local evidence under `.audit-cache/` and is intentionally ignored by Git.',
  '',
  '## Work remaining',
  '',
  '- Prompt 1.2: shared design system, header, navigation, footer, spacing, typography and reusable animations.',
  '- Prompts 1.3 through 3.3: page groups, services, articles, archives and restored pages.',
  '- Prompts 4.1 through 4.3: responsive repair, final SEO/content/interaction validation and repository approval.',
  '',
  'This is a measurement baseline, not a website-completion statement.',
  '',
].join('\n'));

await writeFile(path.join(reports, 'prompt-1-1-route-registry-summary.md'), [
  '# Prompt 1.1 route registry summary',
  '',
  `- Public routes: ${registry.expectedTotals.publicRoutes}`,
  `- WordPress-mirrored routes: ${registry.expectedTotals.mirroredRoutes}`,
  `- New demolition routes: ${registry.expectedTotals.newRoutes}`,
  `- Production sitemap routes: ${registry.expectedTotals.sitemapRoutes}`,
  `- Noindex taxonomy archives: ${registry.expectedTotals.noindexTaxonomyArchives}`,
  `- Noindex restored pages: ${registry.expectedTotals.noindexRestoredPages}`,
  `- Noindex thank-you routes: ${registry.expectedTotals.noindexThankYouRoutes}`,
  '- Custom 404: `/404.html`',
  `- Redirect, gone and known-404 classifications: \`${registry.dispositionRegistry.source}\`, joined by the registry validation.`,
  '',
].join('\n'));

const claimPattern = /\b(?:\d[\d,+.% -]*(?:years?|customers?|projects?|satisfaction|warranty|guarantee)|certif\w*|licen[cs]\w*|guarantee\w*|warrant\w*|testimonial\w*|emergency|completed?\s+(?:in|within)|team|customer)\b/i;
const claims = [];
for (const route of registry.publicRoutes.filter(({ mirrored }) => mirrored)) {
  const source = JSON.parse(await readFile(path.join(
    root, '.audit-cache', 'prompt-1-1', 'source-semantics', `${routeSlug(route.path)}.json`,
  ), 'utf8'));
  const astro = inventoryHtml(await readFile(builtHtmlPath(route.path), 'utf8'));
  const astroVisible = new Set([
    ...astro.orderedHeadings.map(({ text }) => text),
    ...astro.orderedParagraphs,
    ...astro.orderedLists.flatMap(({ items }) => items),
  ]);
  const sourceVisible = [
    ...source.orderedHeadings.map(({ text }) => text),
    ...source.orderedParagraphs,
    ...source.orderedLists.flatMap(({ items }) => items),
  ].filter((wording) => claimPattern.test(wording));
  for (const wording of sourceVisible) {
    claims.push({
      route: route.path,
      wording,
      copied: astroVisible.has(wording) ? 'YES' : 'NO',
      evidence: 'No independent evidence supplied in repository',
      status: 'SOURCE_ONLY',
    });
  }
}
await writeFile(path.join(reports, 'prompt-1-1-source-claim-register.md'), [
  '# Prompt 1.1 source-claim register',
  '',
  'Claim verification is separate from content and visual parity.',
  '',
  '| Route | Exact source wording | Copied into Astro | Evidence supplied | Verification status |',
  '|---|---|---|---|---|',
  ...claims.map((claim) => `| ${claim.route} | ${claim.wording.replaceAll('|', '\\|')} | ${claim.copied} | ${claim.evidence} | ${claim.status} |`),
  '',
].join('\n'));

const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
await writeFile(path.join(reports, 'final-content-parity.csv'), [
  ['Route', 'Status', 'Difference fields'].map(csv).join(','),
  ...parity.routes.map((route) => [
    route.route,
    route.status,
    Object.entries(route.differences || {}).filter(([, value]) =>
      Array.isArray(value) ? value.length : Boolean(value)).map(([name]) => name).join('; '),
  ].map(csv).join(',')),
].join('\n') + '\n');
const cards = parity.routes.map((route) => `<article data-status="${route.status}"><h2>${route.route}</h2><strong>${route.status}</strong></article>`);
await mkdir(path.join(reports, 'final-ditto-review'), { recursive: true });
await writeFile(path.join(reports, 'final-ditto-review', 'index.html'),
  `<!doctype html><html><head><meta charset="utf-8"><title>Truthful parity review</title></head><body><h1>Prompt 1.1 truthful parity review</h1>${cards.join('')}</body></html>\n`);
