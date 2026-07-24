import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import routePolicy from '../src/data/route-policy.json' with { type: 'json' };
import taxonomyArchives from '../src/data/taxonomy-archives.json' with { type: 'json' };

const target = process.env.DEPLOY_TARGET || 'local';
const indexable = target === 'vps';
const root = path.resolve('dist');
const failures = [];
const htmlFiles = [];
const retainedTaxonomyCanonicals = new Set(Object.entries(taxonomyArchives)
  .filter(([, archive]) => archive.action === 'KEEP_NOINDEX_NATIVE')
  .map(([route]) => `https://rkrenosolution.com${route}`));

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
await walk(root);

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const $ = load(html);
  const robots = $('meta[name="robots"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const utilityNoindex = relative === 'thank-you/index.html' ||
    retainedTaxonomyCanonicals.has(canonical);
  const shouldIndex = indexable && !utilityNoindex;
  if (shouldIndex !== /^index,\s*follow$/i.test(robots)) {
    failures.push(`${path.relative(root, file)} has unexpected robots meta: ${robots}`);
  }
  if (!canonical.startsWith('https://rkrenosolution.com/')) {
    failures.push(`${path.relative(root, file)} has invalid canonical: ${canonical}`);
  }
  if (indexable && html.includes('staging-banner')) {
    failures.push(`${path.relative(root, file)} includes a staging banner`);
  }
}

const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
if (indexable) {
  if (!robots.includes('Allow: /') || !robots.includes('https://rkrenosolution.com/sitemap.xml')) {
    failures.push('Production robots.txt is incomplete');
  }
} else if (!robots.includes('Disallow: /')) {
  failures.push('Non-production robots.txt must disallow crawling');
}

const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedSitemapUrls = htmlFiles.length - 2 - retainedTaxonomyCanonicals.size;
if (sitemapUrls.length !== expectedSitemapUrls) {
  failures.push(`Expected ${expectedSitemapUrls} sitemap URLs, found ${sitemapUrls.length}`);
}
if (sitemapUrls.some((url) => !url.startsWith('https://rkrenosolution.com/'))) {
  failures.push('Sitemap contains a non-production URL');
}
if (routePolicy.excluded.some((route) =>
  sitemapUrls.includes(`https://rkrenosolution.com${route}`))) {
  failures.push('Sitemap contains an approved excluded route');
}
if (sitemapUrls.includes('https://rkrenosolution.com/thank-you/')) {
  failures.push('Sitemap contains the noindex thank-you route');
}
if ([...retainedTaxonomyCanonicals].some((canonical) => sitemapUrls.includes(canonical))) {
  failures.push('Sitemap contains a retained noindex taxonomy route');
}

const indexHtml = await readFile(path.join(root, 'index.html'), 'utf8');
const contactHtml = await readFile(path.join(root, 'contact-us', 'index.html'), 'utf8');
if (indexable && process.env.PUBLIC_FORM_ENDPOINT && !contactHtml.includes(process.env.PUBLIC_FORM_ENDPOINT)) {
  failures.push('Production form endpoint is missing from the contact page');
}
if (indexable && process.env.PUBLIC_TURNSTILE_SITE_KEY &&
    !contactHtml.includes(process.env.PUBLIC_TURNSTILE_SITE_KEY)) {
  failures.push('Turnstile site key is missing from the contact page');
}
if (indexable && process.env.PUBLIC_ANALYTICS_ENABLED === 'true' &&
    !/googletagmanager|connect\.facebook\.net/.test(indexHtml)) {
  failures.push('Analytics was enabled but no analytics loader was emitted');
}

const forbidden = [
  'SMTP_PASS=',
  'TURNSTILE_SECRET_KEY=',
  'BEGIN OPENSSH PRIVATE KEY',
  'wp-old-site-backup',
];
for (const marker of forbidden) {
  if (indexHtml.includes(marker)) failures.push(`Forbidden value found in build: ${marker}`);
}

if (failures.length) {
  console.error(`Deployment build verification failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    `Verified ${htmlFiles.length} HTML files, ${sitemapUrls.length} sitemap URLs, ` +
    `${indexable ? 'production indexing' : 'non-indexable preview'} and secret exclusions.`,
  );
}
