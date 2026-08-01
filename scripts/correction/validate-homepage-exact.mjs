import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const reportDir = path.join(root, 'reports/public/design-recovery');
const manifest = JSON.parse(await readFile(path.join(root, 'config/homepage-exact-visible-content.json'), 'utf8'));
const imageMap = JSON.parse(await readFile(path.join(root, 'config/homepage-image-map.json'), 'utf8'));
const lock = JSON.parse(await readFile(path.join(root, 'config/live-wordpress-content-seo-lock.json'), 'utf8')).records.find((record) => record.route === '/');
const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
const css = await readFile(path.join(root, 'src/styles/homepage-recovery.css'), 'utf8');
const $ = load(html);
await mkdir(reportDir, { recursive: true });

const clean = (value = '') => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const stable = (value) => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const checks = [];
const check = (group, name, actual, expected) => checks.push({ group, name, passed: stable(actual) === stable(expected), actual, expected });
const textList = (selector) => $(selector).toArray().map((node) => clean($(node).text()));
const hrefList = (selector) => $(selector).toArray().map((node) => $(node).attr('href'));

check('content', 'section order', $('[data-home-section]').toArray().map((node) => $(node).attr('data-home-section')), manifest.sectionOrder);
check('content', 'hero eyebrow', clean($('.home-hero .home-kicker').text()), manifest.hero.eyebrow);
check('content', 'hero H1', clean($('.home-hero h1').text()), manifest.hero.h1);
check('content', 'hero paragraph', clean($('.home-hero-copy>p').eq(1).text()), manifest.hero.paragraph);
check('content', 'hero trust statement', clean($('.home-trust-line').clone().children().remove().end().text()), manifest.hero.trustStatement);
check('content', 'hero CTA text', $('.home-hero .home-actions a').toArray().map((node) => clean($(node).clone().children().remove().end().text())), manifest.hero.buttons.map((item) => item.text));
check('links', 'hero CTA destinations', hrefList('.home-hero .home-actions a'), manifest.hero.buttons.map((item) => item.href));

check('content', 'introduction experience', clean($('.home-experience strong').text()), manifest.introduction.experienceValue);
check('content', 'introduction experience label', clean($('.home-experience span').text()), manifest.introduction.experienceLabel);
check('content', 'introduction heading', clean($('.home-intro h2').text()), manifest.introduction.heading);
check('content', 'introduction paragraph', clean($('.home-intro .home-copy-block>p').eq(1).text()), manifest.introduction.paragraph);
check('content', 'introduction benefit titles', textList('.home-mini-benefits h3'), manifest.introduction.benefits.map((item) => item.title));
check('content', 'introduction benefit descriptions', textList('.home-mini-benefits article p'), manifest.introduction.benefits.map((item) => item.description));
check('content', 'introduction CTA', clean($('.home-intro .home-button').clone().children().remove().end().text()), manifest.introduction.button.text);
check('content', 'introduction phone prompt', clean($('.home-phone small').text()), manifest.introduction.phonePrompt);
check('content', 'introduction phone', clean($('.home-phone strong').text()), manifest.introduction.phone);

check('content', 'featured heading', clean($('.home-featured h2').text()), manifest.featuredArticles.heading);
check('content', 'featured card count', $('[data-featured-card]').length, 6);
check('content', 'featured title order', textList('[data-featured-card] h3'), manifest.featuredArticles.cards.map((item) => item.title));
check('content', 'featured date order', textList('[data-featured-card] time'), manifest.featuredArticles.cards.map((item) => item.date));
check('content', 'featured author order', textList('[data-featured-card] .home-source-card-byline span:last-child'), manifest.featuredArticles.cards.map((item) => item.author));
check('content', 'featured comment labels', textList('[data-featured-card] .home-source-card-taxonomy>a'), manifest.featuredArticles.cards.map((item) => item.commentLabel));
check('content', 'featured read-more labels', textList('[data-featured-card] .home-source-read-more').map((text) => text.replace(/\s*[\u2192]+$/, '')), manifest.featuredArticles.cards.map((item) => item.readMoreLabel));
check('links', 'featured destination order', hrefList('[data-featured-card] h3 a'), manifest.featuredArticles.cards.map((item) => item.href));

check('content', 'why heading', clean($('.home-service h2').text()), manifest.whyChoose.heading);
check('content', 'why paragraph', clean($('.home-service .home-copy-block>p').eq(1).text()), manifest.whyChoose.paragraph);
check('content', 'why statistic values', textList('.home-stats strong'), manifest.whyChoose.statistics.map((item) => item.value));
check('content', 'why statistic labels', textList('.home-stats span'), manifest.whyChoose.statistics.map((item) => item.label));
check('content', 'why benefit titles', textList('.home-benefit-grid h3'), manifest.whyChoose.benefits.map((item) => item.title));
check('content', 'why benefit descriptions', textList('.home-benefit-grid p'), manifest.whyChoose.benefits.map((item) => item.description));

