import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const registry = JSON.parse(await readFile(path.join(root, 'config/final-route-registry.json'), 'utf8'));
const sitePages = JSON.parse(await readFile(path.join(root, 'src/data/site-pages.json'), 'utf8'));
const routes = registry.publicRoutes.filter((route) => route.indexability === 'index');
const cacheDir = path.join(root, '.audit-cache/correction/live-wordpress');
await mkdir(cacheDir, { recursive: true });

const clean = (value = '') => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const absolute = (value, url) => {
  try { return new URL(value, url).href; } catch { return value || ''; }
};
const hash = (value) => createHash('sha256').update(value).digest('hex');
const json = (value) => { try { return JSON.parse(value); } catch { return null; } };

function contentRoot($) {
  for (const selector of [
    '[data-elementor-type="wp-page"]',
    '[data-elementor-type="single-post"]',
    '[data-elementor-type="single-page"]',
    'main', '#primary', '.site-content',
  ]) {
    const candidate = $(selector).first();
    if (candidate.length && clean(candidate.text()).length > 80) return candidate;
  }
  return $('body');
}

function values($, rootNode, selector, mapper = (node) => clean($(node).text())) {
  return rootNode.find(selector).toArray().map(mapper).filter((value) => {
    if (typeof value === 'string') return Boolean(value);
    return Boolean(value && Object.values(value).some(Boolean));
  });
}

