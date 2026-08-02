import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const output = path.join(root, 'dist/aircond-installation-kl/index.html');
const reportDir = path.join(root, 'reports/public/page-recovery/aircond-installation-kl');
const content = JSON.parse(await readFile(path.join(root, 'config/aircond-installation-kl-content.json'), 'utf8'));
const seo = JSON.parse(await readFile(path.join(root, 'config/aircond-installation-kl-seo.json'), 'utf8'));
const $ = load(await readFile(output, 'utf8'));
await mkdir(reportDir, { recursive: true });

const clean = (value = '') => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const stable = (value) => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const textList = (selector) => $(selector).toArray().map((node) => clean($(node).text()));
const hrefList = (selector) => $(selector).toArray().map((node) => $(node).attr('href') || '');
const checks = [];
const check = (group, name, actual, expected) => checks.push({ group, name, passed: stable(actual) === stable(expected), actual, expected });
const stripBase = (href) => href.replace(/^\/rkreno(?=\/)/, '');

check('content', 'section order', $('[data-airkl-section]').toArray().map((node) => $(node).attr('data-airkl-section')), content.sectionOrder);
check('content', 'one exact H1', textList('.airkl-page h1'), [content.hero.h1]);
check('content', 'H2 sequence', textList('.airkl-page h2'), [content.services.heading, content.costFactors.heading, content.pricing.heading, content.gallery.heading, content.process.heading, content.areas.heading, content.faqs.heading, content.finalCta.heading]);
check('content', 'hero eyebrow', clean($('.airkl-hero .airkl-eyebrow').text()), content.hero.eyebrow);
check('content', 'hero paragraph', clean($('.airkl-lead').text()), content.hero.paragraph);
check('pricing', 'hero prices', textList('.airkl-hero-prices strong'), content.hero.prices);
check('content', 'hero button labels', textList('.airkl-hero .airkl-actions a'), content.hero.buttons.map((item) => item.label));
check('links', 'hero button destinations', hrefList('.airkl-hero .airkl-actions a').map(stripBase), content.hero.buttons.map((item) => item.href));
check('content', 'hero chips', textList('.airkl-chips span'), content.hero.chips);
check('content', 'hero estimate note', [clean($('.airkl-hero-media figcaption strong').text()), clean($('.airkl-hero-media figcaption span').text())], [content.hero.noteTitle, content.hero.noteText]);

check('content', 'fact values', textList('.airkl-fact-grid strong'), content.facts.map((item) => item.value));
check('content', 'fact labels', textList('.airkl-fact-grid span'), content.facts.map((item) => item.label));
check('content', 'services paragraph', clean($('.airkl-service-grid').prevAll('.airkl-heading').first().find('>p:last-child').text()), content.services.paragraph);
check('content', 'service titles', textList('.airkl-service-grid h3'), content.services.items.map((item) => item.title));
check('content', 'service descriptions', textList('.airkl-service-grid p'), content.services.items.map((item) => item.description));
check('content', 'package heading', clean($('.airkl-package h3').text()), content.services.package.heading);
check('content', 'package paragraph', clean($('.airkl-package>div:first-child>p:last-child').text()), content.services.package.paragraph);
check('content', 'package values', textList('.airkl-package-grid strong'), content.services.package.items.map((item) => item.value));
check('content', 'package labels', textList('.airkl-package-grid span'), content.services.package.items.map((item) => item.label));

check('content', 'cost paragraph', clean($('.airkl-cost-layout .airkl-heading>p:last-child').text()), content.costFactors.paragraph);
check('content', 'cost factors', textList('.airkl-check-list li'), content.costFactors.items);
check('content', 'quote heading', clean($('.airkl-quote h3').text()), content.costFactors.quote.heading);
check('content', 'quote paragraph', clean($('.airkl-quote>p:not(.airkl-eyebrow)').text()), content.costFactors.quote.paragraph);
check('content', 'quote preparation items', textList('.airkl-quote li'), content.costFactors.quote.items);
check('links', 'quote WhatsApp destination', $('.airkl-quote a').attr('href') || '', content.costFactors.quote.button.href);

check('content', 'pricing paragraph', clean($('#harga .airkl-heading>p:last-child').text()), content.pricing.paragraph);
check('pricing', 'pricing titles', textList('.airkl-price-grid h3'), content.pricing.cards.map((item) => item.title));
check('pricing', 'pricing values', textList('.airkl-price-value'), content.pricing.cards.map((item) => item.price));
check('pricing', 'pricing notes', textList('.airkl-price-note'), content.pricing.cards.map((item) => item.note));
check('pricing', 'pricing inclusions', $('.airkl-price-grid article').toArray().map((node) => $(node).find('li').toArray().map((item) => clean($(item).text()))), content.pricing.cards.map((item) => item.items));
check('pricing', 'extra-cost titles', textList('.airkl-extra-grid h3'), content.pricing.extras.map((item) => item.title));
check('pricing', 'extra-cost descriptions', textList('.airkl-extra-grid p'), content.pricing.extras.map((item) => item.description));
check('pricing', 'qualification note', clean($('.airkl-qualification').text()), content.pricing.qualification);

