import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = path.join(process.cwd(), 'dist');
const files = [];
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) await walk(full);
    else files.push(full);
  }
}
await walk(root);

const htmlFiles = files.filter((file) => file.endsWith('.html'));
const existing = new Set(files.map((file) => `/${path.relative(root, file).replaceAll('\\', '/')}`));
const broken = [];
for (const file of htmlFiles) {
  const $ = load(await readFile(file, 'utf8'));
  for (const el of $('[href],[src]').toArray()) {
    const value = $(el).attr('href') || $(el).attr('src');
    if (!value || /^(https?:|mailto:|tel:|#|data:)/.test(value)) continue;
    const clean = value.split(/[?#]/)[0].replace(/^\/rkreno/, '') || '/';
    const candidates = clean.endsWith('/') ? [`${clean}index.html`] : [clean, `${clean}/index.html`];
    if (!candidates.some((candidate) => existing.has(candidate))) broken.push({ file, value });
  }
}
if (broken.length) {
  console.error(JSON.stringify(broken.slice(0, 100), null, 2));
  process.exitCode = 1;
} else {
  console.log(`Checked ${htmlFiles.length} HTML files: no broken local links.`);
}
