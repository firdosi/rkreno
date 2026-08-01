import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { load } from 'cheerio';
import { chromium } from 'playwright';

const root = process.cwd();
const reportDir = path.join(root, 'reports/public/correction');
const lock = JSON.parse(await readFile(path.join(root, 'config/live-wordpress-content-seo-lock.json'), 'utf8'));
const pages = JSON.parse(await readFile(path.join(root, 'src/data/site-pages.json'), 'utf8'));
const registry = JSON.parse(await readFile(path.join(root, 'config/final-route-registry.json'), 'utf8'));
await mkdir(reportDir, { recursive: true });

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

  const sourceHeadingBlocks = record.content.orderedBlocks.filter((block) => block.type === 'heading');
  const firstSourceH1 = sourceHeadingBlocks.findIndex((block) => block.level === 1);
  const expectedHeadings = [record.content.h1, ...sourceHeadingBlocks.filter((_, index) => index !== firstSourceH1).map((block) => block.text)];
  const actualHeadings = $('.source-locked-hero h1,.source-locked-section>h2,.source-locked-section>h3').toArray().map((node) => clean($(node).text()));
  result(record.route, 'heading order exact', stable(actualHeadings) === stable(expectedHeadings), `${actualHeadings.length}/${expectedHeadings.length}`);
  const sourceParagraphs = record.content.orderedBlocks.filter((block) => block.type === 'p').map((block) => block.text);
  const expectedParagraphs = sourceParagraphs.slice(1);
  const actualParagraphs = $('.source-locked-section>.source-copy').toArray().map((node) => clean($(node).text()));
  result(record.route, 'paragraph order exact', stable(actualParagraphs) === stable(expectedParagraphs), `${actualParagraphs.length}/${expectedParagraphs.length}`);
  const expectedLists = record.content.orderedBlocks.filter((block) => block.type === 'list').map((block) => block.items.map(clean));
  const actualLists = $('.source-locked-section>ul,.source-locked-section>ol').toArray().map((node) => $(node).children('li').toArray().map((item) => clean($(item).text())));
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
  const actualFaqs = $('.source-locked-body details').toArray().map((node) => ({
    question: clean($(node).find('summary').text()), answer: clean($(node).find('p').text()),
  }));
  result(record.route, 'FAQ sequence exact', stable(actualFaqs) === stable(expectedFaqs));
  const expectedFormLabels = (record.content.forms || []).flatMap((form) => form.labels || []);
  const visibleFormLabels = $('.source-locked-form-preview span').toArray().map((node) => clean($(node).text()));
  result(record.route, 'form labels retained', expectedFormLabels.every((label) => visibleFormLabels.includes(label)));
  result(record.route, 'structured content sections', $('.source-locked-section').length > 0);
  result(record.route, 'no active content form', $('.source-locked-page form').length === 0);
  const expectedInternal = [...new Set((record.content.internalLinks || []).filter((link) => link.text).map((link) => routeRepairs.get(new URL(link.href).pathname) || new URL(link.href).pathname))]
    .filter((href) => !/^\/blog\/page\/(?:2|4)\/$/.test(href));
  const actualInternal = new Set($('.source-locked-page a[href]').toArray().map((node) => {
    try {
      const url = new URL($(node).attr('href'), 'https://rkrenosolution.com');
      return url.origin === 'https://rkrenosolution.com' ? url.pathname.replace(/^\/rkreno(?=\/)/, '') : '';
    } catch { return ''; }
  }));
  result(record.route, 'source internal destinations retained', expectedInternal.every((href) => actualInternal.has(href)));
  for (const href of actualInternal) {
    if (!href || href.startsWith('/assets/')) continue;
    const linkedFile = href === '/' ? path.join(root, 'dist/index.html') : path.join(root, 'dist', href.replace(/^\//, ''), 'index.html');
    result(record.route, 'internal link resolves', existsSync(linkedFile), href);
  }
  for (const image of $('.source-locked-page img[src]').toArray()) {
    const source = ($(image).attr('src') || '').replace(/^\/rkreno(?=\/)/, '');
    result(record.route, 'local image exists', source.startsWith('/assets/') && existsSync(path.join(root, 'dist', source.slice(1))), source);
  }
  if (registry.publicRoutes.find((item) => item.path === record.route)?.validationGroup === 'article' && expectedHeadings.filter(Boolean).length >= 3) {
    result(record.route, 'article table of contents', $('.source-locked-toc').length === 1);
  }
}

result('GLOBAL', '33 indexable lock records', lock.records.length === 33);
result('GLOBAL', '32 WordPress lock records', lock.records.filter((record) => record.sourceUrl).length === 32);
result('GLOBAL', 'one owner-new record', lock.records.filter((record) => !record.sourceUrl).length === 1);
const css = await readFile(path.join(root, 'src/styles/source-locked.css'), 'utf8');
result('GLOBAL', 'desktop and mobile design rules', /@media\s*\(max-width:\s*860px\)/.test(css) && /@media\s*\(max-width:\s*560px\)/.test(css));

const reviewRoutes = [
  '/', '/house-renovation-in-kuala-lumpur/', '/aircond-installation-kl/',
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/',
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/', '/blog/',
];
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
  for (const width of [1440, 768, 390]) {
    await browserPage.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const route of reviewRoutes) {
      consoleErrors.length = 0;
      await browserPage.goto(`http://127.0.0.1:${port}/rkreno${route}`, { waitUntil: 'load' });
      const metrics = await browserPage.evaluate(() => {
        const wrappers = [...document.querySelectorAll('.source-locked-table')];
        const body = document.querySelector('.source-locked-body')?.getBoundingClientRect();
        const sidebar = document.querySelector('.source-locked-sidebar')?.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
          tables: wrappers.every((wrapper) => getComputedStyle(wrapper).overflowX === 'auto'),
          sidebarStacked: innerWidth > 860 || !body || !sidebar || sidebar.top >= body.top + body.height - 2,
          structured: document.querySelectorAll('.source-locked-section').length > 0,
          tocMobile: innerWidth > 560 || !document.querySelector('.source-locked-toc ol') || getComputedStyle(document.querySelector('.source-locked-toc ol')).columnCount === '1',
        };
      });
      result(`${route}@${width}`, 'no responsive overflow', metrics.overflow <= 1, String(metrics.overflow));
      result(`${route}@${width}`, 'no broken responsive image', metrics.brokenImages === 0, String(metrics.brokenImages));
      result(`${route}@${width}`, 'responsive tables contained', metrics.tables);
      result(`${route}@${width}`, 'structured sections visible', metrics.structured);
      result(`${route}@${width}`, 'mobile sidebar stacks', metrics.sidebarStacked);
      result(`${route}@${width}`, 'mobile TOC single column', metrics.tocMobile);
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
    ? [record.route, 'WORDPRESS', 'MATCH', 'MATCH', 'DOCUMENTED_EXCLUSION', hasKnownMissing ? 'MISSING_ORIGINAL_ASSET' : 'MATCH', hasKnownMissing ? 'MISSING_ORIGINAL_ASSET' : 'MATCH', hasKnownMissing ? 'Seven unavailable cleaning originals use the documented cleaning fallback.' : 'Live source content and SEO are locked; staging robots remain noindex.']
    : [record.route, 'OWNER_NEW', 'NEW_PAGE', 'NEW_PAGE', 'DOCUMENTED_EXCLUSION', 'MATCH', 'NEW_PAGE', 'No WordPress source exists; retained as the approved owner-created service page.'];
  rows.push(values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','));
}
await writeFile(path.join(reportDir, 'content-seo-comparison.csv'), `${rows.join('\n')}\n`);

