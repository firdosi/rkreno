import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const origin = 'https://rkrenosolution.com';
const dataPath = path.join(process.cwd(), 'src', 'data', 'site-pages.json');
const pages = JSON.parse(await readFile(dataPath, 'utf8'));
const priorityPaths = ['/', '/services/', '/service/building-renovation/'];
const externalStyles = [
  'https://rkrenosolution.com/wp-content/uploads/elementor/css/custom-frontend.min.css?ver=1782812196',
  'https://rkrenosolution.com/wp-content/themes/vastcon/assets/css/grid.css?ver=1.0.1',
  'https://rkrenosolution.com/wp-content/themes/vastcon/assets/css/style.css?ver=1.0.1',
  'https://rkrenosolution.com/wp-content/themes/vastcon/style.css?ver=1.0.1',
  'https://rkrenosolution.com/wp-content/plugins/elementor/assets/lib/font-awesome/css/all.min.css?ver=5.15.3',
];
const pageTitleAsset = new URL('/wp-content/uploads/2025/01/pagtitle1.webp', origin);
const mediaDirectory = path.join(process.cwd(), 'public', 'assets', 'media');

const media = new Map();
for (const page of pages) {
  for (const image of page.images || []) {
    if (image.source && image.local?.startsWith('/assets/')) {
      media.set(new URL(image.source, origin).href, image.local);
    }
  }
}

await mkdir(mediaDirectory, { recursive: true });
const pageTitleResponse = await fetch(pageTitleAsset);
if (!pageTitleResponse.ok) throw new Error(`${pageTitleResponse.status} for ${pageTitleAsset}`);
await writeFile(
  path.join(mediaDirectory, 'pagtitle1.webp'),
  Buffer.from(await pageTitleResponse.arrayBuffer()),
);

for (const pathname of priorityPaths) {
  const record = pages.find((page) => page.path === pathname);
  if (!record) throw new Error(`Missing page data for ${pathname}`);
  const response = await fetch(new URL(pathname, origin), {
    headers: { 'user-agent': 'RK-Reno-static-theme-refresh/1.0' },
  });
  if (!response.ok) throw new Error(`${response.status} for ${pathname}`);
  const $ = load(await response.text());
  const source = $('main#pxl-content-main').first();
  if (!source.length) throw new Error(`Missing main#pxl-content-main on ${pathname}`);
  const inlineStyles = $('style')
    .map((_, element) => $(element).html() || '')
    .get()
    .filter((css) => css.trim())
    .join('\n');

  const fragment = load(`<main>${source.html()}</main>`);
  const root = fragment('main');
  root.find('script,noscript,iframe,form,header,footer').remove();
  root.find('.elementor-invisible').removeClass('elementor-invisible');
  root.find('[class*="wow"],[data-wow-delay]').each((_, element) => {
    const node = fragment(element);
    const names = (node.attr('class') || '')
      .split(/\s+/)
      .filter((name) => name && !/^(wow|animated|fadeIn|fadeInUp|fadeInRight|fadeInLeft|zoomIn)$/i.test(name));
    node.attr('class', names.join(' ')).removeAttr('data-wow-delay');
  });

  root.find('img').each((_, element) => {
    const image = fragment(element);
    const raw = image.attr('data-src') || image.attr('src');
    if (!raw) return image.remove();
    const absolute = new URL(raw, origin).href;
    const local = media.get(absolute);
    if (local) image.attr('src', local);
    image.removeAttr('srcset').removeAttr('sizes').removeAttr('data-src').removeAttr('loading');
  });
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

  record.content = `<style>${inlineStyles}</style>${root.html()}`;
  record.customLayout = true;
  record.externalStyles = externalStyles;
  console.log(`Refreshed theme layout for ${pathname}`);
}

await writeFile(dataPath, `${JSON.stringify(pages, null, 2)}\n`);
