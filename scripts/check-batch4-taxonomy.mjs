import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import taxonomyArchives from '../src/data/taxonomy-archives.json' with { type: 'json' };

const failures = [];
const retained = Object.entries(taxonomyArchives)
  .filter(([, archive]) => archive.action === 'KEEP_NOINDEX_NATIVE');
const retired = Object.entries(taxonomyArchives)
  .filter(([, archive]) => archive.action !== 'KEEP_NOINDEX_NATIVE');
const sitemap = await readFile(path.join('dist', 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const blog = load(await readFile(path.join('dist', 'blog', 'index.html'), 'utf8'));
const blogLinks = new Set(blog('.p21-blog-list article h2 a[href]').map((_, anchor) => blog(anchor).attr('href')).get()
  .map((href) => href?.replace(/^\/rkreno/, '')).filter(Boolean));
const signatures = new Map();

for (const [route, archive] of retained) {
  const file = path.join('dist', route.replace(/^\/|\/$/g, ''), 'index.html');
  const html = await readFile(file, 'utf8');
  const $ = load(html);
  const canonical = `https://rkrenosolution.com${route}`;
  const cards = $('.p23-archive-entry');
  const cardLinks = cards.map((_, card) =>
    $(card).find('h2 a').attr('href')?.replace(/^\/rkreno/, '')).get();
  const uniqueLinks = new Set(cardLinks);
  const schema = $('script[type="application/ld+json"]').map((_, node) => {
    try { return JSON.parse($(node).text())['@type']; } catch { return 'invalid'; }
  }).get();

  if (!$('.archive-exact-page').length || $('.legacy-content').length) failures.push(`${route}: native template missing`);
  if ($('h1').length !== 1) failures.push(`${route}: expected one H1`);
  if ($('meta[name="robots"]').attr('content') !== 'noindex, follow') failures.push(`${route}: robots mismatch`);
  if ($('link[rel="canonical"]').attr('href') !== canonical) failures.push(`${route}: canonical mismatch`);
  if (sitemapUrls.has(canonical)) failures.push(`${route}: retained noindex archive is in sitemap`);
  if (!schema.includes('CollectionPage') || schema.includes('BlogPosting')) failures.push(`${route}: schema mismatch`);
  if (cards.length !== archive.articles.length || uniqueLinks.size !== cardLinks.length) {
    failures.push(`${route}: card count or duplication mismatch`);
  }
  if (archive.articles.some((article) => !uniqueLinks.has(article))) failures.push(`${route}: membership mismatch`);
  if (archive.articles.some((article) => !blogLinks.has(article))) failures.push(`${route}: non-retained article listed`);
  if ($('img').filter((_, image) => /^https?:\/\//.test($(image).attr('src') || '')).length) {
    failures.push(`${route}: remote image found`);
  }
  if ($('img').filter((_, image) => !($(image).attr('alt') || '').trim()).length) {
    failures.push(`${route}: image alt missing`);
  }
  if (/gravatar|tag-cloud|comment-respond|elementor|100% satisfaction|certified wireman/i.test(html)) {
    failures.push(`${route}: legacy residue or unsupported claim found`);
  }
  const signature = [...archive.articles].sort().join('|');
  if (signatures.has(signature)) failures.push(`${route}: duplicates ${signatures.get(signature)}`);
  signatures.set(signature, route);
}

const htmlFiles = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
await walk('dist');
const allHtml = (await Promise.all(htmlFiles.map((file) => readFile(file, 'utf8')))).join('\n');

for (const [route, archive] of retired) {
  try {
    await access(path.join('dist', route.replace(/^\/|\/$/g, ''), 'index.html'));
    failures.push(`${route}: retired route was generated`);
  } catch {}
  const stagingHref = `/rkreno${route}`;
  if (allHtml.includes(`href="${route}"`) || allHtml.includes(`href="${stagingHref}"`)) {
    failures.push(`${route}: retired route retains an internal link`);
  }
  const rule = `location = ${route} { return 301 ${archive.destination}; }`;
  const nginx = await readFile(path.join('ops', 'nginx', 'redirects.conf'), 'utf8');
  if (!nginx.includes(rule)) failures.push(`${route}: future Nginx rule missing`);
}

if (!sitemapUrls.has('https://rkrenosolution.com/blog/')) failures.push('/blog/: missing from sitemap');
for (const article of blogLinks) {
  if (!sitemapUrls.has(`https://rkrenosolution.com${article}`)) {
    failures.push(`${article}: retained article missing from sitemap`);
  }
}

if (failures.length) {
  console.error(`Batch 4 taxonomy validation failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Batch 4 taxonomy checks passed: ${retained.length} native archives, ${retired.length} retired routes.`);
}
