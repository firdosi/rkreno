import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { finalReviewRoutes, taxonomyRoutes } from './lib/final-review-routes.mjs';

const metrics = JSON.parse(await fs.readFile(
  path.resolve('.audit-cache', 'final-review', 'metrics.json'),
  'utf8',
));
const routeReview = await fs.readFile(
  path.resolve('reports', 'public', 'final-staging-route-review.csv'),
  'utf8',
);
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

expect(finalReviewRoutes.length === 42, 'expected 42 retained routes');
expect(metrics.length === 126, 'expected 126 route/viewport visual records');
for (const route of finalReviewRoutes) {
  const records = metrics.filter((record) => record.route === route.route);
  expect(records.length === 3, `${route.route}: expected three viewport records`);
  for (const record of records) {
    const label = `${record.route} (${record.viewport})`;
    expect(record.status === 200, `${label}: non-200 status`);
    expect(record.errors.length === 0, `${label}: browser errors`);
    expect(record.dom.h1.length === 1, `${label}: expected one H1`);
    expect(record.dom.headingJumps.length === 0, `${label}: heading-level jump`);
    expect(record.dom.brokenImages.length === 0, `${label}: broken images`);
    expect(record.dom.missingAlt.length === 0, `${label}: missing alt text`);
    expect(record.dom.remoteImages.length === 0, `${label}: remote image`);
    expect(record.remoteImageRequests.length === 0, `${label}: remote image request`);
    expect(!record.dom.overflow, `${label}: horizontal overflow`);
    expect(!record.dom.rawWordPress, `${label}: raw WordPress markup`);
    expect(record.dom.forbiddenText.length === 0, `${label}: demo/ecommerce text`);
    expect(record.dom.schemaValid, `${label}: missing or invalid schema`);
    expect(record.dom.telephoneLinks > 0, `${label}: telephone link missing`);
    expect(record.dom.whatsappLinks > 0, `${label}: WhatsApp link missing`);
    if (record.viewport === 'mobile') {
      expect(record.mobileMenu?.opened && record.mobileMenu.links >= 5, `${label}: mobile menu failed`);
    }
  }
  const builtFile = route.route === '/'
    ? path.resolve('dist', 'index.html')
    : path.resolve('dist', route.route.replace(/^\/|\/$/g, ''), 'index.html');
  const html = await fs.readFile(builtFile, 'utf8');
  const expectedCanonical = new URL(route.route.replace(/^\/+/, ''), 'https://rkrenosolution.com/').href;
  expect(/<title>[^<]{2,}<\/title>/.test(html), `${route.route}: title missing`);
  expect(/<meta name="description" content="[^"]{20,}"/.test(html), `${route.route}: description missing`);
  expect(html.includes(`<link rel="canonical" href="${expectedCanonical}">`),
    `${route.route}: production canonical incorrect`);
  expect(/<meta name="robots" content="(?:index|noindex), (?:follow|nofollow)">/.test(html),
    `${route.route}: robots directive missing`);
  expect(/<script type="application\/ld\+json">/.test(html),
    `${route.route}: structured data missing`);
}

expect(!routeReview.includes('OWNER_APPROVED'), 'route review must not mark owner approval');
expect((routeReview.match(/READY_FOR_OWNER_REVIEW/g) || []).length === 40,
  'expected 40 routes ready for owner review');
expect((routeReview.match(/NEEDS_FORM_CONFIGURATION/g) || []).length === 2,
  'expected two form-dependent routes');
for (const route of taxonomyRoutes) {
  const row = routeReview.split(/\r?\n/).find((line) => line.includes(`"${route}"`));
  expect(row?.includes('"NOINDEX_FOLLOW"') && row.includes('"EXCLUDED"'),
    `${route}: archive indexing/sitemap status incorrect`);
}

const localBase = process.argv[2];
if (localBase) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(new URL('faq/', localBase).href, { waitUntil: 'networkidle' });
    const firstDetails = page.locator('details').first();
    await firstDetails.locator('summary').focus();
    await page.keyboard.press('Enter');
    expect(await firstDetails.evaluate((element) => element.open), 'FAQ accordion failed keyboard Enter');

    await page.goto(new URL('contact-us/', localBase).href, { waitUntil: 'networkidle' });
    const form = page.locator('[data-enquiry-form]');
    expect(await form.getAttribute('data-configured') === 'false', 'staging form is configured');
    expect(await form.locator('button[type="submit"]').isDisabled(), 'staging submit is enabled');
    expect((await form.locator('[data-form-status]').textContent()).includes('production endpoint'),
      'staging inactive-form explanation is missing');

    let leadEvents = 0;
    await page.exposeFunction('recordLeadEvent', () => { leadEvents += 1; });
    await page.addInitScript(() => {
      document.addEventListener('rkreno:lead', () => window.recordLeadEvent());
    });
    await page.goto(new URL('thank-you/', localBase).href, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    expect(leadEvents === 0, 'direct thank-you visit fired a lead event');
  } finally {
    await browser.close();
  }
}

const installationHtml = await fs.readFile(
  path.resolve('dist', 'aircond-installation-kl', 'index.html'),
  'utf8',
);
expect(!installationHtml.includes('RM220'), 'unsupported RM220 title remains in built output');
expect(!installationHtml.includes('googletagmanager.com'), 'tracking loaded in non-production build');
expect(!installationHtml.includes('connect.facebook.net'), 'Meta Pixel loaded in non-production build');

if (failures.length) {
  console.error(`Phase 4 acceptance failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Phase 4 acceptance passed for 42 routes and 126 visual records.');
}