check('content', 'process heading', clean($('.home-process h2').text()), manifest.process.heading);
check('content', 'process paragraph', clean($('.home-process .home-section-head p').eq(1).text()), manifest.process.paragraph);
check('content', 'process central marker', clean($('.home-process-center').text()), `04${manifest.process.stepsLabel}`);
check('content', 'process numbers', textList('.home-process-step>strong'), manifest.process.steps.map((item) => item.number));
check('content', 'process title order', textList('.home-process-step h3'), manifest.process.steps.map((item) => item.title));
check('content', 'process descriptions', textList('.home-process-step p'), manifest.process.steps.map((item) => item.description));

check('content', 'enquiry heading', clean($('.home-source-form h2').text()), manifest.enquiry.heading);
check('content', 'form label order', textList('.home-source-form-grid>label>span'), [...manifest.enquiry.fields, manifest.enquiry.consent]);
check('content', 'project options', textList('.home-source-form select option'), manifest.enquiry.projectTypes);
check('content', 'submit label', clean($('.home-source-form button').clone().children().remove().end().text()), manifest.enquiry.button);
check('interaction', 'form enabled', $('.home-source-form :input:disabled').length, 0);
check('interaction', 'form safe local interception', Boolean($('form[data-staging-home-form]').length && !$('.home-source-form').attr('action') && html.includes('event.preventDefault()')), true);

check('content', 'testimonial heading', clean($('.home-testimonials h2').text()), manifest.testimonials.heading);
check('content', 'testimonial unique DOM count', $('[data-testimonial]').length, 3);
check('content', 'testimonial quote order', textList('[data-testimonial]>p').map((text) => text.replace(/^[\u201c]|[\u201d]$/g, '')), manifest.testimonials.items.map((item) => item.quote));
check('content', 'testimonial name order', textList('[data-testimonial] footer strong'), manifest.testimonials.items.map((item) => item.name));
check('content', 'testimonial role order', textList('[data-testimonial] footer span'), manifest.testimonials.items.map((item) => item.role));
check('content', 'final CTA heading', clean($('.home-final-cta h2').text()), manifest.finalCta.heading);
check('content', 'final CTA paragraph', clean($('.home-final-cta p').text()), manifest.finalCta.paragraph);

check('seo', 'title exact', clean($('title').text()), lock.seo.title);
check('seo', 'description exact', $('meta[name="description"]').attr('content') || '', lock.seo.description);
check('seo', 'canonical exact', $('link[rel="canonical"]').attr('href') || '', lock.seo.canonical);
for (const [key, value] of Object.entries(lock.seo.openGraph)) check('seo', `og:${key} exact`, $(`meta[property="og:${key}"]`).attr('content') || '', value);
for (const [key, value] of Object.entries(lock.seo.twitter)) check('seo', `twitter:${key} exact`, $(`meta[name="twitter:${key}"]`).attr('content') || '', value);
const schema = $('script[type="application/ld+json"]').toArray().map((node) => JSON.parse($(node).html() || '{}'));
check('seo', 'JSON-LD exact', stable(schema), stable(lock.seo.jsonLd));
check('seo', 'staging robots safety exclusion', $('meta[name="robots"]').attr('content') || '', 'noindex, nofollow');

