import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import {
  allowedActions, backupAvailableImages, claimDefinitions, demoIndicators, dispositionFor,
  exactDuplicateTargets, foreignIndicators, knownMissingImages, recommendedIndex, routeTests,
} from './lib/route-disposition-rules.mjs';
import { buildDispositionReport } from './lib/route-disposition-reports.mjs';
import {
  buildLegalRequirements, buildOwnerDecisions,
} from './lib/route-disposition-static-reports.mjs';

const root = process.cwd();
const reportDirectory = path.join(root, 'reports/public');
const productionOrigin = 'https://rkrenosolution.com';
const stagingOrigin = 'https://firdosi.github.io/rkreno';
const clean = (value = '') => String(value).replace(/\s+/g, ' ').trim();
const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

function parseCsv(input) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (character === '"' && quoted && input[index + 1] === '"') {
      cell += '"'; index++;
    } else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index++;
      row.push(cell); cell = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers, ...values] = rows;
  return values.map((valuesRow) =>
    Object.fromEntries(headers.map((header, index) => [header, valuesRow[index] || ''])));
}

const [allPages, completionCsv, redirectCsv, xmlExport] = await Promise.all([
  readFile(path.join(root, 'src/data/site-pages.json'), 'utf8').then(JSON.parse),
  readFile(path.join(reportDirectory, 'full-site-completion-status.csv'), 'utf8').then(parseCsv),
  readFile(path.join(reportDirectory, 'redirect-map.csv'), 'utf8').then(parseCsv),
  readFile(path.join(root, 'wp-old-site-backup/rkrenosolution.WordPress.2026-07-23.xml'), 'utf8').catch(() => ''),
]);
const generatedPages = allPages.filter((page) =>
  page.status === 200 && page.type !== 'template' && page.title);
const production404s = allPages.filter((page) => page.status === 404);
const crawledUtility = allPages.find((page) => page.path === '/wp-content/uploads/2025/01/home.svg');
const completionByRoute = new Map(completionCsv.map((row) => [row.Route, row]));
const pageByRoute = new Map(allPages.map((page) => [page.path, page]));
const postRoutes = new Set(generatedPages.filter((page) => page.type === 'post').map((page) => page.path));

function textFor(page) {
  const $ = load(page?.content || '');
  $('style,script,noscript').remove();
  return clean($.text());
}

const incomingLinks = new Map();
const linkedPosts = new Map();
for (const source of generatedPages) {
  const $ = load(source.content || '');
  const posts = new Set();
  for (const anchor of $('a[href]').toArray()) {
    try {
      const target = new URL($(anchor).attr('href'), productionOrigin);
      if (target.origin !== productionOrigin) continue;
      const targetPath = target.pathname.replace('https://', 'https:/');
      incomingLinks.set(targetPath, (incomingLinks.get(targetPath) || 0) + 1);
      if (postRoutes.has(targetPath)) posts.add(targetPath);
    } catch {}
  }
  linkedPosts.set(source.path, posts.size);
}

const supplemental = [];
for (const redirect of redirectCsv) {
  if (!pageByRoute.has(redirect.source)) {
    supplemental.push({
      path: redirect.source,
      url: `${productionOrigin}${redirect.source}`,
      title: redirect.source === '/about/' ? 'Legacy About alias' : 'Legacy Home 2 demo alias',
      type: 'redirect-alias',
      status: 'unknown',
      source: 'existing-redirect-map',
    });
  }
}
if (crawledUtility) {
  supplemental.push({ ...crawledUtility, source: 'internal-link', status: 200 });
}
for (const [route, title] of [
  ['/cart/', 'Cart'], ['/checkout/', 'Checkout'], ['/my-account/', 'My account'],
]) {
  const slug = route.replaceAll('/', '');
  const published = new RegExp(
    `<wp:post_name><!\\[CDATA\\[${slug}\\]\\]></wp:post_name>[\\s\\S]{0,1200}` +
    '<wp:status><!\\[CDATA\\[publish\\]\\]></wp:status>',
  ).test(xmlExport);
  if (xmlExport && !published) throw new Error(`Published WordPress export route not found: ${route}`);
  supplemental.push({
    path: route, url: `${productionOrigin}${route}`, title, type: 'page',
    status: 'unknown', source: 'WordPress-export',
  });
}

async function liveStatus(origin, route) {
  try {
    const response = await fetch(`${origin}${route}`, {
      redirect: 'manual',
      headers: { 'user-agent': 'RK-Reno-disposition-audit/1.0' },
      signal: AbortSignal.timeout(20_000),
    });
    await response.body?.cancel();
    const location = response.headers.get('location');
    return `${response.status}${location ? ` → ${location}` : ''}`;
  } catch (error) {
    return `ERROR: ${error instanceof Error ? error.message : 'request failed'}`;
  }
}
await Promise.all(supplemental.map(async (item) => {
  [item.productionStatus, item.astroStatus] = await Promise.all([
    liveStatus(productionOrigin, item.path),
    liveStatus(stagingOrigin, item.path),
  ]);
}));

