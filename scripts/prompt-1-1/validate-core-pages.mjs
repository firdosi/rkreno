import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const dist = join(root, 'dist');
const routes = ['/', '/services/', '/about-us/', '/contact-us/', '/faq/', '/blog/'];
const failures = [];

const routeFile = (route) =>
  route === '/' ? join(dist, 'index.html') : join(dist, route.slice(1), 'index.html');

for (const route of routes) {
  const html = await readFile(routeFile(route), 'utf8');
  const $ = load(html);
  const canonical = $('link[rel="canonical"]').attr('href');
  const robots = $('meta[name="robots"]').attr('content') || '';
  const expectedCanonical = `https://rkrenosolution.com${route}`;
  if (!$('title').text().trim()) failures.push(`${route}: missing title`);
  if (!$('meta[name="description"]').attr('content')) failures.push(`${route}: missing description`);
  if (canonical !== expectedCanonical) failures.push(`${route}: canonical ${canonical}`);
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

const contact = load(await readFile(routeFile('/contact-us/'), 'utf8'));
const formControls = contact('form input, form select, form textarea, form button').toArray();
if (!formControls.length || formControls.some((control) => contact(control).attr('disabled') === undefined)) {
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
for (const route of routes) {
  if (!sitemap.includes(`https://rkrenosolution.com${route}`)) failures.push(`${route}: absent from sitemap`);
}

if (failures.length) {
  console.error(`Core-page validation failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Core-page metadata, image, staging privacy, sitemap, FAQ, blog and disabled-form checks passed.');
}