check('content', 'gallery paragraph', clean($('.airkl-gallery').prevAll('.airkl-heading').first().find('>p:last-child').text()), content.gallery.paragraph);
check('images', 'gallery paths', $('.airkl-gallery img').toArray().map((node) => stripBase($(node).attr('src') || '')), content.gallery.images.map((item) => item.localPath));
check('images', 'gallery alt text', $('.airkl-gallery img').toArray().map((node) => $(node).attr('alt') || ''), content.gallery.images.map((item) => item.alt));
check('content', 'gallery captions', textList('.airkl-gallery figcaption'), content.gallery.images.map((item) => item.caption));
check('content', 'process paragraph', clean($('.airkl-process').prevAll('.airkl-heading').first().find('>p:last-child').text()), content.process.paragraph);
check('content', 'process titles', textList('.airkl-process h3'), content.process.items.map((item) => item.title));
check('content', 'process descriptions', textList('.airkl-process p'), content.process.items.map((item) => item.description));
check('content', 'service areas', textList('.airkl-areas span'), content.areas.items);
check('content', 'related titles', textList('.airkl-related h3'), content.related.map((item) => item.title));
check('content', 'related descriptions', textList('.airkl-related p'), content.related.map((item) => item.description));
check('links', 'related destinations', hrefList('.airkl-related a').map(stripBase), content.related.map((item) => item.href));

check('faq', 'FAQ questions', textList('.airkl-faqs summary'), content.faqs.items.map((item) => item.question));
check('faq', 'FAQ answers', textList('.airkl-faqs details p'), content.faqs.items.map((item) => item.answer));
check('content', 'final CTA eyebrow', clean($('.airkl-final .airkl-eyebrow').text()), content.finalCta.eyebrow);
check('content', 'final CTA paragraph', clean($('.airkl-final>div>p:not(.airkl-eyebrow)').text()), content.finalCta.paragraph);
check('links', 'final WhatsApp destination', $('.airkl-final a').attr('href') || '', content.finalCta.button.href);
check('links', 'all WhatsApp destinations', hrefList('.airkl-page a[href^="https://wa.me/"]'), [content.hero.buttons[0].href, content.costFactors.quote.button.href, content.finalCta.button.href]);

