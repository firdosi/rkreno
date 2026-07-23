import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const origin = 'https://rkrenosolution.com';
const dataPath = path.join(process.cwd(), 'src', 'data', 'site-pages.json');
const mediaDirectory = path.join(process.cwd(), 'public', 'assets', 'media');
const pages = JSON.parse(await readFile(dataPath, 'utf8'));
const layouts = [
  { path: '/servis-aircond-murah-kl/', root: 'rk-wrapper' },
  { path: '/aircond-installation-kl/', root: 'rkkl' },
  { path: '/upah-pasang-aircond-selangor/', root: 'rka4' },
  { path: '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/', root: 'rk-guide' },
  { path: '/house-renovation-in-kuala-lumpur/', root: 'rkklren' },
  { path: '/house-renovation-in-selangor/', root: 'rkren' },
  { path: '/electrical-services-selangor/', root: 'rk-wrapper' }
];

const globalMedia = new Map();
for (const page of pages) {
  for (const image of page.images || []) {
    if (image.source && image.local?.startsWith('/assets/')) {
      globalMedia.set(new URL(image.source, origin).href, image.local);
    }
  }
}
await mkdir(mediaDirectory, { recursive: true });

async function localizeImage(absolute) {
  const known = globalMedia.get(absolute);
  if (known) return known;
  const url = new URL(absolute);
  const extension = path.extname(url.pathname).toLowerCase() || '.jpg';
  const stem = path.basename(url.pathname, extension)
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'priority-image';
  const hash = createHash('sha256').update(absolute).digest('hex').slice(0, 8);
  const filename = `${stem}-${hash}${extension}`;
  const response = await fetch(absolute, {
    headers: { 'user-agent': 'RK-Reno-static-priority-refresh/1.0' },
  });
  if (!response.ok) return null;
  await writeFile(
    path.join(mediaDirectory, filename),
    Buffer.from(await response.arrayBuffer()),
  );
  const local = `/assets/media/${filename}`;
  globalMedia.set(absolute, local);
  return local;
}

for (const layout of layouts) {
  const page = pages.find((item) => item.path === layout.path);
  if (!page) throw new Error(`Missing page data for ${layout.path}`);

  const response = await fetch(new URL(layout.path, origin), {
    headers: { 'user-agent': 'RK-Reno-static-priority-refresh/1.0' }
  });
  if (!response.ok) throw new Error(`${response.status} for ${layout.path}`);
  const $ = load(await response.text());
  const sourceRoot = $(`.${layout.root}`).first();
  if (!sourceRoot.length) throw new Error(`Missing .${layout.root} on ${layout.path}`);

  const style = $('style').map((_, element) => $(element).html() || '').get()
    .find((css) => css.includes(`.${layout.root}`));
  if (!style) throw new Error(`Missing style for .${layout.root} on ${layout.path}`);

  const fragment = load(`<main>${sourceRoot.toString()}</main>`);
  const root = fragment('main');
  root.find('script,noscript,iframe,form').remove();

  for (const element of root.find('img').toArray()) {
    const image = fragment(element);
    const raw = image.attr('data-src') || image.attr('src');
    if (!raw) {
      image.remove();
      continue;
    }
    const absolute = new URL(raw, origin).href;
    const local = await localizeImage(absolute);
    if (!local) {
      image.remove();
      continue;
    }
    image.attr('src', local);
    image.removeAttr('srcset').removeAttr('sizes').removeAttr('data-src');
    if (!page.images?.some((item) => item.source === absolute)) {
      page.images ||= [];
      page.images.push({ source: absolute, local, alt: image.attr('alt') || '' });
    }
  }

  root.find('source').remove();
  root.find('a[href]').each((_, element) => {
    const anchor = fragment(element);
    try {
      const target = new URL(anchor.attr('href'), origin);
      if (target.origin === origin) {
        anchor.attr('href', `${target.pathname}${target.search}${target.hash}`);
      }
    } catch {}
  });

  page.content = `<style>${style}</style>${root.html()}`;
  page.customLayout = true;
  console.log(`Refreshed ${layout.path} with .${layout.root}`);
}

await writeFile(dataPath, `${JSON.stringify(pages, null, 2)}\n`);