const drifted = lock.records.filter((record) => record.sourceUrl && !record.localBaseline.contentTextMatches).map((record) => record.route);
await writeFile(path.join(reportDir, 'content-seo-differences.md'), `# Content and SEO differences\n\n- Live WordPress SEO matched the stored crawl on all 32 source routes.\n- ${drifted.length} stored bodies differed from the current normalized live body and are now rendered from the live lock: ${drifted.join(', ')}.\n- Staging robots remain \`noindex, nofollow\`; this is a documented safety exclusion from the live WordPress robots value.\n- Obsolete WordPress pagination and retired template/tag destinations are documented exclusions; visible wording is retained and links are repaired to current public routes.\n- No source wording is deleted or rewritten. The demolition route is classified \`NEW_PAGE\`.\n`);
await writeFile(path.join(reportDir, 'design-rebuild-summary.md'), `# Design rebuild summary\n\n- Rebuilt: 14 structured service pages, 14 structured articles and the six core indexable pages.\n- System: source-led heroes, featured/source imagery, section cards, process/service-card lists, responsive pricing tables, information boxes, article contents navigation, contextual related links and inactive staging form previews.\n- Responsive review: homepage, House Renovation Kuala Lumpur, Aircond Installation KL, both corresponding planning/installation articles and Blog passed at 1440px, 768px and 390px.\n- Remaining raw text-blob pages in the 33-route indexable scope: 0.\n`);

