import { load } from 'cheerio';

export interface SourceImage { source?: string; local?: string; alt?: string }

const routeRepairs = new Map([
  ['/about/', '/about-us/'],
  ['/tag/pemasangan-aircond/', '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/'],
  ['/tag/ceiling-works/', '/plaster-ceiling-contractor-kl/'],
  ['/tag/wiring/', '/electrical-services-selangor/'],
  ['/tag/guide/', '/blog/'],
  ['/tag/kuala-lumpur/', '/category/servis-pembersihan/'],
  ['/tag/aircond-maintenance/', '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/'],
  ['/tag/cleaning/', '/category/servis-pembersihan/'],
  ['/service/building-construction/', '/services/'],
  ['/service/architecture-design/', '/services/'],
  ['/service/flooring-roofing/', '/services/'],
  ['/service/general-contracting/', '/services/'],
  ['/service/repair-expand/', '/services/'],
]);
const repairedPath = (pathname: string) => routeRepairs.get(pathname) || pathname;

const cleanUrl = (value = '') => {
  try {
    const url = new URL(value, 'https://rkrenosolution.com');
    url.search = '';
    url.hash = '';
    return url.href;
  } catch { return value; }
};

export function createSourceMediaResolver(images: SourceImage[] = []) {
  const media = new Map(images.flatMap((image) => {
    if (!image.source || !image.local) return [];
    const local = /gravatar/i.test(image.source)
      ? '/assets/media/logo-iocn-6f17c44e.png'
      : (/^https?:/i.test(image.local) || image.local.startsWith('/wp-content/'))
        ? '/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg'
        : image.local;
    return [[cleanUrl(image.source), local], [image.source, local]];
  }));
  return (source = '') => media.get(source) || media.get(cleanUrl(source)) || '';
}

export function safeSourceHtml(html = '', base = '', wrapper = 'div') {
  const $ = load(`<${wrapper} id="source-fragment">${html}</${wrapper}>`);
  const root = $('#source-fragment');
  root.find('select,textarea').each((_, node) => $(node).replaceWith($(node).text()));
  root.find('script,style,iframe,form,input,button').remove();
  $('*').each((_, node) => {
    const element = $(node);
    for (const attribute of Object.keys(node.attribs || {})) {
      if (!['href', 'title', 'target', 'rel', 'aria-label'].includes(attribute)) element.removeAttr(attribute);
    }
  });
  $('a[href]').each((_, node) => {
    const link = $(node);
    try {
      const url = new URL(link.attr('href') || '', 'https://rkrenosolution.com');
      if (url.origin === 'https://rkrenosolution.com') link.attr('href', `${base}${repairedPath(url.pathname)}${url.hash}`);
      else link.attr('rel', 'noopener noreferrer');
    } catch { link.removeAttr('href'); }
  });
  return root.html() || '';
}

export function localRouteHref(href = '', base = '') {
  try {
    const url = new URL(href, 'https://rkrenosolution.com');
    return url.origin === 'https://rkrenosolution.com' ? `${base}${repairedPath(url.pathname)}${url.hash}` : url.href;
  } catch { return `${base}/contact-us/`; }
}
