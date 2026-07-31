import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const clean = (value = '') => value.replace(/\s+/g, ' ').trim();
const key = (value = '') => clean(value).toLowerCase();
const htmlFile = (root, route) => route === '/' ? path.join(root, 'dist/index.html') : path.join(root, 'dist', route.slice(1), 'index.html');
const normalizeHref = (href = '') => {
  if (/^(?:mailto:|tel:|https?:\/\/wa\.me)/i.test(href)) return href;
  try {
    const parsed = new URL(href, 'https://rkrenosolution.com/');
    return (parsed.pathname.replace(/^\/rkreno(?=\/|$)/, '') || '/').replace(/([^/])$/, '$1/');
  } catch { return href; }
};

export async function validatePrompt2(root) {
  const requirements = JSON.parse(await readFile(path.join(root, 'config/prompt-2-content-requirements.json'), 'utf8'));
  const errors = [];
  const results = [];
  for (const requirement of requirements.routes) {
    const html = await readFile(htmlFile(root, requirement.route), 'utf8');
    const $ = load(html);
    const main = $('main');
    const text = key(main.text());
    const headings = main.find('h1,h2,h3,h4').toArray().map((node) => clean($(node).text()));
    const hrefs = main.find('a[href]').toArray().map((node) => normalizeHref($(node).attr('href')));
    const checks = {
      h1: main.find('h1').length === 1 && key(main.find('h1').text()) === key(requirement.requiredH1),
      headings: requirement.requiredHeadings.every((expected) => headings.some((actual) => key(actual).includes(key(expected)))),
      statements: requirement.requiredStatements.every((expected) => text.includes(key(expected))),
      lists: main.find('ul,ol').length >= requirement.minLists,
      tables: main.find('table').length >= requirement.minTables,
      faqs: main.find('details').length >= requirement.minFaqs,
      areas: requirement.pageType !== 'service' || /kuala lumpur|selangor|subang jaya|lembah klang/.test(text),
      cta: hrefs.some((href) => /^tel:|^https:\/\/wa\.me|\/contact-us\/$/.test(href)),
      links: requirement.requiredLinks.every((expected) => hrefs.includes(expected)),
      pricing: !requirement.pricing || /rm\s?[\d,]+/i.test(main.text()),
      images: main.find('img').length >= requirement.minImages,
      imageQuality: main.find('img').toArray().every((node) => {
        const image = $(node); const src = image.attr('src') || '';
        return image.attr('alt') !== undefined && image.attr('width') && image.attr('height') && !/^https?:/i.test(src);
      }),
    };
    const missing = Object.entries(checks).filter(([, pass]) => !pass).map(([name]) => name);
    const status = missing.length ? 'MISSING_CONTENT' : requirement.sourceStatus;
    if (missing.length) errors.push(`${requirement.route}: ${missing.join(', ')}`);
    results.push({
      route: requirement.route, pageType: requirement.pageType, sourceStatus: requirement.sourceStatus,
      status, missing, checks,
      evidence: { headings: headings.length, lists: main.find('ul,ol').length, tables: main.find('table').length, faqs: main.find('details').length, images: main.find('img').length, internalLinks: hrefs.filter((href) => href.startsWith('/')).length },
    });
  }
  return { errors, results, routes: requirements.routes.map((item) => item.route), complete: results.filter((item) => item.status === 'COMPLETE').length, newPages: results.filter((item) => item.status === 'NEW_PAGE').length };
}
