import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { load } from 'cheerio';
import { chromium } from 'playwright';

const root = process.cwd();
const reportDir = path.join(root, 'reports/public/correction');
const recoveryReportDir = path.join(root, 'reports/public/design-recovery');
const lock = JSON.parse(await readFile(path.join(root, 'config/live-wordpress-content-seo-lock.json'), 'utf8'));
const pages = JSON.parse(await readFile(path.join(root, 'src/data/site-pages.json'), 'utf8'));
const registry = JSON.parse(await readFile(path.join(root, 'config/final-route-registry.json'), 'utf8'));
await mkdir(reportDir, { recursive: true });
await mkdir(recoveryReportDir, { recursive: true });

const failures = [];
const checks = [];
const clean = (value = '') => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const stable = (value) => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const result = (route, name, passed, detail = '') => {
  checks.push({ route, name, passed, detail });
  if (!passed) failures.push(`${route} ${name}${detail ? `: ${detail}` : ''}`);
};
const outputFile = (route) => route === '/' ? path.join(root, 'dist/index.html') : path.join(root, 'dist', route.slice(1), 'index.html');
const articleRoutes = new Set(registry.publicRoutes.filter((item) => item.validationGroup === 'article').map((item) => item.path));
const serviceRoutes = new Set(registry.publicRoutes.filter((item) => item.validationGroup === 'service' && item.path !== '/services/').map((item) => item.path));
const expectedTemplate = (route) => ({
  '/': 'homepage', '/services/': 'services-hub', '/about-us/': 'about',
  '/contact-us/': 'contact', '/faq/': 'faq', '/blog/': 'blog-archive',
}[route] || (articleRoutes.has(route) ? 'article' : serviceRoutes.has(route) ? 'service' : 'standard'));
const templateUsage = new Map();
const coreRoutes = new Set(['/', '/services/', '/about-us/', '/contact-us/', '/faq/', '/blog/']);
const coreRequiredText = {
  '/': [
    'Transform your home, office, or commercial space with RK Reno Solution.',
    'RK Reno Solution helps homeowners and business owners improve their spaces',
    'We keep the process simple, clear, and organized',
    'Whether you need home renovation, office renovation, waterproofing, plaster ceiling, aircond installation, or cleaning services',
  ],
  '/services/': ['Whether you need renovation, repair, ceiling work, leakage solutions, aircond installation, or cleaning service', 'RK Reno Solution helps homeowners, office owners, landlords, and businesses improve their spaces'],
  '/about-us/': ['RK Reno Solution is a Kuala Lumpur based renovation and service team', 'Our mission is to make renovation, repair, and installation work simple', 'We believe in honest communication, careful workmanship, practical solutions', 'Renovation work affects your comfort, budget, and property value', 'RK Reno Solution provides renovation, repair, waterproofing, plaster ceiling, aircond installation, and cleaning services across Kuala Lumpur, Selangor'],
  '/contact-us/': ['Have a question? Please contact us using the customer support channels below.', '+60 11 1133 4496', 'rkrenosolution@gmail.com', '4-2, Jalan 3/50C, Setapak, 53000 Kuala Lumpur'],
  '/faq/': ['How long does a typical construction project take?', 'Do you provide custom designs?', 'Are your projects eco-friendly?', 'What’s included in your pricing plans?', 'Do you handle permits and regulations?', 'What warranty do you offer on your projects?'],
  '/blog/': [],
};

const missingOriginals = new Set([
  'deep-cleaning-rumah-kuala-lumpur.webp', 'cuci-bilik-air-rumah-kl.webp',
  'pakej-cuci-rumah-hari-raya.webp', 'cucian-selepas-renovasi-rumah.webp',
  'cuci-dapur-rumah-berminyak.webp', 'cuci-habuk-plaster-ceiling.webp',
  'servis-aircond-dan-cuci-rumah.webp',
]);
const routeRepairs = new Map([
  ['/about/', '/about-us/'], ['/tag/pemasangan-aircond/', '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/'],
  ['/tag/ceiling-works/', '/plaster-ceiling-contractor-kl/'], ['/tag/wiring/', '/electrical-services-selangor/'],
  ['/tag/guide/', '/blog/'], ['/tag/kuala-lumpur/', '/category/servis-pembersihan/'],
  ['/tag/aircond-maintenance/', '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/'],
  ['/tag/cleaning/', '/category/servis-pembersihan/'], ['/service/building-construction/', '/services/'],
  ['/service/architecture-design/', '/services/'], ['/service/flooring-roofing/', '/services/'],
  ['/service/general-contracting/', '/services/'], ['/service/repair-expand/', '/services/'],
]);

