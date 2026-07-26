import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const dist = join(root, 'dist');
const serviceRoutes = [
  '/servis-aircond-murah-kl/',
  '/aircond-installation-kl/',
  '/upah-pasang-aircond-selangor/',
  '/service/building-renovation/',
  '/electrical-services-selangor/',
  '/house-renovation-in-kuala-lumpur/',
  '/house-renovation-in-selangor/',
  '/home-renovation-contractor-in-subang-jaya/',
  '/office-renovation-in-kuala-lumpur/',
  '/waterproofing-contractor-kuala-lumpur/',
  '/plaster-ceiling-contractor-kl/',
  '/servis-cuci-rumah-kl/',
];
const coreRoutes = ['/', '/services/', '/about-us/', '/contact-us/', '/faq/', '/blog/'];
const failures = [];
const routeFile = (route) => route === '/' ? join(dist, 'index.html') : join(dist, route.slice(1), 'index.html');

for (const route of [...serviceRoutes, ...coreRoutes]) {
  const html = await readFile(routeFile(route), 'utf8');
  const $ = load(html);
  const expectedCanonical = `https://rkrenosolution.com${route}`;
  const robots = $('meta[name="robots"]').attr('content') || '';
  if (!$('title').text().trim()) failures.push(`${route}: missing title`);
  if (!$('meta[name="description"]').attr('content')) failures.push(`${route}: missing description`);
  if ($('link[rel="canonical"]').attr('href') !== expectedCanonical) failures.push(`${route}: incorrect canonical`);
  if (!/noindex/i.test(robots) || !/nofollow/i.test(robots)) failures.push(`${route}: staging robots ${robots}`);
  if ($('h1').length !== 1) failures.push(`${route}: expected one H1, found ${$('h1').length}`);
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (!$(`meta[property="${property}"]`).attr('content')) failures.push(`${route}: missing ${property}`);
  }
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    try {
      JSON.parse($(script).text());
    } catch {
      failures.push(`${route}: invalid JSON-LD`);
    }
  }
  for (const image of $('img').toArray()) {
    const source = $(image).attr('src') || '';
    if (/^https?:\/\//i.test(source)) failures.push(`${route}: remote image ${source}`);
    if ($(image).attr('alt') === undefined) failures.push(`${route}: image missing alt`);
  }
  if (/googletagmanager|gtag\s*\(|google-analytics|GTM-|fbq\s*\(/i.test(html)) {
    failures.push(`${route}: staging tracking code present`);
  }
}

for (const route of serviceRoutes) {
  const html = await readFile(routeFile(route), 'utf8');
  const $ = load(html);
  if (!$('.service-exact-page').length) failures.push(`${route}: exact service layout missing`);
  if (!$('.service-exact-hero').length) failures.push(`${route}: route hero missing`);
  if ($('h2').length < 2) failures.push(`${route}: insufficient preserved section headings`);
  if (!$('main img').length) failures.push(`${route}: no local content image`);
  const headingLevels = $('main h1, main h2, main h3, main h4, main h5, main h6').toArray()
    .map((heading) => Number(heading.tagName.slice(1)));
  for (let index = 1; index < headingLevels.length; index += 1) {
    if (headingLevels[index] > headingLevels[index - 1] + 1) {
      failures.push(`${route}: heading level skips from H${headingLevels[index - 1]} to H${headingLevels[index]}`);
      break;
    }
  }
  const visibleFaqs = $('.service-exact-faqs details').toArray().map((details) => ({
    question: $(details).find('summary').clone().children().remove().end().text().trim(),
    answer: $(details).find('p').text().trim(),
  }));
  if (visibleFaqs.length) {
    const schemas = $('script[type="application/ld+json"]').toArray()
      .map((script) => JSON.parse($(script).text()));
    const faqSchema = schemas.find((schema) => schema['@type'] === 'FAQPage');
    if (!faqSchema) {
      failures.push(`${route}: visible FAQ has no FAQPage schema`);
    } else {
      const schemaFaqs = faqSchema.mainEntity || [];
      if (schemaFaqs.length !== visibleFaqs.length) failures.push(`${route}: FAQ schema count does not match visible FAQ`);
      visibleFaqs.forEach((faq, index) => {
        if (schemaFaqs[index]?.name !== faq.question || schemaFaqs[index]?.acceptedAnswer?.text !== faq.answer) {
          failures.push(`${route}: FAQ schema item ${index + 1} does not match visible content`);
        }
      });
    }
  }
  const text = $('main').text().replace(/\s+/g, ' ');
  if (/\b(?:4\.9|5,000\+|5000\+|2,000\+|2000\+|1,000\+|1000\+|500\+|90-day warranty|100% dry guarantee|guarantee perfection)\b/i.test(text)) {
    failures.push(`${route}: unsupported imported claim remains`);
  }
}

const requiredText = {
  '/servis-aircond-murah-kl/': ['RM 60', 'RM 120', 'RM 50'],
  '/aircond-installation-kl/': ['RM220', 'RM280', '5 feet'],
  '/upah-pasang-aircond-selangor/': ['RM220', 'RM280', '5 kaki'],
  '/home-renovation-contractor-in-subang-jaya/': ['RM 4,000', 'RM 15,000', 'RM 6,000'],
  '/house-renovation-in-kuala-lumpur/': ['RM400', 'RM6/sq ft', 'RM15,000'],
  '/house-renovation-in-selangor/': ['RM400', 'RM6/sq ft', 'RM15,000'],
  '/office-renovation-in-kuala-lumpur/': ['RM30/sq ft', 'RM50/sq ft', 'RM20/sq ft'],
  '/waterproofing-contractor-kuala-lumpur/': ['RM 150', 'RM 800', 'RM 15'],
  '/plaster-ceiling-contractor-kl/': ['RM 3.50', 'RM 15.00', 'RM 80'],
  '/servis-cuci-rumah-kl/': ['RM 300', 'RM 400'],
};
for (const [route, values] of Object.entries(requiredText)) {
  const html = await readFile(routeFile(route), 'utf8');
  for (const value of values) if (!html.includes(value)) failures.push(`${route}: missing published value ${value}`);
}

for (const route of ['/aircond-installation-kl/', '/upah-pasang-aircond-selangor/']) {
  const $ = load(await readFile(routeFile(route), 'utf8'));
  if ($('.service-exact-faqs details').length !== 7) failures.push(`${route}: expected 7 FAQ items`);
}
const contact = load(await readFile(routeFile('/contact-us/'), 'utf8'));
const controls = contact('form input, form select, form textarea, form button').toArray();
if (!controls.length || controls.some((control) => contact(control).attr('disabled') === undefined)) {
  failures.push('/contact-us/: form controls are not all disabled');
}
const faq = load(await readFile(routeFile('/faq/'), 'utf8'));
if (faq('.core-faq-list details').length !== 9) failures.push('/faq/: expected 9 FAQ accordions');
const blog = load(await readFile(routeFile('/blog/'), 'utf8'));
if (blog('.core-blog-grid article').length !== 14) failures.push('/blog/: expected 14 article cards');

const robotsText = await readFile(join(dist, 'robots.txt'), 'utf8');
if (!/User-agent:\s*\*/i.test(robotsText) || !/Disallow:\s*\/\s*$/im.test(robotsText)) {
  failures.push('robots.txt is not disallow-all');
}
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
for (const route of [...serviceRoutes, ...coreRoutes]) {
  if (!sitemap.includes(`https://rkrenosolution.com${route}`)) failures.push(`${route}: absent from sitemap`);
}

if (failures.length) {
  console.error(`Prompt 1.2 validation failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('All 12 service routes and six Prompt 1.1 core-page regressions passed.');
}