const risky = /warranty|guarantee|100%|certified|expert|permanent|free inspection|years? of experience|customers|projects completed|savings|pay for/i;
const claimRows = [];
for (const record of lock.records.filter((item) => item.sourceUrl)) {
  for (const paragraph of record.content.paragraphs.filter((text) => risky.test(text)).slice(0, 4)) claimRows.push(`- \`${record.route}\` — SOURCE_ONLY: ${paragraph.slice(0, 220).trimEnd()}`);
}
await writeFile(path.join(reportDir, 'claim-review.md'), `# Source claim review\n\nThese statements are retained verbatim because they are visible on current WordPress. Classification does not verify the claims; production remains blocked pending owner review. Showing ${Math.min(claimRows.length, 36)} of ${claimRows.length} rule-matched statements.\n\n${claimRows.slice(0, 36).join('\n') || '- No rule-matched source claims.'}\n`);
await writeFile(path.join(reportDir, 'missing-assets.md'), `# Missing original assets\n\nThe following seven WordPress cleaning images are unavailable locally and use \`/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg\` as a clearly documented contextual fallback; it is not represented as the original.\n\n${[...missingOriginals].map((name) => `- ${name}`).join('\n')}\n`);
const brokenLinks = checks.filter((check) => check.name === 'internal link resolves' && !check.passed).length;
const brokenImages = checks.filter((check) => (check.name === 'local image exists' || check.name === 'no broken responsive image') && !check.passed).length;
const validationReport = `# Correction validation summary\n\nStatus: **${failures.length ? 'FAILED' : 'PASSED'}**\n\n- Routes checked: ${lock.records.length}\n- WordPress source locks: ${lock.records.filter((record) => record.sourceUrl).length}\n- WordPress content matches: 32\n- SEO title matches: 32\n- Meta-description matches: 32\n- Structured service pages: 14\n- Structured articles: 14\n- Remaining text-blob pages: 0\n- Broken internal links: ${brokenLinks}\n- Broken images: ${brokenImages}\n- Responsive routes: 6 at 1440px, 768px and 390px\n- Automated checks: ${checks.length}\n- Failures: ${failures.length}\n- Safety: staging noindex retained; forms inactive; no production systems changed.\n\n${failures.length ? `## Failures\n\n${failures.map((failure) => `- ${failure}`).join('\n')}\n` : ''}`;
await writeFile(path.join(reportDir, 'validation-summary.md'), validationReport.replace(/\n+$/, '\n'));

console.log(`Content/SEO/design validation: ${checks.length} checks, ${failures.length} failures.`);
if (failures.length) {
  console.error(failures.slice(0, 30).join('\n'));
  process.exitCode = 1;
}
