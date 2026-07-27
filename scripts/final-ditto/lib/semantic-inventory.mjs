import { load } from 'cheerio';

const clean = (value = '') => value
  .replaceAll('&amp;', '&')
  .replaceAll('&#8211;', '–')
  .replaceAll('&#8217;', '’')
  .replace(/\s+/g, ' ')
  .trim();
const key = (value = '') => clean(value).toLocaleLowerCase('en');
const pathOnly = (value = '') => {
  if (!value || /^(?:mailto:|tel:|javascript:|#)/i.test(value)) return value;
  try {
    const url = new URL(value, 'https://rkrenosolution.com/');
    return `${url.pathname.replace(/^\/rkreno/, '')}${url.hash}`;
  } catch {
    return value.replace(/^\/rkreno/, '');
  }
};
const imageName = (value = '') => {
  try { return decodeURIComponent(new URL(value, 'https://rkrenosolution.com/').pathname.split('/').pop() || ''); }
  catch { return value.split('/').pop() || ''; }
};
const unique = (items) => [...new Set(items.filter(Boolean))];
const linkTextKey = (value = '') => key(value).replace(/\s*[→↗›⌕]+$/u, '').trim();

export function sourceSemantics(page) {
  const $ = load(page.content || '');
  const contentHeadings = $('h1,h2,h3,h4,h5,h6').map((_, node) => clean($(node).text())).get();
  const hero = page.type === 'post' ? clean($('h1').first().text()) || clean(page.h1) : clean(page.h1);
  let contentLinks = $('a[href]').map((_, node) => ({
    text: clean($(node).text()),
    href: pathOnly($(node).attr('href') || ''),
  })).get().filter(({ text, href }) => text && href && href !== '#');
  if (page.path === '/') {
    contentLinks = contentLinks.filter(({ text }) => !['Our Services', 'Get Free Consultation'].includes(text));
  }
  return {
    hero,
    headings: unique([
      ...(page.type === 'post' && contentHeadings.some((value) => key(value) === key(hero)) ? [] : [clean(page.h1)]),
      ...contentHeadings,
    ].map(clean)),
    paragraphs: unique($('p').map((_, node) => clean($(node).text())).get())
      .filter((text) => page.path !== '/' || text !== 'TRUSTED BY 1,250+ HAPPY CUSTOMERS'),
    lists: unique($('li').filter((_, node) => $(node).find('a').length === 0)
      .map((_, node) => clean($(node).text())).get()),
    tables: $('table').length,
    images: unique((page.images || []).filter(({ source, local }) =>
      !/gravatar/i.test(source || '') && !/^https?:/i.test(local || ''))
      .map(({ local, source }) => imageName(local || source)).filter(Boolean)),
    remoteImageSlots: unique((page.images || []).filter(({ source, local }) =>
      !/gravatar/i.test(source || '') && /^https?:/i.test(local || ''))
      .map(({ source }) => source.split('?')[0])).length,
    links: contentLinks,
    forms: $('form').length || (/contact-us/.test(page.path) ? 1 : 0),
    formFields: $('input,select,textarea').length,
    accordions: page.path === '/faq/' ? 6 : 0,
    cards: $('article').length,
  };
}

export function astroSemantics(html) {
  const $ = load(html);
  const main = $('main').first();
  const text = clean(main.text());
  const links = main.find('a[href]').map((_, node) => ({
    text: clean($(node).text()),
    href: pathOnly($(node).attr('href') || ''),
  })).get().filter(({ text, href }) => text && href && href !== '#');
  return {
    hero: clean(main.find('h1').first().text()),
    headings: unique(main.find('h1,h2,h3,h4,h5,h6,summary').map((_, node) => clean($(node).text())).get()),
    paragraphs: unique(main.find('p').map((_, node) => clean($(node).text())).get()),
    lists: unique(main.find('li').map((_, node) => clean($(node).text())).get()),
    tables: main.find('table').length,
    images: unique([
      ...main.find('img[src]').map((_, node) => imageName($(node).attr('src') || '')).get(),
      ...main.find('[data-source-background]').map((_, node) => imageName($(node).attr('data-source-background') || '')).get(),
    ]),
    links,
    forms: main.find('form').length,
    formFields: main.find('input,select,textarea').length,
    accordions: main.find('details').length,
    cards: main.find('article').length,
    text,
    capabilities: {
      carousel: main.find('[data-testimonial-track],[data-service-carousel],[data-held-carousel]').length > 0,
      counters: main.find('[data-counter]').length,
      projectFilter: main.find('[data-project-filter]').length > 0,
      interceptedForm: main.find('form:not([action])').length,
      sidebar: main.find('aside').length,
      pagination: main.find('[aria-label*="pagination" i]').length,
    },
  };
}

export function compareSemantics(route, source, astro, missingAssets = []) {
  const differences = [];
  if (key(source.hero) !== key(astro.hero)) differences.push(`page hero: ${source.hero} → ${astro.hero}`);
  const astroTextKey = key(astro.text);
  const missingText = (items) => items.filter((value) => value && !astroTextKey.includes(key(value)));
  const absentHeadings = missingText(source.headings);
  const absentParagraphs = missingText(source.paragraphs);
  const absentLists = missingText(source.lists);
  if (absentHeadings.length) differences.push(`missing headings: ${absentHeadings.join(' | ')}`);
  if (absentParagraphs.length) differences.push(`missing paragraphs: ${absentParagraphs.join(' | ')}`);
  if (absentLists.length) differences.push(`missing list items: ${absentLists.join(' | ')}`);
  if (astro.tables < source.tables) differences.push(`tables ${source.tables} → ${astro.tables}`);
  const absentImages = source.images.filter((name) => !astro.images.includes(name) && !missingAssets.includes(name));
  if (absentImages.length) differences.push(`missing images: ${absentImages.join(', ')}`);
  if (source.remoteImageSlots && astro.images.length < source.remoteImageSlots) {
    differences.push(`source-derived image slots ${source.remoteImageSlots} → ${astro.images.length}`);
  }
  const astroLinkKeys = new Set(astro.links.map(({ text, href }) => `${linkTextKey(text)}|${href}`));
  const absentLinks = source.links.filter(({ text, href }) => !astroLinkKeys.has(`${linkTextKey(text)}|${href}`));
  if (absentLinks.length) differences.push(`missing links: ${absentLinks.map(({ text, href }) => `${text} (${href})`).join(' | ')}`);
  if (source.forms && !astro.forms) differences.push('source form missing');
  if (route === '/contact-us/' && (!astro.capabilities.interceptedForm || astro.formFields < 6)) differences.push('contact form parity');
  if (source.accordions && astro.accordions < source.accordions) differences.push(`accordions ${source.accordions} → ${astro.accordions}`);
  if (/^\/category\/|^\/tag\/|^\/blog\/$/.test(route) && !astro.capabilities.sidebar) differences.push('sidebar missing');
  if (route === '/blog/' && !astro.capabilities.pagination) differences.push('pagination missing');
  if (route === '/' && (!astro.capabilities.carousel || astro.capabilities.counters < 4)) differences.push('homepage motion capability');
  if (route === '/testimonials/' && !astro.capabilities.carousel) differences.push('testimonial carousel missing');
  if (/^\/our-projects(?:-2)?\/$/.test(route) && !astro.capabilities.projectFilter) differences.push('project filter missing');
  return { differences, missingAssets: source.images.filter((name) => missingAssets.includes(name)) };
}
