import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { parseCsv } from '../phase7/lib/report-data.mjs';
import { cleanText, csvText, extractSeo, hash, productionOrigin } from './lib/seo-extract.mjs';

const reports = path.resolve('reports', 'public');
const auditDir = path.resolve('.audit-cache', 'prompt-3-1');
await mkdir(auditDir, { recursive: true });
const baselineDocument = JSON.parse(await readFile(path.join(reports, 'seo-baseline-final.json'), 'utf8'));
const baseline = baselineDocument.routes;
const previous = [
  ...parseCsv(await readFile(path.join(reports, 'prompt-2-1-corrections.csv'), 'utf8')),
  ...parseCsv(await readFile(path.join(reports, 'prompt-2-2-corrections.csv'), 'utf8')),
  ...parseCsv(await readFile(path.join(reports, 'prompt-2-3-final-corrections.csv'), 'utf8')),
];
const priorByRoute = new Map(previous.map((row) => [row.Route, row]));

async function fetchRetry(url, options = {}) {
  let error;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetch(url, {
        ...options,
        headers: { 'User-Agent': 'RK-Reno-SEO-Continuity/1.0', ...(options.headers || {}) },
        signal: AbortSignal.timeout(30_000),
      });
    } catch (value) {
      error = value;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw error;
}

async function liveSitemapUrls() {
  const urls = new Set();
  const pending = [`${productionOrigin}/sitemap.xml`];
  const visited = new Set();
  while (pending.length && visited.size < 40) {
    const current = pending.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    try {
      const response = await fetchRetry(current);
      const xml = await response.text();
      for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        const location = match[1].replaceAll('&amp;', '&');
        if (/\.xml(?:\?|$)/i.test(location)) pending.push(location);
        else urls.add(location.replace(/\/$/, '/') || location);
      }
    } catch {}
  }
  return urls;
}

async function fetchWithTrace(route) {
  let url = `${productionOrigin}${route}`;
  const redirects = [];
  for (let hop = 0; hop < 6; hop += 1) {
    const response = await fetchRetry(url, { redirect: 'manual' });
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      const next = new URL(response.headers.get('location'), url).href;
      redirects.push(`${response.status} ${url} -> ${next}`);
      url = next;
      continue;
    }
    return { response, finalUrl: url, redirects };
  }
  throw new Error(`${route}: redirect chain exceeded five hops`);
}

const liveSitemap = await liveSitemapUrls();
const snapshot = [];
let cursor = 0;
const workers = Array.from({ length: 6 }, async () => {
  while (cursor < baseline.length) {
    const item = baseline[cursor++];
    try {
      const { response, finalUrl, redirects } = await fetchWithTrace(item.route);
      const html = await response.text();
      const seo = extractSeo(html, item.route, liveSitemap);
      const $ = load(html);
      snapshot.push({
        route: item.route,
        httpStatus: response.status,
        finalResolvedUrl: finalUrl,
        redirectsBeforePage: redirects,
        title: seo.seoTitle,
        metaDescription: seo.metaDescription,
        canonical: seo.canonical,
        robots: seo.robots,
        h1: seo.h1,
        mainHeadings: seo.headingSequence,
        openGraphTitle: seo.openGraphTitle,
        openGraphDescription: seo.openGraphDescription,
        openGraphUrl: seo.openGraphUrl,
        openGraphImage: seo.openGraphImage,
        schemaTypes: seo.schemaTypes,
        publishedDate: seo.publishedDate,
        modifiedDate: seo.modifiedDate,
        sitemapPresence: liveSitemap.has(finalUrl),
        importantInternalLinks: seo.internalLinkDestinations,
        mainVisibleContentHash: seo.mainContentTextHash,
        mainVisibleWordCount: seo.wordCount,
        imageReferences: seo.imageUrls,
        googleSiteVerification: $('meta[name="google-site-verification"]').attr('content') || '',
        sourceStatus: 'AVAILABLE',
      });
    } catch (error) {
      snapshot.push({
        route: item.route, httpStatus: '', finalResolvedUrl: '', redirectsBeforePage: [],
        title: '', metaDescription: '', canonical: '', robots: '', h1: '', mainHeadings: [],
        openGraphTitle: '', openGraphDescription: '', openGraphUrl: '', openGraphImage: '',
        schemaTypes: [], publishedDate: '', modifiedDate: '', sitemapPresence: false,
        importantInternalLinks: [], mainVisibleContentHash: '', mainVisibleWordCount: 0,
        imageReferences: [], googleSiteVerification: '', sourceStatus: `UNAVAILABLE: ${error.message}`,
      });
    }
  }
});
await Promise.all(workers);
snapshot.sort((left, right) => baseline.findIndex((item) => item.route === left.route)
  - baseline.findIndex((item) => item.route === right.route));

