import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const dist = join(root, 'dist');
const target = process.env.VALIDATE_TARGET || 'github';
const basePrefix = target === 'github' ? '/rkreno' : '';
const services = [
  '/electrical-services-selangor/',
  '/home-renovation-contractor-in-subang-jaya/',
  '/office-renovation-in-kuala-lumpur/',
  '/waterproofing-contractor-kuala-lumpur/',
  '/plaster-ceiling-contractor-kl/',
  '/servis-cuci-rumah-kl/',
];
const articles = [
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/',
  '/commercial-retail-shop-renovation-in-kuala-lumpur/',
  '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/',
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/',
  '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/',
  '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/',
  '/office-renovation-petaling-jaya-corporate-fit-out-experts/',
  '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/',
  '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/',
  '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/',
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/',
  '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/',
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/',
  '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/',
];
const routes = [...services, ...articles];
const keyText = {
  '/electrical-services-selangor/': ['Reliable Electrical Services Selangor & KL', 'Comprehensive Electrical Services Selangor List'],
  '/home-renovation-contractor-in-subang-jaya/': ['Why Choose Our Home Renovation Contractor in Subang Jaya?', 'Estimated Renovation Costs in Subang Jaya'],
  '/office-renovation-in-kuala-lumpur/': ['Office Fit-Out and Renovation Services', 'Minimum Starting Prices for Office Renovation'],
  '/waterproofing-contractor-kuala-lumpur/': ['Why Hire Our Waterproofing Contractor Kuala Lumpur Team?', 'Estimated Waterproofing Costs'],
  '/plaster-ceiling-contractor-kl/': ['Your Trusted Plaster Ceiling Contractor KL', 'Designs by Plaster Ceiling Contractor KL'],
  '/servis-cuci-rumah-kl/': ['Kenapa Pilih Kami untuk Servis Cuci Rumah KL?', 'Pakej Servis Cuci Rumah KL'],
};
const failures = [];
const routeFile = (route) => route === '/' ? join(dist, 'index.html') : join(dist, route.slice(1), 'index.html');
const schemasOf = ($) => {
  const schemas = [];
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    try { schemas.push(JSON.parse($(script).text())); } catch { failures.push('invalid JSON-LD'); }
  }
  return JSON.stringify(schemas);
};

