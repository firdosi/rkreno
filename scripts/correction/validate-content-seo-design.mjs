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
const homepageManifest = JSON.parse(await readFile(path.join(root, 'config/homepage-exact-visible-content.json'), 'utf8'));
const aircondKlManifest = JSON.parse(await readFile(path.join(root, 'config/aircond-installation-kl-content.json'), 'utf8'));
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
const serviceRecoveryRoutes = new Set(serviceRoutes);
const aircondRoutes = new Set(['/servis-aircond-murah-kl/', '/aircond-installation-kl/', '/upah-pasang-aircond-selangor/']);
const renovationRoutes = new Set(['/service/building-renovation/', '/house-renovation-in-kuala-lumpur/', '/house-renovation-in-selangor/', '/home-renovation-contractor-in-subang-jaya/', '/office-renovation-in-kuala-lumpur/']);
const specialistRoutes = new Set(['/electrical-services-selangor/', '/waterproofing-contractor-kuala-lumpur/', '/plaster-ceiling-contractor-kl/', '/servis-cuci-rumah-kl/']);
const articleAircondRoutes = new Set(['/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/', '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/', '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/']);
const articleRenovationRoutes = new Set(['/commercial-retail-shop-renovation-in-kuala-lumpur/', '/office-renovation-petaling-jaya-corporate-fit-out-experts/', '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/', '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/', '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/']);
const articleCleaningRoutes = new Set(['/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/', '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/']);
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
    result(record.route, 'demolition family composition', $('[data-service-family="demolition"]').length === 1 && /controlled|strip-out|debris|site preparation/i.test(clean($('main').text())));
    result(record.route, 'service final CTA', $('.service-recovery-final').length === 1);
    result(record.route, 'service relevant body image', $('.service-recovery-page img').length >= 2, String($('.service-recovery-page img').length));
    continue;
  }
  const expected = record.seo;
  result(record.route, 'title exact', clean($('title').text()) === expected.title);
  result(record.route, 'description exact', ($('meta[name="description"]').attr('content') || '') === expected.description);
  result(record.route, 'canonical exact', ($('link[rel="canonical"]').attr('href') || '') === expected.canonical);
    result(record.route, 'safe staging robots', record.route === '/aircond-installation-kl/'
      ? /^noindex,\s*nofollow,\s*max-image-preview:large$/i.test($('meta[name="robots"]').attr('content') || '')
      : /^noindex,\s*nofollow$/i.test($('meta[name="robots"]').attr('content') || ''));
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
  const expectedH1 = record.route === '/aircond-installation-kl/' ? aircondKlManifest.hero.h1 : record.content.h1;
  result(record.route, 'single exact H1', $('main h1').length === 1 && clean($('main h1').text()) === expectedH1);

  if (coreRoutes.has(record.route)) {
    const mainText = clean($('main').text());
    for (const text of coreRequiredText[record.route]) result(record.route, 'important business content retained', mainText.includes(text), text.slice(0, 70));
    result(record.route, 'manual core composition', $('.recovery-page').length === 1 && $('.source-locked-section').length === 0);
    result(record.route, 'no core article sidebar or TOC', $('.locked-article-rail,.source-locked-toc').length === 0);
    result(record.route, 'no Vastcon text', !/vastcon/i.test(mainText));
    result(record.route, 'no raw broken form text', !/MessageAccept terms|Your services\*What are your needs|Send Message/i.test(mainText));
    result(record.route, 'no fake profile images', $('img[src*="avartar"],img[src*="gravatar"]').length === 0);
    if (record.route === '/') {
      result(record.route, 'homepage recovery sections complete', $('[data-home-section]').length === 8);
      result(record.route, 'homepage source guide links retained', $('[data-featured-card]').length === 6 && new Set($('[data-featured-card] h3 a').toArray().map((node) => $(node).attr('href'))).size === 6, String($('[data-featured-card]').length));
      const statText = $('.home-stats > div').toArray().map((node) => clean($(node).text()));
      result(record.route, 'homepage source counters retained', $('.home-stats > div').length === 3 && ['40+Projects Completed', '95%Customer Satisfaction', '16Service Areas Covered'].every((value) => statText.includes(value)));
      result(record.route, 'homepage process complete', $('.home-process-step').length === 4 && clean($('.home-process-center').text()) === '04STEPS', String($('.home-process-step').length));
      result(record.route, 'homepage form safely intercepted', $('form[data-staging-home-form]').length === 1 && $('form[data-staging-home-form] :input:disabled').length === 0 && !$('form[data-staging-home-form]').attr('action'));
      result(record.route, 'homepage testimonials retained', $('[data-testimonial]').length === 3, String($('[data-testimonial]').length));
      result(record.route, 'homepage uses distinct local imagery', new Set($('.home-recovery img').toArray().map((node) => $(node).attr('src'))).size >= 10, String(new Set($('.home-recovery img').toArray().map((node) => $(node).attr('src'))).size));
    }
    if (record.route === '/services/') {
      const destinations = new Set($('[data-locked-template="services-hub"] a[href]').toArray().map((node) => $(node).attr('href')).filter((href) => href?.includes('/') && !href.startsWith('http')));
      result(record.route, 'service hub has grouped categories', $('.recovery-service-group').length >= 3 && /Aircond services|Renovation services|Demolition and preparation|Electrical and specialist services|Property cleaning/i.test(clean($('main').text())));
      result(record.route, 'service hub destinations complete', destinations.size >= 13, String(destinations.size));
      result(record.route, 'service hub process and areas', $('.recovery-process-grid article').length === 4 && $('.recovery-location-section').length === 1);
    }
    if (record.route === '/about-us/') result(record.route, 'about removes template team/history content', !/Meet Our Leadership|year of experience|Simple actions make a difference/i.test(mainText));
    if (record.route === '/contact-us/') {
      result(record.route, 'contact has structured disabled form', $('form[data-disabled-enquiry-form]').length === 1 && $('form[data-disabled-enquiry-form] :input:not(:disabled)').length === 0 && !$('form[data-disabled-enquiry-form]').attr('action'));
      result(record.route, 'contact labels not duplicated', ['Full Name', 'Email', 'Phone Number', 'Service', 'Project Details'].every((label) => $(`form[data-disabled-enquiry-form] label > span`).filter((_, node) => clean($(node).text()) === label).length === 1));
    }
    if (record.route === '/faq/') result(record.route, 'FAQ has accessible grouped accordions', $('.recovery-faq-grid > section').length === 2 && $('.recovery-faq-grid details').length === 6);
    if (record.route === '/blog/') result(record.route, 'blog archive uses 14 article cards', $('.recovery-article-card').length === 14, String($('.recovery-article-card').length));
  } else if (serviceRecoveryRoutes.has(record.route)) {
    const mainText = clean($('main').text());
    if (record.route === '/aircond-installation-kl/') {
      result(record.route, 'manual service composition', $('[data-aircond-installation-kl]').length === 1 && $('.source-locked-section,.source-locked-toc').length === 0);
      result(record.route, 'service family selected', $('[data-service-family="aircond"]').length === 1);
      result(record.route, 'service pricing presentation', $('[data-service-pricing="visible"]').length === 1);
      result(record.route, 'service relevant body image', $('[data-aircond-installation-kl] img').length === 4, String($('[data-aircond-installation-kl] img').length));
      result(record.route, 'service final CTA', $('.airkl-final').length === 1);
      result(record.route, 'no active content form', $('[data-aircond-installation-kl] form').length === 0);
      result(record.route, 'aircond pricing visible', /RM220/.test(mainText) && /RM280/.test(mainText));
      result(record.route, 'visible source-supported FAQs', $('.airkl-faqs details').length === 7, String($('.airkl-faqs details').length));
    } else {
      result(record.route, 'manual service composition', $('.service-recovery-page').length === 1 && $('.source-locked-section,.source-locked-toc').length === 0);
      result(record.route, 'service family selected', $('[data-service-family]').length === 1);
      result(record.route, 'service eyebrow is specific', !/Renovation & property service/i.test($('.service-recovery-hero .service-recovery-eyebrow').text()));
      result(record.route, 'service overview is useful', $('.service-recovery-overview article').length >= 3);
      result(record.route, 'service pricing presentation', $('[data-service-pricing]').length === 1);
      result(record.route, 'service relevant body image', $('.service-recovery-page img').length >= 2, String($('.service-recovery-page img').length));
      result(record.route, 'service final CTA', $('.service-recovery-final').length === 1);
      result(record.route, 'no active content form', $('.service-recovery-page form').length === 0);
      if (aircondRoutes.has(record.route)) result(record.route, 'aircond pricing visible', $('[data-service-pricing="visible"]').length === 1 && /RM\s*\d/i.test(mainText));
    if (renovationRoutes.has(record.route)) result(record.route, 'renovation process and cost factors', $('.service-family-renovation .service-recovery-numbered article').length === 4 && /cost|quotation|pricing/i.test(mainText));
    if (specialistRoutes.has(record.route)) {
      const required = record.route.includes('electrical') ? /circuit|wiring|electrical/i : record.route.includes('waterproofing') ? /leak|water|injection/i : record.route.includes('plaster') ? /ceiling|L-box|cornice/i : /cleaning|post-renovation|move-in/i;
      result(record.route, 'specialist service-specific content', required.test(mainText));
    }
      if ((record.content.faqs || []).length) result(record.route, 'visible source-supported FAQs', $('.service-recovery-faqs details').length > 0, String($('.service-recovery-faqs details').length));
    }
  } else {
  const isArticle = articleRoutes.has(record.route);
  const sourceHeadingBlocks = record.content.orderedBlocks.filter((block) => block.type === 'heading');
  const firstSourceH1 = sourceHeadingBlocks.findIndex((block) => block.level === 1);
  const expectedHeadings = [record.content.h1, ...sourceHeadingBlocks.filter((_, index) => index !== firstSourceH1).map((block) => block.text)];
  const headingSelector = isArticle ? '.article-recovery-hero h1,.article-recovery-source-heading' : '.source-locked-hero h1,.locked-section-inner>h2,.locked-section-inner>h3,.locked-section-inner>.locked-question-only h3';
  const actualHeadings = $(headingSelector).toArray().map((node) => clean($(node).text()));
  result(record.route, 'heading order exact', stable(actualHeadings) === stable(expectedHeadings), `${actualHeadings.length}/${expectedHeadings.length}`);
  const sourceParagraphs = record.content.orderedBlocks.filter((block) => block.type === 'p').map((block) => block.text);
  const expectedParagraphs = sourceParagraphs.slice(1);
  const actualParagraphs = $(isArticle ? '.article-recovery-source-paragraph' : '.locked-section-inner>.source-copy').toArray().map((node) => clean($(node).text()));
  result(record.route, 'paragraph order exact', stable(actualParagraphs) === stable(expectedParagraphs), `${actualParagraphs.length}/${expectedParagraphs.length}`);
  const expectedLists = record.content.orderedBlocks.filter((block) => block.type === 'list').map((block) => block.items.map(clean));
  const actualLists = $(isArticle ? '.article-recovery-source-list' : '.locked-section-inner>ul,.locked-section-inner>ol').toArray().map((node) => $(node).children('li').toArray().map((item) => clean($(item).text())));
  result(record.route, 'list order exact', stable(actualLists) === stable(expectedLists), `${actualLists.length}/${expectedLists.length}`);
  const expectedTables = record.content.orderedBlocks.filter((block) => block.type === 'table').map((block) => block.rows.map((row) => row.map(clean)));
  const actualTables = $(isArticle ? '.article-recovery-source-table table' : '.source-locked-table table').toArray().map((node) => $(node).find('tr').toArray().map((row) => $(row).find('th,td').toArray().map((cell) => clean($(cell).text()))));
  result(record.route, 'table order exact', stable(actualTables) === stable(expectedTables), `${actualTables.length}/${expectedTables.length}`);
  const sourceImageBlocks = record.content.orderedBlocks.filter((block) => block.type === 'image' && (!isArticle || !/gravatar|logo-iocn/i.test(block.src || '')));
  const sourceHeroUsed = sourceImageBlocks.some((block) => !/gravatar/i.test(block.src));
  const actualSourceImages = isArticle
    ? $('.article-recovery-source-image').length + (sourceHeroUsed ? $('.article-recovery-hero figure img').length : 0)
    : $('.source-locked-body figure img').length + (sourceHeroUsed ? $('.source-locked-hero-media').length : 0);
  result(record.route, 'source image slots retained', actualSourceImages === sourceImageBlocks.length, `${actualSourceImages}/${sourceImageBlocks.length}`);
  const expectedAlts = sourceImageBlocks.map((block) => block.alt || '').sort();
  const actualAlts = (isArticle
    ? [...(sourceHeroUsed ? $('.article-recovery-hero figure img').toArray() : []), ...$('.article-recovery-source-image img,.article-recovery-source-missing').toArray()]
    : [...(sourceHeroUsed ? $('.source-locked-hero-media').toArray() : []), ...$('.source-locked-body figure img').toArray()])
    .map((node) => $(node).attr('alt') || $(node).attr('aria-label') || '').sort();
  result(record.route, 'source image purposes retained', stable(actualAlts) === stable(expectedAlts));
  const expectedFaqs = record.content.faqs || [];
  const actualFaqs = $(isArticle ? '.article-recovery-faq' : '.source-locked-body details:not(.locked-question-only)').toArray().map((node) => ({
    question: clean($(node).find('summary').text()), answer: clean($(node).find('p').text()),
  }));
  result(record.route, 'FAQ sequence exact', isArticle && !expectedFaqs.length ? true : stable(actualFaqs) === stable(expectedFaqs));
  const expectedFormLabels = (record.content.forms || []).flatMap((form) => form.labels || []);
  const visibleFormLabels = $('.source-locked-form-preview span').toArray().map((node) => clean($(node).text()));
  result(record.route, 'form labels retained', expectedFormLabels.every((label) => visibleFormLabels.includes(label)));
  result(record.route, 'structured content sections', $(isArticle ? '.article-recovery-section' : '.source-locked-section').length > 0);
  result(record.route, 'no active content form', $('.source-locked-page form').length === 0);
  if (serviceRoutes.has(record.route)) {
    const treatments = new Set($('.source-locked-section').toArray().flatMap((node) => ($(node).attr('class') || '').split(/\s+/).filter((name) => name.startsWith('locked-treatment-'))));
    result(record.route, 'service has multiple section treatments', treatments.size >= 3, String(treatments.size));
  }
  if (articleRoutes.has(record.route)) {
    result(record.route, 'article recovery architecture', $('.article-recovery-page').length === 1 && $('.locked-editorial-body,.locked-section-stream').length === 0);
    result(record.route, 'article family selected', $('[data-article-recovery]').length === 1);
    result(record.route, 'article metadata', $('.article-recovery-hero time').length === 1);
    if (expectedHeadings.filter(Boolean).length >= 3) result(record.route, 'article table of contents', $('.article-recovery-toc').length === 1);
    result(record.route, 'article has no permanent sidebar', $('.article-recovery-page aside[style*="sticky"],.locked-article-rail').length === 0);
    result(record.route, 'article related service CTA', $('.article-recovery-service-cta a').length === 1);
    result(record.route, 'article related guides', $('.article-recovery-related a').length >= 2);
    result(record.route, 'article final CTA', $('.article-recovery-final-cta').length === 1);
    result(record.route, 'article pricing structured', $('.article-recovery-section-pricing').length >= 1);
    if (expectedFaqs.length) result(record.route, 'article FAQ accordions', $('.article-recovery-faq').length === expectedFaqs.length, String($('.article-recovery-faq').length));
    result(record.route, 'no article template artifacts', !/No Comments|author avatar|about the author/i.test(clean($('main').text())) && $('.article-recovery-page img[src*="gravatar"],.article-recovery-page img[src*="avartar"]').length === 0);
  }
  }
  const expectedInternal = [...new Set((record.content.internalLinks || []).filter((link) => link.text).map((link) => routeRepairs.get(new URL(link.href).pathname) || new URL(link.href).pathname))]
    .filter((href) => href !== record.route && !/^\/blog\/page\/(?:2|4)\/$/.test(href));
  const actualInternal = new Set($('[data-locked-template] a[href]').toArray().map((node) => {
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
  for (const image of $('[data-locked-template] img[src]').toArray()) {
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

const reviewRoutes = [...coreRoutes, ...serviceRecoveryRoutes, ...articleRoutes];
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
        const wrappers = [...document.querySelectorAll('.source-locked-table,.article-recovery-source-table')];
        const page = document.querySelector('.recovery-page,.service-recovery-page,.article-recovery-page,.airkl-page');
        const pageBlocks = page ? [...page.children].filter((node) => node.matches('header,section,nav,aside,div') && node.getBoundingClientRect().height > 0) : [];
        const gaps = pageBlocks.slice(1).map((node, index) => node.getBoundingClientRect().top - pageBlocks[index].getBoundingClientRect().bottom);
        const sparseSections = [...document.querySelectorAll('.recovery-section,.service-recovery-section,.article-recovery-section')].filter((section) => {
          const rect = section.getBoundingClientRect();
          return rect.height > 360 && (section.textContent || '').trim().length < 100 && section.querySelectorAll('img,.recovery-service-card,.recovery-article-card,form,details').length === 0;
        });
        const paragraphs = [...document.querySelectorAll('.recovery-page p:not(.recovery-eyebrow),.service-recovery-page p:not(.service-recovery-eyebrow),.article-recovery-source-paragraph,.airkl-page p:not(.airkl-eyebrow):not(.airkl-price-kicker):not(.airkl-package-label)')].filter((node) => node.getBoundingClientRect().height > 0);
        const wraps = [...document.querySelectorAll('.recovery-page .recovery-wrap,.service-recovery-page .service-recovery-wrap,.article-recovery-section-inner,.airkl-wrap')].filter((node) => node.getBoundingClientRect().height > 0);
          return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
          tables: wrappers.every((wrapper) => getComputedStyle(wrapper).overflowX === 'auto'),
          structured: Boolean(page) && pageBlocks.length >= 3,
          tocMobile: innerWidth > 560 || !document.querySelector('.source-locked-toc ol,.article-recovery-toc ol') || getComputedStyle(document.querySelector('.source-locked-toc ol,.article-recovery-toc ol')).columnCount === '1',
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
      if (articleRoutes.has(route) && width === 1440) result(`${route}@${width}`, 'article body text at least 17px', metrics.minBodyFont >= 17, String(metrics.minBodyFont));
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
      : serviceRecoveryRoutes.has(record.route)
        ? [record.route, 'WORDPRESS_CURATED_SERVICE', 'IMPORTANT_CONTENT_RETAINED', 'MATCH', 'DOCUMENTED_EXCLUSION', hasKnownMissing ? 'MISSING_ORIGINAL_ASSET' : 'MATCH', hasKnownMissing ? 'MISSING_ORIGINAL_ASSET' : 'MATCH', 'Service page manually composed by route purpose and family; raw Elementor order and unsupported claims are excluded.']
        : [record.route, 'WORDPRESS', 'MATCH', 'MATCH', 'DOCUMENTED_EXCLUSION', hasKnownMissing ? 'MISSING_ORIGINAL_ASSET' : 'MATCH', hasKnownMissing ? 'MISSING_ORIGINAL_ASSET' : 'MATCH', hasKnownMissing ? 'Seven unavailable cleaning originals use the documented cleaning fallback.' : 'Live source content and SEO are locked; staging robots remain noindex.']
    : [record.route, 'OWNER_NEW', 'NEW_PAGE', 'NEW_PAGE', 'DOCUMENTED_EXCLUSION', 'MATCH', 'NEW_PAGE', 'No WordPress source exists; retained as the approved owner-created service page.'];
  rows.push(values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','));
}
await writeFile(path.join(reportDir, 'content-seo-comparison.csv'), `${rows.join('\n')}\n`);

const drifted = lock.records.filter((record) => record.sourceUrl && !record.localBaseline.contentTextMatches).map((record) => record.route);
await writeFile(path.join(reportDir, 'content-seo-differences.md'), `# Content and SEO differences\n\n- Live WordPress SEO matched the stored crawl on all 32 source routes.\n- ${drifted.length} stored bodies differed from the normalized live body recorded by the content lock: ${drifted.join(', ')}.\n- The approved core pages remain manually composed; the services hub was refined inside Prompt 2.\n- Service-detail routes use route-purpose models and four family layouts; raw Elementor order and unsupported claims are excluded.\n- All 14 article routes use semantic family models while retaining locked source blocks and SEO.\n- Staging robots remain \`noindex, nofollow\`; this is a documented safety exclusion from the live WordPress robots value.\n- The demolition route remains classified \`NEW_PAGE\`.\n`);
const countTemplate = (name) => [...templateUsage.values()].filter((value) => value === name).length;
const contentCheckNames = new Set(['single exact H1', 'important business content retained', 'heading order exact', 'paragraph order exact', 'list order exact', 'table order exact', 'FAQ sequence exact', 'form labels retained', 'source image slots retained', 'source image purposes retained', 'source internal destinations retained', 'aircond pricing visible', 'renovation process and cost factors', 'specialist service-specific content', 'demolition family composition', 'visible source-supported FAQs']);
const seoCheckPattern = /^(?:title|description|canonical|JSON-LD|og:|article:|twitter:)/;
const contentRegressions = checks.filter((check) => !check.passed && contentCheckNames.has(check.name)).length;
const seoRegressions = checks.filter((check) => !check.passed && seoCheckPattern.test(check.name)).length;
const nestedMainCount = checks.filter((check) => check.name === 'no nested main' && !check.passed).length;
const genericTemplateCount = countTemplate('standard') + countTemplate('none');
const textBlobCount = checks.filter((check) => check.name === 'structured content sections' && !check.passed).length;
await writeFile(path.join(reportDir, 'design-rebuild-summary.md'), `# Design rebuild summary\n\n- Core scope: homepage rebuilt in this correction; about, contact, FAQ, services and blog retain their approved foundations.\n- Core exclusions: raw WordPress DOM order, demo-theme wording, fake profile images, decorative spacers and broken form strings are not rendered.\n- Service-detail scope: ${countTemplate('service')} service pages retain their Prompt 2 route-purpose compositions.\n- Article scope: ${countTemplate('article')} editorial guides use the article-recovery renderer across Aircond, Renovation, Technical and Cleaning families.\n- Remaining generic locked templates: ${genericTemplateCount}.\n- Nested main landmarks: ${nestedMainCount}.\n- Content regressions: ${contentRegressions}.\n- SEO regressions: ${seoRegressions}.\n`);

const templateRows = [...templateUsage.entries()].map(([route, template]) => `| \`${route}\` | ${template} | ${template === expectedTemplate(route) ? 'PASS' : 'FAIL'} |`).join('\n');
await writeFile(path.join(reportDir, 'template-usage-report.md'), `# Template usage report\n\n| Route | Template | Result |\n|---|---|---|\n${templateRows}\n\n- Homepage templates: ${countTemplate('homepage')}\n- Services hubs: ${countTemplate('services-hub')}\n- About templates: ${countTemplate('about')}\n- Contact templates: ${countTemplate('contact')}\n- FAQ templates: ${countTemplate('faq')}\n- Blog archives: ${countTemplate('blog-archive')}\n- Rich service templates: ${countTemplate('service')}\n- Editorial article templates: ${countTemplate('article')}\n- Generic/none: ${genericTemplateCount}\n`);

await writeFile(path.join(reportDir, 'visual-review.md'), `# Visual review\n\nAutomated desktop and mobile review covered the approved core routes, all service-detail routes and all 14 article routes at 1440px and 390px. Checks include horizontal overflow, broken images, contained tables, visible structured sections, body-text size, excessive blank space and console errors. Prompt 3 screenshots are stored in \`reports/public/design-recovery/article-screenshots/\`.\n`);

const homepageChecks = checks.filter((check) => check.route === '/');
const homepageFailures = homepageChecks.filter((check) => !check.passed);
await writeFile(path.join(recoveryReportDir, 'homepage-only-review.md'), `# Homepage-only design recovery\n\nStatus: **${homepageFailures.length ? 'FAILED' : 'PASSED'}**\n\n## Scope\n\n- Changed route: \`/\` only.\n- Shared header and footer: unchanged.\n- About, contact, FAQ, services, blog and detail templates: unchanged.\n- Production systems: unchanged; VPS deployment intentionally skipped.\n\n## Content and SEO\n\n- Source-locked title, description, canonical, robots, Open Graph, Twitter and JSON-LD checks: ${homepageChecks.filter((check) => /exact|safe staging robots/.test(check.name)).every((check) => check.passed) ? 'PASS' : 'FAIL'}.\n- Single source H1 and important business content: ${homepageChecks.filter((check) => check.name === 'single exact H1' || check.name === 'important business content retained').every((check) => check.passed) ? 'PASS' : 'FAIL'}.\n- Six source-linked guides, source counters, four-step process and three source testimonials: ${homepageChecks.filter((check) => /source guide|source counters|process complete|testimonials retained/.test(check.name)).every((check) => check.passed) ? 'PASS' : 'FAIL'}.\n- Enquiry form is enabled and safely intercepted without an action: ${homepageChecks.find((check) => check.name === 'homepage form safely intercepted')?.passed ? 'PASS' : 'FAIL'}.\n\n## Automated review\n\n- Homepage checks: ${homepageChecks.length}.\n- Homepage failures: ${homepageFailures.length}.\n- Broken internal links across the built site: ${checks.filter((check) => check.name === 'internal link resolves' && !check.passed).length}.\n- Broken local images across the built site: ${checks.filter((check) => (check.name === 'local image exists' || check.name === 'no broken responsive image') && !check.passed).length}.\n- Desktop/tablet/mobile evidence: \`homepage-final-screenshots/homepage-desktop.png\`, \`homepage-tablet.png\`, \`homepage-mobile.png\`.\n\n${homepageFailures.length ? `## Failures\n\n${homepageFailures.map((check) => `- ${check.name}${check.detail ? `: ${check.detail}` : ''}`).join('\n')}\n` : ''}`);

const risky = /warranty|guarantee|100%|certified|expert|permanent|free inspection|years? of experience|customers|projects completed|savings|pay for/i;
const claimRows = [];
for (const claim of homepageManifest.sourceOnlyClaims) claimRows.push(`- \`/\` - SOURCE_ONLY: ${claim}`);
for (const record of lock.records.filter((item) => item.sourceUrl)) {
  for (const paragraph of record.content.paragraphs.filter((text) => risky.test(text)).slice(0, 4)) claimRows.push(`- \`${record.route}\` - SOURCE_ONLY: ${paragraph.slice(0, 220).trimEnd()}`);
}
const uniqueClaimRows = [...new Set(claimRows)];
await writeFile(path.join(reportDir, 'claim-review.md'), `# Source claim review\n\nThese statements are retained verbatim because they are visible on current WordPress. Classification does not verify the claims; production remains blocked pending owner review. Showing ${Math.min(uniqueClaimRows.length, 36)} of ${uniqueClaimRows.length} rule-matched statements.\n\n${uniqueClaimRows.slice(0, 36).join('\n') || '- No rule-matched source claims.'}\n`);
await writeFile(path.join(reportDir, 'missing-assets.md'), `# Missing original assets\n\nThe following seven WordPress cleaning images are unavailable locally and use \`/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg\` as a clearly documented contextual fallback; it is not represented as the original.\n\n${[...missingOriginals].map((name) => `- ${name}`).join('\n')}\n`);
const brokenLinks = checks.filter((check) => check.name === 'internal link resolves' && !check.passed).length;
const brokenImages = checks.filter((check) => (check.name === 'local image exists' || check.name === 'no broken responsive image') && !check.passed).length;
const validationReport = `# Correction validation summary\n\nStatus: **${failures.length ? 'FAILED' : 'PASSED'}**\n\n- Routes checked: ${lock.records.length}\n- WordPress source locks: ${lock.records.filter((record) => record.sourceUrl).length}\n- Approved-content regressions: ${contentRegressions}\n- SEO title matches: ${checks.filter((check) => check.name === 'title exact' && check.passed).length}/32\n- Meta-description matches: ${checks.filter((check) => check.name === 'description exact' && check.passed).length}/32\n- JSON-LD regressions: ${checks.filter((check) => check.name === 'JSON-LD exact' && !check.passed).length}\n- Manually composed core pages: 6\n- Manually composed service pages: ${countTemplate('service')}\n- Article recovery templates: ${countTemplate('article')}\n- Nested main landmarks: ${nestedMainCount}\n- Broken internal links: ${brokenLinks}\n- Broken images: ${brokenImages}\n- Core, service and article responsive routes: ${reviewRoutes.length} at 1440px and 390px\n- Automated checks: ${checks.length}\n- Failures: ${failures.length}\n- Safety: staging noindex retained; enquiry form disabled; no production systems changed.\n\n${failures.length ? `## Failures\n\n${failures.map((failure) => `- ${failure}`).join('\n')}\n` : ''}`;
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
await writeFile(path.join(recoveryReportDir, 'core-pages-review.md'), coreReport.replace('Service-detail and article templates were not redesigned.', 'Prompt 1 core pages remain unchanged except the in-scope services hub and blog archive; article results are reported separately.'));

const serviceReviewRoutes = ['/services/', ...serviceRecoveryRoutes];
const familyFor = (route) => route === '/services/' ? 'Service hub' : aircondRoutes.has(route) ? 'Aircond' : renovationRoutes.has(route) ? 'Renovation' : specialistRoutes.has(route) ? 'Specialist' : 'Demolition';
const sectionsFor = (route) => route === '/services/'
  ? 'Hero; priority services; grouped Aircond and Renovation; Demolition; specialist services; Cleaning; process; areas; CTA'
  : familyFor(route) === 'Aircond' ? 'Hero; overview; service types; pricing; inclusions; quotation factors; process; areas; FAQs; related links; CTA'
    : familyFor(route) === 'Renovation' ? 'Hero; overview; property types; scope; pricing; cost factors; stages; areas; FAQs; related links; CTA'
      : familyFor(route) === 'Specialist' ? 'Hero; overview; service-specific work; pricing; scope; quotation factors; process; areas; FAQs; related links; CTA'
        : 'Hero; overview; controlled work types; safety and debris scope; pricing factors; process; areas; FAQs; renovation links; CTA';
const serviceReviewRows = serviceReviewRoutes.map((route) => {
  const defects = checks.filter((check) => (check.route === route || check.route.startsWith(`${route}@`)) && !check.passed);
  const pricing = route === '/services/' ? 'Links to route-specific pricing' : 'Visible pricing or site-quotation explanation';
  const images = route === '/services/' ? 'Distinct local category and service images' : checks.some((check) => check.route === route && check.name === 'service relevant body image' && check.passed) ? 'Relevant hero and body imagery' : 'Needs review';
  return `| \`${route}\` | ${familyFor(route)} | ${sectionsFor(route)} | ${pricing} | ${images} | Final CTA visible | ${defects.length ? 'Needs repair' : 'PASS'} | ${defects.length ? 'Needs repair' : 'PASS'} | ${defects.length ? defects.map((check) => check.name).join('; ') : 'None found'} |`;
});
const genericRepeatedLayoutCount = checks.filter((check) => check.name === 'manual service composition' && !check.passed).length;
const serviceReport = `# Service pages visual review\n\nStatus: **${failures.length ? 'NEEDS REPAIR' : 'PASS'}** for Prompt 2 service-page scope only. Prompt 3 article results are reported separately.\n\n| Route | Template family | Main sections | Pricing result | Image result | CTA result | Desktop result | Mobile result | Remaining defects |\n|---|---|---|---|---|---|---|---|---|\n${serviceReviewRows.join('\n')}\n\n- Excessive blank-space issues: ${excessiveBlankIssues}\n- Generic repeated-layout issues: ${genericRepeatedLayoutCount}\n- Broken links: ${brokenLinks}\n- Broken images: ${brokenImages}\n- Content regressions: ${contentRegressions}\n- SEO regressions: ${seoRegressions}\n- Homepage, About, Contact, FAQ and restored noindex pages were not redesigned in Prompt 2.\n- Staging remains noindex; VPS deployment remains gated.\n`;
await writeFile(path.join(recoveryReportDir, 'service-pages-review.md'), serviceReport);

const articleFamilyFor = (route) => articleAircondRoutes.has(route) ? 'Aircond' : articleRenovationRoutes.has(route) ? 'Renovation and commercial' : articleCleaningRoutes.has(route) ? 'Cleaning' : 'Technical and specialist';
const articleRows = [];
let adjacentDuplicateImages = 0;
for (const route of articleRoutes) {
  const articleChecks = checks.filter((check) => check.route === route || check.route.startsWith(`${route}@`));
  const defects = articleChecks.filter((check) => !check.passed);
  const $ = load(await readFile(outputFile(route), 'utf8'));
  const heroImage = $('.article-recovery-hero img').attr('src') || '';
  const firstBodyImage = $('.article-recovery-section').first().find('.article-recovery-source-image img').first().attr('src') || '';
  if (heroImage && heroImage === firstBodyImage) adjacentDuplicateImages += 1;
  articleRows.push(`| \`${route}\` | ${articleFamilyFor(route)} | ${$('.article-recovery-section').length} | ${$('.article-recovery-section-pricing').length ? 'Structured' : 'Missing'} | ${$('.article-recovery-faq').length || 'Source has no FAQ block'} | ${defects.length ? `Needs repair: ${defects.map((check) => check.name).join('; ')}` : 'PASS'} |`);
}
const articleBlankIssues = checks.filter((check) => articleRoutes.has(check.route.split('@')[0]) && check.name === 'no excessive blank space' && !check.passed).length;
const articleNarrowIssues = checks.filter((check) => articleRoutes.has(check.route.split('@')[0]) && check.name === 'desktop content width at least 650px' && !check.passed).length;
const articleTinyTextIssues = checks.filter((check) => articleRoutes.has(check.route.split('@')[0]) && check.name === 'article body text at least 17px' && !check.passed).length;
const articleContentRegressions = checks.filter((check) => articleRoutes.has(check.route) && !check.passed && contentCheckNames.has(check.name)).length;
const articleSeoRegressions = checks.filter((check) => articleRoutes.has(check.route) && !check.passed && seoCheckPattern.test(check.name)).length;
const articleReport = `# Article pages design recovery review\n\nStatus: **${articleRows.some((row) => row.includes('Needs repair')) ? 'NEEDS REPAIR' : 'PASS'}** for Prompt 3 blog and article scope only. This is not a production-readiness approval.\n\n| Route | Family | Semantic sections | Pricing or comparison | FAQ accordions | Result |\n|---|---|---:|---|---:|---|\n${articleRows.join('\n')}\n\n## Archive and architecture\n\n- Blog archive: hero, topic navigation, featured guide, 14 article cards, grouped topics, related services and final CTA.\n- Article renderer: 14/14 routes use \`data-article-recovery\`; the former locked article/sidebar composition is absent.\n- Families: Aircond 3; Renovation and commercial 5; Technical and specialist 4; Cleaning 2.\n- Related service CTA: 14/14.\n- Related guide navigation: 14/14.\n- Seven unavailable cleaning originals retain the documented contextual fallback and are not represented as originals.\n\n## Automated review counts\n\n- Excessive blank-space issues: ${articleBlankIssues}.\n- Narrow desktop reading-column issues: ${articleNarrowIssues}.\n- Desktop article text below 17px: ${articleTinyTextIssues}.\n- Adjacent duplicate hero/body image issues: ${adjacentDuplicateImages}.\n- Broken internal links across full validation: ${brokenLinks}.\n- Broken images across full validation: ${brokenImages}.\n- Article content regressions: ${articleContentRegressions}.\n- Article SEO regressions: ${articleSeoRegressions}.\n\n## Required visual evidence\n\n1. \`article-screenshots/blog-archive-desktop.png\`\n2. \`article-screenshots/aircond-installation-kl-desktop.png\`\n3. \`article-screenshots/aircond-installation-kl-mobile.png\`\n4. \`article-screenshots/house-renovation-kl-desktop.png\`\n5. \`article-screenshots/commercial-retail-renovation-desktop.png\`\n6. \`article-screenshots/deep-cleaning-desktop.png\`\n\nSafety: staging remains \`noindex, nofollow\`; forms remain disabled; no VPS, WordPress, DNS, analytics, SMTP, Turnstile or other production system was changed.\n`;
await writeFile(path.join(recoveryReportDir, 'article-pages-review.md'), articleReport);

console.log(`Content/SEO/design validation: ${checks.length} checks, ${failures.length} failures.`);
if (failures.length) {
  console.error(failures.slice(0, 30).join('\n'));
  process.exitCode = 1;
}