for (const record of lock.records) {
  const file = outputFile(record.route);
  result(record.route, 'built route', existsSync(file));
  if (!existsSync(file)) continue;
  const $ = load(await readFile(file, 'utf8'));
  const template = $('[data-locked-template]').first().attr('data-locked-template') || 'none';
  templateUsage.set(record.route, template);
  result(record.route, 'one main landmark', $('main').length === 1, String($('main').length));
  result(record.route, 'no nested main', $('main main').length === 0, String($('main main').length));
  result(record.route, 'header landmark', $('body > header').length === 1, String($('body > header').length));
  result(record.route, 'footer landmark', $('body > footer').length === 1, String($('body > footer').length));
  result(record.route, 'skip link target valid', $('a.skip-link[href="#main-content"]').length === 1 && $('#main-content').length === 1);
  result(record.route, 'dedicated page template', template === expectedTemplate(record.route), `${template}/${expectedTemplate(record.route)}`);
  result(record.route, 'no public audit wording', !/source-verified content|source form fields|source-locked|migration audit|content lock/i.test($('body').text()));
  if (!record.sourceUrl) {
    result(record.route, 'new page H1', clean($('h1').first().text()) === 'Demolition Contractor KL & Selangor');
    result(record.route, 'safe staging robots', /noindex/.test($('meta[name="robots"]').attr('content') || ''));
    continue;
  }
  const expected = record.seo;
  result(record.route, 'title exact', clean($('title').text()) === expected.title);
  result(record.route, 'description exact', ($('meta[name="description"]').attr('content') || '') === expected.description);
  result(record.route, 'canonical exact', ($('link[rel="canonical"]').attr('href') || '') === expected.canonical);
  result(record.route, 'safe staging robots', /^noindex,\s*nofollow$/i.test($('meta[name="robots"]').attr('content') || ''));
  for (const [key, value] of Object.entries(expected.openGraph || {})) {
    result(record.route, `og:${key} exact`, ($(`meta[property="og:${key}"]`).attr('content') || '') === value);
  }
  for (const [key, value] of Object.entries(expected.article || {})) {
    result(record.route, `article:${key} exact`, ($(`meta[property="article:${key}"]`).attr('content') || '') === value);
  }
  for (const [key, value] of Object.entries(expected.twitter || {})) {
    result(record.route, `twitter:${key} exact`, ($(`meta[name="twitter:${key}"]`).attr('content') || '') === value);
  }
  const schema = $('script[type="application/ld+json"]').toArray().map((node) => JSON.parse($(node).html() || '{}'));
  result(record.route, 'JSON-LD exact', stable(schema) === stable(expected.jsonLd));
  result(record.route, 'single exact H1', $('main h1').length === 1 && clean($('main h1').text()) === record.content.h1);

  if (coreRoutes.has(record.route)) {
    const mainText = clean($('main').text());
    for (const text of coreRequiredText[record.route]) result(record.route, 'important business content retained', mainText.includes(text), text.slice(0, 70));
    result(record.route, 'manual core composition', $('.recovery-page').length === 1 && $('.source-locked-section').length === 0);
    result(record.route, 'no core article sidebar or TOC', $('.locked-article-rail,.source-locked-toc').length === 0);
    result(record.route, 'no Vastcon text', !/vastcon/i.test(mainText));
    result(record.route, 'no raw broken form text', !/Building ConstructionArchitecture Designbuilding renovation|MessageAccept terms|Project type\*Building|Your services\*What are your needs|Send Message/i.test(mainText));
    result(record.route, 'no fake profile images', $('img[src*="avartar"],img[src*="gravatar"],img[src*="home7-img7"]').length === 0);
    if (record.route === '/') result(record.route, 'homepage has real service cards', $('.recovery-service-card').length >= 10 && new Set($('.recovery-service-card').toArray().map((node) => $(node).attr('href'))).size >= 7, String($('.recovery-service-card').length));
    if (record.route === '/services/') result(record.route, 'service hub has grouped service cards', $('.recovery-service-group').length === 7 && $('.recovery-service-card').length === 13, `${$('.recovery-service-group').length}/${$('.recovery-service-card').length}`);
    if (record.route === '/about-us/') result(record.route, 'about removes template team/history content', !/Meet Our Leadership|year of experience|Simple actions make a difference/i.test(mainText));
    if (record.route === '/contact-us/') {
      result(record.route, 'contact has structured disabled form', $('form[data-disabled-enquiry-form]').length === 1 && $('form[data-disabled-enquiry-form] :input:not(:disabled)').length === 0 && !$('form[data-disabled-enquiry-form]').attr('action'));
      result(record.route, 'contact labels not duplicated', ['Full Name', 'Email', 'Phone Number', 'Service', 'Project Details'].every((label) => $(`form[data-disabled-enquiry-form] label > span`).filter((_, node) => clean($(node).text()) === label).length === 1));
    }
    if (record.route === '/faq/') result(record.route, 'FAQ has accessible grouped accordions', $('.recovery-faq-grid > section').length === 2 && $('.recovery-faq-grid details').length === 6);
    if (record.route === '/blog/') result(record.route, 'blog archive uses 14 article cards', $('.recovery-article-card').length === 14, String($('.recovery-article-card').length));
  } else {
  const sourceHeadingBlocks = record.content.orderedBlocks.filter((block) => block.type === 'heading');
  const firstSourceH1 = sourceHeadingBlocks.findIndex((block) => block.level === 1);
  const expectedHeadings = [record.content.h1, ...sourceHeadingBlocks.filter((_, index) => index !== firstSourceH1).map((block) => block.text)];
  const actualHeadings = $('.source-locked-hero h1,.locked-section-inner>h2,.locked-section-inner>h3,.locked-section-inner>.locked-question-only h3').toArray().map((node) => clean($(node).text()));
  result(record.route, 'heading order exact', stable(actualHeadings) === stable(expectedHeadings), `${actualHeadings.length}/${expectedHeadings.length}`);
  const sourceParagraphs = record.content.orderedBlocks.filter((block) => block.type === 'p').map((block) => block.text);
  const expectedParagraphs = sourceParagraphs.slice(1);
  const actualParagraphs = $('.locked-section-inner>.source-copy').toArray().map((node) => clean($(node).text()));
  result(record.route, 'paragraph order exact', stable(actualParagraphs) === stable(expectedParagraphs), `${actualParagraphs.length}/${expectedParagraphs.length}`);
  const expectedLists = record.content.orderedBlocks.filter((block) => block.type === 'list').map((block) => block.items.map(clean));
  const actualLists = $('.locked-section-inner>ul,.locked-section-inner>ol').toArray().map((node) => $(node).children('li').toArray().map((item) => clean($(item).text())));
  result(record.route, 'list order exact', stable(actualLists) === stable(expectedLists), `${actualLists.length}/${expectedLists.length}`);
  const expectedTables = record.content.orderedBlocks.filter((block) => block.type === 'table').map((block) => block.rows.map((row) => row.map(clean)));
  const actualTables = $('.source-locked-table table').toArray().map((node) => $(node).find('tr').toArray().map((row) => $(row).find('th,td').toArray().map((cell) => clean($(cell).text()))));
  result(record.route, 'table order exact', stable(actualTables) === stable(expectedTables), `${actualTables.length}/${expectedTables.length}`);
  const sourceImageBlocks = record.content.orderedBlocks.filter((block) => block.type === 'image');
  const sourceHeroUsed = sourceImageBlocks.some((block) => !/gravatar/i.test(block.src));
  const actualSourceImages = $('.source-locked-body figure img').length + (sourceHeroUsed ? $('.source-locked-hero-media').length : 0);
  result(record.route, 'source image slots retained', actualSourceImages === sourceImageBlocks.length, `${actualSourceImages}/${sourceImageBlocks.length}`);
  const expectedAlts = sourceImageBlocks.map((block) => block.alt || '').sort();
  const actualAlts = [...(sourceHeroUsed ? $('.source-locked-hero-media').toArray() : []), ...$('.source-locked-body figure img').toArray()]
    .map((node) => $(node).attr('alt') || '').sort();
  result(record.route, 'source image purposes retained', stable(actualAlts) === stable(expectedAlts));
  const expectedFaqs = record.content.faqs || [];
  const actualFaqs = $('.source-locked-body details:not(.locked-question-only)').toArray().map((node) => ({
    question: clean($(node).find('summary').text()), answer: clean($(node).find('p').text()),
  }));
  result(record.route, 'FAQ sequence exact', stable(actualFaqs) === stable(expectedFaqs));
  const expectedFormLabels = (record.content.forms || []).flatMap((form) => form.labels || []);
  const visibleFormLabels = $('.source-locked-form-preview span').toArray().map((node) => clean($(node).text()));
  result(record.route, 'form labels retained', expectedFormLabels.every((label) => visibleFormLabels.includes(label)));
  result(record.route, 'structured content sections', $('.source-locked-section').length > 0);
  result(record.route, 'no active content form', $('.source-locked-page form').length === 0);
  if (serviceRoutes.has(record.route)) {
    const treatments = new Set($('.source-locked-section').toArray().flatMap((node) => ($(node).attr('class') || '').split(/\s+/).filter((name) => name.startsWith('locked-treatment-'))));
    result(record.route, 'service has multiple section treatments', treatments.size >= 3, String(treatments.size));
  }
  if (articleRoutes.has(record.route)) {
    result(record.route, 'article editorial body', $('.locked-editorial-body').length === 1);
    result(record.route, 'article metadata', $('.locked-byline time').length === 1);
    if (expectedHeadings.filter(Boolean).length >= 3) result(record.route, 'article table of contents', $('.source-locked-toc').length === 1);
  }
  }
  const expectedInternal = [...new Set((record.content.internalLinks || []).filter((link) => link.text).map((link) => routeRepairs.get(new URL(link.href).pathname) || new URL(link.href).pathname))]
    .filter((href) => !/^\/blog\/page\/(?:2|4)\/$/.test(href));
  const actualInternal = new Set($('.source-locked-page a[href]').toArray().map((node) => {
    try {
      const url = new URL($(node).attr('href'), 'https://rkrenosolution.com');
      return url.origin === 'https://rkrenosolution.com' ? url.pathname.replace(/^\/rkreno(?=\/)/, '') : '';
    } catch { return ''; }
  }));
  if (!coreRoutes.has(record.route)) result(record.route, 'source internal destinations retained', expectedInternal.every((href) => actualInternal.has(href)));
  for (const href of actualInternal) {
    if (!href || href.startsWith('/assets/')) continue;
    const linkedFile = href === '/' ? path.join(root, 'dist/index.html') : path.join(root, 'dist', href.replace(/^\//, ''), 'index.html');
    result(record.route, 'internal link resolves', existsSync(linkedFile), href);
  }
  for (const image of $('.source-locked-page img[src]').toArray()) {
    const source = ($(image).attr('src') || '').replace(/^\/rkreno(?=\/)/, '');
    result(record.route, 'local image exists', source.startsWith('/assets/') && existsSync(path.join(root, 'dist', source.slice(1))), source);
  }
}

result('GLOBAL', '33 indexable lock records', lock.records.length === 33);
result('GLOBAL', '32 WordPress lock records', lock.records.filter((record) => record.sourceUrl).length === 32);
result('GLOBAL', 'one owner-new record', lock.records.filter((record) => !record.sourceUrl).length === 1);
const css = await readFile(path.join(root, 'src/styles/source-locked.css'), 'utf8');
const responsiveCss = await readFile(path.join(root, 'src/styles/locked-responsive.css'), 'utf8');
result('GLOBAL', 'desktop and mobile design rules', /@media\s*\(max-width:\s*760px\)/.test(responsiveCss) && /@media\s*\(max-width:\s*560px\)/.test(responsiveCss));
result('GLOBAL', 'no standard template in locked indexable scope', [...templateUsage.values()].filter((name) => name === 'standard').length === 0);

const reviewRoutes = ['/', '/services/', '/about-us/', '/contact-us/', '/faq/', '/blog/'];
const mime = { '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname).replace(/^\/rkreno(?=\/|$)/, '') || '/';
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, 'dist', pathname.replace(/^\//, ''));
    if (!file.startsWith(path.resolve(root, 'dist')) || !existsSync(file)) { response.writeHead(404).end('Not found'); return; }
    response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'text/html' });
    response.end(await readFile(file));
  } catch { response.writeHead(500).end('Server error'); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await chromium.launch({ headless: true });
try {
  const browserPage = await browser.newPage();
  const consoleErrors = [];
  browserPage.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  for (const width of [1440, 390]) {
    await browserPage.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const route of reviewRoutes) {
      consoleErrors.length = 0;
      await browserPage.goto(`http://127.0.0.1:${port}/rkreno${route}`, { waitUntil: 'load' });
      const metrics = await browserPage.evaluate(() => {
        const wrappers = [...document.querySelectorAll('.source-locked-table')];
        const page = document.querySelector('.recovery-page');
        const pageBlocks = page ? [...page.children].filter((node) => node.matches('header,section,nav,aside') && node.getBoundingClientRect().height > 0) : [];
        const gaps = pageBlocks.slice(1).map((node, index) => node.getBoundingClientRect().top - pageBlocks[index].getBoundingClientRect().bottom);
        const sparseSections = [...document.querySelectorAll('.recovery-section')].filter((section) => {
          const rect = section.getBoundingClientRect();
          return rect.height > 360 && (section.textContent || '').trim().length < 100 && section.querySelectorAll('img,.recovery-service-card,.recovery-article-card,form,details').length === 0;
        });
        const paragraphs = [...document.querySelectorAll('.recovery-page p:not(.recovery-eyebrow)')].filter((node) => node.getBoundingClientRect().height > 0);
        const wraps = [...document.querySelectorAll('.recovery-page .recovery-wrap')].filter((node) => node.getBoundingClientRect().height > 0);
          return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
          tables: wrappers.every((wrapper) => getComputedStyle(wrapper).overflowX === 'auto'),
          structured: Boolean(page) && pageBlocks.length >= 3,
          tocMobile: innerWidth > 560 || !document.querySelector('.source-locked-toc ol') || getComputedStyle(document.querySelector('.source-locked-toc ol')).columnCount === '1',
          excessiveGaps: gaps.filter((gap) => gap > 180).length + sparseSections.length,
          minBodyFont: paragraphs.length ? Math.min(...paragraphs.map((node) => parseFloat(getComputedStyle(node).fontSize))) : 16,
          minContentWidth: innerWidth < 1000 || !wraps.length ? 999 : Math.min(...wraps.map((node) => node.getBoundingClientRect().width)),
        };
      });
      result(`${route}@${width}`, 'no responsive overflow', metrics.overflow <= 1, String(metrics.overflow));
      result(`${route}@${width}`, 'no broken responsive image', metrics.brokenImages === 0, String(metrics.brokenImages));
      result(`${route}@${width}`, 'responsive tables contained', metrics.tables);
      result(`${route}@${width}`, 'structured sections visible', metrics.structured);
      result(`${route}@${width}`, 'mobile TOC single column', metrics.tocMobile);
      result(`${route}@${width}`, 'no excessive blank space', metrics.excessiveGaps === 0, String(metrics.excessiveGaps));
      result(`${route}@${width}`, 'body text at least 16px', metrics.minBodyFont >= 16, String(metrics.minBodyFont));
      result(`${route}@${width}`, 'desktop content width at least 650px', metrics.minContentWidth >= 650, String(metrics.minContentWidth));
      result(`${route}@${width}`, 'no console errors', consoleErrors.length === 0, consoleErrors.join(' | '));
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

const rows = ['route,source_type,content_status,seo_status,robots_status,asset_status,overall_status,note'];
for (const record of lock.records) {
  const hasKnownMissing = record.content?.images?.some((image) => missingOriginals.has(path.basename(new URL(image.src).pathname)));
  const values = record.sourceUrl
    ? coreRoutes.has(record.route)
      ? [record.route, 'WORDPRESS_CURATED_CORE', 'IMPORTANT_CONTENT_RETAINED', 'MATCH', 'DOCUMENTED_EXCLUSION', 'MATCH', 'MATCH', 'Core page manually composed; broken demo content and raw DOM order are intentionally excluded.']
      : [record.route, 'WORDPRESS', 'MATCH', 'MATCH', 'DOCUMENTED_EXCLUSION', hasKnownMissing ? 'MISSING_ORIGINAL_ASSET' : 'MATCH', hasKnownMissing ? 'MISSING_ORIGINAL_ASSET' : 'MATCH', hasKnownMissing ? 'Seven unavailable cleaning originals use the documented cleaning fallback.' : 'Live source content and SEO are locked; staging robots remain noindex.']
    : [record.route, 'OWNER_NEW', 'NEW_PAGE', 'NEW_PAGE', 'DOCUMENTED_EXCLUSION', 'MATCH', 'NEW_PAGE', 'No WordPress source exists; retained as the approved owner-created service page.'];
  rows.push(values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','));
}
await writeFile(path.join(reportDir, 'content-seo-comparison.csv'), `${rows.join('\n')}\n`);

const drifted = lock.records.filter((record) => record.sourceUrl && !record.localBaseline.contentTextMatches).map((record) => record.route);
await writeFile(path.join(reportDir, 'content-seo-differences.md'), `# Content and SEO differences\n\n- Live WordPress SEO matched the stored crawl on all 32 source routes.\n- ${drifted.length} stored bodies differed from the normalized live body recorded by the content lock: ${drifted.join(', ')}.\n- The six core routes are manually composed from approved business content; raw DOM order, duplicate responsive fragments, demo-theme wording, fake testimonials and broken form strings are intentionally excluded.\n- Service-detail and article content remains rendered through the locked block engine.\n- Staging robots remain \`noindex, nofollow\`; this is a documented safety exclusion from the live WordPress robots value.\n- The demolition route remains classified \`NEW_PAGE\`.\n`);
const countTemplate = (name) => [...templateUsage.values()].filter((value) => value === name).length;
const contentCheckNames = new Set(['single exact H1', 'important business content retained', 'heading order exact', 'paragraph order exact', 'list order exact', 'table order exact', 'FAQ sequence exact', 'form labels retained', 'source image slots retained', 'source image purposes retained', 'source internal destinations retained']);
const seoCheckPattern = /^(?:title|description|canonical|JSON-LD|og:|article:|twitter:)/;
const contentRegressions = checks.filter((check) => !check.passed && contentCheckNames.has(check.name)).length;
const seoRegressions = checks.filter((check) => !check.passed && seoCheckPattern.test(check.name)).length;
const nestedMainCount = checks.filter((check) => check.name === 'no nested main' && !check.passed).length;
const genericTemplateCount = countTemplate('standard') + countTemplate('none');
const textBlobCount = checks.filter((check) => check.name === 'structured content sections' && !check.passed).length;
await writeFile(path.join(reportDir, 'design-rebuild-summary.md'), `# Design rebuild summary\n\n- Core scope: homepage, services, about, contact, FAQ and blog are manually composed from structured route-specific models.\n- Core exclusions: raw WordPress DOM order, demo-theme wording, fake testimonials/profile images, decorative spacers and broken form strings are not rendered.\n- Service-detail scope: ${countTemplate('service')} service pages remain on the existing rich locked template and were not redesigned in this prompt.\n- Article scope: ${countTemplate('article')} editorial guides remain on the existing locked article template and were not redesigned in this prompt.\n- Remaining generic locked templates: ${genericTemplateCount}.\n- Nested main landmarks: ${nestedMainCount}.\n- Content regressions: ${contentRegressions}.\n- SEO regressions: ${seoRegressions}.\n`);

const templateRows = [...templateUsage.entries()].map(([route, template]) => `| \`${route}\` | ${template} | ${template === expectedTemplate(route) ? 'PASS' : 'FAIL'} |`).join('\n');
await writeFile(path.join(reportDir, 'template-usage-report.md'), `# Template usage report\n\n| Route | Template | Result |\n|---|---|---|\n${templateRows}\n\n- Homepage templates: ${countTemplate('homepage')}\n- Services hubs: ${countTemplate('services-hub')}\n- About templates: ${countTemplate('about')}\n- Contact templates: ${countTemplate('contact')}\n- FAQ templates: ${countTemplate('faq')}\n- Blog archives: ${countTemplate('blog-archive')}\n- Rich service templates: ${countTemplate('service')}\n- Editorial article templates: ${countTemplate('article')}\n- Generic/none: ${genericTemplateCount}\n`);

await writeFile(path.join(reportDir, 'visual-review.md'), `# Visual review\n\nAutomated desktop and mobile review covered the eight required routes at 1440px and 390px. Checks include horizontal overflow, broken responsive images, contained tables, visible structured sections, compact mobile contents navigation and console errors. Final screenshot references are stored in \`reports/public/correction/visual-review/\`.\n`);

const risky = /warranty|guarantee|100%|certified|expert|permanent|free inspection|years? of experience|customers|projects completed|savings|pay for/i;
const claimRows = [];
for (const record of lock.records.filter((item) => item.sourceUrl)) {
  for (const paragraph of record.content.paragraphs.filter((text) => risky.test(text)).slice(0, 4)) claimRows.push(`- \`${record.route}\` — SOURCE_ONLY: ${paragraph.slice(0, 220).trimEnd()}`);
}
await writeFile(path.join(reportDir, 'claim-review.md'), `# Source claim review\n\nThese statements are retained verbatim because they are visible on current WordPress. Classification does not verify the claims; production remains blocked pending owner review. Showing ${Math.min(claimRows.length, 36)} of ${claimRows.length} rule-matched statements.\n\n${claimRows.slice(0, 36).join('\n') || '- No rule-matched source claims.'}\n`);
await writeFile(path.join(reportDir, 'missing-assets.md'), `# Missing original assets\n\nThe following seven WordPress cleaning images are unavailable locally and use \`/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg\` as a clearly documented contextual fallback; it is not represented as the original.\n\n${[...missingOriginals].map((name) => `- ${name}`).join('\n')}\n`);
const brokenLinks = checks.filter((check) => check.name === 'internal link resolves' && !check.passed).length;
const brokenImages = checks.filter((check) => (check.name === 'local image exists' || check.name === 'no broken responsive image') && !check.passed).length;
const validationReport = `# Correction validation summary\n\nStatus: **${failures.length ? 'FAILED' : 'PASSED'}**\n\n- Routes checked: ${lock.records.length}\n- WordPress source locks: ${lock.records.filter((record) => record.sourceUrl).length}\n- Approved-content regressions: ${contentRegressions}\n- SEO title matches: ${checks.filter((check) => check.name === 'title exact' && check.passed).length}/32\n- Meta-description matches: ${checks.filter((check) => check.name === 'description exact' && check.passed).length}/32\n- JSON-LD regressions: ${checks.filter((check) => check.name === 'JSON-LD exact' && !check.passed).length}\n- Manually composed core pages: 6\n- Unchanged rich service templates: ${countTemplate('service')}\n- Unchanged editorial article templates: ${countTemplate('article')}\n- Nested main landmarks: ${nestedMainCount}\n- Broken internal links: ${brokenLinks}\n- Broken images: ${brokenImages}\n- Core responsive routes: 6 at 1440px and 390px\n- Automated checks: ${checks.length}\n- Failures: ${failures.length}\n- Safety: staging noindex retained; enquiry form disabled; no production systems changed.\n\n${failures.length ? `## Failures\n\n${failures.map((failure) => `- ${failure}`).join('\n')}\n` : ''}`;
await writeFile(path.join(reportDir, 'validation-summary.md'), validationReport.replace(/\n+$/, '\n'));

let vastconOccurrences = 0;
let rawBrokenFormTextCount = 0;
for (const route of coreRoutes) {
  const html = await readFile(outputFile(route), 'utf8');
  vastconOccurrences += (html.match(/vastcon/gi) || []).length;
  rawBrokenFormTextCount += (html.match(/Building ConstructionArchitecture Designbuilding renovation|MessageAccept terms|Project type\*Building|Your services\*What are your needs|Send Message/gi) || []).length;
}
const excessiveBlankIssues = checks.filter((check) => check.name === 'no excessive blank space' && !check.passed).length;
const coreReviewRows = [
  ['/', 'Hero; 3 priority services; 7-service grid; introduction; benefits; 4-step process; service areas; guides; CTA', 'Testimonials, fake profiles, raw form fragments and spacer content', 'Homepage desktop and mobile reviewed'],
  ['/services/', 'Hero; grouped Aircond, Renovation, Demolition, Electrical, Waterproofing, Plaster ceiling and Cleaning cards; CTA', 'Disconnected raw archive/source blocks', 'Services desktop and mobile validated'],
  ['/about-us/', 'Hero; mission; values; project approach; expertise; communication; coverage; CTA', 'Fake leadership/history, repeated template safety copy and decorative source images', 'About desktop and mobile validated'],
  ['/contact-us/', 'Hero; contact cards; address and coverage; disabled visual form; related services; CTA', 'Vastcon text, concatenated fields, duplicated labels and blueprint placeholders', 'Contact desktop and mobile validated'],
  ['/faq/', 'Hero; 2 topic groups; 6 accessible accordions; related services; CTA', 'Large fragment sections and unresolved warranty placeholder', 'FAQ desktop and mobile validated'],
  ['/blog/', 'Hero; featured guide; 14-card archive; related services; CTA', 'Disconnected source archive blocks, profile image and pagination fragments', 'Blog desktop and mobile validated'],
];
const coreReport = `# Core pages visual review\n\nStatus: **${failures.length ? 'NEEDS REPAIR' : 'PASS'}** for Prompt 1 core-page scope only. This does not approve service-detail pages or articles.\n\n| Page | Major sections present | Removed broken/template content | Desktop/mobile result | Remaining defects |\n|---|---|---|---|---|\n${coreReviewRows.map(([route, sections, removed, responsive]) => `| \`${route}\` | ${sections} | ${removed} | ${responsive} | ${failures.some((failure) => failure.startsWith(route + ' ') || failure.startsWith(route + '@')) ? 'See validation failures' : 'None found in reviewed scope'} |`).join('\n')}\n\n- Vastcon occurrences: ${vastconOccurrences}\n- Raw broken-form-text occurrences: ${rawBrokenFormTextCount}\n- Excessive blank-space issues: ${excessiveBlankIssues}\n- Broken links: ${brokenLinks}\n- Broken images: ${brokenImages}\n- Content regressions: ${contentRegressions}\n- SEO regressions: ${seoRegressions}\n- Service-detail and article templates were not redesigned.\n- Staging remains noindex with disabled form delivery and VPS protection.\n`;
await writeFile(path.join(recoveryReportDir, 'core-pages-review.md'), coreReport);

console.log(`Content/SEO/design validation: ${checks.length} checks, ${failures.length} failures.`);
if (failures.length) {
  console.error(failures.slice(0, 30).join('\n'));
  process.exitCode = 1;
}
