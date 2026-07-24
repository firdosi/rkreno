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
const unsafeHeading = /testimonial|customer feedback|clients say|success stor|pricing|price list|cost guide|warrant|guarantee|rating|certified|licensed|career|newsletter/i;
const unsafeText = /(?:\b24\s*\/\s*7\b|\b\d{2,}\+?\s+(?:years|projects|customers|clients|services)\b|100\s*%\s*(?:compliant|pricing|transparent|durable|safety|satisfaction|puas)|\b\d+(?:\.\d+)?\s*\/\s*5\b|\bguaranteed?\b|\bwarranty\b|\bcertified\b|\blicensed\b|\byears? of experience\b)/i;
const exactPrice = /\bRM\s*[\d,]+|\bRM\s*\d+\s*[-–]\s*RM|\bper\s+(?:sq\.?\s*ft|square foot|point)\b/i;
const noise = /^(?:tags?|share|previous post|newer post|no comments?|leave a reply|related posts?|search)\s*:?\s*$/i;
const ownerAircondImages = [
  { src: '/assets/media/owner/rk-reno-wall-mounted-aircond-unit-960.webp', alt: 'Owner-supplied image of a wall-mounted aircond unit' },
  { src: '/assets/media/owner/rk-reno-aircond-unit-trunking-960.webp', alt: 'Owner-supplied image of an aircond unit with trunking' },
  { src: '/assets/media/owner/rk-reno-aircond-outdoor-condenser-720.webp', alt: 'Owner-supplied image of an outdoor aircond condenser unit' },
];

function normalizeHref(href = '') {
  if (!href || href.startsWith('#')) return href;
  if (/^(?:tel:|mailto:|https:\/\/wa\.me\/)/i.test(href)) return href;
  try {
    const url = new URL(href, 'https://rkrenosolution.com/');
    if (url.origin !== 'https://rkrenosolution.com') return '';
    const route = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
    return retainedRoutes.has(route) ? route : '';
  } catch {
    return '';
  }
}

function sanitizeInline($, element) {
  const wrapper = load(`<div>${$.html(element)}</div>`);
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
  wrapper('div,span,small').each((_, node) => wrapper(node).replaceWith(wrapper(node).html() || wrapper(node).text()));
  return normalize(wrapper('div').first().html() || wrapper.text());
}

function localImageFor(page, source, sourceAlt = '') {
  if (!source) return null;
  if (source.startsWith('/assets/')) {
    if (/avatar|avartar|logo|icon|bg-/i.test(source)) return null;
    return { src: source.split('?')[0], alt: normalize(sourceAlt) || 'General RK Reno service imagery' };
  }
  const cleanSource = new URL(source.split('?')[0], 'https://rkrenosolution.com/').href;
  const match = page.images?.find((image) => image.source?.split('?')[0] === cleanSource);
  if (!match?.local?.startsWith('/assets/')) return null;
  if (/avatar|avartar|logo|icon|bg-/i.test(match.local)) return null;
  return { src: match.local, alt: normalize(match.alt) || 'General RK Reno service imagery' };
}

function extractPage(page) {
  const $ = load(page.content || '');
  $('style,script,noscript,svg,iframe,form,nav,header,footer,.comments-area,.woocommerce,.elementor-widget-shortcode')
    .remove();
  $('[class*="testimonial"],[class*="counter"],[class*="rating"],[class*="newsletter"],[class*="career"]')
    .remove();
  const sections = [];
  const seen = new Set();
  let current = null;
  let skipSection = false;
  let imagesUsed = 0;
  const addBlock = (block, key) => {
    if (!current || seen.has(key)) return;
    seen.add(key);
    current.blocks.push(block);
  };

  $('h1,h2,h3,h4,p,ul,ol,table,img,details').each((_, element) => {
    const tag = element.tagName.toLowerCase();
    const node = $(element);
    if (node.parents('h1,h2,h3,h4,p,ul,ol,table,details').length) return;
    const text = normalize(node.text());
    if (tag === 'h1') return;
    if (tag === 'h2') {
      skipSection = !text || unsafeHeading.test(text);
      current = skipSection ? null : { title: text, blocks: [] };
      if (current && !seen.has(`section:${text.toLowerCase()}`)) {
        seen.add(`section:${text.toLowerCase()}`);
        sections.push(current);
      } else if (current) current = null;
      return;
    }
    if (!current || skipSection) return;
    if (tag === 'h3' || tag === 'h4') {
      if (!text || unsafeHeading.test(text) || noise.test(text)) return;
      addBlock({ type: 'heading', level: tag === 'h3' ? 3 : 4, text }, `heading:${text.toLowerCase()}`);
      return;
    }
    if (tag === 'p') {
      if (text.length < 24 || noise.test(text) || unsafeText.test(text) || exactPrice.test(text)) return;
      addBlock({ type: 'paragraph', html: sanitizeInline($, element) }, `p:${text.toLowerCase()}`);
      return;
    }
    if (tag === 'details') {
      const question = normalize(node.children('summary').first().text());
      const answerNode = node.find('p').first();
      const answer = normalize(answerNode.text());
      if (!question || !answer || unsafeText.test(answer) || exactPrice.test(`${question} ${answer}`)) return;
      addBlock({ type: 'heading', level: 3, text: question }, `heading:${question.toLowerCase()}`);
      addBlock({ type: 'paragraph', html: sanitizeInline($, answerNode[0]) }, `p:${answer.toLowerCase()}`);
      return;
    }
    if (tag === 'ul' || tag === 'ol') {
      const items = node.children('li').map((__, item) => normalize($(item).text())).get()
        .filter((item) => item.length > 2 && !unsafeText.test(item) && !exactPrice.test(item));
      if (items.length) addBlock({ type: 'list', ordered: tag === 'ol', items }, `list:${items.join('|').toLowerCase()}`);
      return;
    }
    if (tag === 'table') {
      const rows = [];
      node.find('tr').each((__, row) => {
        const cells = $(row).find('th,td').map((___, cell) => normalize($(cell).text())).get();
        if (cells.length && !cells.some((cell) => exactPrice.test(cell))) rows.push(cells);
      });
      if (rows.length > 1) addBlock({ type: 'table', rows }, `table:${JSON.stringify(rows).toLowerCase()}`);
      return;
    }
    if (tag === 'img' && imagesUsed < 4) {
      const ownerImage = /aircond|pasang-aircond/.test(page.path)
        ? ownerAircondImages[imagesUsed % ownerAircondImages.length]
        : null;
      const image = ownerImage || localImageFor(page, node.attr('src') || node.attr('data-src'), node.attr('alt'));
      if (!image) return;
      imagesUsed += 1;
      addBlock({ type: 'image', ...image }, `image:${image.src}`);
    }
  });

  return {
    sourceCanonical: page.canonical,
    sourceH1: page.h1,
    sections: sections.filter(({ blocks }) => blocks.length),
    intentionalSafeDifferences: [
      'Unsupported counters, testimonials, ratings, guarantees, warranties and exact pricing are excluded.',
      'Raw Elementor wrappers, plugin markup, comments, ecommerce and newsletter content are excluded.',
      'Approved owner-supplied aircond imagery remains in place where already selected.',
      'Only locally available, relevant WordPress images are eligible for supporting content.',
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
