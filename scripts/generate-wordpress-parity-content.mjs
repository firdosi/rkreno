import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { finalReviewRoutes, taxonomyRoutes } from './lib/final-review-routes.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceFile = path.join(root, 'src', 'data', 'site-pages.json');
const outputFile = path.join(root, 'src', 'data', 'wordpress-parity-content.json');
const retainedRoutes = new Set(finalReviewRoutes.map(({ route }) => route));
const excludedNativeRoutes = new Set(['/faq/', '/blog/', '/thank-you/', ...taxonomyRoutes]);

const normalize = (value = '') => value.replace(/\s+/g, ' ').trim();
const noise = /^(?:tags?|share|previous post|newer post|no comments?|leave a reply|related posts?|search)\s*:?\s*$/i;
const sourceDerivedFallbacks = {
  '/servis-aircond-murah-kl/': [
    '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
    '/assets/media/owner/rk-reno-aircond-unit-trunking-960.webp',
  ],
  '/aircond-installation-kl/': [
    '/assets/media/721430356-1623451745783563-6720154604310865920-n-b6c68602.jpg',
    '/assets/media/owner/rk-reno-aircond-outdoor-condenser-720.webp',
  ],
  '/upah-pasang-aircond-selangor/': [
    '/assets/media/721430356-1623451745783563-6720154604310865920-n-b6c68602.jpg',
    '/assets/media/owner/rk-reno-aircond-outdoor-condenser-720.webp',
  ],
  '/electrical-services-selangor/': [
    '/assets/media/Construction-workers-discussing-renovation-plans-092133b6.jpg',
    '/assets/media/Renovation-planning-and-project-drawings-6cfdb2fc.jpg',
  ],
  '/house-renovation-in-kuala-lumpur/': [
    '/assets/media/Home-renovation-service-in-KL-422b205c.jpg',
    '/assets/media/Renovation-planning-and-project-drawings-1-ea76b170.jpg',
  ],
  '/house-renovation-in-selangor/': [
    '/assets/media/Modern-building-renovation-and-property-improvement-b1ec6039.jpg',
    '/assets/media/Renovation-planning-and-project-drawings-6cfdb2fc.jpg',
  ],
  '/home-renovation-contractor-in-subang-jaya/': [
    '/assets/media/Renovation-planning-and-project-drawings-6cfdb2fc.jpg',
  ],
  '/office-renovation-in-kuala-lumpur/': [
    '/assets/media/Office-renovation-service-in-Selangor-7928d19d.jpg',
    '/assets/media/Renovation-contractor-for-commercial-buildings-93583952.jpg',
  ],
  '/waterproofing-contractor-kuala-lumpur/': [
    '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg',
  ],
  '/plaster-ceiling-contractor-kl/': [
    '/assets/media/Plaster-ceiling-and-aircond-installation-dd789b38.jpg',
    '/assets/media/Modern-building-renovation-and-property-improvement-b1ec6039.jpg',
    '/assets/media/Home-renovation-service-in-KL-422b205c.jpg',
  ],
};

function normalizeHref(href = '') {
  if (!href || href.startsWith('#')) return href;
  if (/^(?:tel:|mailto:|https:\/\/wa\.me\/)/i.test(href)) return href;
  try {
    const url = new URL(href, 'https://rkrenosolution.com/');
    if (url.origin !== 'https://rkrenosolution.com') return href;
    const route = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
    return retainedRoutes.has(route) ? `${route}${url.hash}` : url.href;
  } catch {
    return '';
  }
}

function sanitizeInline($, element) {
  const wrapper = load(`<main>${$.html(element)}</main>`);
  wrapper('script,style,svg,img,iframe,button,input').remove();
  wrapper('a').each((_, link) => {
    const href = normalizeHref(wrapper(link).attr('href'));
    if (!href) wrapper(link).replaceWith(wrapper(link).text());
    else {
      const text = normalize(wrapper(link).text());
      wrapper(link).replaceWith(`<a href="${href}">${text}</a>`);
    }
  });
  wrapper('strong,b').each((_, node) => wrapper(node).replaceWith(`<strong>${normalize(wrapper(node).text())}</strong>`));
  wrapper('em,i').each((_, node) => wrapper(node).replaceWith(`<em>${normalize(wrapper(node).text())}</em>`));
  wrapper('br').replaceWith('<br>');
  wrapper('main div,main span,main small').each((_, node) => wrapper(node).replaceWith(wrapper(node).html() || wrapper(node).text()));
  const root = wrapper('main').children().first();
  return normalize(root.html() || root.text());
}

function localImageFor(page, source, sourceAlt = '', fallbackIndex = 0) {
  if (!source) return null;
  if (source.startsWith('/assets/')) {
    return { src: source.split('?')[0], alt: normalize(sourceAlt) || 'General RK Reno service imagery' };
  }
  const cleanSource = new URL(source.split('?')[0], 'https://rkrenosolution.com/').href;
  const match = page.images?.find((image) => image.source?.split('?')[0] === cleanSource);
  if (!match?.local?.startsWith('/assets/')) {
    const fallback = sourceDerivedFallbacks[page.path]?.[fallbackIndex];
    return fallback ? { src: fallback, alt: normalize(sourceAlt) || 'Source-derived service imagery' } : null;
  }
  return { src: match.local, alt: normalize(match.alt) || 'General RK Reno service imagery' };
}

