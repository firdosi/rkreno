import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inventoryHtml } from './lib/semantic-inventory.mjs';
import { scalarDifference, sequenceDifference } from './lib/ordered-comparison.mjs';
import { builtHtmlPath, loadRegistry, root, routeSlug } from './lib/route-registry.mjs';

const registry = await loadRegistry();
const reports = path.join(root, 'reports', 'public');
const sourceDir = path.join(root, '.audit-cache', 'prompt-1-1', 'source-semantics');
const knownAssetRoutes = new Set([
  '/servis-cuci-rumah-kl/',
  '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/',
  '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/',
]);
const visualPath = path.join(reports, 'prompt-1-1-visual-comparison.json');
const interactionPath = path.join(reports, 'prompt-1-1-interaction-inventory.json');
const visual = await readFile(visualPath, 'utf8').then(JSON.parse).catch(() => ({ routes: [] }));
const interactions = await readFile(interactionPath, 'utf8').then(JSON.parse).catch(() => ({ routes: [] }));
const visualByRoute = new Map(visual.routes.map((item) => [item.route, item]));
const interactionByRoute = new Map(interactions.routes.map((item) => [item.route, item]));
const pairFields = {
  orderedSections: ['missingSections', 'extraSections', 'reorderedSections'],
  orderedHeadings: ['missingHeadings', 'extraHeadings', 'reorderedHeadings'],
  orderedParagraphs: ['missingParagraphs', 'extraParagraphs', 'reorderedParagraphs'],
  orderedLists: ['missingLists', 'extraLists', 'reorderedLists'],
  tables: ['missingTables', 'extraTables', 'reorderedTables'],
  imageSources: ['missingImages', 'extraImages', 'reorderedImages'],
  internalLinks: ['missingLinks', 'extraLinks', 'reorderedLinks'],
  buttons: ['missingButtons', 'extraButtons', 'reorderedButtons'],
  forms: ['missingForms', 'extraForms', 'reorderedForms'],
  accordions: ['missingAccordions', 'extraAccordions', 'reorderedAccordions'],
  cards: ['missingCards', 'extraCards', 'reorderedCards'],
};
const scalarFields = {
  formFields: 'wrongFormFields',
  sidebarWidgets: 'sidebarDifference',
  pagination: 'paginationDifference',
  carouselItems: 'carouselDifference',
  carouselControls: 'carouselControlDifference',
  counters: 'counterDifference',
  testimonials: 'testimonialDifference',
  projectItems: 'projectDifference',
  teamItems: 'teamDifference',
  headerItems: 'headerDifference',
  footerItems: 'footerDifference',
  floatingActions: 'floatingActionDifference',
};
const summarize = (items) => items.slice(0, 12);

function compare(source, astro) {
  const result = {};
  for (const [field, [missingName, extraName, reorderedName]] of Object.entries(pairFields)) {
    const difference = sequenceDifference(source[field], astro[field]);
    result[missingName] = summarize(difference.missing);
    result[extraName] = summarize(difference.extra);
    result[reorderedName] = difference.reordered;
  }
  const imageDifference = sequenceDifference(source.imageSources, astro.imageSources);
  result.wrongImages = source.imageSources.length === astro.imageSources.length
    ? summarize(imageDifference.missing.map((item, index) => ({
      source: item, astro: imageDifference.extra[index] || null,
    }))) : [];
  const sourceLinksByText = new Map(source.internalLinks.map((item) => [item.text, item.destination]));
  result.wrongLinkDestinations = astro.internalLinks.filter((item) =>
    sourceLinksByText.has(item.text) && sourceLinksByText.get(item.text) !== item.destination)
    .map((item) => ({ text: item.text, source: sourceLinksByText.get(item.text), astro: item.destination }));
  for (const [field, name] of Object.entries(scalarFields)) {
    result[name] = scalarDifference(source[field], astro[field]);
  }
  result.extraSidebar = source.sidebarWidgets.length === 0 && astro.sidebarWidgets.length > 0
    ? summarize(astro.sidebarWidgets) : [];
  result.missingSidebar = source.sidebarWidgets.length > 0 && astro.sidebarWidgets.length === 0
    ? summarize(source.sidebarWidgets) : [];
  result.visualDifference = 'NOT_TESTED';
  result.responsiveDifference = 'NOT_TESTED';
  result.interactionDifference = 'NOT_TESTED';
  return result;
}

