import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const dist = join(root, 'dist');
const target = process.env.VALIDATE_TARGET || 'github';
const articleData = JSON.parse(await readFile(join(root, 'src', 'data', 'article-wordpress-content.json'), 'utf8'));
const taxonomyData = JSON.parse(await readFile(join(root, 'src', 'data', 'taxonomy-archives.json'), 'utf8'));
const articles = Object.keys(articleData);
const archives = Object.entries(taxonomyData)
  .filter(([, archive]) => archive.action === 'KEEP_NOINDEX_NATIVE')
  .map(([route]) => route);
const core = ['/', '/services/', '/about-us/', '/contact-us/', '/faq/', '/blog/'];
const services = [
  '/servis-aircond-murah-kl/', '/aircond-installation-kl/', '/upah-pasang-aircond-selangor/',
  '/service/building-renovation/', '/electrical-services-selangor/',
  '/house-renovation-in-kuala-lumpur/', '/house-renovation-in-selangor/',
  '/home-renovation-contractor-in-subang-jaya/', '/office-renovation-in-kuala-lumpur/',
  '/waterproofing-contractor-kuala-lumpur/', '/plaster-ceiling-contractor-kl/',
  '/servis-cuci-rumah-kl/',
];
const retained = [...core, ...services, ...articles, ...archives, '/thank-you/'];
const failures = [];
const routeFile = (route) => route === '/' ? join(dist, 'index.html') : join(dist, route.slice(1), 'index.html');
const normalize = (value = '') => value.replace(/\s+/g, ' ').trim();
const parsed = new Map();