function extractPage(page) {
  const $ = load(page.content || '');
  $('style,script,noscript,svg,iframe,nav,header,footer,.comments-area,.woocommerce,.elementor-widget-shortcode')
    .remove();
  const sections = [];
  const seen = new Set();
  let current = null;
  let skipSection = false;
  let fallbackImageIndex = 0;
  const addBlock = (block, key) => {
    if (!current || seen.has(key)) return;
    seen.add(key);
    current.blocks.push(block);
  };

  $('h1,h2,h3,h4,h5,h6,p,ul,ol,table,img,details,a,.rk-accordion-header').each((_, element) => {
    const tag = element.tagName.toLowerCase();
    const node = $(element);
    if (node.parents('h1,h2,h3,h4,h5,h6,p,ul,ol,table,details').length) return;
    const text = normalize(node.text());
    if (node.hasClass('rk-accordion-header')) {
      if (current && text) addBlock({ type: 'heading', level: 3, text }, `heading:${text.toLowerCase()}`);
      return;
    }
    if (tag === 'h1') return;
    if (tag === 'h2') {
      skipSection = !text;
      current = skipSection ? null : { title: text, blocks: [] };
      if (current && !seen.has(`section:${text.toLowerCase()}`)) {
        seen.add(`section:${text.toLowerCase()}`);
        sections.push(current);
      } else if (current) current = null;
      return;
    }
    if (!current || skipSection) return;
    if (/^h[3-6]$/.test(tag)) {
      if (!text || noise.test(text)) return;
      addBlock({ type: 'heading', level: Number(tag[1]), text }, `heading:${text.toLowerCase()}`);
      return;
    }
    if (tag === 'a') {
      const href = normalizeHref(node.attr('href'));
      if (text && href) addBlock({ type: 'link', href, text }, `link:${text.toLowerCase()}:${href}`);
      return;
    }
    if (tag === 'p') {
      if (!text || noise.test(text)) return;
      if (/faq|frequently asked|soalan lazim/i.test(current.title)) {
        const question = normalize(node.parent().prev().text());
        if (question && question !== text) {
          addBlock({ type: 'heading', level: 3, text: question }, `heading:${question.toLowerCase()}`);
        }
      }
      addBlock({ type: 'paragraph', html: sanitizeInline($, element) }, `p:${text.toLowerCase()}`);
      return;
    }
    if (tag === 'details') {
      const question = normalize(node.children('summary').first().text());
      const answerNode = node.find('p').first();
      const answer = normalize(answerNode.text());
      if (!question || !answer) return;
      addBlock({ type: 'heading', level: 3, text: question }, `heading:${question.toLowerCase()}`);
      addBlock({ type: 'paragraph', html: sanitizeInline($, answerNode[0]) }, `p:${answer.toLowerCase()}`);
      return;
    }
    if (tag === 'ul' || tag === 'ol') {
      const items = node.children('li').map((__, item) => ({
        text: normalize($(item).text()),
        html: sanitizeInline($, item),
      })).get().filter((item) => item.text.length > 2);
      if (items.length) addBlock({ type: 'list', ordered: tag === 'ol', items }, `list:${items.map((item) => item.text).join('|').toLowerCase()}`);
      return;
    }
    if (tag === 'table') {
      const rows = [];
      node.find('tr').each((__, row) => {
        const cells = $(row).find('th,td').map((___, cell) => normalize($(cell).text())).get();
        if (cells.length) rows.push(cells);
      });
      if (rows.length > 1) addBlock({ type: 'table', rows }, `table:${JSON.stringify(rows).toLowerCase()}`);
      return;
    }
    if (tag === 'img') {
      const image = localImageFor(page, node.attr('src') || node.attr('data-src'), node.attr('alt'), fallbackImageIndex);
      if (!image) return;
      if (!page.images?.some((item) => item.local === image.src)) fallbackImageIndex += 1;
      addBlock({ type: 'image', ...image }, `image:${image.src}`);
    }
  });

  return {
    sourceCanonical: page.canonical,
    sourceH1: page.h1,
    sections,
    intentionalSafeDifferences: [
      'Visible WordPress claims are mirrored verbatim and reviewed separately from implementation parity.',
      'Raw plugin scripts and non-visible tracking markup are excluded.',
    ],
  };
}

const pages = JSON.parse(await fs.readFile(sourceFile, 'utf8'));
const output = {};
for (const route of finalReviewRoutes) {
  if (excludedNativeRoutes.has(route.route)) continue;
  const page = pages.find((entry) => entry.path === route.route && entry.status === 200);
  if (!page) continue;
  output[route.route] = extractPage(page);
}
await fs.writeFile(outputFile, JSON.stringify(output, null, 2) + '\n');
console.log(`Generated safe native parity content for ${Object.keys(output).length} routes.`);
