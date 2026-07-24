import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { load } from 'cheerio';
import { finalReviewRoutes, taxonomyRoutes } from './lib/final-review-routes.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = path.join(root, 'dist');
const reportFile = path.join(root, 'reports', 'public', 'wordpress-parity-validation.md');
const afterManifest = JSON.parse(
  await fs.readFile(path.join(root, '.audit-cache', 'wordpress-parity', 'after', 'manifest.json'), 'utf8'),
);
const routePolicy = JSON.parse(await fs.readFile(path.join(root, 'src', 'data', 'route-policy.json'), 'utf8'));
const retained = new Set(finalReviewRoutes.map(({ route }) => route));
const excluded = new Set(routePolicy.excluded);
const errors = [];
const warnings = [];
const routeChecks = [];

const fail = (route, check, detail) => errors.push({ route, check, detail });
const warn = (route, check, detail) => warnings.push({ route, check, detail });
const outputFile = (route) => route === '/'
  ? path.join(dist, 'index.html')
  : path.join(dist, route.replace(/^\/|\/$/g, ''), 'index.html');
const claimsPattern = /(?:5000\+|2000\+|1250\+|1000\+|500\+\s+wiring|10[- ]year warranty|24\s*\/\s*7 emergency|4\.9\s*\/\s*5|100%\s+(?:safety|durable|satisfaction|puas))/i;

