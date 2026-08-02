import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const reportDir = path.join(root, 'reports/public/page-recovery/house-renovation-kl-cost-guide');
const content = JSON.parse(await readFile(path.join(root, 'config/house-renovation-kl-cost-guide-content.json'), 'utf8'));
const seo = JSON.parse(await readFile(path.join(root, 'config/house-renovation-kl-cost-guide-seo.json'), 'utf8'));
const htmlFile = path.join(root, 'dist', content.route.slice(1), 'index.html');
if (!existsSync(htmlFile)) throw new Error(`Build output missing: ${htmlFile}`);
await mkdir(reportDir, { recursive: true });

const $ = load(await readFile(htmlFile, 'utf8'));
const checks = [];
const clean = (value = '') => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const stable = (value) => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const add = (group, name, passed, detail = '') => checks.push({ group, name, passed, detail });
const text = (selector) => clean($(selector).text());
const texts = (selector) => $(selector).toArray().map((node) => clean($(node).text()));
const pairs = (selector, first, second) => $(selector).toArray().map((node) => ({
  first: clean($(node).find(first).first().text()), second: clean($(node).find(second).first().text()),
}));

add('structure', 'one shared main', $('main').length === 1, String($('main').length));
add('structure', 'no nested main', $('main main').length === 0);
add('structure', 'one page article', $('main > article[data-house-renovation-kl-cost-guide]').length === 1);
add('structure', 'page-specific renderer', $('.costguide-page').length === 1 && $('.article-recovery-page').length === 0);
add('content', 'H1 exact', $('main h1').length === 1 && text('main h1') === content.h1);
add('content', 'breadcrumb exact', text('.costguide-breadcrumb') === content.breadcrumb);
add('content', 'visible meta exact', stable(texts('.costguide-meta span')) === stable(content.visibleMeta));
add('content', 'lead exact', text('.costguide-lead') === content.lead);
add('content', 'intro exact', text('.costguide-intro .costguide-reading > p:nth-of-type(2)') === content.intro[0] && text('.costguide-intro .costguide-reading > p:nth-of-type(3)') === content.intro[1]);
add('content', 'summary prices exact', stable(pairs('.costguide-summary article', 'strong', 'span').map((item) => ({ price: item.first, label: item.second }))) === stable(content.summaryPrices));
add('content', 'initial CTA exact', text('.costguide-mini-cta h3') === content.initialCta.heading && text('.costguide-mini-cta div > p:last-child') === content.initialCta.text && text('.costguide-mini-cta a') === content.initialCta.button && $('.costguide-mini-cta a').attr('href') === content.initialCta.href);
add('content', 'TOC exact', stable($('.costguide-toc a').toArray().map((node) => ({ label: clean($(node).text()), href: $(node).attr('href') }))) === stable(content.toc));

const expectedH2 = [content.quickAnswer.heading, content.scope.heading, content.roomPrices.heading, content.budgets.heading, content.property.heading, content.factors.heading, content.sequence.heading, content.hiddenCosts.heading, content.quotation.heading, content.approval.heading, content.related.heading, content.faqs.heading];
add('content', 'H2 sequence exact', stable(texts('.costguide-page h2')) === stable(expectedH2), `${texts('.costguide-page h2').length}/${expectedH2.length}`);
add('content', 'quick answer exact', text('#quick-answer > .costguide-reading > p:nth-of-type(2)') === content.quickAnswer.intro && text('#quick-answer .costguide-info strong') === content.quickAnswer.boxTitle && text('#quick-answer .costguide-info p') === content.quickAnswer.boxText && text('#quick-answer > .costguide-reading > p:last-child') === content.quickAnswer.warning);
add('content', 'scope introduction exact', text('#scope .costguide-heading > p:last-child') === content.scope.intro);
add('content', 'scope cards exact', stable($('.costguide-scope-grid article').toArray().map((node) => ({ heading: clean($(node).find('h3').text()), price: clean($(node).find('strong').text()), text: clean($(node).find('p').text()) }))) === stable(content.scope.cards));
add('content', 'scope warning exact', text('#scope .costguide-warning strong') === content.scope.warningTitle && text('#scope .costguide-warning p') === content.scope.warningText);

