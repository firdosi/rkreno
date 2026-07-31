import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const exists = async (file) => access(file).then(() => true).catch(() => false);
const cleanText = (value) => value.replace(/\s+/g, ' ').trim();

export async function validateStatic(root) {
  const dist = path.join(root, 'dist');
  const registry = JSON.parse(await readFile(path.join(root, 'config/final-route-registry.json'), 'utf8'));
  const routeMap = JSON.parse(await readFile(path.join(root, 'config/production-route-map.json'), 'utf8'));
  const errors = [];
  const routes = [];
  const publicPaths = new Set(registry.publicRoutes.map((item) => item.path));
  const htmlFile = (route) => route === '/' ? path.join(dist, 'index.html')
    : path.join(dist, route.slice(1), 'index.html');
  const localFile = (urlPath) => path.join(dist, urlPath.replace(/^\/rkreno\/?/, '').replace(/^\//, ''));
  const normalizeInternal = (href, current) => {
    if (!href || /^(?:https?:|mailto:|tel:|javascript:|data:|#)/i.test(href)) return null;
    let value;
    try {
      const parsed = new URL(href, `https://rkrenosolution.com${current}`);
      if (!['rkrenosolution.com', 'firdosi.github.io'].includes(parsed.hostname)) return null;
      value = parsed.pathname.replace(/^\/rkreno(?=\/|$)/, '') || '/';
    } catch { return null; }
    return value.endsWith('/') || path.posix.extname(value) ? value : `${value}/`;
  };

  if (registry.publicRoutes.length !== 48) errors.push(`Route registry has ${registry.publicRoutes.length}, expected 48.`);
  if (registry.publicRoutes.filter((item) => item.mirrored).length !== 47) errors.push('Mirrored route count is not 47.');
  for (const routeInfo of registry.publicRoutes) {
    const file = htmlFile(routeInfo.path);
    if (!(await exists(file))) { errors.push(`${routeInfo.path}: missing built HTML.`); continue; }
    const html = await readFile(file, 'utf8');
    const $ = load(html);
    const pageErrors = [];
    const title = cleanText($('title').text());
    const description = cleanText($('meta[name="description"]').attr('content') || '');
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const robots = $('meta[name="robots"]').attr('content') || '';
    const h1 = $('main h1');
    const words = cleanText($('main').text()).split(/\s+/).filter(Boolean).length;
    if (h1.length !== 1) pageErrors.push(`H1 count ${h1.length}`);
    if (!title) pageErrors.push('missing title');
    if (description.length < 50) pageErrors.push('short or missing meta description');
    if (canonical !== routeInfo.canonical) pageErrors.push(`canonical ${canonical}`);
    if (!/noindex\s*,\s*nofollow/i.test(robots)) pageErrors.push(`staging robots ${robots}`);
    if (words < (routeInfo.path === '/thank-you/' ? 20 : 55)) pageErrors.push(`thin rendered content (${words} words)`);
    const levels = $('main h1,main h2,main h3,main h4,main h5,main h6').toArray()
      .map((node) => Number(node.tagName.slice(1)));
    if (levels.some((level, index) => index && level > levels[index - 1] + 1)) pageErrors.push('heading-level jump');
    for (const script of $('script[type="application/ld+json"]').toArray()) {
      try { JSON.parse($(script).text()); } catch { pageErrors.push('invalid JSON-LD'); }
    }
    for (const image of $('img').toArray()) {
      const src = $(image).attr('src') || '';
      const alt = $(image).attr('alt');
      if (alt === undefined) pageErrors.push(`image missing alt: ${src}`);
      if (/^https?:/i.test(src)) pageErrors.push(`remote image: ${src}`);
      if (/rkrenosolution\.com\/wp-content/i.test(src)) pageErrors.push(`remote WordPress image: ${src}`);
      if (src.startsWith('/') && !(await exists(localFile(src)))) pageErrors.push(`broken image: ${src}`);
    }
    for (const anchor of $('a[href]').toArray()) {
      const href = $(anchor).attr('href') || '';
      if (href === '#') pageErrors.push('placeholder link');
      const destination = normalizeInternal(href, routeInfo.path);
      if (!destination) continue;
      const destinationFile = path.extname(destination) ? localFile(destination) : htmlFile(destination);
      if (!(await exists(destinationFile))) pageErrors.push(`broken internal link: ${href}`);
    }
    for (const form of $('form').toArray()) {
      if ($(form).attr('action')) pageErrors.push(`staging form has action: ${$(form).attr('action')}`);
    }
    if (/elementor-|wp-content\/|wp-admin\/|wpcf7-|\bgtag\s*\(/i.test(html)) pageErrors.push('WordPress runtime/markup residue');
    if (/googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|challenges\.cloudflare\.com/i.test(html)) {
      pageErrors.push('staging analytics/challenge dependency');
    }
    errors.push(...pageErrors.map((error) => `${routeInfo.path}: ${error}`));
    routes.push({ path: routeInfo.path, words, title, description, canonical, errors: pageErrors });
  }

  const redirectEntries = routeMap.entries.filter((item) => item.action === 'REDIRECT_301');
  const goneEntries = routeMap.entries.filter((item) => item.action === 'GONE_410');
  const known404 = routeMap.entries.filter((item) => item.action === 'EXISTING_404');
  const redirectSources = new Set(redirectEntries.map((item) => item.sourcePath));
  for (const entry of redirectEntries) {
    if (!publicPaths.has(entry.destination)) errors.push(`Redirect target is not public: ${entry.sourcePath} -> ${entry.destination}`);
    if (redirectSources.has(entry.destination)) errors.push(`Redirect chain: ${entry.sourcePath} -> ${entry.destination}`);
  }
  const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (sitemapUrls.length !== registry.expectedTotals.sitemapRoutes) errors.push(`Sitemap has ${sitemapUrls.length} URLs.`);
  if (sitemapUrls.some((url) => !url.startsWith('https://rkrenosolution.com/') || url.includes('/rkreno/'))) errors.push('Invalid production sitemap URL.');
  const robotsTxt = await readFile(path.join(dist, 'robots.txt'), 'utf8');
  if (!/Disallow:\s*\//.test(robotsTxt)) errors.push('Staging robots.txt does not disallow all.');
  if (!(await exists(path.join(dist, '404.html')))) errors.push('Custom 404 missing.');

  return {
    errors, routes, routeCount: routes.length,
    indexableCount: registry.publicRoutes.filter((item) => item.indexability === 'index').length,
    sitemapCount: sitemapUrls.length,
    brokenLinks: errors.filter((item) => item.includes('broken internal link')).length,
    brokenImages: errors.filter((item) => item.includes('broken image')).length,
    remoteWordPressImages: errors.filter((item) => item.includes('remote WordPress image')).length,
    redirects: redirectEntries.length, gone: goneEntries.length, known404: known404.length,
  };
}
