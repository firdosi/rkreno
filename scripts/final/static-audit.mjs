import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { clean, exists, htmlFile, localFile, normalizeRoute, readJson, schemaTypes } from './helpers.mjs';

const cleaningRoute = '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/';
const expectedPhone = '+601111334496';
const externalAsset = (value = '') => /^https?:/i.test(value);
const collectFiles = async (dir) => {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    files.push(...(entry.isDirectory() ? await collectFiles(file) : [file]));
  }
  return files;
};

export async function auditStatic(root) {
  const registry = await readJson(path.join(root, 'config/final-route-registry.json'));
  const routeMap = await readJson(path.join(root, 'config/production-route-map.json'));
  const prompt2Config = await readJson(path.join(root, 'config/prompt-2-content-requirements.json'));
  const prompt3Config = await readJson(path.join(root, 'config/prompt-3-content-requirements.json'));
  const publicPaths = new Set(registry.publicRoutes.map((item) => item.path));
  const errors = [];
  const rows = [];
  const titleOwners = new Map();
  const descriptionOwners = new Map();
  let brokenLinks = 0;
  let brokenImages = 0;
  let remoteWordPressAssets = 0;
  let unsupportedSchemas = 0;
  let accessibilitySerious = 0;
  let remoteDependencies = 0;

  for (const route of registry.publicRoutes) {
    const html = await readFile(htmlFile(root, route.path), 'utf8');
    const $ = load(html);
    const main = $('main');
    const pageErrors = { content: [], seo: [], image: [], link: [], accessibility: [], schema: [], performance: [] };
    const title = clean($('title').text());
    const description = clean($('meta[name="description"]').attr('content') || '');
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const h1 = clean(main.find('h1').text());
    const words = clean(main.text()).split(/\s+/).filter(Boolean).length;
    const images = main.find('img').toArray();
    const internalLinks = [];
    const schemas = [];

    if (!title || titleOwners.has(title)) pageErrors.seo.push(title ? `duplicate title with ${titleOwners.get(title)}` : 'missing title');
    else titleOwners.set(title, route.path);
    if (description.length < 50 || descriptionOwners.has(description)) pageErrors.seo.push(description ? `duplicate/short description` : 'missing description');
    else descriptionOwners.set(description, route.path);
    if (canonical !== route.canonical) pageErrors.seo.push(`canonical ${canonical}`);
    if (!/noindex\s*,\s*nofollow/i.test($('meta[name="robots"]').attr('content') || '')) pageErrors.seo.push('staging is indexable');
    for (const property of ['og:title', 'og:description', 'og:image', 'og:url']) {
      if (!clean($(`meta[property="${property}"]`).attr('content') || '')) pageErrors.seo.push(`missing ${property}`);
    }
    if ($('meta[property="og:url"]').attr('content') !== canonical) pageErrors.seo.push('Open Graph URL differs from canonical');
    if (/firdosi\.github\.io|\/rkreno\//i.test([canonical, $('meta[property="og:image"]').attr('content')].join(' '))) pageErrors.seo.push('staging URL in production metadata');
    if (main.find('h1').length !== 1) pageErrors.content.push(`H1 count ${main.find('h1').length}`);
    const levels = main.find('h1,h2,h3,h4,h5,h6').toArray().map((node) => Number(node.tagName.slice(1)));
    if (levels.some((level, index) => index && level > levels[index - 1] + 1)) pageErrors.accessibility.push('heading hierarchy jump');
    if (words < (route.path === '/thank-you/' ? 20 : 55)) pageErrors.content.push(`thin content ${words}`);

    for (const image of images) {
      const element = $(image); const src = element.attr('src') || '';
      if (element.attr('alt') === undefined) pageErrors.accessibility.push(`missing image alt ${src}`);
      if (!element.attr('width') || !element.attr('height')) pageErrors.image.push(`missing dimensions ${src}`);
      if (externalAsset(src)) pageErrors.image.push(`remote image ${src}`);
      if (/rkrenosolution\.com\/wp-content/i.test(src)) remoteWordPressAssets += 1;
      if (src.startsWith('/') && !(await exists(localFile(root, src)))) { pageErrors.image.push(`broken image ${src}`); brokenImages += 1; }
      const file = src.startsWith('/') ? localFile(root, src) : null;
      if (file && await exists(file) && (await stat(file)).size > 2_000_000) pageErrors.performance.push(`oversized image ${src}`);
    }
    for (const anchor of $('a').toArray()) {
      const href = $(anchor).attr('href') || '';
      if (!href || href === '#') pageErrors.link.push('empty or placeholder link');
      if (/^https?:\/\/(?:www\.)?rkrenosolution\.com/i.test(href)) pageErrors.link.push(`internal link made external ${href}`);
      const destination = normalizeRoute(href, route.path);
      if (!destination) continue;
      internalLinks.push(destination);
      const destinationFile = path.posix.extname(destination) ? localFile(root, destination) : htmlFile(root, destination);
      if (!(await exists(destinationFile))) { pageErrors.link.push(`broken internal link ${href}`); brokenLinks += 1; }
      if (!publicPaths.has(destination) && !path.posix.extname(destination)) pageErrors.link.push(`link to non-public route ${href}`);
    }
    for (const script of $('script[type="application/ld+json"]').toArray()) {
      try {
        const schema = JSON.parse($(script).text()); schemas.push(schema);
        if (schema['@context'] !== 'https://schema.org') pageErrors.schema.push('invalid @context');
        const types = schemaTypes(schema);
        if (types.includes('AggregateRating') || types.includes('Review') || /"(?:ratingValue|reviewCount)"\s*:/.test(JSON.stringify(schema))) pageErrors.schema.push('unsupported rating/review schema');
        if (/firdosi\.github\.io|\/rkreno\//i.test(JSON.stringify(schema))) pageErrors.schema.push('staging URL in schema');
      } catch { pageErrors.schema.push('invalid JSON-LD'); }
    }
    const faqSchemas = schemas.filter((schema) => schemaTypes(schema).includes('FAQPage'));
    if (faqSchemas.length && !main.find('details').length) pageErrors.schema.push('FAQ schema without visible FAQ');
    const ids = $('[id]').toArray().map((node) => $(node).attr('id'));
    if (new Set(ids).size !== ids.length) pageErrors.accessibility.push('duplicate IDs');
    if ($('html').attr('lang') !== 'en' || !$('main').length || !$('header').length || !$('footer').length || !$('a.skip-link[href="#main-content"]').length) pageErrors.accessibility.push('missing language or landmark');
    for (const control of $('input:not([type="hidden"]),select,textarea').toArray()) {
      const id = $(control).attr('id');
      if ($(control).closest('[aria-hidden="true"]').length) continue;
      if (!$(control).closest('label').length && !(id && $(`label[for="${id}"]`).length) && !$(control).attr('aria-label')) pageErrors.accessibility.push(`unlabelled field ${$(control).attr('name') || ''}`);
    }
    for (const asset of $('script[src],link[rel="stylesheet"][href],img[src],source[src]').toArray()) {
      const value = $(asset).attr('src') || $(asset).attr('href') || '';
      if (externalAsset(value)) { pageErrors.performance.push(`external runtime dependency ${value}`); remoteDependencies += 1; }
    }
    if ($('form[action]').length) pageErrors.content.push('staging form action present');
    if ($('form').length && !/preview only|not sent/i.test(clean(main.text()))) pageErrors.content.push('missing staging no-send message');
    const leadMarkup = html.match(/(?:tel:\+601111334496|wa\.me\/601111334496)/g) || [];
    if (!leadMarkup.length && route.path !== '/thank-you/') pageErrors.link.push('missing phone or WhatsApp lead action');
    if (/elementor-|wp-admin\/|wpcf7-|googletagmanager|google-analytics|challenges\.cloudflare/i.test(html)) pageErrors.performance.push('runtime residue or disabled integration present');

    const allErrors = Object.values(pageErrors).flat();
    unsupportedSchemas += pageErrors.schema.length;
    accessibilitySerious += pageErrors.accessibility.length;
    errors.push(...allErrors.map((error) => `${route.path}: ${error}`));
    rows.push({
      route: route.path, pageType: route.pageType, sourceType: route.sourceType,
      indexability: route.indexability, sitemapInclusion: route.sitemapInclusion,
      canonical, title, description, h1, words, localImages: images.length,
      missingOriginalAsset: route.path === cleaningRoute ? 'DOCUMENTED_7_ORIGINALS_UNAVAILABLE' : 'NONE',
      internalLinks: internalLinks.length, schemaTypes: [...new Set(schemas.flatMap(schemaTypes))],
      pageErrors,
    });
  }

  const sitemap = await readFile(path.join(root, 'dist/sitemap.xml'), 'utf8');
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (sitemapUrls.length !== 33 || new Set(sitemapUrls).size !== 33) errors.push(`Sitemap count/uniqueness is ${sitemapUrls.length}/${new Set(sitemapUrls).size}.`);
  if (sitemapUrls.some((url) => !url.startsWith('https://rkrenosolution.com/') || url.includes('/rkreno/'))) errors.push('Sitemap contains invalid production URL.');
  const robots = await readFile(path.join(root, 'dist/robots.txt'), 'utf8');
  if (!/^User-agent: \*\s+Disallow: \/\s*$/m.test(robots.trim())) errors.push('GitHub robots is not disallow-all.');
  const cssFiles = (await collectFiles(path.join(root, 'dist'))).filter((file) => file.endsWith('.css'));
  const cssErrors = [];
  for (const file of cssFiles) {
    const css = await readFile(file, 'utf8');
    for (const match of css.matchAll(/url\((['"]?)([^)'"\s]+)\1\)/g)) {
      const url = match[2];
      if (/^(?:data:|#)/.test(url)) continue;
      if (externalAsset(url)) { cssErrors.push(`remote CSS asset ${url}`); continue; }
      const resolved = url.startsWith('/') ? localFile(root, url) : path.resolve(path.dirname(file), decodeURIComponent(url));
      if (!(await exists(resolved))) cssErrors.push(`missing CSS asset ${url} from ${path.basename(file)}`);
    }
  }
  errors.push(...cssErrors);
  const redirectSources = new Set(routeMap.entries.filter((item) => item.action === 'REDIRECT_301').map((item) => item.sourcePath));
  for (const item of routeMap.entries.filter((entry) => entry.action === 'REDIRECT_301')) {
    if (!publicPaths.has(item.destination) || redirectSources.has(item.destination)) errors.push(`Unsafe redirect ${item.sourcePath} -> ${item.destination}`);
  }
  const p2Routes = new Set(prompt2Config.routes.map((item) => item.route));
  const p3Routes = new Set(prompt3Config.routes.map((item) => item.route));
  return { errors, rows, sitemapUrls, cssErrors, counts: {
    publicRoutes: rows.length, indexableRoutes: rows.filter((row) => row.indexability === 'index').length,
    sitemapUrls: sitemapUrls.length, brokenLinks, brokenImages, remoteWordPressAssets,
    remoteDependencies, unsupportedSchemas, accessibilitySerious,
    missingContent: rows.filter((row) => row.pageErrors.content.length).length,
    missingOriginalAssets: rows.filter((row) => row.missingOriginalAsset !== 'NONE').length,
    prompt2Routes: rows.filter((row) => p2Routes.has(row.route)).length,
    prompt3Routes: rows.filter((row) => p3Routes.has(row.route)).length,
  }};
}