const universe = [
  ...generatedPages.map((page) => ({ ...page, source: 'generated-route' })),
  ...production404s.map((page) => ({ ...page, source: 'production-404' })),
  ...supplemental,
];
const uniqueUniverse = new Map();
for (const item of universe) {
  if (uniqueUniverse.has(item.path)) throw new Error(`Duplicate universe route: ${item.path}`);
  uniqueUniverse.set(item.path, item);
}

function claimMatches(text) {
  return claimDefinitions.flatMap(([label, pattern]) => {
    const match = text.match(pattern);
    return match ? [{ label, text: clean(match[0]) }] : [];
  });
}

const claims = [];
const analyses = new Map();
for (const item of uniqueUniverse.values()) {
  const text = textFor(item);
  const $ = load(item.content || '');
  const hotlinks = $('img[src],source[srcset]').map((_, image) => {
    const source = $(image).attr('src') || $(image).attr('srcset') || '';
    return source.includes('rkrenosolution.com') ? source.split(/\s|,/)[0] : null;
  }).get().filter(Boolean);
  const missing = knownMissingImages.filter((name) => (item.content || '').includes(name));
  for (const image of $('img[src^="/assets/"]').toArray()) {
    const source = $(image).attr('src');
    try { await access(path.join(root, 'public', source.replace(/^\//, ''))); }
    catch { missing.push(source); }
  }
  const foundClaims = claimMatches(text);
  const demos = demoIndicators(text, item.path);
  const dependencyNames = [...hotlinks, ...missing].map((source) => {
    try { return path.basename(new URL(source, productionOrigin).pathname); }
    catch { return path.basename(source); }
  });
  const backupMatches = [...new Set(dependencyNames.filter((name) =>
    backupAvailableImages.has(name)))];
  const localReplacements = (item.images || []).filter((image) =>
    image.local?.startsWith('/assets/')).length;
  for (const claim of foundClaims) {
    claims.push({
      'Claim text': claim.text,
      'Route': item.path,
      'Evidence found': demos.length
        ? `Production-derived content plus imported-demo indicators: ${demos.join(', ')}`
        : 'Present in production-derived content; no owner evidence was supplied.',
      'Verification status': demos.length ? 'IMPORTED_DEMO_CONTENT' : 'OWNER_CONFIRMATION_REQUIRED',
      'Recommended action': demos.length
        ? 'Remove the imported claim with the demo route/content.'
        : 'Do not publish until the owner supplies documentary or first-party support.',
    });
  }
  if (item.type === 'portfolio') {
    claims.push({
      'Claim text': `RK Reno completed project: ${item.title.replace(/ - RK Reno Solution$/, '')}`,
      'Route': item.path,
      'Evidence found': 'Repeated Ivey/Vastcon/Vincent/Alten demo copy; no Malaysian project evidence.',
      'Verification status': 'IMPORTED_DEMO_CONTENT',
      'Recommended action': 'Do not present as RK Reno work; proposed 410 unless owner disproves demo finding.',
    });
  }
  analyses.set(item.path, {
    text, hotlinks, missing, claims: foundClaims, demos,
    foreign: foreignIndicators(text), backupMatches, localReplacements,
    linkedArticles: linkedPosts.get(item.path) || 0,
  });
}

function nearDuplicateTarget(item) {
  if (item.type === 'portfolio') {
    return item.path === '/portfolio/the-ivey-school-of-business/'
      ? '/portfolio/axis-industrial-park/'
      : '/portfolio/the-ivey-school-of-business/';
  }
  const onePage = item.path.match(/^\/home-(\d+)-(?:one-page|onepage)\/$/);
  if (onePage && pageByRoute.has(`/home-${onePage[1]}/`)) return `/home-${onePage[1]}/`;
  return '';
}

const records = [...uniqueUniverse.values()].sort((a, b) => a.path.localeCompare(b.path))
  .map((item) => {
    const analysis = analyses.get(item.path);
    const completion = completionByRoute.get(item.path);
    const disposition = dispositionFor({
      route: item.path, page: item, completionStatus: completion?.['Final status'], source: item.source,
    });
    const exactTarget = exactDuplicateTargets.get(item.path) || '';
    const nearTarget = exactTarget ? '' : nearDuplicateTarget(item);
    const isOwner = disposition.action === 'OWNER_DECISION_REQUIRED';
    const archiveReason = item.type === 'taxonomy'
      ? ` Linked unique article count: ${analysis.linkedArticles}; unique introduction not established.`
      : '';
    const imageStatus = analysis.hotlinks.length || analysis.missing.length
      ? `BLOCKED — ${analysis.hotlinks.length} hotlinked, ${analysis.missing.length} missing`
      : (item.images?.length ? 'LOCALIZED/AVAILABLE — visual suitability unreviewed' : 'NO IMAGE DEPENDENCY FOUND');
    const businessValue = ['KEEP_AND_REDESIGN', 'KEEP_CONTENT_PAGE'].includes(disposition.action)
      ? 'HIGH' : (disposition.action === 'KEEP_NOINDEX_TEMPORARILY' ? 'MEDIUM' :
        (isOwner ? 'UNKNOWN' : 'LOW'));
    const ownerNeeds = [];
    if (analysis.claims.length) ownerNeeds.push('Evidence for business claims');
    if (item.type === 'portfolio') ownerNeeds.push('Confirm no listed project is genuine RK Reno work');
    if (analysis.hotlinks.length || analysis.missing.length) ownerNeeds.push('Verified original images/project photos');
    if (isOwner) ownerNeeds.push('Owner decision and authentic replacement content');
    if (item.type === 'taxonomy') ownerNeeds.push('Category/tag retention strategy');
    return {
      'Current route': item.path,
      'Full production URL': item.url || `${productionOrigin}${item.path}`,
      'Route source': item.source,
      'Page title': item.title || '',
      'WordPress content type': item.type || 'unknown',
      'Current production status': item.source === 'generated-route' ? '200' :
        (item.source === 'production-404' ? '404' : item.productionStatus || String(item.status)),
      'Current Astro status': completion?.['Astro status'] || item.astroStatus || '404 (not generated)',
      'Current completion status': completion?.['Final status'] || 'NOT REVIEWED',
      'Current layout': completion?.['Layout/template used'] || 'not generated',
      'Proposed action': disposition.action,
      'Proposed destination URL': disposition.destination,
      'Recommended index status': recommendedIndex(disposition.action),
      'Reason': `${disposition.reason}${archiveReason}`,
      'Existing internal-link count': incomingLinks.get(item.path) || 0,
      'Existing canonical': item.canonical || '',
      'Sitemap presence': item.sitemap && item.sitemap !== 'internal-link' ? `YES — ${item.sitemap}` : 'NO',
      'SEO title present': item.title ? 'YES' : 'NO',
      'Meta description present': item.description ? 'YES' : 'NO',
      'Unique content level': exactTarget ? 'EXACT_DUPLICATE' :
        (nearTarget ? 'NEAR_DUPLICATE' : (analysis.text.length > 1200 ? 'HIGH' :
          (analysis.text.length > 300 ? 'MEDIUM' : 'LOW'))),
      'Exact duplicate target': exactTarget,
      'Near-duplicate target': nearTarget,
      'Real business value': businessValue,
      'Possible search value': ['KEEP_AND_REDESIGN', 'KEEP_CONTENT_PAGE'].includes(disposition.action)
        ? (routeTests.valuablePattern.test(item.path) ? 'HIGH' : 'MEDIUM') : (isOwner ? 'UNKNOWN' : 'LOW'),
      'Possible backlink risk': 'UNKNOWN — no Search Console or backlink export available',
      'Image dependency status': imageStatus,
      'Hotlinked image count': analysis.hotlinks.length,
      'Missing image count': analysis.missing.length,
      'Demo/template indicators': analysis.demos.join('; ') || 'NONE FOUND',
      'Foreign company/location indicators': analysis.foreign.join('; ') || 'NONE FOUND',
      'Unverified business claim indicators': analysis.claims.map((claim) => claim.label).join('; ') || 'NONE FOUND',
      'Portfolio authenticity status': item.type === 'portfolio' ? 'LIKELY_THEME_DEMO' : 'NOT_APPLICABLE',
      'Owner information required': ownerNeeds.join('; ') || 'None for disposition; owner approval still required',
      'Final decision status': isOwner ? 'OWNER_CONFIRMATION_REQUIRED' : 'PROPOSED_NOT_IMPLEMENTED',
    };
  });

const headers = Object.keys(records[0]);
const dispositionCsv = [headers.map(csvCell).join(','), ...records.map((record) =>
  headers.map((header) => csvCell(record[header])).join(','))].join('\n');
const claimHeaders = ['Claim text', 'Route', 'Evidence found', 'Verification status', 'Recommended action'];
const claimsCsv = [claimHeaders.map(csvCell).join(','), ...claims.map((claim) =>
  claimHeaders.map((header) => csvCell(claim[header])).join(','))].join('\n');
const actionCounts = Object.fromEntries(allowedActions.map((action) =>
  [action, records.filter((record) => record['Proposed action'] === action).length]));

await mkdir(reportDirectory, { recursive: true });
await Promise.all([
  writeFile(path.join(reportDirectory, 'route-disposition-plan.csv'), `${dispositionCsv}\n`),
  writeFile(path.join(reportDirectory, 'unverified-claims-register.csv'), `${claimsCsv}\n`),
  writeFile(path.join(reportDirectory, 'route-disposition-report.md'),
    buildDispositionReport({ records, actionCounts, claims, redirectCsv, analyses, pages: allPages })),
  writeFile(path.join(reportDirectory, 'legal-page-requirements.md'), buildLegalRequirements()),
  writeFile(path.join(reportDirectory, 'owner-decisions-required.md'),
    buildOwnerDecisions({ records, claims })),
]);
console.log(`Wrote ${records.length} route dispositions and ${claims.length} claim records.`);
console.log(actionCounts);
