import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import routeMap from '../../config/production-route-map.json' with { type: 'json' };
import contentLock from '../../config/approved-route-content-lock.json' with { type: 'json' };
import { extractSeo, parseSchemas, productionOrigin, schemaTypes } from './lib/seo-extract.mjs';

const simulator = (process.env.PRODUCTION_SIMULATOR_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const auditDir = path.resolve('.audit-cache', 'prompt-3-1');
await mkdir(auditDir, { recursive: true });
const baselineDocument = JSON.parse(await readFile(path.resolve('reports', 'public', 'seo-baseline-final.json'), 'utf8'));
const baselineByRoute = new Map(baselineDocument.routes.map((item) => [item.route, item]));
const failures = [];
const stats = {
  retained: 0, redirects: 0, gone: 0, existing404: 0, ownerUnpublished: 0,
  canonicalFailures: 0, metadataFailures: 0, schemaFailures: 0, internalLinkFailures: 0,
  stagingLeakageFailures: 0, headerFailures: 0,
};
const request = (pathname, options = {}) => fetch(`${simulator}${pathname}`, {
  redirect: 'manual',
  headers: { Host: 'rkrenosolution.com', 'X-Forwarded-Proto': 'https', ...(options.headers || {}) },
});
const record = (group, message) => {
  stats[group] += 1;
  failures.push(message);
};
const entries = new Map(routeMap.entries.map((item) => [item.sourcePath, item]));
const retained = routeMap.entries.filter((item) => item.action === 'RETAIN_200');
const sitemapResponse = await request('/sitemap.xml');
const sitemap = await sitemapResponse.text();
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapSet = new Set(sitemapUrls);
const allInternalLinks = new Set();
const allImageSources = new Set();
const inbound = new Map(retained.map((item) => [item.sourcePath, 0]));
const allowedSchemas = new Set([
  'Organization', 'LocalBusiness', 'WebSite', 'WebPage', 'Service', 'BlogPosting',
  'Article', 'BreadcrumbList', 'FAQPage', 'CollectionPage',
]);

for (const entry of retained) {
  stats.retained += 1;
  const response = await request(entry.sourcePath);
  const html = await response.text();
  const $ = load(html);
  if (response.status !== 200) failures.push(`${entry.sourcePath}: HTTP ${response.status}`);
  const seo = extractSeo(html, entry.sourcePath, sitemapSet);
  const expected = contentLock.routes[entry.sourcePath];
  const baseline = baselineByRoute.get(entry.sourcePath);
  if (!expected || seo.mainContentTextHash !== expected.mainTextHash
    || JSON.stringify(seo.headingSequence) !== JSON.stringify(expected.headingSequence)
    || seo.tableCount !== expected.tableCount || seo.faqCount !== expected.faqCount
    || seo.internalLinkCount !== expected.internalLinkCount || seo.imageCount !== expected.imageCount) {
    failures.push(`${entry.sourcePath}: approved content lock mismatch`);
  }
  if (seo.metadataHash !== expected?.metadataHash) record('metadataFailures', `${entry.sourcePath}: metadata lock mismatch`);
  if (seo.canonical !== `${productionOrigin}${entry.sourcePath}` || $('link[rel="canonical"]').length !== 1) {
    record('canonicalFailures', `${entry.sourcePath}: canonical mismatch or duplicate`);
  }
  const isArchive = /^\/(?:category|tag)\//.test(entry.sourcePath);
  const isThankYou = entry.sourcePath === '/thank-you/';
  const expectedRobots = isArchive ? 'noindex, follow' : isThankYou ? 'noindex, nofollow' : 'index, follow';
  if (seo.robots !== expectedRobots) failures.push(`${entry.sourcePath}: robots ${seo.robots}`);
  if (sitemapSet.has(`${productionOrigin}${entry.sourcePath}`) !== (!isArchive && !isThankYou)) {
    failures.push(`${entry.sourcePath}: sitemap/indexability mismatch`);
  }
  if (!seo.seoTitle || !seo.metaDescription || !seo.openGraphTitle || !seo.openGraphDescription
    || !seo.openGraphImage || !seo.twitterCard || !seo.h1) {
    record('metadataFailures', `${entry.sourcePath}: required metadata/H1 missing`);
  }
  const types = schemaTypes(parseSchemas($));
  for (const type of types) if (!allowedSchemas.has(type)) record('schemaFailures', `${entry.sourcePath}: unsupported schema ${type}`);
  if (types.includes('INVALID')) record('schemaFailures', `${entry.sourcePath}: invalid JSON-LD`);
  if (/"@type":"(?:AggregateRating|Review|Person)"/.test(JSON.stringify(parseSchemas($)))) {
    record('schemaFailures', `${entry.sourcePath}: unsupported rating/review/person schema`);
  }
  const schemaJson = JSON.stringify(parseSchemas($));
  if (/firdosi\.github\.io|\/rkreno\//i.test(schemaJson)) record('stagingLeakageFailures', `${entry.sourcePath}: staging schema URL`);
  if (types.includes('Organization') && (!schemaJson.includes('RK Reno Solution')
    || !schemaJson.includes('+601111334496') || !schemaJson.includes('Kuala Lumpur')
    || !schemaJson.includes('Selangor'))) {
    record('schemaFailures', `${entry.sourcePath}: organization facts incomplete`);
  }
  if ((/"telephone":/.test(schemaJson) && !/\+60\s?11\s?1133\s?4496/.test(schemaJson))
    || (/"email":/.test(schemaJson) && !schemaJson.includes('rkrenosolution@gmail.com'))
    || /registrationNumber|companyRegistration|AggregateRating|"@type":"Review"/i.test(schemaJson)) {
    record('schemaFailures', `${entry.sourcePath}: unsupported or incorrect business fact in schema`);
  }
  if (seo.publishedDate !== baseline?.publishedDate || seo.modifiedDate !== baseline?.modifiedDate) {
    record('schemaFailures', `${entry.sourcePath}: published/modified date changed`);
  }
  if (isArchive) {
    const collection = parseSchemas($).find((item) => item?.['@type'] === 'CollectionPage');
    const visible = $('.p23-archive-entry h2 a').map((_, anchor) =>
      new URL($(anchor).attr('href'), productionOrigin).pathname).get();
    const structured = collection?.hasPart?.map((item) => new URL(item.url).pathname) || [];
    if (JSON.stringify(visible) !== JSON.stringify(structured)) {
      record('schemaFailures', `${entry.sourcePath}: CollectionPage membership mismatch`);
    }
  }
  const visibleFaqs = $('main details summary,.rk-faq-item h3').map((_, item) => $(item).text().replace(/\s+/g, ' ').trim()).get();
  const faq = parseSchemas($).flatMap((item) => item?.['@graph'] || item)
    .find((item) => item?.['@type'] === 'FAQPage');
  if (faq && (faq.mainEntity?.length || 0) !== visibleFaqs.length) {
    record('schemaFailures', `${entry.sourcePath}: FAQ schema/content count mismatch`);
  }
  if (/firdosi\.github\.io|localhost|127\.0\.0\.1|\/rkreno\//i.test(html)) {
    record('stagingLeakageFailures', `${entry.sourcePath}: production-host leakage`);
  }
  $('img').each((_, image) => {
    const source = $(image).attr('src') || '';
    if (/^https?:\/\//i.test(source)) failures.push(`${entry.sourcePath}: remote image ${source}`);
    if ($(image).attr('alt') === undefined) failures.push(`${entry.sourcePath}: missing image alt`);
    if (!$(image).attr('width') || !$(image).attr('height')) failures.push(`${entry.sourcePath}: image dimensions missing`);
    if (source && !/^https?:\/\//i.test(source)) allImageSources.add(source);
  });
  $('a[href]').each((_, anchor) => {
    const href = $(anchor).attr('href') || '';
    if (!href || /^javascript:/i.test(href)) record('internalLinkFailures', `${entry.sourcePath}: invalid link`);
    try {
      const url = new URL(href, productionOrigin);
      if (url.hostname === 'rkrenosolution.com') {
        allInternalLinks.add(url.pathname);
        if (inbound.has(url.pathname)) inbound.set(url.pathname, inbound.get(url.pathname) + 1);
        const target = entries.get(url.pathname);
        if (target && target.action !== 'RETAIN_200') {
          record('internalLinkFailures', `${entry.sourcePath}: links to ${target.action} ${url.pathname}`);
        }
      }
    } catch {}
  });
  for (const header of ['content-security-policy', 'permissions-policy', 'referrer-policy', 'x-content-type-options', 'x-frame-options', 'strict-transport-security']) {
    if (!response.headers.get(header)) record('headerFailures', `${entry.sourcePath}: missing ${header}`);
  }
  if (!/max-age=0.*must-revalidate/i.test(response.headers.get('cache-control') || '')) {
    record('headerFailures', `${entry.sourcePath}: HTML cache policy`);
  }
}

for (const entry of routeMap.entries.filter((item) => item.action === 'REDIRECT_301')) {
  stats.redirects += 1;
  const response = await request(entry.sourcePath);
  const location = response.headers.get('location');
  if (response.status !== 301 || location !== `${productionOrigin}${entry.destination}`) {
    failures.push(`${entry.sourcePath}: redirect ${response.status} ${location}`);
    continue;
  }
  const destination = await request(entry.destination);
  if (destination.status !== 200) failures.push(`${entry.sourcePath}: destination HTTP ${destination.status}`);
  if (entries.get(entry.destination)?.action !== 'RETAIN_200') failures.push(`${entry.sourcePath}: destination not retained`);
}
for (const entry of routeMap.entries.filter((item) => item.action === 'GONE_410')) {
  stats.gone += 1;
  const response = await request(entry.sourcePath);
  const body = await response.text();
  if (response.status !== 410 || /<html|RK Reno Solution/i.test(body)) failures.push(`${entry.sourcePath}: invalid 410`);
}
for (const entry of routeMap.entries.filter((item) => item.action === 'EXISTING_404')) {
  stats.existing404 += 1;
  if ((await request(entry.sourcePath)).status !== 404) failures.push(`${entry.sourcePath}: expected 404`);
}
for (const entry of routeMap.entries.filter((item) => item.action === 'OWNER_DECISION_UNPUBLISHED')) {
  stats.ownerUnpublished += 1;
  if ((await request(entry.sourcePath)).status !== 404) failures.push(`${entry.sourcePath}: owner route is published`);
}

if (sitemapResponse.status !== 200 || sitemapUrls.length !== 32 || sitemapSet.size !== 32) failures.push('sitemap: expected 32 unique URLs');
if (/<lastmod>/i.test(sitemap)) failures.push('sitemap: unverified lastmod values present');
if (sitemapUrls.some((url) => !url.startsWith(`${productionOrigin}/`) || /[?#]/.test(url))) failures.push('sitemap: invalid origin or parameter');
for (const entry of routeMap.entries.filter((item) => item.action !== 'RETAIN_200')) {
  if (sitemapSet.has(`${productionOrigin}${entry.sourcePath}`)) failures.push(`${entry.sourcePath}: non-retained route in sitemap`);
}
const robotsResponse = await request('/robots.txt');
const robots = await robotsResponse.text();
if (robotsResponse.status !== 200 || !robots.includes('Allow: /')
  || !robots.includes(`Sitemap: ${productionOrigin}/sitemap.xml`) || robots.includes('Disallow: /')) failures.push('production robots.txt mismatch');

for (const route of allInternalLinks) {
  if (/^\/(?:assets|_astro)\//.test(route) || ['/robots.txt', '/sitemap.xml'].includes(route)) continue;
  const response = await request(route);
  if (response.status !== 200) record('internalLinkFailures', `internal destination ${route}: HTTP ${response.status}`);
}
for (const source of allImageSources) {
  const response = await request(source);
  if (response.status !== 200 || !response.headers.get('content-type')?.startsWith('image/')) {
    failures.push(`image ${source}: HTTP ${response.status} or invalid content type`);
  }
}
for (const [route, count] of inbound) if (!['/', '/thank-you/'].includes(route) && count === 0) {
  record('internalLinkFailures', `${route}: orphan retained route`);
}

const normalization = [
  ['/', { 'X-Forwarded-Host': 'rkrenosolution.com', 'X-Forwarded-Proto': 'http' }, `${productionOrigin}/`],
  ['/services/', { 'X-Forwarded-Host': 'www.rkrenosolution.com', 'X-Forwarded-Proto': 'https' }, `${productionOrigin}/services/`],
  ['/services', {}, `${productionOrigin}/services/`],
  ['//services///', {}, `${productionOrigin}/services/`],
  ['/services/index.html', {}, `${productionOrigin}/services/`],
  ['/SERVICES/', {}, `${productionOrigin}/services/`],
];
for (const [route, headers, expected] of normalization) {
  const response = await fetch(`${simulator}${route}`, {
    redirect: 'manual', headers: { Host: 'rkrenosolution.com', 'X-Forwarded-Proto': 'https', ...headers },
  });
  if (response.status !== 301 || response.headers.get('location') !== expected) failures.push(`${route}: normalization failed`);
}
const missing = await request('/__prompt-3-1-real-404__/');
if (missing.status !== 404 || !(await missing.text()).includes('Page not found')) failures.push('custom 404 failed');
const assetPath = load(await (await request('/')).text())('link[rel="stylesheet"][href^="/"]').first().attr('href');
if (assetPath) {
  const asset = await request(assetPath, { headers: { 'Accept-Encoding': 'gzip' } });
  if (asset.status !== 200 || !/immutable/.test(asset.headers.get('cache-control') || '')
    || !asset.headers.get('content-type')) record('headerFailures', 'versioned asset cache/content type');
}

await writeFile(path.join(auditDir, 'readiness-result.json'), `${JSON.stringify({
  result: failures.length ? 'FAIL' : 'PASS', stats, sitemapCount: sitemapUrls.length, failures,
}, null, 2)}\n`);
console.log(JSON.stringify({ result: failures.length ? 'FAIL' : 'PASS', stats, sitemapCount: sitemapUrls.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