function orderedBlocks($, rootNode, sourceUrl) {
  const blocks = [];
  const seenImages = new Set();
  const selector = 'h1,h2,h3,h4,h5,h6,p,ul,ol,table,blockquote,details,img,form,a';
  for (const node of rootNode.find(selector).toArray()) {
    const element = $(node);
    if (element.parents('header,footer,nav,.comments-area,#respond').length) continue;
    if (element.is('p') && element.parents('li,blockquote,details').length) continue;
    if (element.is('ul,ol') && element.parents('ul,ol').length) continue;
    if (element.is('img') && element.parents('picture').length && element.prevAll('img').length) continue;
    if (element.is('a') && (element.parents('h1,h2,h3,h4,h5,h6,p,li,table,blockquote,details').length || element.find('img').length)) continue;
    if (element.is('a') && !clean(element.text())) continue;
    if (element.is('form')) {
      blocks.push({
        type: 'form',
        labels: element.find('label').toArray().map((label) => clean($(label).text())).filter(Boolean),
        fields: element.find('input,select,textarea').toArray().map((field) => ({
          type: $(field).attr('type') || field.tagName,
          name: $(field).attr('name') || '',
          placeholder: $(field).attr('placeholder') || '',
        })),
      });
    } else if (/^h[1-6]$/.test(node.tagName)) {
      blocks.push({ type: 'heading', level: Number(node.tagName.slice(1)), text: clean(element.text()), html: element.html() || '' });
    } else if (node.tagName === 'p' || node.tagName === 'blockquote') {
      blocks.push({ type: node.tagName, text: clean(element.text()), html: element.html() || '' });
    } else if (node.tagName === 'ul' || node.tagName === 'ol') {
      blocks.push({ type: 'list', ordered: node.tagName === 'ol', items: element.children('li').toArray().map((item) => clean($(item).text())).filter(Boolean), html: element.html() || '' });
    } else if (node.tagName === 'table') {
      blocks.push({ type: 'table', rows: element.find('tr').toArray().map((row) => $(row).find('th,td').toArray().map((cell) => clean($(cell).text()))), html: element.html() || '' });
    } else if (node.tagName === 'details') {
      blocks.push({ type: 'details', summary: clean(element.find('summary').first().text()), text: clean(element.clone().find('summary').remove().end().text()) });
    } else if (node.tagName === 'img') {
      const src = absolute(element.attr('data-src') || element.attr('src'), sourceUrl);
      const key = src.replace(/[?#].*$/, '');
      if (seenImages.has(key)) continue;
      seenImages.add(key);
      blocks.push({ type: 'image', src, alt: element.attr('alt') || '' });
    } else if (node.tagName === 'a') {
      blocks.push({ type: 'link', href: absolute(element.attr('href'), sourceUrl), text: clean(element.text()) });
    }
  }
  return blocks.filter((block) => block.type === 'image' || block.type === 'form' || block.rows?.length || block.items?.length || block.text || block.summary);
}

function extract(html, route) {
  const $ = load(html);
  const rootNode = contentRoot($).clone();
  rootNode.find('script,style,noscript,iframe,template,header,footer,[data-elementor-type="header"],[data-elementor-type="footer"],.comments-area,#respond').remove();
  const sourceUrl = route.sourceUrl;
  const headings = values($, rootNode, 'h1,h2,h3,h4,h5,h6', (node) => ({
    level: Number(node.tagName.slice(1)), text: clean($(node).text()),
  }));
  const paragraphs = values($, rootNode, 'p');
  const lists = values($, rootNode, 'ul,ol', (node) => ({
    ordered: node.tagName === 'ol',
    items: $(node).children('li').toArray().map((item) => clean($(item).text())).filter(Boolean),
  })).filter((list) => list.items.length);
  const tables = values($, rootNode, 'table', (node) => ({
    rows: $(node).find('tr').toArray().map((row) => $(row).find('th,td').toArray().map((cell) => clean($(cell).text()))),
  })).filter((table) => table.rows.length);
  const images = values($, rootNode, 'img', (node) => ({
    src: absolute($(node).attr('data-src') || $(node).attr('src'), sourceUrl),
    alt: $(node).attr('alt') || '',
    width: Number($(node).attr('width')) || null,
    height: Number($(node).attr('height')) || null,
  })).filter((image, index, all) => image.src && all.findIndex((candidate) => candidate.src.replace(/[?#].*$/, '') === image.src.replace(/[?#].*$/, '')) === index);
  const links = values($, rootNode, 'a[href]', (node) => ({
    href: absolute($(node).attr('href'), sourceUrl), text: clean($(node).text()),
  }));
  const internalLinks = links.filter((link) => {
    try { return new URL(link.href).origin === new URL(sourceUrl).origin; } catch { return false; }
  });
  const forms = values($, rootNode, 'form', (node) => ({
    labels: $(node).find('label').toArray().map((label) => clean($(label).text())).filter(Boolean),
    fields: $(node).find('input,select,textarea').toArray().map((field) => ({
      type: $(field).attr('type') || field.tagName,
      name: $(field).attr('name') || '',
      placeholder: $(field).attr('placeholder') || '',
    })),
  }));
  const faqs = values($, rootNode, 'details', (node) => ({
    question: clean($(node).find('summary').first().text()),
    answer: clean($(node).clone().find('summary').remove().end().text()),
  })).filter((faq) => faq.question && faq.answer);
  const pricing = [...paragraphs, ...lists.flatMap((list) => list.items), ...tables.flatMap((table) => table.rows.flat())]
    .filter((text, index, all) => /\bRM\s*\d|\bprice|\bpricing|\bcost|\bharga|\bupah/i.test(text) && all.indexOf(text) === index);
  const ctas = links.filter((link) => /whatsapp|quote|contact|book|consult|call|enquir|hubungi|sebut harga/i.test(link.text));
  const bodyText = clean(rootNode.text());
  return {
    sourceStatus: 200,
    sourceUrl,
    seo: {
      title: clean($('title').first().text()),
      description: $('meta[name="description"]').attr('content') || '',
      canonical: absolute($('link[rel="canonical"]').attr('href') || sourceUrl, sourceUrl),
      robots: $('meta[name="robots"]').attr('content') || '',
      openGraph: Object.fromEntries($('meta[property^="og:"]').toArray().map((node) => [$(node).attr('property').slice(3), $(node).attr('content') || ''])),
      article: Object.fromEntries($('meta[property^="article:"]').toArray().map((node) => [$(node).attr('property').slice(8), $(node).attr('content') || ''])),
      twitter: Object.fromEntries($('meta[name^="twitter:"]').toArray().map((node) => [$(node).attr('name').slice(8), $(node).attr('content') || ''])),
      jsonLd: $('script[type="application/ld+json"]').toArray().map((node) => json($(node).html() || '')).filter(Boolean),
    },
    content: {
      h1: clean($('h1').first().text()),
      orderedBlocks: orderedBlocks($, rootNode, sourceUrl),
      headings, paragraphs, lists, tables, pricing, faqs, images, internalLinks, ctas, forms,
      sectionOrder: headings.map((heading) => heading.text),
      published: $('meta[property="article:published_time"]').attr('content') || '',
      modified: $('meta[property="article:modified_time"]').attr('content') || '',
      dates: [...new Set([$('meta[property="article:published_time"]').attr('content'), $('meta[property="article:modified_time"]').attr('content')].filter(Boolean))],
      author: clean(rootNode.find('[rel="author"],.author,.post-author').first().text()),
      categories: values($, rootNode, 'a[rel="category tag"]'),
      tags: values($, rootNode, 'a[rel="tag"]'),
      textSha256: hash(bodyText),
      textLength: bodyText.length,
    },
  };
}

async function fetchRoute(route) {
  if (!route.sourceUrl) return { route: route.path, sourceType: route.sourceType, comparisonStatus: 'NEW_PAGE' };
  const response = await fetch(route.sourceUrl, {
    redirect: 'follow', headers: { 'user-agent': 'RK-Reno-content-seo-correction/1.0' },
  });
  const html = await response.text();
  if (!response.ok) throw new Error(`${route.path}: HTTP ${response.status}`);
  await writeFile(path.join(cacheDir, `${route.path === '/' ? 'home' : route.path.replace(/^\/|\/$/g, '').replaceAll('/', '__')}.html`), html);
  return { route: route.path, sourceType: route.sourceType, comparisonStatus: 'MATCH', ...extract(html, route) };
}

const records = [];
let cursor = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (cursor < routes.length) records.push(await fetchRoute(routes[cursor++]));
}));
records.sort((a, b) => routes.findIndex((route) => route.path === a.route) - routes.findIndex((route) => route.path === b.route));

const localByRoute = new Map(sitePages.map((page) => [page.path, page]));
for (const record of records) {
  if (!record.sourceUrl) continue;
  const local = localByRoute.get(record.route);
  const localText = clean(load(local?.content || '').text());
  record.localBaseline = {
    titleMatches: local?.title === record.seo.title,
    descriptionMatches: local?.description === record.seo.description,
    canonicalMatches: local?.canonical === record.seo.canonical,
    contentTextMatches: hash(localText) === record.content.textSha256,
  };
}

const lock = {
  schemaVersion: 1,
  sourceOrigin: registry.productionOrigin,
  capturedAt: new Date().toISOString(),
  scope: { indexableRoutes: 33, wordpressRoutes: 32, ownerNewRoutes: 1 },
  records,
};
await writeFile(path.join(root, 'config/live-wordpress-content-seo-lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
console.log(`Locked ${records.filter((record) => record.sourceUrl).length} live WordPress routes and ${records.filter((record) => !record.sourceUrl).length} owner-new route.`);