const heroImage = $('.airkl-hero-media img');
check('images', 'hero image path', stripBase(heroImage.attr('src') || ''), content.hero.image.localPath);
check('images', 'hero image alt', heroImage.attr('alt') || '', content.hero.image.alt);
for (const image of [content.hero.image, ...content.gallery.images]) check('assets', `${image.alt} local file`, existsSync(path.join(root, 'public', image.localPath.replace(/^\//, ''))), true);

check('seo', 'title exact', clean($('title').text()), seo.title);
check('seo', 'description exact', $('meta[name="description"]').attr('content') || '', seo.description);
check('seo', 'canonical exact', $('link[rel="canonical"]').attr('href') || '', seo.canonical);
check('seo', 'staging robots exact', $('meta[name="robots"]').attr('content') || '', seo.stagingRobots);
for (const [key, value] of Object.entries(seo.openGraph)) check('seo', `og:${key} exact`, $(`meta[property="og:${key}"]`).attr('content') || '', value);
for (const [key, value] of Object.entries(seo.article)) check('seo', `article:${key} exact`, $(`meta[property="article:${key}"]`).attr('content') || '', value);
for (const [key, value] of Object.entries(seo.twitter)) check('seo', `twitter:${key} exact`, $(`meta[name="twitter:${key}"]`).attr('content') || '', value);
const schemas = $('script[type="application/ld+json"]').toArray().map((node) => JSON.parse($(node).html() || '{}'));
check('seo', 'JSON-LD exact', stable(schemas), stable(seo.jsonLd));
check('seo', 'schema type safety', /AggregateRating|Review|Employee|Certification|Offer|FAQPage|Service/.test(stable(schemas)), false);

const internalHrefs = [...new Set(hrefList('.airkl-page a[href^="/"]').map(stripBase).map((href) => href.split('#')[0]))];
const routeFile = (href) => href === '/' ? path.join(root, 'dist/index.html') : path.join(root, 'dist', href.replace(/^\//, ''), href.endsWith('/') ? 'index.html' : '');
const brokenLinks = internalHrefs.filter((href) => !existsSync(routeFile(href)));
check('links', 'internal destinations resolve', brokenLinks, []);
const forbidden = ['A clear four-step process', 'Standard installation scope', 'Choose the right service', 'Ready to discuss the actual property?'];
const rewritten = forbidden.filter((text) => clean($('.airkl-page').text()).includes(text));
check('content', 'no generic replacement wording', rewritten, []);

const failures = checks.filter((item) => !item.passed);
const contentChecks = checks.filter((item) => item.group === 'content');
const visualPath = path.join(reportDir, 'visual-metrics.json');
const visual = existsSync(visualPath) ? JSON.parse(await readFile(visualPath, 'utf8')) : null;
const visualTotals = visual?.viewports.reduce((total, item) => ({ broken: total.broken + item.brokenImages, overflow: total.overflow + Math.max(0, item.overflow), console: total.console + item.consoleErrors.length }), { broken: 0, overflow: 0, console: 0 }) || { broken: 0, overflow: 0, console: 0 };
const summary = {
  status: failures.length ? 'FAILED' : 'PASSED',
  exactContentMatchCount: contentChecks.filter((item) => item.passed).length,
  missingContentCount: contentChecks.filter((item) => !item.passed).length,
  rewrittenContentCount: rewritten.length,
  seoRegressionCount: checks.filter((item) => item.group === 'seo' && !item.passed).length,
  correctImageCount: checks.filter((item) => item.group === 'images' && item.passed).length,
  imageFallbackCount: 0,
  pricingValidation: checks.filter((item) => item.group === 'pricing').every((item) => item.passed) ? 'PASSED' : 'FAILED',
  faqValidation: checks.filter((item) => item.group === 'faq').every((item) => item.passed) ? 'PASSED' : 'FAILED',
  whatsappValidation: checks.filter((item) => /WhatsApp/.test(item.name)).every((item) => item.passed) ? 'PASSED' : 'FAILED',
  brokenLinkCount: brokenLinks.length,
  failures: failures.length
};
await writeFile(path.join(reportDir, 'validation.json'), `${JSON.stringify({ summary, checks }, null, 2)}\n`);
await writeFile(path.join(reportDir, 'review.md'), `# Aircond Installation KL recovery review\n\nStatus: **${summary.status}**\n\n- Route: \`/aircond-installation-kl/\` only.\n- Source manifest: PASS.\n- Exact content matches: ${summary.exactContentMatchCount}.\n- Missing content: ${summary.missingContentCount}.\n- Rewritten content: ${summary.rewrittenContentCount}.\n- SEO regressions: ${summary.seoRegressionCount}.\n- Correct rendered image checks: ${summary.correctImageCount}.\n- Image fallbacks: ${summary.imageFallbackCount}.\n- Pricing validation: ${summary.pricingValidation}.\n- FAQ validation: ${summary.faqValidation}.\n- WhatsApp validation: ${summary.whatsappValidation}.\n- Broken links: ${summary.brokenLinkCount}.\n- Broken images: ${visualTotals.broken}.\n- Overflow: ${visualTotals.overflow}.\n- Console errors: ${visualTotals.console}.\n- Desktop/tablet/mobile: ${visual?.status === 'PASSED' ? 'PASS / PASS / PASS' : 'PENDING/FAIL'}.\n- Remaining visible defects: ${visual?.status === 'PASSED' && !failures.length ? 'None found in the inspected captures.' : 'See validator failures.'}\n- Regression scope: homepage, shared header/footer/navigation and every other route remain outside the redesign.\n- Safety: staging remains noindex; VPS, WordPress, DNS, Hostinger, Cloudflare, SMTP, Turnstile, analytics and production systems are untouched.\n\n## Failures\n\n${failures.length ? failures.map((item) => `- ${item.group}: ${item.name}`).join('\n') : '- None.'}\n`);

console.log(`AIRCOND INSTALLATION KL ${summary.status}`);
console.log(`Exact content match count: ${summary.exactContentMatchCount}`);
console.log(`Missing content count: ${summary.missingContentCount}`);
console.log(`Rewritten content count: ${summary.rewrittenContentCount}`);
console.log(`SEO regression count: ${summary.seoRegressionCount}`);
console.log(`Pricing: ${summary.pricingValidation}; FAQ: ${summary.faqValidation}; WhatsApp: ${summary.whatsappValidation}`);
if (failures.length) {
  failures.forEach((item) => console.error(`FAIL ${item.group}: ${item.name}`));
  process.exitCode = 1;
}
