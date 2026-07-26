import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { load } from 'cheerio';
import taxonomyArchives from '../../src/data/taxonomy-archives.json' with { type: 'json' };
import { finalReviewRoutes } from '../lib/final-review-routes.mjs';

const target = process.env.DEPLOY_TARGET || 'vps';
const production = target === 'vps';
const root = path.resolve('dist');
const failures = [];
const routeFiles = new Map(finalReviewRoutes.map(({ route, group }) => [
  route,
  { group, file: path.join(root, route === '/' ? 'index.html' : route.slice(1), route === '/' ? '' : 'index.html') },
]));
const normalizeHref = (href = '') => href.replace(/^\/rkreno/, '');
const schemas = ($) => $('script[type="application/ld+json"]').map((_, node) => {
  try { return JSON.parse($(node).text()); } catch { return { '@type': 'INVALID' }; }
}).get();
const schemaTypes = (items) => items.flatMap((item) => Array.isArray(item)
  ? schemaTypes(item) : [item?.['@type']].flat().filter(Boolean));

for (const [route, { group, file }] of routeFiles) {
  let html;
  try { html = await readFile(file, 'utf8'); } catch {
    failures.push(`${route}: output missing`);
    continue;
  }
  const $ = load(html);
  const canonical = `https://rkrenosolution.com${route}`;
  const robots = $('meta[name="robots"]').attr('content');
  const expectedRobots = production
    ? (group === 'archive' ? 'noindex, follow' : route === '/thank-you/' ? 'noindex, nofollow' : 'index, follow')
    : 'noindex, nofollow';
  if ($('main h1').length !== 1) failures.push(`${route}: expected one main H1`);
  if (!$('.exact-header').length || !$('.exact-footer').length) failures.push(`${route}: shared header/footer missing`);
  if ($('link[rel="canonical"]').attr('href') !== canonical) failures.push(`${route}: canonical mismatch`);
  if (robots !== expectedRobots) failures.push(`${route}: robots ${robots}, expected ${expectedRobots}`);
  if (!$('meta[name="description"]').attr('content')) failures.push(`${route}: meta description missing`);
  for (const selector of ['meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image"]', 'meta[name="twitter:card"]']) {
    if (!$(selector).attr('content')) failures.push(`${route}: ${selector} missing`);
  }
  const jsonLd = schemas($);
  if (schemaTypes(jsonLd).includes('INVALID')) failures.push(`${route}: invalid JSON-LD`);
  if (group === 'article' && !schemaTypes(jsonLd).includes('BlogPosting')) failures.push(`${route}: BlogPosting schema missing`);
  if (group === 'service' && route !== '/services/' && !schemaTypes(jsonLd).includes('Service')) failures.push(`${route}: Service schema missing`);
  $('img').each((_, image) => {
    const source = $(image).attr('src') || '';
    if (/^https?:\/\//i.test(source)) failures.push(`${route}: remote image ${source}`);
    if (!source) failures.push(`${route}: image source missing`);
    if ($(image).attr('alt') === undefined) failures.push(`${route}: image alt attribute missing`);
    if (!$(image).attr('width') || !$(image).attr('height')) failures.push(`${route}: intrinsic image dimensions missing for ${source}`);
  });
  $('a[href]').each((_, anchor) => {
    const href = $(anchor).attr('href') || '';
    if (!href || /^javascript:/i.test(href)) failures.push(`${route}: invalid link`);
    if (/^tel:/.test(href) && href !== 'tel:+601111334496') failures.push(`${route}: wrong phone link ${href}`);
    if (/^mailto:/.test(href) && href !== 'mailto:rkrenosolution@gmail.com') failures.push(`${route}: wrong email link ${href}`);
    if (/wa\.me\//.test(href) && !/wa\.me\/601111334496/.test(href)) failures.push(`${route}: wrong WhatsApp link ${href}`);
  });
  if (/Vastcon|example\.com|100% satisfaction|registered company/i.test($('main').text())) {
    failures.push(`${route}: excluded demo or unsupported claim found`);
  }
  const faqHeadings = $('.rk-faq-item h3').map((_, item) => $(item).text().replace(/\s+/g, ' ').trim()).get();
  const faqSchema = jsonLd.find((item) => item?.['@type'] === 'FAQPage');
  if (faqHeadings.length && (!faqSchema || faqSchema.mainEntity?.length !== faqHeadings.length)) {
    failures.push(`${route}: FAQ schema/content mismatch`);
  }
}

for (const [route, archive] of Object.entries(taxonomyArchives).filter(([, item]) => item.action === 'KEEP_NOINDEX_NATIVE')) {
  const $ = load(await readFile(routeFiles.get(route).file, 'utf8'));
  const visible = $('.p23-archive-entry h2 a').map((_, anchor) => normalizeHref($(anchor).attr('href'))).get();
  if (JSON.stringify(visible) !== JSON.stringify(archive.articles)) failures.push(`${route}: visible membership mismatch`);
  const collection = schemas($).find((item) => item?.['@type'] === 'CollectionPage');
  const structured = collection?.hasPart?.map((item) => new URL(item.url).pathname) || [];
  if (JSON.stringify(structured) !== JSON.stringify(archive.articles)) failures.push(`${route}: schema membership mismatch`);
  if ($('.exact-header nav a').toArray().some((link) => normalizeHref($(link).attr('href')) === route)) {
    failures.push(`${route}: archive appears in main navigation`);
  }
  if (/tag.cloud|tag-cloud/i.test($.html())) failures.push(`${route}: tag cloud residue`);
}

const thankYou = load(await readFile(routeFiles.get('/thank-you/').file, 'utf8'));
for (const required of ['direct visit does not confirm', 'forms remain disabled', 'tel:+601111334496', 'wa.me/601111334496', '/contact-us/']) {
  if (!thankYou.html().toLowerCase().includes(required.toLowerCase())) failures.push(`/thank-you/: missing ${required}`);
}
if (thankYou('form').length || /generate_lead|fbq\s*\(/i.test(thankYou.html())) failures.push('/thank-you/: form or lead event found');

const errorHtml = await readFile(path.join(root, '404.html'), 'utf8');
const errorPage = load(errorHtml);
if (errorPage('meta[name="robots"]').attr('content') !== 'noindex, nofollow') failures.push('404: robots mismatch');
for (const required of ['/', '/services/', '/blog/', '/contact-us/', 'tel:+601111334496', 'wa.me/601111334496']) {
  if (!errorPage(`[href$="${required}"]`).length && !errorHtml.includes(required)) failures.push(`404: missing ${required}`);
}
if (/http-equiv=["']refresh/i.test(errorHtml)) failures.push('404: automatic redirect found');

const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== 32) failures.push(`sitemap: expected 32 URLs, found ${sitemapUrls.length}`);
for (const route of [...Object.keys(taxonomyArchives), '/thank-you/']) {
  if (sitemapUrls.includes(`https://rkrenosolution.com${route}`)) failures.push(`${route}: incorrectly in sitemap`);
}
const robotsTxt = await readFile(path.join(root, 'robots.txt'), 'utf8');
if (!production && !robotsTxt.includes('Disallow: /')) failures.push('staging robots.txt is not disallow-all');
if (!production) {
  const allHtml = (await Promise.all([...routeFiles.values()].map(({ file }) => readFile(file, 'utf8')))).join('\n');
  if (/googletagmanager|google-analytics|connect\.facebook\.net|fbq\s*\(/i.test(allHtml)) failures.push('staging analytics loader found');
  const $ = load(allHtml);
  if ($('form button:not([disabled]), form input:not([disabled]), form textarea:not([disabled]), form select:not([disabled])').length) {
    failures.push('staging contains enabled form controls');
  }
}

const tracked = spawnSync('git', ['ls-files'], { encoding: 'utf8' }).stdout.split(/\r?\n/);
for (const file of tracked) {
  const environmentExample = /(?:\.example\.env|env\.example)$/i.test(file);
  if (/^(Media|wp-old-site-backup|\.audit-cache)\//.test(file)
    || (!environmentExample && /\.(sql|zip|tar|gz|env|pem|key|p12|pfx)$/i.test(file))) {
    failures.push(`private file tracked: ${file}`);
  }
}

console.log(JSON.stringify({
  target,
  routes: routeFiles.size,
  archives: 9,
  sitemapUrls: sitemapUrls.length,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
