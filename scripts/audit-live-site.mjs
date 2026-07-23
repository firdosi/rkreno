import { createHash } from 'node:crypto';
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import sharp from 'sharp';

const ORIGIN = 'https://rkrenosolution.com';
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'src', 'data');
const MEDIA_DIR = path.join(ROOT, 'public', 'assets', 'media');
const REPORT_DIR = path.join(ROOT, 'reports', 'public');
const CONCURRENCY = 6;

await Promise.all([
  mkdir(DATA_DIR, { recursive: true }),
  mkdir(MEDIA_DIR, { recursive: true }),
  mkdir(REPORT_DIR, { recursive: true })
]);

async function getText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'RK-Reno-static-migration/1.0' },
    redirect: 'follow'
  });
  return { response, text: await response.text() };
}

function xmlLocations(xml) {
  const $ = load(xml, { xmlMode: true });
  return $('loc').map((_, el) => $(el).text().trim()).get();
}

const { text: indexXml } = await getText(`${ORIGIN}/sitemap_index.xml`);
const sitemapUrls = xmlLocations(indexXml);
const discovered = new Map();

for (const sitemap of sitemapUrls) {
  const { text } = await getText(sitemap);
  for (const url of xmlLocations(text)) {
    if (!discovered.has(url)) {
      discovered.set(url, path.basename(new URL(sitemap).pathname, '.xml'));
    }
  }
}

function cleanText(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function contentRoot($) {
  const selectors = [
    '[data-elementor-type="wp-page"]',
    '[data-elementor-type="single-post"]',
    '[data-elementor-type="single-page"]',
    'main',
    '#primary',
    '.site-content'
  ];
  for (const selector of selectors) {
    const root = $(selector).first();
    if (root.length && cleanText(root.text()).length > 80) return root;
  }
  return $('body');
}

function pageType(url, sitemap) {
  if (url === `${ORIGIN}/`) return 'homepage';
  if (sitemap.includes('category') || sitemap.includes('tag')) return 'taxonomy';
  if (sitemap.includes('post')) return 'post';
  if (sitemap.includes('portfolio')) return 'portfolio';
  if (sitemap.includes('service')) return 'service';
  if (sitemap.includes('product')) return 'product';
  if (sitemap.includes('template')) return 'template';
  return 'page';
}

function extensionFor(contentType, url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('svg')) return '.svg';
  if (contentType.includes('avif')) return '.avif';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'].includes(ext) ? ext : '.jpg';
}

const mediaJobs = new Map();
const linkedUrls = new Set();
async function localizeImage(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl, ORIGIN).href;
  } catch {
    return rawUrl;
  }
  if (!url.startsWith(ORIGIN) || url.startsWith('data:')) return rawUrl;
  if (mediaJobs.has(url)) return mediaJobs.get(url);

  const job = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return rawUrl;
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) return rawUrl;
      const ext = extensionFor(contentType, url);
      const stem = path.basename(new URL(url).pathname, path.extname(new URL(url).pathname))
        .replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 55) || 'image';
      const hash = createHash('sha1').update(url).digest('hex').slice(0, 8);
      const outputName = `${stem}-${hash}${ext}`;
      const outputPath = path.join(MEDIA_DIR, outputName);
      try {
        await access(outputPath);
        return `/assets/media/${outputName}`;
      } catch {}
      const input = Buffer.from(await response.arrayBuffer());
      if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
        await sharp(input).rotate().resize({ width: 1920, withoutEnlargement: true })
          .toFormat(ext === '.jpg' || ext === '.jpeg' ? 'jpeg' : ext.slice(1), { quality: 84 })
          .toFile(outputPath);
      } else {
        await writeFile(outputPath, input);
      }
      return `/assets/media/${outputName}`;
    } catch {
      return rawUrl;
    }
  })();
  mediaJobs.set(url, job);
  return job;
}