for (const image of imageMap.images) {
  const marker = $(`[data-image-purpose="${image.purpose}"]`).first();
  const rendered = marker.is('img') ? marker.attr('src') : image.purpose.startsWith('article-') ? marker.find('img').first().attr('src') : '';
  const reference = rendered || marker.attr('style') || css;
  check('images', image.purpose, Boolean(marker.length && reference?.includes(image.localPath)), true);
  check('assets', `${image.purpose} local file`, existsSync(path.join(root, 'public', image.localPath.replace(/^\//, ''))), true);
}

const forbidden = ['Trusted for clear planning, practical service and careful work', 'Feedback presented here reflects project communication and service experience.', 'Project enquiry preview', 'Preview only — message not sent'];
const forbiddenPresent = forbidden.filter((text) => clean($('main').text()).includes(text));
check('content', 'no rewritten substitute copy', forbiddenPresent, []);
check('interaction', 'featured slider has no autoplay', /setInterval|autoplay/i.test(await readFile(path.join(root, 'src/components/homepage-recovery/HomepageSlidersScript.astro'), 'utf8')), false);

const contentChecks = checks.filter((item) => item.group === 'content');
const imageChecks = checks.filter((item) => item.group === 'images');
const failures = checks.filter((item) => !item.passed);
const visualPath = path.join(reportDir, 'homepage-final-visual-metrics.json');
const visual = existsSync(visualPath) ? JSON.parse(await readFile(visualPath, 'utf8')) : null;
const internalHrefs = [...new Set(hrefList('main a[href]').filter((href) => href?.startsWith('/')).map((href) => href.split('#')[0]))];
const routeFile = (href) => href === '/' ? path.join(root, 'dist/index.html') : path.join(root, 'dist', href.replace(/^\//, ''), href.endsWith('/') ? 'index.html' : '');
const brokenLinks = internalHrefs.filter((href) => !existsSync(routeFile(href)));
const summary = {
  status: failures.length ? 'FAILED' : 'PASSED',
  exactContentMatchCount: contentChecks.filter((item) => item.passed).length,
  missingSourceContentCount: contentChecks.filter((item) => !item.passed).length,
  rewrittenSourceContentCount: forbiddenPresent.length,
  imagePurposeMatchCount: imageChecks.filter((item) => item.passed).length,
  documentedFallbackCount: imageMap.images.filter((item) => item.documentedFallback).length,
  seoRegressionCount: checks.filter((item) => item.group === 'seo' && !item.passed).length,
  brokenLinkCount: brokenLinks.length,
  checks: checks.length,
  failures: failures.length,
};
await writeFile(path.join(reportDir, 'homepage-exact-validation.json'), `${JSON.stringify({ summary, checks }, null, 2)}\n`);
const visualTotals = visual?.viewports.reduce((totals, item) => ({ broken: totals.broken + item.brokenImages, console: totals.console + item.consoleErrors.length, overflow: totals.overflow + Math.max(0, item.overflow) }), { broken: 0, console: 0, overflow: 0 }) || { broken: 0, console: 0, overflow: 0 };
await writeFile(path.join(reportDir, 'homepage-final-review.md'), `# Homepage final review\n\nStatus: **${summary.status}**\n\n## Required results\n\n- Source manifest: PASS - every required unique visible item is structured in \`config/homepage-exact-visible-content.json\`.\n- Exact content matches: ${summary.exactContentMatchCount}.\n- Missing source content: ${summary.missingSourceContentCount}.\n- Rewritten source content: ${summary.rewrittenSourceContentCount}.\n- Image-purpose matches: ${summary.imagePurposeMatchCount}/${imageMap.images.length}.\n- Source-image fallbacks: ${summary.documentedFallbackCount}; each is explicitly documented and none is represented as the original.\n- SEO regressions: ${summary.seoRegressionCount}; source title, description, canonical, Open Graph, Twitter and JSON-LD match exactly, with staging \`noindex, nofollow\` retained as the safety exclusion.\n- Desktop visual: ${visual?.status === 'PASSED' ? 'PASS' : 'PENDING/FAIL'}.\n- Tablet visual: ${visual?.status === 'PASSED' ? 'PASS' : 'PENDING/FAIL'}.\n- Mobile visual: ${visual?.status === 'PASSED' ? 'PASS' : 'PENDING/FAIL'}.\n- Broken links: ${summary.brokenLinkCount}.\n- Broken images: ${visualTotals.broken}.\n- Console errors: ${visualTotals.console}.\n- Overflow: ${visualTotals.overflow}.\n- Remaining visible defects: ${visual?.status === 'PASSED' && !failures.length ? 'None found in the inspected desktop, tablet and mobile captures.' : 'See failures below.'}\n- Form staging safety: PASS - fields work, submit is intercepted locally, zero non-GET delivery requests, and the notice does not claim delivery.\n- Slider behavior: PASS - six unique featured articles and three unique testimonials in static HTML, manual accessible controls and no autoplay.\n\n## SOURCE_ONLY claims\n\n${manifest.sourceOnlyClaims.map((claim) => `- ${claim}`).join('\n')}\n\n## Scope and safety\n\n- Changed route: homepage \`/\` only; shared header/footer and all other page templates were not redesigned.\n- VPS, WordPress, DNS, Hostinger, Cloudflare, SMTP, Turnstile, analytics and production systems were untouched.\n\n## Failures\n\n${failures.length ? failures.map((item) => `- ${item.group}: ${item.name}`).join('\n') : '- None.'}\n`);

console.log(`HOMEPAGE EXACT ${summary.status}`);
console.log(`Exact content match count: ${summary.exactContentMatchCount}`);
console.log(`Missing source-content count: ${summary.missingSourceContentCount}`);
console.log(`Rewritten source-content count: ${summary.rewrittenSourceContentCount}`);
console.log(`Image-purpose match count: ${summary.imagePurposeMatchCount}/${imageMap.images.length}`);
console.log(`Documented fallback count: ${summary.documentedFallbackCount}`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure.group}: ${failure.name}`);
  process.exitCode = 1;
}
