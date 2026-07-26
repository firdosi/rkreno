import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const dist = join(root, 'dist');
const target = process.env.VALIDATE_TARGET || 'github';
const basePrefix = target === 'github' ? '/rkreno' : '';
const routes = [
  '/', '/services/', '/about-us/', '/contact-us/', '/faq/', '/blog/',
  '/servis-aircond-murah-kl/', '/aircond-installation-kl/', '/upah-pasang-aircond-selangor/',
  '/service/building-renovation/', '/house-renovation-in-kuala-lumpur/', '/house-renovation-in-selangor/',
];
const keyText = {
  '/': ['Reliable Renovation Contractor in KL & Selangor', 'How We Handle Your Project'],
  '/services/': ['Property Services Done With Care and Clear Planning', 'Practical Information for Your Property Work'],
  '/about-us/': ['Who We Are', 'Our Mission', 'Core Values', 'Rao Israr', 'Serving Kuala Lumpur, Selangor and Nearby Areas'],
  '/contact-us/': ['Have a question? Please contact us using the customer support channels below.', 'Send Your Enquiry'],
  '/faq/': ['How should I start a renovation enquiry?', 'How can I contact RK Reno Solution?'],
  '/blog/': ['Pakej Deep Cleaning Rumah KL', 'Waterproofing Contractor Kuala Lumpur'],
  '/servis-aircond-murah-kl/': ['Pakar Servis Aircond Murah KL', 'Perkhidmatan Penyaman Udara Menyeluruh'],
  '/aircond-installation-kl/': ['Professional Aircond Installation KL for Homes, Condos, Offices & Shops', 'Aircond Installation KL Prices'],
  '/upah-pasang-aircond-selangor/': ['Upah Pasang Aircond Selangor untuk Rumah, Pejabat & Kedai', 'Harga Upah Pasang Aircond Selangor'],
  '/service/building-renovation/': ['Building Renovation', 'Working Process', 'Building Renovation Questions'],
  '/house-renovation-in-kuala-lumpur/': ['House Renovation Contractor in Kuala Lumpur', 'Minimum Starting Prices for KL Renovation Work'],
  '/house-renovation-in-selangor/': ['House Renovation Contractor in Selangor', 'Minimum Starting Prices for Renovation Work'],
};
const failures = [];
const routeFile = (route) => route === '/' ? join(dist, 'index.html') : join(dist, route.slice(1), 'index.html');

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
  for (const phrase of keyText[route]) {
    if (!$.text().replace(/\s+/g, ' ').includes(phrase)) failures.push(`${route}: source text missing: ${phrase}`);
  }
  for (const image of $('main img').toArray()) {
    const src = $(image).attr('src') || '';
    if (/^https?:\/\//i.test(src)) failures.push(`${route}: remote image ${src}`);
    if ($(image).attr('alt') === undefined) failures.push(`${route}: image missing alt`);
  }
  if (/googletagmanager|gtag\s*\(|google-analytics|fbq\s*\(|generate_lead/i.test(html)) failures.push(`${route}: tracking/lead event present`);
  if (target === 'github' && $('form input,form select,form textarea,form button').toArray()
    .some((control) => $(control).attr('disabled') === undefined)) failures.push(`${route}: enabled staging form control`);
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    try { JSON.parse($(script).text()); } catch { failures.push(`${route}: invalid JSON-LD`); }
  }
  for (const href of $('a[href]').toArray().map((anchor) => $(anchor).attr('href') || '')) {
    if (href.startsWith('/') && !href.startsWith(`${basePrefix}/`) && target === 'github') {
      failures.push(`${route}: unbased internal link ${href}`);
      break;
    }
  }
}

const faq = load(await readFile(routeFile('/faq/'), 'utf8'));
if (faq('.core-faq-list details').length !== 9) failures.push('/faq/: expected nine safe accordions');
const blog = load(await readFile(routeFile('/blog/'), 'utf8'));
if (blog('.core-blog-grid article').length !== 14) failures.push('/blog/: expected 14 article cards');
if (blog('.core-blog-topics a').length !== 9) failures.push('/blog/: expected nine archive links');
const contact = load(await readFile(routeFile('/contact-us/'), 'utf8'));
if (contact('form input,form select,form textarea,form button').toArray().some((control) => contact(control).attr('disabled') === undefined)) {
  failures.push('/contact-us/: staging controls enabled');
}
const aboutText = load(await readFile(routeFile('/about-us/'), 'utf8')).text();
if (/registration number|Sdn\.?\s*Bhd|company number/i.test(aboutText)) failures.push('/about-us/: unsupported registration detail');
const buildingText = load(await readFile(routeFile('/service/building-renovation/'), 'utf8')).text();
if (/Vastcon|Careers|casethemes|ThemeForest/i.test(buildingText)) failures.push('/service/building-renovation/: imported demo content');

const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
if ([...sitemap.matchAll(/<loc>/g)].length !== 32) failures.push('sitemap count changed');
if (target === 'github' && !/Disallow:\s*\/\s*$/im.test(await readFile(join(dist, 'robots.txt'), 'utf8'))) failures.push('staging robots not disallow-all');

if (target === 'github') {
  const metrics = JSON.parse(await readFile(join(root, '.audit-cache', 'prompt-2-1', 'after-metrics.json'), 'utf8'));
  if (metrics.length !== 72) failures.push(`visual metrics: expected 72, found ${metrics.length}`);
  for (const record of metrics.filter((item) => item.site === 'astro')) {
    if (record.status !== 200 || record.h1.length !== 1 || record.scrollWidth > record.clientWidth
      || record.images.some((image) => !image.width || !image.height)
      || record.consoleErrors.some((message) => !/favicon|ERR_NETWORK_CHANGED|404/i.test(message))) {
      failures.push(`${record.route} ${record.viewportName}: visual capture failed`);
    }
  }
  for (const file of [
    'core-desktop-side-by-side-contact-sheet.png', 'core-mobile-side-by-side-contact-sheet.png',
    'high-value-services-desktop-side-by-side-contact-sheet.png', 'high-value-services-mobile-side-by-side-contact-sheet.png',
  ]) await access(join(root, 'reports', 'public', 'visuals', 'prompt-2-1', file));
}

if (failures.length) {
  console.error(`Prompt 2.1 ${target} validation failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Prompt 2.1 ${target} validation passed: 12 corrected routes, SEO freeze, privacy controls and visual evidence.`);
}