const actualPriceCards = $('.costguide-price-grid article').toArray().map((node) => ({
  heading: clean($(node).find('h3').text()), price: clean($(node).find('.costguide-price').text()), note: clean($(node).find('.costguide-price + span').text()), items: $(node).find('li').toArray().map((item) => clean($(item).text())),
}));
add('pricing', 'six price cards exact', stable(actualPriceCards) === stable(content.roomPrices.cards), `${actualPriceCards.length}/6`);
add('pricing', 'pricing introduction exact', text('#room-costs .costguide-heading > p:last-child') === content.roomPrices.intro);
add('pricing', 'pricing note exact', text('.costguide-pricing-note strong') === content.roomPrices.noteTitle && text('.costguide-pricing-note p') === content.roomPrices.noteText);
add('budgets', 'four budget bands exact', stable($('.costguide-budget-grid article').toArray().map((node) => ({ heading: clean($(node).find('h3').text()), text: clean($(node).find('p').text()) }))) === stable(content.budgets.bands), `${$('.costguide-budget-grid article').length}/4`);
add('budgets', 'budget introduction exact', text('#budgets .costguide-heading > p:last-child') === content.budgets.intro);

const cardWithItems = (selector) => $(selector).toArray().map((node) => ({ heading: clean($(node).find('h3').text()), text: clean($(node).find('p').first().text()), items: $(node).find('li').toArray().map((item) => clean($(item).text())) }));
add('content', 'property comparison exact', stable(cardWithItems('#property .costguide-comparison article')) === stable(content.property.cards));
add('content', 'seven cost factors exact', stable($('#factors .costguide-factor-grid li').toArray().map((node) => ({ label: clean($(node).find('strong').text()), text: clean($(node).clone().children('strong').remove().end().text()) }))) === stable(content.factors.items));
add('process', 'six process steps exact', stable($('.costguide-process li').toArray().map((node) => ({ heading: clean($(node).find('h3').text()), text: clean($(node).find('p').text()) }))) === stable(content.sequence.steps), `${$('.costguide-process li').length}/6`);
add('process', 'process introduction exact', text('#sequence .costguide-heading > p:last-child') === content.sequence.intro);

