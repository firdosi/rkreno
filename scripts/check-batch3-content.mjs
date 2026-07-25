import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const routes = [
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/',
  '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/',
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/',
  '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/',
  '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/',
  '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/',
  '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/',
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/',
  '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/',
  '/servis-cuci-rumah-kl/',
  '/thank-you/',
];
const articles = new Set(routes.slice(0, 9));
const failures = [];
const retainedArticles = [
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

for (const route of routes) {
  const file = path.join('dist', route.replace(/^\/|\/$/g, ''), 'index.html');
  const html = await fs.readFile(file, 'utf8');
  const $ = load(html);
  const h1 = $('h1').length;
  const robots = $('meta[name="robots"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const remoteImages = $('img').filter((_, image) => /^https?:\/\//.test($(image).attr('src') || ''));
  const missingAlt = $('img').filter((_, image) => !($(image).attr('alt') || '').trim());
  const schema = $('script[type="application/ld+json"]').map((_, node) => {
    try { return JSON.parse($(node).text())['@type']; } catch { return 'invalid'; }
  }).get();

  if (h1 !== 1) failures.push(`${route}: expected one H1, found ${h1}`);
  if (canonical !== `https://rkrenosolution.com${route}`) failures.push(`${route}: canonical mismatch`);
  if (remoteImages.length) failures.push(`${route}: remote image found`);
  if (missingAlt.length) failures.push(`${route}: missing image alt`);
  if (/gravatar|elementor|comment-respond|tag-cloud/i.test(html)) failures.push(`${route}: legacy residue found`);
  if (articles.has(route) && !schema.includes('BlogPosting')) failures.push(`${route}: BlogPosting missing`);
  if (articles.has(route) && (!$('article.article-page').length || $('h2').length < 3)) {
    failures.push(`${route}: native article structure missing`);
  }
  if (articles.has(route)) {
    let seenH2 = false;
    $('article.article-page h1, article.article-page h2, article.article-page h3').each((_, heading) => {
      const level = heading.tagName.toLowerCase();
      if (level === 'h2') seenH2 = true;
      if (level === 'h3' && !seenH2) failures.push(`${route}: H3 appears before H2`);
    });
  }
  const visible = $('main').text().replace(/\s+/g, ' ');
  if (/RK Reno Expert|Certified Wireman|90-Day Workmanship|100% Satisfaction Guarantee|2000\+|4\.9\/5|24\/7|cheapest (?:contractor|service|price)/i.test(visible)) {
    failures.push(`${route}: unsupported legacy claim found`);
  }
  if (route === '/servis-cuci-rumah-kl/' && !schema.includes('Service')) failures.push(`${route}: Service schema missing`);
  if (route === '/thank-you/' && robots !== 'noindex, follow') failures.push(`${route}: noindex missing`);
  if (route === '/thank-you/' && html.includes("dispatchEvent(new CustomEvent('rkreno:lead'")) {
    failures.push(`${route}: lead dispatch code included`);
  }
}

const sitemap = await fs.readFile(path.join('dist', 'sitemap.xml'), 'utf8');
if (sitemap.includes('/thank-you/')) failures.push('/thank-you/: present in sitemap');

const blog = load(await fs.readFile(path.join('dist', 'blog', 'index.html'), 'utf8'));
const articleLinks = new Set(blog('a[href]').map((_, anchor) => blog(anchor).attr('href')).get());
for (const route of retainedArticles) {
  if (![...articleLinks].some((href) => href?.endsWith(route))) failures.push(`/blog/: missing ${route}`);
  const articleHtml = await fs.readFile(path.join('dist', route.replace(/^\/|\/$/g, ''), 'index.html'), 'utf8');
  const articlePage = load(articleHtml);
  if (articlePage('.legacy-content').length || !articlePage('article.article-page, .batch-page').length) {
    failures.push(`${route}: retained article is not on a native template`);
  }
  if (articlePage('img').filter((_, image) => /^https?:\/\//.test(articlePage(image).attr('src') || '')).length) {
    failures.push(`${route}: retained article hotlinks an image`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Batch 3 content, schema, image, archive and thank-you checks passed.');
}