const routes = [];
for (const route of registry.publicRoutes) {
  if (!route.mirrored) {
    routes.push({ route: route.path, pageType: route.pageType, status: 'NEW_PAGE', differences: {} });
    continue;
  }
  const source = JSON.parse(await readFile(path.join(sourceDir, `${routeSlug(route.path)}.json`), 'utf8'));
  const astro = inventoryHtml(await readFile(builtHtmlPath(route.path), 'utf8'), {
    route: route.path,
    origin: 'astro',
  });
  const differences = compare(source, astro);
  const visualResult = visualByRoute.get(route.path);
  if (visualResult) {
    differences.visualDifference = visualResult.status;
    differences.responsiveDifference = visualResult.viewports || 'NOT_TESTED';
  }
  const interaction = interactionByRoute.get(route.path);
  if (interaction?.wordpress) {
    const fields = Object.keys(interaction.astro);
    differences.interactionDifference = fields.every((field) =>
      Number(interaction.wordpress[field] || 0) === Number(interaction.astro[field] || 0))
      && Object.values(interaction.behavior).every((value) => value === 'MATCH')
      ? null : 'DIFFERENCE';
  }
  const semanticDifference = Object.entries(differences).some(([name, value]) => {
    if (['visualDifference', 'responsiveDifference', 'interactionDifference'].includes(name)) return false;
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });
  const strictPass = !semanticDifference
    && differences.visualDifference === 'PASS'
    && differences.interactionDifference == null;
  let status = strictPass ? 'MATCH' : 'DIFFERENCE';
  if (strictPass && knownAssetRoutes.has(route.path)) status = 'SOURCE_ASSET_MISSING';
  routes.push({
    route: route.path,
    pageType: route.pageType,
    validationGroup: route.validationGroup,
    status,
    sourceCounts: Object.fromEntries(Object.keys(pairFields)
      .map((field) => [field, source[field].length])),
    astroCounts: Object.fromEntries(Object.keys(pairFields)
      .map((field) => [field, astro[field].length])),
    differences,
  });
}
await mkdir(reports, { recursive: true });
const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceSnapshot: '.audit-cache/prompt-1-1/live-wordpress/manifest.json',
  statuses: ['MATCH', 'DIFFERENCE', 'SOURCE_ASSET_MISSING', 'NEW_PAGE', 'NOT_TESTED'],
  routes,
};
await writeFile(path.join(reports, 'prompt-1-1-bidirectional-parity.json'),
  `${JSON.stringify(output, null, 2)}\n`);
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const fields = ['Route', 'Page type', 'Validation group', 'Status', 'Difference fields'];
await writeFile(path.join(reports, 'prompt-1-1-bidirectional-parity.csv'), [
  fields.map(csv).join(','),
  ...routes.map((route) => [
    route.route,
    route.pageType,
    route.validationGroup || '',
    route.status,
    Object.entries(route.differences || {})
      .filter(([, value]) => Array.isArray(value) ? value.length : Boolean(value))
      .map(([name]) => name).join('; '),
  ].map(csv).join(',')),
].join('\n') + '\n');
console.log(JSON.stringify(Object.fromEntries(
  ['MATCH', 'DIFFERENCE', 'SOURCE_ASSET_MISSING', 'NEW_PAGE']
    .map((status) => [status, routes.filter((route) => route.status === status).length]),
), null, 2));