for (const route of routes) {
  const html = await readFile(routeFile(route), 'utf8');
  const $ = load(html);
  if ($('h1').length !== 1) failures.push(`${route}: expected one H1`);
  if (!$('title').text().trim() || !$('meta[name="description"]').attr('content')) failures.push(`${route}: metadata missing`);
  if ($('link[rel="canonical"]').attr('href') !== `https://rkrenosolution.com${route}`) failures.push(`${route}: canonical changed`);
  const expectedRobots = target === 'github' ? 'noindex, nofollow' : 'index, follow';
  if ($('meta[name="robots"]').attr('content') !== expectedRobots) failures.push(`${route}: robots changed`);
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (!$(`meta[property="${property}"]`).attr('content')) failures.push(`${route}: ${property} missing`);
  }
  const schemaText = schemasOf($);
  if (articles.includes(route) && !/BlogPosting/.test(schemaText)) failures.push(`${route}: BlogPosting schema missing`);
  if (services.includes(route) && !/Service/.test(schemaText)) failures.push(`${route}: Service schema missing`);
  for (const phrase of keyText[route] || []) {
    if (!$.text().replace(/\s+/g, ' ').includes(phrase)) failures.push(`${route}: source text missing: ${phrase}`);
  }
  for (const image of $('main img').toArray()) {
    const src = $(image).attr('src') || '';
    if (/^https?:\/\//i.test(src)) failures.push(`${route}: remote image ${src}`);
    if ($(image).attr('alt') === undefined) failures.push(`${route}: image missing alt`);
    if (!$(image).attr('width') && !$(image).attr('height')) failures.push(`${route}: image missing intrinsic size`);
  }
  if (/googletagmanager|gtag\s*\(|google-analytics|fbq\s*\(|generate_lead/i.test(html)) {
    failures.push(`${route}: tracking/lead event present`);
  }
  if (target === 'github' && $('form input,form select,form textarea,form button').toArray()
    .some((control) => $(control).attr('disabled') === undefined)) failures.push(`${route}: enabled staging form control`);
  for (const href of $('a[href]').toArray().map((anchor) => $(anchor).attr('href') || '')) {
    if (href.startsWith('/') && target === 'github' && !href.startsWith(`${basePrefix}/`)) {
      failures.push(`${route}: unbased internal link ${href}`);
      break;
    }
  }
  if (services.includes(route) && !$('.service-exact-page--prompt22').length) failures.push(`${route}: corrected service layout missing`);
  if (articles.includes(route) && (!$('.p22-article-layout').length || !$('.p22-article-sidebar').length)) {
    failures.push(`${route}: corrected article/sidebar layout missing`);
  }
}

const exactArticles = JSON.parse(await readFile(join(root, 'src', 'data', 'article-wordpress-content.json'), 'utf8'));
for (const route of articles) {
  const $ = load(await readFile(routeFile(route), 'utf8'));
  const counts = exactArticles[route].counts;
  const content = $('.article-exact-content');
  if (content.find('h1,h2,h3,h4').length !== counts.astroHeadings) failures.push(`${route}: article heading count changed`);
  if (content.find('table').length !== counts.astroTables) failures.push(`${route}: article table count changed`);
  if (content.find('details,.rk-faq-item').length !== counts.astroFaqs) failures.push(`${route}: article FAQ count changed`);
  if (counts.sourceHeadings !== counts.astroHeadings || counts.sourceTables !== counts.astroTables
    || counts.sourceFaqs !== counts.astroFaqs) failures.push(`${route}: WordPress/Astro content counts differ`);
}

const faq = load(await readFile(routeFile('/faq/'), 'utf8'));
if (faq('.core-faq-list details').length !== 9) failures.push('/faq/: expected nine safe accordions');
const blog = load(await readFile(routeFile('/blog/'), 'utf8'));
if (blog('.core-blog-grid article').length !== 14) failures.push('/blog/: expected 14 retained articles');
const contact = load(await readFile(routeFile('/contact-us/'), 'utf8'));
if (contact('form input,form select,form textarea,form button').toArray()
  .some((control) => contact(control).attr('disabled') === undefined)) failures.push('/contact-us/: staging controls enabled');

const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
if ([...sitemap.matchAll(/<loc>/g)].length !== 32) failures.push('sitemap count changed');
if (target === 'github' && !/Disallow:\s*\/\s*$/im.test(await readFile(join(dist, 'robots.txt'), 'utf8'))) {
  failures.push('staging robots not disallow-all');
}

if (target === 'github') {
  const metrics = JSON.parse(await readFile(join(root, '.audit-cache', 'prompt-2-2', 'after-metrics.json'), 'utf8'));
  if (metrics.length !== 120) failures.push(`visual metrics: expected 120, found ${metrics.length}`);
  for (const record of metrics.filter((item) => item.site === 'astro')) {
    if (record.status !== 200 || record.h1.length !== 1 || record.scrollWidth > record.clientWidth
      || record.images.some((image) => !image.width || !image.height)
      || record.consoleErrors.some((message) => !/favicon|ERR_NETWORK_CHANGED|404/i.test(message))) {
      failures.push(`${record.route} ${record.viewportName}: visual capture failed`);
    }
  }
  for (const file of [
    'remaining-services-desktop-side-by-side-contact-sheet.png',
    'remaining-services-mobile-side-by-side-contact-sheet.png',
    'articles-desktop-side-by-side-contact-sheet.png',
    'articles-mobile-side-by-side-contact-sheet.png',
  ]) await access(join(root, 'reports', 'public', 'visuals', 'prompt-2-2', file));
}

const csv = await readFile(join(root, 'reports', 'public', 'prompt-2-2-corrections.csv'), 'utf8');
if (csv.trim().split(/\r?\n/).length !== 21) failures.push('correction CSV must contain 20 route rows');
for (const value of csv.matchAll(/,"([A-Z_]+)","/g)) {
  if (!['NONE', 'SOURCE_IMAGE_UNAVAILABLE', 'SAFE_DEMO_EXCLUSION', 'TECHNICAL_PLATFORM_DIFFERENCE', 'OWNER_DECISION_REQUIRED'].includes(value[1])) {
    failures.push(`invalid correction reason: ${value[1]}`);
  }
}

if (failures.length) {
  console.error(`Prompt 2.2 ${target} validation failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Prompt 2.2 ${target} validation passed: 20 corrected routes, content counts, SEO freeze and visual evidence.`);
}
