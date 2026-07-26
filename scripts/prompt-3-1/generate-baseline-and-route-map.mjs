import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { finalReviewRoutes } from '../lib/final-review-routes.mjs';
import { parseCsv } from '../phase7/lib/report-data.mjs';
import { csvText, extractSeo, hash } from './lib/seo-extract.mjs';

const root = process.cwd();
const dist = path.join(root, 'dist');
const reports = path.join(root, 'reports', 'public');
const config = path.join(root, 'config');
await mkdir(config, { recursive: true });

const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const baseline = [];
for (const route of finalReviewRoutes) {
  const file = route.route === '/' ? path.join(dist, 'index.html')
    : path.join(dist, route.route.slice(1), 'index.html');
  const html = await readFile(file, 'utf8');
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
  sourceCommit: 'a5f5ed9e85140d2bfcc07587e507bb0e460df83f',
  buildTarget: 'vps',
  routeCount: baseline.length,
  sitemapCount: sitemapUrls.size,
  routes: baseline,
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
  sourceCommit: 'a5f5ed9e85140d2bfcc07587e507bb0e460df83f',
  algorithm: 'sha256',
  routeCount: baseline.length,
  routes: contentLock,
}, null, 2)}\n`);

const coverage = parseCsv(await readFile(path.join(reports, 'all-production-url-coverage.csv'), 'utf8'));
const actionMap = {
  RETAIN_WITH_SAFE_DIFFERENCES: ['RETAIN_200', 200, 'APPROVED_STAGE_2'],
  MERGE_AND_301: ['REDIRECT_301', 301, 'APPROVED_ROUTE_CONSOLIDATION'],
  REMOVE_AND_410: ['GONE_410', 410, 'DEMO_OR_UNSUPPORTED_CONTENT_REMOVAL'],
  EXISTING_404: ['EXISTING_404', 404, 'OBSERVED_EXISTING_404'],
  OWNER_DECISION_REQUIRED: ['OWNER_DECISION_UNPUBLISHED', 404, 'OWNER_EVIDENCE_REQUIRED'],
};
const entries = coverage.map((row) => {
  const mapped = actionMap[row['Final action']];
  if (!mapped) throw new Error(`Unknown final action for ${row.Path}: ${row['Final action']}`);
  const [action, expectedStatus, evidenceCategory] = mapped;
  return {
    sourcePath: row.Path,
    action,
    ...(action === 'REDIRECT_301' ? { destination: row['Redirect destination'] } : {}),
    expectedStatus,
    reason: row.Reason,
    evidenceCategory,
  };
}).sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
const totals = Object.fromEntries([...new Set(entries.map(({ action }) => action))]
  .map((action) => [action, entries.filter((entry) => entry.action === action).length]));
const mapHash = hash(JSON.stringify(entries));
await writeFile(path.join(config, 'production-route-map.json'), `${JSON.stringify({
  preferredOrigin: 'https://rkrenosolution.com',
  sourceInventory: 'reports/public/all-production-url-coverage.csv',
  sourceCommit: 'a5f5ed9e85140d2bfcc07587e507bb0e460df83f',
  totals,
  mapHash,
  entries,
}, null, 2)}\n`);

const problems = [];
if (baseline.length !== 42) problems.push(`baseline routes ${baseline.length}`);
if (sitemapUrls.size !== 32) problems.push(`sitemap URLs ${sitemapUrls.size}`);
const expected = { RETAIN_200: 42, REDIRECT_301: 23, GONE_410: 66, EXISTING_404: 9, OWNER_DECISION_UNPUBLISHED: 5 };
for (const [action, count] of Object.entries(expected)) if (totals[action] !== count) {
  problems.push(`${action} ${totals[action] || 0}, expected ${count}`);
}
for (const item of baseline) {
  const $ = load(await readFile(item.route === '/' ? path.join(dist, 'index.html')
    : path.join(dist, item.route.slice(1), 'index.html'), 'utf8'));
  if ($('main h1').length !== 1) problems.push(`${item.route}: H1 count`);
}
console.log(JSON.stringify({ baseline: baseline.length, sitemap: sitemapUrls.size, totals, problems }, null, 2));
if (problems.length) process.exitCode = 1;
