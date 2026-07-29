import { load } from 'cheerio';

export const cleanText = (value = '') => String(value)
  .replace(/&nbsp;/gi, ' ')
  .replace(/\u00a0/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const normalizedUrl = (value = '') => {
  const raw = cleanText(value);
  if (!raw || /^(?:mailto:|tel:|javascript:|#)/i.test(raw)) return raw;
  try {
    const url = new URL(raw, 'https://rkrenosolution.com/');
    const pathname = decodeURIComponent(url.pathname)
      .replace(/^\/rkreno(?=\/|$)/, '') || '/';
    const trailing = pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`;
    return `${trailing}${url.search}${url.hash}`;
  } catch {
    return decodeURIComponent(raw).replace(/^\/rkreno(?=\/|$)/, '');
  }
};

const imageSource = (value = '') => {
  if (!value) return '';
  try {
    return decodeURIComponent(new URL(value, 'https://rkrenosolution.com/').pathname)
      .replace(/^\/rkreno(?=\/|$)/, '');
  } catch {
    return decodeURIComponent(value).replace(/^\/rkreno(?=\/|$)/, '');
  }
};

const textItems = ($, scope, selector) => scope.find(selector)
  .map((_, node) => cleanText($(node).text())).get().filter(Boolean);
const links = ($, scope, selector = 'a[href]') => scope.find(selector)
  .map((_, node) => ({
    text: cleanText($(node).text()),
    destination: normalizedUrl($(node).attr('href') || ''),
  })).get().filter(({ text, destination }) => text && destination && destination !== '#');
const images = ($, scope) => scope.find('img[src],source[srcset]')
  .map((_, node) => imageSource($(node).attr('src') || ($(node).attr('srcset') || '').split(/\s+/)[0]))
  .get().filter(Boolean);
const backgrounds = ($, scope) => scope.find('[style*="background"],[data-source-background]')
  .map((_, node) => {
    const explicit = $(node).attr('data-source-background');
    const match = ($(node).attr('style') || '').match(/url\((['"]?)(.*?)\1\)/i);
    return imageSource(explicit || match?.[2] || '');
  }).get().filter(Boolean);
const tableInventory = ($, scope) => scope.find('table').map((_, table) => ({
  rows: $(table).find('tr').map((__, row) => $(row).find('th,td')
    .map((___, cell) => cleanText($(cell).text())).get()).get(),
})).get();
const formInventory = ($, scope) => scope.find('form').map((_, form) => ({
  action: normalizedUrl($(form).attr('action') || ''),
  method: cleanText($(form).attr('method') || 'get').toLowerCase(),
  labels: textItems($, $(form), 'label'),
  fields: $(form).find('input,select,textarea,button[type="submit"]').map((__, field) => ({
    element: field.tagName,
    type: cleanText($(field).attr('type') || ''),
    name: cleanText($(field).attr('name') || ''),
    label: cleanText($(field).attr('aria-label') || $(field).attr('placeholder') || ''),
  })).get(),
})).get();
const itemText = ($, scope, selector) => scope.find(selector)
  .map((_, node) => cleanText($(node).text())).get().filter(Boolean);

export function inventoryHtml(html, { route = '', origin = 'astro' } = {}) {
  const $ = load(html || '');
  const body = $('body').length ? $('body').first() : $.root();
  const main = body.find('main').first().length ? body.find('main').first() : body;
  const header = body.find('header').first();
  const footer = body.find('footer').last();
  const orderedHeadings = main.find('h1,h2,h3,h4,h5,h6,summary').map((_, node) => ({
    level: node.tagName === 'summary' ? 'summary' : node.tagName,
    text: cleanText($(node).text()),
  })).get().filter(({ text }) => text);
  const tables = tableInventory($, main);
  const forms = formInventory($, main);
  const allLinks = links($, main);
  const orderedSections = main.find('section,article,.elementor-section,[data-section]')
    .map((_, node) => {
      const section = $(node);
      return {
        heading: cleanText(section.find('h1,h2,h3,h4,h5,h6').first().text()),
        text: cleanText(section.clone().find('script,style,noscript').remove().end().text()),
      };
    }).get().filter(({ heading, text }) => heading || text);
  return {
    schemaVersion: 1,
    route,
    origin,
    pageHero: cleanText(main.find('h1').first().text()),
    breadcrumb: itemText($, main, '[aria-label*="breadcrumb" i] a,[aria-label*="breadcrumb" i] span,.breadcrumb a,.breadcrumb span'),
    orderedSections,
    orderedHeadings,
    orderedParagraphs: textItems($, main, 'p'),
    orderedLists: main.find('ul,ol').map((_, list) => ({
      type: list.tagName,
      items: $(list).children('li').map((__, item) => cleanText($(item).text())).get().filter(Boolean),
    })).get(),
    tables,
    tableText: tables.flatMap(({ rows }) => rows.flat()),
    figures: itemText($, main, 'figure figcaption'),
    imageSources: images($, main),
    imageAltText: main.find('img').map((_, node) => cleanText($(node).attr('alt') || '')).get(),
    backgroundImages: backgrounds($, main),
    buttons: itemText($, main, 'button,input[type="submit"],a[role="button"],.btn,.button'),
    buttonDestinations: links($, main, 'a[role="button"][href],a.btn[href],a.button[href]'),
    internalLinks: allLinks.filter(({ destination }) => destination.startsWith('/')),
    externalLinks: allLinks.filter(({ destination }) => /^(?:https?:)?\/\//i.test(destination)),
    forms,
    formLabels: forms.flatMap(({ labels }) => labels),
    formFields: forms.flatMap(({ fields }) => fields),
    accordions: itemText($, main, 'details,[data-accordion-item],.accordion-item'),
    accordionQuestions: itemText($, main, 'summary,[data-accordion-question],.accordion-title'),
    accordionAnswers: itemText($, main, 'details > :not(summary),[data-accordion-answer],.accordion-content'),
    cards: itemText($, main, 'article,.card,[data-card]'),
    cardTitles: itemText($, main, 'article h2,article h3,.card h2,.card h3,[data-card] h2,[data-card] h3'),
    cardLinks: links($, main, 'article a[href],.card a[href],[data-card] a[href]'),
    sidebarWidgets: itemText($, main, 'aside > *,[data-sidebar] > *,.widget'),
    pagination: links($, main, '[aria-label*="pagination" i] a[href],.pagination a[href]'),
    carouselItems: itemText($, main, '[data-carousel-item],.swiper-slide,.slick-slide,[data-testimonial-track] article'),
    carouselControls: itemText($, main, '[data-carousel-control],.swiper-button-next,.swiper-button-prev,.slick-arrow,[data-testimonial-next],[data-testimonial-prev]'),
    counters: itemText($, main, '[data-counter],.counter'),
    testimonials: itemText($, main, '[data-testimonial],.testimonial,[data-testimonial-track] article'),
    projectItems: itemText($, main, '[data-project-categories],.project-item'),
    teamItems: itemText($, main, '[data-team-item],.team-item,.team-member'),
    headerItems: [...textItems($, header, 'a,button,span').filter(Boolean)],
    footerItems: [...textItems($, footer, 'a,button,p,h1,h2,h3,h4,h5,h6,li').filter(Boolean)],
    floatingActions: links($, body, '[class*="floating"] a[href],[class*="whatsapp"] a[href],[class*="phone"] a[href],a[href^="tel:"],a[href*="wa.me"]'),
  };
}

// Kept for existing callers, now without deduplication or containment matching.
export const sourceSemantics = (page) => inventoryHtml(page?.content || '', {
  route: page?.path || '',
  origin: 'wordpress-source',
});
export const astroSemantics = (html) => inventoryHtml(html, { origin: 'astro' });
