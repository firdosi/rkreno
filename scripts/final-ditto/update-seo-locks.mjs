import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { finalReviewRoutes } from '../lib/final-review-routes.mjs';
import { csvText, extractSeo, hash } from '../prompt-3-1/lib/seo-extract.mjs';

const root = process.cwd();
const dist = path.join(root, 'dist');
const config = path.join(root, 'config');
const reports = path.join(root, 'reports', 'public');
const sourceCommit = 'MASTER_RECOVERY_PENDING_COMMIT';
const htmlFile = (route) => route === '/' ? path.join(dist, 'index.html')
  : path.join(dist, route.slice(1), 'index.html');

const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const baseline = [];
for (const route of finalReviewRoutes) {
  const html = await readFile(htmlFile(route.route), 'utf8');
  baseline.push({ pageFamily: route.group, ...extractSeo(html, route.route, sitemapUrls) });
}
const baselineHeaders = [
  'route', 'expectedProductionUrl', 'expectedHttpStatus', 'indexability', 'sitemapIncluded',
  'seoTitle', 'metaDescription', 'canonical', 'robots', 'h1', 'h2', 'h3',
  'openGraphTitle', 'openGraphDescription', 'openGraphUrl', 'openGraphImage', 'twitterCard',
  'schemaTypes', 'breadcrumbSchema', 'faqSchema', 'serviceSchema', 'articleSchema',
  'publishedDate', 'modifiedDate', 'internalLinkDestinations', 'imageUrls', 'imageAltText',
  'language', 'wordCount', 'mainContentTextHash',
];
await writeFile(path.join(reports, 'seo-baseline-final.csv'), csvText(baselineHeaders, baseline));
await writeFile(path.join(reports, 'seo-baseline-final.json'), `${JSON.stringify({
  sourceCommit, buildTarget: 'vps', routeCount: baseline.length,
  sitemapCount: sitemapUrls.size, routes: baseline,
}, null, 2)}\n`);

const contentLock = Object.fromEntries(baseline.map((item) => [item.route, {
  h1: item.h1,
  headingSequence: item.headingSequence,
  mainTextHash: item.mainContentTextHash,
  tableCount: item.tableCount,
  faqCount: item.faqCount,
  internalLinkCount: item.internalLinkCount,
  imageCount: item.imageCount,
  metadataHash: item.metadataHash,
}]));
await writeFile(path.join(config, 'approved-route-content-lock.json'), `${JSON.stringify({
  sourceCommit, algorithm: 'sha256', routeCount: baseline.length, routes: contentLock,
}, null, 2)}\n`);

const routeMapFile = path.join(config, 'production-route-map.json');
const routeMap = JSON.parse(await readFile(routeMapFile, 'utf8'));
const held = new Set(['/company-history/', '/our-projects-2/', '/our-projects/', '/our-team/', '/testimonials/']);
for (const entry of routeMap.entries) {
  if (!held.has(entry.sourcePath)) continue;
  entry.action = 'RETAIN_200';
  entry.expectedStatus = 200;
  entry.reason = 'Current visible WordPress page restored for owner review; production robots remain noindex, follow.';
  entry.evidenceCategory = 'WORDPRESS_SOURCE_OWNER_REVIEW';
}
if (!routeMap.entries.some(({ sourcePath }) => sourcePath === '/demolition-contractor-kl-selangor/')) {
  routeMap.entries.push({
    sourcePath: '/demolition-contractor-kl-selangor/',
    action: 'RETAIN_200',
    expectedStatus: 200,
    reason: 'Owner-requested demolition enquiry service page.',
    evidenceCategory: 'OWNER_REQUESTED_NEW_PAGE',
  });
}
routeMap.entries.sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
routeMap.sourceCommit = sourceCommit;
routeMap.totals = Object.fromEntries([...new Set(routeMap.entries.map(({ action }) => action))]
  .map((action) => [action, routeMap.entries.filter((entry) => entry.action === action).length]));
routeMap.mapHash = hash(JSON.stringify(routeMap.entries));
await writeFile(routeMapFile, `${JSON.stringify(routeMap, null, 2)}\n`);

const errors = [];
if (baseline.length !== 48) errors.push(`route baseline ${baseline.length}, expected 48`);
if (sitemapUrls.size !== 33) errors.push(`sitemap ${sitemapUrls.size}, expected 33`);
if (routeMap.totals.RETAIN_200 !== 48) errors.push(`retained ${routeMap.totals.RETAIN_200}, expected 48`);
if (routeMap.totals.OWNER_DECISION_UNPUBLISHED) errors.push('held routes still unpublished');
console.log(JSON.stringify({ routes: baseline.length, sitemap: sitemapUrls.size, totals: routeMap.totals, errors }, null, 2));
if (errors.length) process.exitCode = 1;