for (const route of retained) {
  const html = await readFile(routeFile(route), 'utf8');
  const $ = load(html);
  parsed.set(route, { html, $ });
  const robots = $('meta[name="robots"]').attr('content') || '';
  const expectedRobots = target === 'github'
    ? 'noindex, nofollow'
    : archives.includes(route) ? 'noindex, follow'
      : route === '/thank-you/' ? 'noindex, nofollow' : 'index, follow';
  if (normalize(robots).toLowerCase() !== expectedRobots) failures.push(`${route}: robots ${robots}, expected ${expectedRobots}`);
  if ($('link[rel="canonical"]').attr('href') !== `https://rkrenosolution.com${route}`) failures.push(`${route}: incorrect canonical`);
  if (!$('title').text().trim() || !$('meta[name="description"]').attr('content')) failures.push(`${route}: missing title or description`);
  if ($('h1').length !== 1) failures.push(`${route}: expected one H1, found ${$('h1').length}`);
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (!$(`meta[property="${property}"]`).attr('content')) failures.push(`${route}: missing ${property}`);
  }
  const headings = $('main h1, main h2, main h3, main h4, main h5, main h6').toArray()
    .map((heading) => Number(heading.tagName.slice(1)));
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index] > headings[index - 1] + 1) {
      failures.push(`${route}: heading skip H${headings[index - 1]} to H${headings[index]}`);
      break;
    }
  }
  for (const image of $('main img').toArray()) {
    const src = $(image).attr('src') || '';
    if (/^https?:\/\//i.test(src)) failures.push(`${route}: remote image ${src}`);
    if ($(image).attr('alt') === undefined) failures.push(`${route}: image missing alt`);
    if ((articles.includes(route) || archives.includes(route) || route === '/thank-you/')
      && (!$(image).attr('width') || !$(image).attr('height'))) failures.push(`${route}: image missing dimensions`);
  }
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    try {
      JSON.parse($(script).text());
    } catch {
      failures.push(`${route}: invalid JSON-LD`);
    }
  }
  if (/googletagmanager|gtag\s*\(|google-analytics|GTM-|fbq\s*\(|generate_lead|Meta Lead/i.test(html)) {
    failures.push(`${route}: tracking or lead event present`);
  }
}

for (const route of articles) {
  const { html, $ } = parsed.get(route);
  const source = articleData[route];
  const body = $('.article-exact-content');
  if (!body.length) failures.push(`${route}: exact article body missing`);
  if (body.find('h2,h3,h4').length !== source.counts.astroHeadings) failures.push(`${route}: heading completeness mismatch`);
  if (body.find('table').length !== source.counts.astroTables) failures.push(`${route}: table completeness mismatch`);
  const visibleFaqs = [];
  body.find('details').each((_, detail) => {
    const question = normalize($(detail).find('summary').first().text());
    const answer = normalize($(detail).clone().find('summary').remove().end().text());
    if (question && answer) visibleFaqs.push({ question, answer });
  });
  if (!visibleFaqs.length) {
    body.find('.rk-faq-item, [class*="accordion-item"]').each((_, item) => {
      const question = normalize($(item).find('h3,h4,[class*="question"],[class*="title"]').first().text());
      const answer = normalize($(item).find('p,[class*="answer"],[class*="content"]').first().text());
      if (question && answer) visibleFaqs.push({ question, answer });
    });
  }
  if (visibleFaqs.length !== source.counts.astroFaqs) failures.push(`${route}: FAQ completeness mismatch`);
  const schemas = $('script[type="application/ld+json"]').toArray().map((script) => JSON.parse($(script).text()));
  const articleSchema = schemas.find((schema) => schema['@type'] === 'BlogPosting');
  if (!articleSchema) failures.push(`${route}: BlogPosting schema missing`);
  if (articleSchema?.datePublished !== source.published || articleSchema?.dateModified !== source.modified) {
    failures.push(`${route}: article schema dates do not match WordPress`);
  }
  const faqSchema = schemas.find((schema) => schema['@type'] === 'FAQPage');
  if (visibleFaqs.length && !faqSchema) failures.push(`${route}: visible FAQs have no FAQPage schema`);
  if (!visibleFaqs.length && faqSchema) failures.push(`${route}: hidden-only FAQPage schema emitted`);
  visibleFaqs.forEach((faq, index) => {
    const schemaFaq = faqSchema?.mainEntity?.[index];
    if (schemaFaq?.name !== faq.question || schemaFaq?.acceptedAnswer?.text !== faq.answer) {
      failures.push(`${route}: FAQ schema item ${index + 1} differs from visible content`);
    }
  });
  if (/\b(?:90-day workmanship warranty|solid warranty|satisfaction guarantee|warranty promise)\b/i.test(body.text())) {
    failures.push(`${route}: excluded warranty/guarantee claim remains`);
  }
  if (/<script|<iframe|<form/i.test(source.html)) failures.push(`${route}: imported executable/plugin markup remains`);
  if (!html.includes(source.sourceTitle)) failures.push(`${route}: source article title missing`);
}

for (const route of archives) {
  const { $ } = parsed.get(route);
  const archive = taxonomyData[route];
  const links = $('.archive-exact-grid article h2 a').toArray().map((anchor) =>
    ($(anchor).attr('href') || '').replace(/^\/rkreno/, ''));
  if (JSON.stringify(links) !== JSON.stringify(archive.articles)) failures.push(`${route}: archive membership mismatch`);
  const schemas = $('script[type="application/ld+json"]').toArray().map((script) => JSON.parse($(script).text()));
  const collection = schemas.find((schema) => schema['@type'] === 'CollectionPage');
  if (!collection) failures.push(`${route}: CollectionPage schema missing`);
  const schemaLinks = collection?.hasPart?.map((item) => new URL(item.url).pathname) || [];
  if (JSON.stringify(schemaLinks) !== JSON.stringify(archive.articles)) failures.push(`${route}: CollectionPage membership mismatch`);
  if (!$('a[href$="/blog/"]').length) failures.push(`${route}: Blog link missing`);
}

const inboundLinks = new Map(retained.map((route) => [route, 0]));
for (const [sourceRoute, { $ }] of parsed) {
  $('a[href]').each((_, anchor) => {
    const href = ($(anchor).attr('href') || '').replace(/^\/rkreno(?=\/)/, '');
    if (!href.startsWith('/') || href.startsWith('//')) return;
    const targetRoute = href.split(/[?#]/)[0].replace(/\/?$/, '/');
    if (targetRoute !== sourceRoute && inboundLinks.has(targetRoute)) {
      inboundLinks.set(targetRoute, inboundLinks.get(targetRoute) + 1);
    }
  });
}
for (const route of [...core.slice(1), ...services, ...articles, ...archives]) {
  if (!inboundLinks.get(route)) failures.push(`${route}: orphaned retained route`);
}

const contact = parsed.get('/contact-us/').$;
const controls = contact('form input, form select, form textarea, form button').toArray();
if (!controls.length || controls.some((control) => contact(control).attr('disabled') === undefined)) {
  failures.push('/contact-us/: form controls are not all disabled');
}
if (parsed.get('/faq/').$('.core-faq-list details').length !== 9) failures.push('/faq/: expected nine FAQ items');
if (parsed.get('/blog/').$('.core-blog-grid article').length !== 14) failures.push('/blog/: expected 14 article cards');
if (parsed.get('/blog/').$('.core-blog-topics a').length !== 9) failures.push('/blog/: expected nine archive topic links');
for (const route of services) if (!parsed.get(route).$('.service-exact-page').length) failures.push(`${route}: service regression`);

const thankYou = parsed.get('/thank-you/');
if (!/direct visit does not confirm/i.test(thankYou.$('main').text())) failures.push('/thank-you/: direct-visit warning missing');
if (thankYou.$('form').length) failures.push('/thank-you/: form present');
const errorHtml = await readFile(join(dist, '404.html'), 'utf8');
const errorPage = load(errorHtml);
if (errorPage('meta[name="robots"]').attr('content') !== 'noindex, nofollow') failures.push('404: incorrect robots');
if (errorPage('h1').length !== 1 || !/page not found/i.test(errorPage('h1').text())) failures.push('404: H1 missing');
for (const href of ['/', '/services/', '/contact-us/']) {
  if (!errorPage(`a[href$="${href}"]`).length) failures.push(`404: link ${href} missing`);
}
if (/http-equiv=["']refresh/i.test(errorHtml)) failures.push('404: meta refresh present');

const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== 32) failures.push(`sitemap: expected 32 URLs, found ${sitemapUrls.length}`);
for (const route of [...archives, '/thank-you/']) {
  if (sitemap.includes(`https://rkrenosolution.com${route}`)) failures.push(`${route}: must be excluded from sitemap`);
}
for (const route of [...core, ...services, ...articles]) {
  if (!sitemap.includes(`https://rkrenosolution.com${route}`)) failures.push(`${route}: missing from sitemap`);
}
const robotsTxt = await readFile(join(dist, 'robots.txt'), 'utf8');
if (target === 'github' && !/Disallow:\s*\/\s*$/im.test(robotsTxt)) failures.push('robots.txt: staging is not disallow-all');

const htmlFiles = (await readdir(dist, { recursive: true })).filter((file) => file.endsWith('.html'));
if (htmlFiles.length !== 43) failures.push(`build: expected 43 HTML files, found ${htmlFiles.length}`);

if (failures.length) {
  console.error(`Stage 1 ${target} validation failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Stage 1 ${target} validation passed: 42/42 retained routes, custom 404, schemas, sitemap and privacy controls.`);
}