async function auditPage([url, sitemap]) {
  try {
    const { response, text } = await getText(url);
    const $ = load(text);
    const root = contentRoot($).clone();
    root.find('script,style,noscript,iframe,link,form,.woocommerce,.comments-area').remove();
    root.find('header,footer,[data-elementor-type="header"],[data-elementor-type="footer"]').remove();

    const images = [];
    for (const el of root.find('img').toArray()) {
      const node = root.find(el);
      const source = node.attr('data-src') || node.attr('src');
      if (!source) continue;
      const localized = await localizeImage(source);
      node.attr('src', localized);
      node.removeAttr('srcset').removeAttr('sizes').removeAttr('loading');
      images.push({ source: new URL(source, url).href, local: localized, alt: node.attr('alt') || '' });
    }
    for (const el of root.find('source').toArray()) {
      const node = root.find(el);
      const source = (node.attr('srcset') || '').split(',')[0]?.trim().split(/\s+/)[0];
      if (!source) continue;
      const localized = await localizeImage(source);
      node.attr('srcset', localized);
    }

    for (const el of root.find('a').toArray()) {
      const node = root.find(el);
      const href = node.attr('href');
      if (!href) continue;
      try {
        const target = new URL(href, url);
        if (target.origin === ORIGIN) {
          if (/\.(?:jpe?g|png|webp|gif|svg|avif)$/i.test(target.pathname)) {
            node.attr('href', await localizeImage(target.href));
            continue;
          }
          node.attr('href', `${target.pathname}${target.search}${target.hash}`);
          if (!target.search && !target.pathname.startsWith('/wp-') &&
              !/\.(?:jpe?g|png|webp|gif|svg|pdf|zip)$/i.test(target.pathname)) {
            linkedUrls.add(new URL(target.pathname, ORIGIN).href);
          }
        }
      } catch {}
    }

    root.find('*').each((_, el) => {
      const node = root.find(el);
      for (const key of Object.keys(el.attribs || {})) {
        if (key === 'class' || key === 'style' || key.startsWith('data-') || key.startsWith('aria-')) {
          node.removeAttr(key);
        }
      }
    });

    const canonical = $('link[rel="canonical"]').attr('href') || url;
    const ogSource = $('meta[property="og:image"]').attr('content') || '';
    const ogImage = ogSource ? await localizeImage(ogSource) : '';
    const robots = $('meta[name="robots"]').attr('content') || 'index, follow';
    const headings = $('h1,h2,h3,h4,h5,h6').map((_, el) => ({
      level: Number(el.tagName.slice(1)),
      text: cleanText($(el).text())
    })).get();
    const schema = $('script[type="application/ld+json"]').map((_, el) => $(el).html()).get()
      .map((value) => { try { return JSON.parse(value); } catch { return null; } }).filter(Boolean);

    return {
      url,
      path: new URL(response.url).pathname,
      status: response.status,
      type: pageType(url, sitemap),
      sitemap,
      title: cleanText($('title').first().text()),
      description: $('meta[name="description"]').attr('content') || '',
      canonical,
      robots,
      h1: cleanText($('h1').first().text()),
      headings,
      og: {
        title: $('meta[property="og:title"]').attr('content') || '',
        description: $('meta[property="og:description"]').attr('content') || '',
        image: ogImage
      },
      twitter: {
        card: $('meta[name="twitter:card"]').attr('content') || '',
        title: $('meta[name="twitter:title"]').attr('content') || ''
      },
      published: $('meta[property="article:published_time"]').attr('content') || '',
      modified: $('meta[property="article:modified_time"]').attr('content') || '',
      schema,
      images,
      content: root.html() || ''
    };
  } catch (error) {
    return { url, path: new URL(url).pathname, status: 0, type: pageType(url, sitemap), sitemap, error: error.message };
  }
}

const queue = [...discovered.entries()];
const pages = [];
let cursor = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (cursor < queue.length) {
    const item = queue[cursor++];
    pages.push(await auditPage(item));
    if (pages.length % 20 === 0) console.log(`Audited ${pages.length}/${queue.length}`);
  }
}));

const auditedUrls = new Set(discovered.keys());
for (let depth = 0; depth < 4; depth++) {
  const extras = [...linkedUrls]
    .filter((url) => !auditedUrls.has(url))
    .map((url) => [url, 'internal-link']);
  if (!extras.length) break;
  extras.forEach(([url]) => auditedUrls.add(url));
  console.log(`Auditing ${extras.length} additional internal URLs (depth ${depth + 1})`);
  cursor = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < extras.length) pages.push(await auditPage(extras[cursor++]));
  }));
}
const uniquePages = new Map();
for (const page of pages) {
  const current = uniquePages.get(page.path);
  if (!current || (current.status !== 200 && page.status === 200)) uniquePages.set(page.path, page);
}
pages.length = 0;
pages.push(...uniquePages.values());
pages.sort((a, b) => a.path.localeCompare(b.path));

await writeFile(path.join(DATA_DIR, 'site-pages.json'), `${JSON.stringify(pages, null, 2)}\n`);
const inventory = pages.map(({ content, schema, ...page }) => ({ ...page, schemaCount: schema?.length || 0 }));
await writeFile(path.join(REPORT_DIR, 'url-inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`);
const healthy = pages.filter((page) => page.status === 200);
const failed = pages.filter((page) => page.status !== 200);
const report = `# RK Reno public migration audit\n\n` +
  `Generated: ${new Date().toISOString()}\n\n` +
  `- Sitemap URLs discovered: ${queue.length}\n` +
  `- Unique final paths after redirects and internal-link discovery: ${pages.length}\n` +
  `- HTTP 200 pages: ${healthy.length}\n` +
  `- Non-200 or failed pages: ${failed.length}\n` +
  `- Localized public images: ${mediaJobs.size}\n` +
  `- Pages missing a title: ${pages.filter((p) => !p.title).length}\n` +
  `- Pages missing a meta description: ${pages.filter((p) => !p.description).length}\n` +
  `- Pages missing an H1: ${pages.filter((p) => !p.h1).length}\n\n` +
  `## Non-200 URLs\n\n${failed.map((p) => `- ${p.status}: ${p.url}`).join('\n') || '- None'}\n`;
await writeFile(path.join(REPORT_DIR, 'migration-summary.md'), report);
console.log(report);