for (const routeInfo of finalReviewRoutes) {
  const route = routeInfo.route;
  let html = '';
  try {
    html = await fs.readFile(outputFile(route), 'utf8');
  } catch {
    fail(route, 'route-build', 'Built HTML is missing');
    continue;
  }
  const $ = load(html);
  const title = $('title').text().trim();
  const description = $('meta[name="description"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const robots = $('meta[name="robots"]').attr('content') || '';
  const h1 = $('h1');
  const images = $('img').toArray();
  const schemas = $('script[type="application/ld+json"]').toArray();
  const routeErrorsBefore = errors.length;
  if (!title) fail(route, 'title', 'Missing title');
  if (!description) fail(route, 'meta-description', 'Missing meta description');
  if (new URL(canonical || 'https://invalid.test').pathname !== route) fail(route, 'canonical', canonical);
  if (h1.length !== 1) fail(route, 'h1', `Expected one H1, found ${h1.length}`);
  if (!$('meta[property="og:title"]').attr('content')) fail(route, 'open-graph', 'Missing og:title');
  if (!$('meta[property="og:description"]').attr('content')) fail(route, 'open-graph', 'Missing og:description');
  if (!schemas.length) fail(route, 'schema', 'Missing JSON-LD');
  for (const schema of schemas) {
    try { JSON.parse($(schema).text()); } catch { fail(route, 'schema', 'Invalid JSON-LD'); }
  }
  for (const image of images) {
    const src = $(image).attr('src') || '';
    const alt = $(image).attr('alt');
    if (/^https?:\/\//i.test(src)) fail(route, 'remote-image', src);
    if (alt === undefined || !alt.trim()) fail(route, 'missing-alt', src);
  }
  if (/elementor-|wp-block-|woocommerce|wp-shortcode|wp-content\/plugins/i.test(html)) {
    fail(route, 'raw-wordpress-markup', 'WordPress/plugin class or path found');
  }
  if (/cart|checkout|wishlist|my account|add to cart/i.test($('main').text())) {
    fail(route, 'ecommerce-content', 'Excluded ecommerce wording found');
  }
  if (/014[- ]?3319006|WhatsApp Image|WhatsApp Video/i.test(html) || /\/Media\//.test(html)) {
    fail(route, 'private-media', 'Held/original media identifier found');
  }
  if (claimsPattern.test($('main').text())) fail(route, 'unsupported-claim', 'Known unsupported claim found');
  const internalLinks = $('a[href^="/"]').toArray();
  for (const link of internalLinks) {
    const href = ($(link).attr('href') || '').split('#')[0].split('?')[0];
    const normalized = href.endsWith('/') ? href : `${href}/`;
    if (excluded.has(normalized)) fail(route, 'excluded-internal-link', href);
    if (href && !retained.has(normalized) && !['/404/'].includes(normalized)) warn(route, 'unregistered-link', href);
  }
  if (!$('a[href^="tel:+601111334496"]').length) fail(route, 'telephone-link', 'Published telephone link missing');
  if (!$('a[href^="https://wa.me/601111334496"]').length) fail(route, 'whatsapp-link', 'Published WhatsApp link missing');
  if (!$('.mobile-menu').length || !$('.desktop-nav').length) fail(route, 'navigation', 'Desktop or mobile navigation missing');
  if (taxonomyRoutes.has(route) && !/^noindex,\s*follow$/i.test(robots)) fail(route, 'taxonomy-robots', robots);
  if (route === '/contact-us/') {
    const form = $('form[data-enquiry-form]');
    if (!form.length || form.attr('data-configured') !== 'false' || !form.find('button[disabled]').length) {
      fail(route, 'staging-form', 'Staging form is not visibly disabled');
    }
  }
  if (route === '/faq/' && !$('details').length) fail(route, 'accordion', 'FAQ accordion missing');
  const mobileCapture = afterManifest.captures.find(
    (item) => item.route === route && item.source === 'astro' && item.viewport === 'mobile',
  );
  if (!mobileCapture) fail(route, 'mobile-capture', 'After-capture missing');
  else {
    if (mobileCapture.dom.horizontalOverflow) fail(route, 'horizontal-overflow', 'Mobile overflow detected');
    if (mobileCapture.dom.brokenImages.length) fail(route, 'broken-image', mobileCapture.dom.brokenImages.join('; '));
    if (mobileCapture.browserErrors.length) fail(route, 'browser-error', mobileCapture.browserErrors.join('; '));
  }
  routeChecks.push({ route, passed: errors.length === routeErrorsBefore });
}

const sitemap = await fs.readFile(path.join(dist, 'sitemap.xml'), 'utf8');
for (const route of taxonomyRoutes) {
  if (sitemap.includes(`https://rkrenosolution.com${route}`)) fail(route, 'sitemap', 'Taxonomy must stay excluded');
}
if (sitemap.includes('https://rkrenosolution.com/thank-you/')) fail('/thank-you/', 'sitemap', 'Thank-you route must stay excluded');
const robotsText = await fs.readFile(path.join(dist, 'robots.txt'), 'utf8');
if (!/User-agent:/i.test(robotsText)) fail('/robots.txt', 'robots', 'Robots output is invalid');

const tracked = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).stdout.split(/\r?\n/);
for (const file of tracked) {
  if (!file) continue;
  if (/^Media\//.test(file) || /^\.audit-cache\//.test(file)
    || /\.(?:sql|sql\.gz|tar|tar\.gz|zip|7z|rar|bak|pem|key|p12|pfx)$/i.test(file)) {
    fail('/repository', 'private-file-tracking', file);
  }
}

const passedRoutes = routeChecks.filter(({ passed }) => passed).length;
const report = `# WordPress Parity Validation

- Retained routes: **${finalReviewRoutes.length}**
- Routes passing all automated checks: **${passedRoutes}**
- Errors: **${errors.length}**
- Warnings: **${warnings.length}**
- After-captures reviewed: **${afterManifest.captures.length}**

## Validation coverage

Production build, route output, title, description, canonical, H1, heading presence, schema, Open Graph, internal links, sitemap, robots, image locality, alt text, broken images, horizontal overflow, browser errors, mobile navigation markup, accordion markup, disabled staging form, telephone and WhatsApp links, unsupported claims, raw WordPress markup, demo/ecommerce wording and private-file tracking.

## Errors

${errors.length ? errors.map(({ route, check, detail }) => `- \`${route}\` — **${check}**: ${detail}`).join('\n') : '- None.'}

## Warnings

${warnings.length ? warnings.slice(0, 100).map(({ route, check, detail }) => `- \`${route}\` — **${check}**: ${detail}`).join('\n') : '- None.'}
`;
await fs.writeFile(reportFile, report);
console.log({ routes: finalReviewRoutes.length, passedRoutes, errors: errors.length, warnings: warnings.length });
if (errors.length) process.exitCode = 1;
