import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const dist = path.join(root, 'dist');
const reportDir = path.join(root, 'reports', 'public');

function parseCsv(input) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"' && quoted && input[index + 1] === '"') {
      cell += '"'; index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if (/[\r\n]/.test(character) && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(cell); cell = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers, ...values] = rows;
  return values.map((valueRow) =>
    Object.fromEntries(headers.map((header, index) => [header, valueRow[index] || ''])));
}

const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const htmlPath = (route) =>
  route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html');
const normalizePath = (value) => {
  try {
    const url = new URL(value, 'https://rkrenosolution.com/');
    if (url.origin !== 'https://rkrenosolution.com') return null;
    return url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  } catch {
    return null;
  }
};

const plan = parseCsv(await readFile(path.join(reportDir, 'route-disposition-plan.csv'), 'utf8'));
const retained = plan.filter((row) => row['Current Astro status'].startsWith('200'));
const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const allFiles = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else allFiles.push(full);
  }
}
await walk(dist);
const existing = new Set(allFiles.map((file) =>
  `/${path.relative(dist, file).replaceAll('\\', '/')}`));

const records = [];
const inbound = new Map(retained.map((row) => [row['Current route'], 0]));
for (const row of retained) {
  const route = row['Current route'];
  const file = htmlPath(route);
  const html = await readFile(file, 'utf8');
  const $ = load(html);
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const robots = $('meta[name="robots"]').attr('content') || '';
  const title = $('title').text().trim();
  const description = $('meta[name="description"]').attr('content') || '';
  const h1s = $('h1').toArray().map((node) => $(node).text().trim()).filter(Boolean);
  const headings = $('h1,h2,h3,h4,h5,h6').toArray().map((node) =>
    Number(node.tagName.slice(1)));
  const hierarchyValid = headings.every((level, index) =>
    index === 0 || level <= headings[index - 1] + 1);
  const internalLinks = new Set();
  const broken = [];
  for (const element of $('a[href]').toArray()) {
    const value = $(element).attr('href');
    if (!value || /^(mailto:|tel:|#|javascript:)/.test(value)) continue;
    const local = normalizePath(value);
    if (!local) continue;
    internalLinks.add(local);
    if (inbound.has(local) && local !== route) inbound.set(local, inbound.get(local) + 1);
    const clean = local === '/' ? '/index.html' : `${local}index.html`;
    if (!existing.has(clean) && !value.includes('/api/')) broken.push(local);
  }
  const schemaScripts = $('script[type="application/ld+json"]').toArray();
  let schemaValid = schemaScripts.length > 0;
  for (const script of schemaScripts) {
    try { JSON.parse($(script).text()); } catch { schemaValid = false; }
  }
  const images = $('img').toArray();
  const missingAlt = images.filter((image) => $(image).attr('alt') === undefined).length;
  const remoteImages = images.filter((image) => /^https?:\/\//.test($(image).attr('src') || '')).length;
  const ogFields = ['og:title', 'og:description', 'og:url', 'og:image'];
  const ogValid = ogFields.every((property) => $(`meta[property="${property}"]`).attr('content'));
  const published = $('meta[property="article:published_time"]').attr('content') || '';
  const modified = $('meta[property="article:modified_time"]').attr('content') || '';
  const expectedRobots = row['Recommended index status'].replace(/\s/g, '').toLowerCase();
  const actualRobots = robots.replace(/\s/g, '').toLowerCase();
  const expectedCanonical = `https://rkrenosolution.com${route}`;
  const issues = [];
  if (!title) issues.push('missing title');
  if (!description) issues.push('missing description');
  if (canonical !== expectedCanonical) issues.push('canonical mismatch');
  if (actualRobots !== expectedRobots) issues.push('robots mismatch');
  if (h1s.length !== 1) issues.push(`${h1s.length} H1 elements`);
  if (!hierarchyValid) issues.push('heading level skipped');
  if (!schemaValid) issues.push('schema missing or invalid');
  if (!ogValid) issues.push('Open Graph incomplete');
  if (missingAlt) issues.push(`${missingAlt} image alt attributes missing`);
  if (broken.length) issues.push(`${broken.length} broken local links`);
  const shouldBeInSitemap = expectedRobots === 'index,follow';
  if (sitemapUrls.has(expectedCanonical) !== shouldBeInSitemap) issues.push('sitemap inclusion mismatch');
  records.push({
    route, exactUrl: expectedCanonical, title, description, canonical, robots,
    h1: h1s.join(' | '), hierarchy: hierarchyValid ? 'PASS' : 'FAIL',
    internalLinks: internalLinks.size, schema: schemaValid ? 'PASS' : 'FAIL',
    openGraph: ogValid ? 'PASS' : 'FAIL', images: images.length, missingAlt,
    remoteImages, published, modified,
    sitemap: sitemapUrls.has(expectedCanonical) ? 'INCLUDED' : 'EXCLUDED',
    brokenLinks: broken.length, issues,
  });
}

const canonicalCounts = new Map();
for (const record of records) {
  canonicalCounts.set(record.canonical, (canonicalCounts.get(record.canonical) || 0) + 1);
}
for (const record of records) {
  if (canonicalCounts.get(record.canonical) > 1) record.issues.push('duplicate canonical target');
  if ((inbound.get(record.route) || 0) === 0 && record.route !== '/' &&
      record.robots.replace(/\s/g, '').toLowerCase() === 'index,follow') {
    record.issues.push('orphan page');
  }
}

const headers = [
  'Route', 'Exact production URL', 'Title', 'Meta description', 'Canonical', 'Robots',
  'H1', 'Heading hierarchy', 'Internal link destinations', 'Schema', 'Open Graph',
  'Image count', 'Missing alt count', 'Remote image count', 'Published date',
  'Modified date', 'Sitemap', 'Inbound retained-route links', 'Broken local links',
  'Duplicate canonical', 'Orphan', 'Result', 'Notes',
];
const lines = [headers.map(quote).join(',')];
for (const record of records) {
  const duplicate = canonicalCounts.get(record.canonical) > 1 ? 'YES' : 'NO';
  const orphan = (inbound.get(record.route) || 0) === 0 && record.route !== '/' ? 'YES' : 'NO';
  lines.push([
    record.route, record.exactUrl, record.title, record.description, record.canonical,
    record.robots, record.h1, record.hierarchy, record.internalLinks, record.schema,
    record.openGraph, record.images, record.missingAlt, record.remoteImages,
    record.published || 'NOT_APPLICABLE_OR_NOT_EMITTED',
    record.modified || 'NOT_APPLICABLE_OR_NOT_EMITTED', record.sitemap,
    inbound.get(record.route) || 0, record.brokenLinks, duplicate, orphan,
    record.issues.length ? 'FAIL' : 'PASS',
    record.issues.join('; ') || (orphan === 'YES'
      ? 'Noindex archive or utility has no retained-route inbound link'
      : 'No issue found'),
  ].map(quote).join(','));
}
await writeFile(path.join(reportDir, 'final-production-seo-audit.csv'), `${lines.join('\n')}\n`);

const failures = records.filter((record) => record.issues.length);
console.log(
  `Audited ${records.length} retained routes: ${records.length - failures.length} pass, ` +
  `${failures.length} require review; sitemap has ${sitemapUrls.size} URLs.`,
);
if (failures.length) {
  console.error(failures.map((record) => `${record.route}: ${record.issues.join('; ')}`).join('\n'));
  process.exitCode = 1;
}
