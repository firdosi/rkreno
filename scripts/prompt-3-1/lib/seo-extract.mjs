import { createHash } from 'node:crypto';
import { load } from 'cheerio';

export const productionOrigin = 'https://rkrenosolution.com';
export const cleanText = (value = '') => value.replace(/\s+/g, ' ').trim();
export const hash = (value) => createHash('sha256').update(String(value)).digest('hex');

export function parseSchemas($) {
  return $('script[type="application/ld+json"]').map((_, node) => {
    try { return JSON.parse($(node).text()); } catch { return { '@type': 'INVALID' }; }
  }).get();
}

export function schemaTypes(value) {
  if (Array.isArray(value)) return value.flatMap(schemaTypes);
  if (!value || typeof value !== 'object') return [];
  const own = [value['@type']].flat().filter(Boolean);
  const graph = value['@graph'] ? schemaTypes(value['@graph']) : [];
  return [...own, ...graph];
}

function schemaNodes(value) {
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  if (!value || typeof value !== 'object') return [];
  return [value, ...schemaNodes(value['@graph'] || [])];
}

export function extractSeo(html, route, sitemapUrls = new Set()) {
  const $ = load(html);
  const main = $('main').first();
  const mainText = cleanText(main.text());
  const schemas = parseSchemas($);
  const nodes = schemaNodes(schemas);
  const types = [...new Set(schemaTypes(schemas))];
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const robots = $('meta[name="robots"]').attr('content') || '';
  const internalLinks = [...new Set(main.find('a[href]').map((_, link) => {
    const href = $(link).attr('href') || '';
    try {
      const url = new URL(href, productionOrigin);
      return url.hostname === 'rkrenosolution.com' ? url.pathname : '';
    } catch { return ''; }
  }).get().filter(Boolean))];
  const images = main.find('img').map((_, image) => ({
    url: $(image).attr('src') || '',
    alt: $(image).attr('alt') ?? '',
  })).get();
  const articleNode = nodes.find((node) => ['BlogPosting', 'Article'].includes(node['@type']));
  const metadata = {
    title: cleanText($('title').text()),
    description: $('meta[name="description"]').attr('content') || '',
    canonical,
    robots,
    ogTitle: $('meta[property="og:title"]').attr('content') || '',
    ogDescription: $('meta[property="og:description"]').attr('content') || '',
    ogUrl: $('meta[property="og:url"]').attr('content') || '',
    ogImage: $('meta[property="og:image"]').attr('content') || '',
    twitterCard: $('meta[name="twitter:card"]').attr('content') || '',
  };
  return {
    route,
    expectedProductionUrl: `${productionOrigin}${route}`,
    expectedHttpStatus: 200,
    indexability: /^index,\s*follow$/i.test(robots) ? 'INDEXABLE'
      : /^noindex,\s*follow$/i.test(robots) ? 'NOINDEX_FOLLOW' : 'NOINDEX_NOFOLLOW',
    sitemapIncluded: sitemapUrls.has(`${productionOrigin}${route}`),
    seoTitle: metadata.title,
    metaDescription: metadata.description,
    canonical,
    robots,
    h1: main.find('h1').map((_, item) => cleanText($(item).text())).get()[0] || '',
    h2: main.find('h2').map((_, item) => cleanText($(item).text())).get(),
    h3: main.find('h3').map((_, item) => cleanText($(item).text())).get(),
    openGraphTitle: metadata.ogTitle,
    openGraphDescription: metadata.ogDescription,
    openGraphUrl: metadata.ogUrl,
    openGraphImage: metadata.ogImage,
    twitterCard: metadata.twitterCard,
    schemaTypes: types,
    breadcrumbSchema: types.includes('BreadcrumbList'),
    faqSchema: types.includes('FAQPage'),
    serviceSchema: types.includes('Service'),
    articleSchema: types.some((type) => ['BlogPosting', 'Article'].includes(type)),
    publishedDate: articleNode?.datePublished || $('meta[property="article:published_time"]').attr('content') || '',
    modifiedDate: articleNode?.dateModified || $('meta[property="article:modified_time"]').attr('content') || '',
    internalLinkDestinations: internalLinks,
    imageUrls: images.map(({ url }) => url),
    imageAltText: images.map(({ alt }) => alt),
    language: $('html').attr('lang') || '',
    wordCount: mainText ? mainText.split(/\s+/).length : 0,
    mainContentTextHash: hash(mainText),
    headingSequence: main.find('h1,h2,h3,h4,h5,h6').map((_, item) =>
      `${item.tagName.toUpperCase()}:${cleanText($(item).text())}`).get(),
    tableCount: main.find('table').length,
    faqCount: main.find('.rk-faq-item, details').length,
    internalLinkCount: main.find('a[href]').length,
    imageCount: images.length,
    metadataHash: hash(JSON.stringify(metadata)),
  };
}

export const csvValue = (value) => Array.isArray(value)
  ? value.map((item) => typeof item === 'object' ? JSON.stringify(item) : item).join(' | ')
  : typeof value === 'boolean' ? String(value).toUpperCase() : String(value ?? '');

export function csvText(headers, rows) {
  const quote = (value) => `"${csvValue(value).replaceAll('"', '""')}"`;
  return [headers, ...rows.map((row) => headers.map((header) => row[header]))]
    .map((row) => row.map(quote).join(',')).join('\n') + '\n';
}
