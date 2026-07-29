import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { finalReviewRoutes } from '../lib/final-review-routes.mjs';

const target = process.argv[2];
if (!['production', 'github'].includes(target)) throw new Error('Usage: validate-build.mjs production|github');
const root = process.cwd();
const dist = path.join(root, 'dist');
const errors = [];
const results = [];
const held = new Set(['/company-history/', '/our-projects-2/', '/our-projects/', '/our-team/', '/testimonials/']);
const archives = new Set(finalReviewRoutes.filter(({ group }) => group === 'archive').map(({ route }) => route));
const htmlFile = (route) => route === '/' ? path.join(dist, 'index.html')
  : path.join(dist, route.slice(1), 'index.html');
const normalizeRoute = (href, current) => {
  if (!href || /^(?:https?:|mailto:|tel:|javascript:|#)/.test(href)) return null;
  let value = href.split(/[?#]/)[0];
  if (target === 'github') value = value.replace(/^\/rkreno/, '');
  if (!value.startsWith('/')) value = path.posix.resolve(current, value);
  return value.endsWith('/') || path.posix.extname(value) ? value : `${value}/`;
};
const pageExists = async (route) => {
  const file = path.extname(route) ? path.join(dist, route.replace(/^\//, '')) : htmlFile(route);
  try { await access(file); return true; } catch { return false; }
};

for (const routeInfo of finalReviewRoutes) {
  const html = await readFile(htmlFile(routeInfo.route), 'utf8');
  const $ = load(html);
  const pageErrors = [];
  const robots = $('meta[name="robots"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  if ($('main h1').length < 1) pageErrors.push('missing H1');
  if (!$('title').text().trim()) pageErrors.push('missing title');
  if (!$('meta[name="description"]').attr('content')) pageErrors.push('missing description');
  if (!canonical.startsWith('https://rkrenosolution.com/')) pageErrors.push(`canonical ${canonical}`);
  if (!$('meta[property="og:title"]').attr('content') || !$('meta[property="og:image"]').attr('content')) pageErrors.push('missing Open Graph');
  if (target === 'github' && !/noindex\s*,\s*nofollow/i.test(robots)) pageErrors.push(`staging robots ${robots}`);
  if (target === 'production') {
    const expected = routeInfo.route === '/thank-you/' ? /noindex\s*,\s*nofollow/i
      : held.has(routeInfo.route) || archives.has(routeInfo.route) ? /noindex\s*,\s*follow/i
        : /index\s*,\s*follow/i;
    if (!expected.test(robots)) pageErrors.push(`production robots ${robots}`);
  }
  for (const image of $('img[src]').toArray()) {
    const src = $(image).attr('src') || '';
    if (/^https?:/.test(src)) pageErrors.push(`remote image ${src}`);
    else {
      const local = target === 'github' ? src.replace(/^\/rkreno/, '') : src;
      if (local.startsWith('/') && !(await pageExists(local))) pageErrors.push(`broken image ${src}`);
    }
  }
  for (const anchor of $('a[href]').toArray()) {
    const linkedRoute = normalizeRoute($(anchor).attr('href'), routeInfo.route);
    if (linkedRoute && !(await pageExists(linkedRoute))) pageErrors.push(`broken link ${$(anchor).attr('href')}`);
  }
  if (pageErrors.length) errors.push(...pageErrors.map((error) => `${routeInfo.route}: ${error}`));
  results.push({ route: routeInfo.route, robots, canonical, errors: pageErrors });
}

const notFound = load(await readFile(path.join(dist, '404.html'), 'utf8'));
if (!/noindex\s*,\s*nofollow/i.test(notFound('meta[name="robots"]').attr('content') || '')) errors.push('404 robots');
const thankYou = load(await readFile(htmlFile('/thank-you/'), 'utf8'));
if (!/noindex\s*,\s*nofollow/i.test(thankYou('meta[name="robots"]').attr('content') || '')) errors.push('thank-you robots');
const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapCount = [...sitemap.matchAll(/<loc>/g)].length;
if (target === 'production' && sitemapCount !== 33) errors.push(`sitemap ${sitemapCount}`);
for (const route of held) if (sitemap.includes(`rkrenosolution.com${route}`)) errors.push(`held route in sitemap ${route}`);

const robotsTxt = await readFile(path.join(dist, 'robots.txt'), 'utf8');
if (target === 'github' && !/Disallow:\s*\//.test(robotsTxt)) errors.push('staging robots.txt does not disallow all');
if (target === 'github') {
  const allHtml = await Promise.all([...finalReviewRoutes.map(({ route }) => readFile(htmlFile(route), 'utf8')), readFile(path.join(dist, '404.html'), 'utf8')]);
  const joined = allHtml.join('\n');
  for (const forbidden of ['googletagmanager.com', 'google-analytics.com', 'connect.facebook.net', 'challenges.cloudflare.com']) {
    if (joined.includes(forbidden)) errors.push(`staging third-party tracking/challenge reference ${forbidden}`);
  }
  const home = load(await readFile(htmlFile('/'), 'utf8'));
  const contact = load(await readFile(htmlFile('/contact-us/'), 'utf8'));
  if (!home('[data-testimonial-track]').length || !home('[data-testimonial-next]').length) errors.push('testimonial carousel controls');
  if (home('[data-counter]').length < 4) errors.push('animated counters');
  for (const [route, form] of [['/', home('form')], ['/contact-us/', contact('form')]]) {
    if (!form.length || form.attr('action')) errors.push(`${route}: preview form missing or has action`);
    if (form.find(':disabled').length) errors.push(`${route}: preview form visually disabled`);
  }
}

const parityJson = JSON.parse(await readFile(
  path.join(root, 'reports', 'public', 'prompt-1-1-bidirectional-parity.json'), 'utf8',
));
const parityStatuses = parityJson.routes.map(({ status }) => status);
const matchCount = parityStatuses.filter((status) => status === 'MATCH').length;
const differenceCount = parityStatuses.filter((status) => status === 'DIFFERENCE').length;
const sourceMissingCount = parityStatuses.filter((status) => status === 'SOURCE_ASSET_MISSING').length;
const newPageCount = parityStatuses.filter((status) => status === 'NEW_PAGE').length;
if (parityStatuses.length !== 48) errors.push(`parity records ${parityStatuses.length}`);
if (sourceMissingCount > 3) errors.push(`SOURCE_ASSET_MISSING routes ${sourceMissingCount}`);
if (newPageCount !== 1) errors.push(`NEW_PAGE routes ${newPageCount}`);
if (matchCount + differenceCount + sourceMissingCount + newPageCount !== 48) {
  errors.push('unknown strict parity status');
}
for (const route of parityJson.routes.filter(({ status }) => status === 'MATCH')) {
  const unresolved = Object.values(route.differences || {}).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value));
  if (unresolved) errors.push(`${route.route}: falsely labelled MATCH`);
}
try {
  await access(path.join(root, 'src', 'components', 'ditto', 'WordPressSourcePage.astro'));
  errors.push('generic WordPressSourcePage implementation still exists');
} catch {
  // Expected: every held route is rendered through a dedicated native component.
}
const report = { target, generatedAt: new Date().toISOString(), routeCount: results.length, sitemapCount, errors, routes: results };
await writeFile(path.join(root, 'reports', 'public', `final-${target}-validation.json`), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ target, routes: results.length, sitemap: sitemapCount, errors: errors.length }, null, 2));
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
}