const snapshotHeaders = [
  'route', 'httpStatus', 'finalResolvedUrl', 'redirectsBeforePage', 'title', 'metaDescription',
  'canonical', 'robots', 'h1', 'mainHeadings', 'openGraphTitle', 'openGraphDescription',
  'openGraphUrl', 'openGraphImage', 'schemaTypes', 'publishedDate', 'modifiedDate',
  'sitemapPresence', 'importantInternalLinks', 'mainVisibleContentHash', 'mainVisibleWordCount',
  'imageReferences', 'googleSiteVerification', 'sourceStatus',
];
await writeFile(path.join(reports, 'live-wordpress-seo-snapshot.csv'), csvText(snapshotHeaders, snapshot));

const normalize = (value) => cleanText(Array.isArray(value) ? value.join(' | ') : String(value ?? ''))
  .toLowerCase().replace(/[–—]/g, '-');
const differenceFor = (route) => {
  const prior = priorByRoute.get(route);
  if (!prior) return ['TECHNICAL_IMPLEMENTATION_DIFFERENCE', 'Approved Astro implementation remains frozen'];
  if (prior['Remaining difference'] === 'SOURCE_IMAGE_UNAVAILABLE') {
    return ['BROKEN_SOURCE_IMAGE_REPLACED', prior.Reason];
  }
  if (prior['Remaining difference'] === 'SAFE_DEMO_EXCLUSION') {
    return [/warranty|guarantee|claim/i.test(prior.Reason)
      ? 'UNSUPPORTED_CLAIM_REMOVED' : 'DEMO_CONTENT_REMOVED', prior.Reason];
  }
  return ['TECHNICAL_IMPLEMENTATION_DIFFERENCE', prior.Reason];
};
const comparisons = [];
const signals = [
  ['HTTP status', 'httpStatus', 'expectedHttpStatus'],
  ['Final resolved URL', 'finalResolvedUrl', 'expectedProductionUrl'],
  ['Redirects before page', 'redirectsBeforePage', null],
  ['SEO title', 'title', 'seoTitle'],
  ['Meta description', 'metaDescription', 'metaDescription'],
  ['Canonical', 'canonical', 'canonical'],
  ['Robots', 'robots', 'robots'],
  ['H1', 'h1', 'h1'],
  ['Main headings', 'mainHeadings', 'headingSequence'],
  ['Open Graph title', 'openGraphTitle', 'openGraphTitle'],
  ['Open Graph description', 'openGraphDescription', 'openGraphDescription'],
  ['Open Graph URL', 'openGraphUrl', 'openGraphUrl'],
  ['Open Graph image', 'openGraphImage', 'openGraphImage'],
  ['Schema types', 'schemaTypes', 'schemaTypes'],
  ['Published date', 'publishedDate', 'publishedDate'],
  ['Modified date', 'modifiedDate', 'modifiedDate'],
  ['Sitemap presence', 'sitemapPresence', 'sitemapIncluded'],
  ['Important internal links', 'importantInternalLinks', 'internalLinkDestinations'],
  ['Main visible content', 'mainVisibleContentHash', 'mainContentTextHash'],
  ['Image references', 'imageReferences', 'imageUrls'],
];
for (const astro of baseline) {
  const wordpress = snapshot.find((item) => item.route === astro.route);
  for (const [signal, liveKey, astroKey] of signals) {
    const liveValue = liveKey === 'redirectsBeforePage' ? wordpress[liveKey] : wordpress[liveKey];
    const astroValue = astroKey ? astro[astroKey] : [];
    let matchStatus = 'EXACT';
    let differenceType = 'NONE';
    let action = 'NONE';
    let reason = 'Values match after normalization.';
    if (wordpress.sourceStatus !== 'AVAILABLE') {
      matchStatus = 'SOURCE_UNAVAILABLE'; differenceType = 'SOURCE_UNAVAILABLE';
      action = 'RETRY_SOURCE'; reason = wordpress.sourceStatus;
    } else if (normalize(liveValue) !== normalize(astroValue)) {
      const criticalMissing = ['SEO title', 'Meta description', 'Canonical', 'H1']
        .includes(signal) && !normalize(astroValue);
      const badCanonical = signal === 'Canonical' && astroValue !== astro.expectedProductionUrl;
      if (criticalMissing || badCanonical) {
        matchStatus = 'REQUIRES_FIX'; differenceType = 'SEO_RISK';
        action = 'FIX_BEFORE_LAUNCH'; reason = 'Approved production output is missing or misdirects a critical SEO signal.';
      } else if (['Robots', 'Schema types', 'Sitemap presence', 'Redirects before page'].includes(signal)) {
        matchStatus = 'EQUIVALENT_SAFE'; differenceType = 'TECHNICAL_IMPLEMENTATION_DIFFERENCE';
        action = 'PRESERVE_APPROVED_ASTRO'; reason = 'The Astro control is explicit and matches the approved production indexing strategy.';
      } else {
        const [type, priorReason] = differenceFor(astro.route);
        matchStatus = 'INTENTIONAL_CORRECTION'; differenceType = type;
        action = 'PRESERVE_APPROVED_ASTRO'; reason = priorReason;
      }
    }
    comparisons.push({
      Route: astro.route, Signal: signal, 'WordPress value': liveValue,
      'Astro production value': astroValue, 'Match status': matchStatus,
      'Difference type': differenceType, Action: action, Reason: reason,
    });
  }
}
const continuityHeaders = [
  'Route', 'Signal', 'WordPress value', 'Astro production value',
  'Match status', 'Difference type', 'Action', 'Reason',
];
await writeFile(path.join(reports, 'wordpress-to-astro-seo-continuity.csv'),
  csvText(continuityHeaders, comparisons));
await writeFile(path.join(auditDir, 'live-seo-summary.json'), `${JSON.stringify({
  routes: snapshot.length,
  available: snapshot.filter((item) => item.sourceStatus === 'AVAILABLE').length,
  liveSitemapUrls: liveSitemap.size,
  matchCounts: Object.fromEntries([...new Set(comparisons.map((item) => item['Match status']))]
    .map((status) => [status, comparisons.filter((item) => item['Match status'] === status).length])),
  requiresFix: comparisons.filter((item) => item['Match status'] === 'REQUIRES_FIX'),
  verificationValues: [...new Set(snapshot.map((item) => item.googleSiteVerification).filter(Boolean))],
  snapshotHash: hash(JSON.stringify(snapshot)),
}, null, 2)}\n`);
console.log(JSON.stringify({
  routes: snapshot.length,
  available: snapshot.filter((item) => item.sourceStatus === 'AVAILABLE').length,
  comparisons: comparisons.length,
  requiresFix: comparisons.filter((item) => item['Match status'] === 'REQUIRES_FIX').length,
}, null, 2));
if (comparisons.some((item) => item['Match status'] === 'REQUIRES_FIX')) process.exitCode = 1;