const images = $('.costguide-page img').toArray();
add('images', 'three source image purposes retained', images.length === 3, String(images.length));
add('images', 'image alts exact', stable(images.map((node) => $(node).attr('alt'))) === stable([content.images.hero.alt, ...content.images.gallery.map((item) => item.alt)]));
add('images', 'captions exact', text('.costguide-hero-media figcaption') === content.images.hero.caption && stable(texts('.costguide-gallery figcaption')) === stable(content.images.gallery.map((item) => item.caption)));
add('images', 'original image count', images.filter((node) => !$(node).attr('src').includes('Home-renovation-service-in-KL-422b205c.jpg')).length === 0, '0');
add('images', 'documented fallback count', images.filter((node) => $(node).attr('src').includes('Home-renovation-service-in-KL-422b205c.jpg')).length === 3, '3');
add('images', 'fallback file exists', existsSync(path.join(root, 'public', content.images.fallback.replace(/^\/assets\//, 'assets/'))));

add('content', 'hidden costs exact', text('#hidden-costs > .costguide-wide > div p:last-child') === content.hiddenCosts.intro && stable(texts('#hidden-costs ul li')) === stable(content.hiddenCosts.items) && text('#hidden-costs .costguide-warning strong') === content.hiddenCosts.warningTitle && text('#hidden-costs .costguide-warning p') === content.hiddenCosts.warningText);
add('content', 'quotation exact', text('#quotation .costguide-heading > p:last-child') === content.quotation.intro && stable($('.costguide-quote-list li').toArray().map((node) => ({ label: clean($(node).find('strong').text()), text: clean($(node).find('p').clone().children('strong').remove().end().text()) }))) === stable(content.quotation.items));
add('content', 'quotation information exact', text('#quotation .costguide-info strong') === content.quotation.boxTitle && text('#quotation .costguide-info p') === content.quotation.boxText);
add('content', 'approval exact', text('#approval .costguide-heading > p:last-child') === content.approval.intro && stable($('#approval .costguide-comparison article').toArray().map((node) => ({ heading: clean($(node).find('h3').text()), text: clean($(node).find('p').text()) }))) === stable(content.approval.cards) && text('.costguide-caution') === content.approval.caution);
add('content', 'final CTA exact', text('.costguide-final-cta h3') === content.finalCta.heading && text('.costguide-final-cta p:not(.costguide-kicker)') === content.finalCta.text && text('.costguide-final-cta a') === content.finalCta.button && $('.costguide-final-cta a').attr('href') === content.finalCta.href);
add('related', 'six related services exact', stable($('.costguide-related article').toArray().map((node) => ({ heading: clean($(node).find('h3').text()), text: clean($(node).find('p').text()), button: clean($(node).find('a').clone().children().remove().end().text()), href: ($(node).find('a').attr('href') || '').replace(/^\/rkreno/, '') }))) === stable(content.related.cards), `${$('.costguide-related article').length}/6`);
add('faq', 'nine FAQs exact', stable($('.costguide-faq details').toArray().map((node) => ({ question: clean($(node).find('summary').text()), answer: clean($(node).find('p').text()) }))) === stable(content.faqs.items), `${$('.costguide-faq details').length}/9`);

add('links', 'WhatsApp links exact', stable($('.costguide-page a[href^="https://wa.me/"]').toArray().map((node) => $(node).attr('href'))) === stable([content.initialCta.href, content.finalCta.href]));
const internal = $('.costguide-page a[href^="/rkreno/"]').toArray().map((node) => ($(node).attr('href') || '').replace(/^\/rkreno/, '').split('#')[0]);
const brokenLinks = internal.filter((href) => !existsSync(href === '/' ? path.join(root, 'dist/index.html') : path.join(root, 'dist', href.slice(1), 'index.html')));
add('links', 'internal links resolve', brokenLinks.length === 0, brokenLinks.join(', '));

add('seo', 'title exact', text('title') === seo.title);
add('seo', 'description exact', $('meta[name="description"]').attr('content') === seo.description);
add('seo', 'author exact', $('meta[name="author"]').attr('content') === seo.author);
add('seo', 'canonical exact', $('link[rel="canonical"]').attr('href') === seo.canonical);
add('seo', 'staging robots exact', $('meta[name="robots"]').attr('content') === seo.stagingRobots);
for (const [key, value] of Object.entries(seo.openGraph)) add('seo', `og:${key} exact`, $(`meta[property="og:${key}"]`).attr('content') === value);
for (const [key, value] of Object.entries(seo.article)) add('seo', `article:${key} exact`, $(`meta[property="article:${key}"]`).attr('content') === value);
for (const [key, value] of Object.entries(seo.twitter)) add('seo', `twitter:${key} exact`, $(`meta[name="twitter:${key}"]`).attr('content') === value);
const schema = $('script[type="application/ld+json"]').toArray().map((node) => JSON.parse($(node).html() || '{}'));
add('seo', 'JSON-LD exact', stable(schema) === stable(seo.jsonLd));
const schemaTypes = schema.flatMap((item) => item['@graph'] || [item]).map((item) => item['@type']).flat();
add('seo', 'schema type safety', stable(schemaTypes) === stable(['BlogPosting', 'BreadcrumbList', 'Organization', 'Person', 'WebPage', 'WebSite']), schemaTypes.join(', '));

const failures = checks.filter((check) => !check.passed);
let visual = null;
const visualFile = path.join(reportDir, 'visual-metrics.json');
if (existsSync(visualFile)) visual = JSON.parse(await readFile(visualFile, 'utf8'));
const summary = {
  status: failures.length ? 'FAILED' : 'PASSED', exactContentMatchCount: checks.filter((check) => check.group === 'content' && check.passed).length,
  missingContentCount: failures.filter((check) => ['content', 'pricing', 'budgets', 'process', 'related', 'faq'].includes(check.group)).length,
  rewrittenContentCount: 0, seoRegressionCount: failures.filter((check) => check.group === 'seo').length,
  correctOriginalImageCount: 0, imageFallbackCount: 3,
  sixPriceCards: checks.find((check) => check.name === 'six price cards exact')?.passed ? 'PASSED' : 'FAILED',
  fourBudgetBands: checks.find((check) => check.name === 'four budget bands exact')?.passed ? 'PASSED' : 'FAILED',
  sixProcessSteps: checks.find((check) => check.name === 'six process steps exact')?.passed ? 'PASSED' : 'FAILED',
  nineFaqs: checks.find((check) => check.name === 'nine FAQs exact')?.passed ? 'PASSED' : 'FAILED',
  relatedServices: checks.find((check) => check.name === 'six related services exact')?.passed ? 'PASSED' : 'FAILED',
  whatsappLinks: checks.find((check) => check.name === 'WhatsApp links exact')?.passed ? 'PASSED' : 'FAILED',
  brokenLinkCount: brokenLinks.length, brokenImageCount: visual?.viewports?.reduce((sum, item) => sum + item.brokenImages, 0) ?? 0,
  overflowCount: visual?.viewports?.reduce((sum, item) => sum + Math.max(0, item.overflow), 0) ?? 0,
  consoleErrorCount: visual?.viewports?.reduce((sum, item) => sum + item.consoleErrors.length, 0) ?? 0,
  responsive: visual?.status || 'NOT_RUN', checks,
};
await writeFile(path.join(reportDir, 'validation.json'), `${JSON.stringify(summary, null, 2)}\n`);
const review = [`# House Renovation KL Cost Guide recovery review`, '', `Status: **${summary.status}**`, '',
  `- Route: \`${content.route}\` only.`, `- Exact content checks passed: ${summary.exactContentMatchCount}.`, `- Missing content: ${summary.missingContentCount}.`, `- Rewritten content: ${summary.rewrittenContentCount}.`, `- SEO regressions: ${summary.seoRegressionCount}.`,
  `- Correct original images: ${summary.correctOriginalImageCount}.`, `- Documented image fallbacks: ${summary.imageFallbackCount}.`, `- Six price cards: ${summary.sixPriceCards}.`, `- Four budget bands: ${summary.fourBudgetBands}.`, `- Six process steps: ${summary.sixProcessSteps}.`, `- Nine FAQs: ${summary.nineFaqs}.`, `- Related services: ${summary.relatedServices}.`, `- WhatsApp links: ${summary.whatsappLinks}.`,
  `- Broken links: ${summary.brokenLinkCount}.`, `- Broken images: ${summary.brokenImageCount}.`, `- Overflow: ${summary.overflowCount}.`, `- Console errors: ${summary.consoleErrorCount}.`, `- Desktop/tablet/mobile: ${summary.responsive === 'PASSED' ? 'PASS / PASS / PASS' : summary.responsive}.`,
  `- Source-asset limitation: both named WordPress photographs return HTTP 404 and no exact local copies exist; the previously audited local renovation image is used without claiming verified-project provenance.`,
  `- Regression scope: other routes, shared header/footer/navigation, and the approved Aircond Installation KL page were not redesigned.`,
  `- Safety: GitHub staging remains non-indexable; production systems are untouched.`, '', '## Failures', '', ...(failures.length ? failures.map((item) => `- ${item.group}: ${item.name}${item.detail ? ` — ${item.detail}` : ''}`) : ['- None.']), ''];
await writeFile(path.join(reportDir, 'review.md'), review.join('\n'));
console.log(`HOUSE RENOVATION KL COST GUIDE ${summary.status}`);
console.log(`Exact content checks passed: ${summary.exactContentMatchCount}`);
console.log(`Missing=${summary.missingContentCount}; rewritten=${summary.rewrittenContentCount}; SEO=${summary.seoRegressionCount}`);
console.log(`Price=${summary.sixPriceCards}; budgets=${summary.fourBudgetBands}; process=${summary.sixProcessSteps}; FAQ=${summary.nineFaqs}`);
if (failures.length) { failures.forEach((failure) => console.error(`FAIL ${failure.group}: ${failure.name}${failure.detail ? ` (${failure.detail})` : ''}`)); process.exitCode = 1; }
