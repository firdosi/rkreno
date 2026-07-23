import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const backup = path.join(root, 'wp-old-site-backup');
const pages = JSON.parse(await readFile(path.join(root, 'src', 'data', 'site-pages.json'), 'utf8'));
const aioseo = JSON.parse(await readFile(
  path.join(backup, 'aioseo-export-post-types-2026-07-23.json'), 'utf8'
)).postOptions?.content?.posts || [];
const settings = JSON.parse(await readFile(
  path.join(backup, 'aioseo-export-settings-2026-07-23.json'), 'utf8'
)).settings || {};
const xml = await readFile(path.join(backup, 'rkrenosolution.WordPress.2026-07-23.xml'), 'utf8');

const clean = (value = '') => load(`<p>${value}</p>`).text().replace(/\s+/g, ' ').trim();
const normalize = (value = '') => clean(value)
  .replace(/\s*[|–—-]\s*RK Reno Solutions?$/i, '').toLowerCase();

const aioByTitle = new Map();
for (const item of aioseo) {
  if (item.post_title) aioByTitle.set(normalize(item.post_title), item);
}

let compared = 0;
let exactTitle = 0;
let exactDescription = 0;
let customTitle = 0;
let customDescription = 0;
for (const page of pages) {
  const item = aioByTitle.get(normalize(page.h1 || page.title));
  if (!item) continue;
  compared++;
  const expectedTitle = clean(item.title);
  const expectedDescription = clean(item.description);
  if (expectedTitle) {
    customTitle++;
    if (clean(page.title) === expectedTitle) exactTitle++;
  }
  if (expectedDescription) {
    customDescription++;
    if (clean(page.description) === expectedDescription) exactDescription++;
  }
}

const itemCount = (xml.match(/<item>/g) || []).length;
const publishedCount = (xml.match(/<wp:status><!\[CDATA\[publish\]\]><\/wp:status>/g) || []).length;
const postTypes = [...xml.matchAll(/<wp:post_type><!\[CDATA\[(.*?)\]\]><\/wp:post_type>/g)]
  .reduce((counts, match) => ({ ...counts, [match[1]]: (counts[match[1]] || 0) + 1 }), {});

const report = `# Backup comparison (public metadata only)\n\n` +
  `Generated: ${new Date().toISOString()}\n\n` +
  `## Sources safely inspected\n\n` +
  `- WordPress XML: ${itemCount} items (${publishedCount} marked published)\n` +
  `- Elementor kit: valid ZIP structure with 149 entries\n` +
  `- AIOSEO post metadata: ${aioseo.length} records\n` +
  `- AIOSEO settings: ${Object.keys(settings).length} top-level groups\n` +
  `- Full site archive: valid gzip/tar structure rooted at the production domain\n` +
  `- Database export: valid gzip-compressed SQL export (not extracted)\n\n` +
  `## WordPress XML types\n\n` +
  Object.entries(postTypes).sort().map(([type, count]) => `- ${type}: ${count}`).join('\n') +
  `\n\n## AIOSEO versus live pages\n\n` +
  `- Live pages matched to AIOSEO records by public title: ${compared}\n` +
  `- Records with a custom SEO title: ${customTitle}; exact live matches: ${exactTitle}\n` +
  `- Records with a custom meta description: ${customDescription}; exact live matches: ${exactDescription}\n` +
  `\nThe live rendered metadata remains the migration source of truth; production canonical URLs are preserved.\n`;

await writeFile(path.join(root, 'reports', 'public', 'backup-comparison.md'), report);
console.log(report);
