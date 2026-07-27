import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.argv[2] || 'https://firdosi.github.io/rkreno/';
const url = (route) => new URL(route.replace(/^\/+/, ''), base).href;
const checks = [];
const record = (name, passed, detail = '') => checks.push({ name, passed, detail });
const browser = await chromium.launch({ headless: true });

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await desktop.newPage();
  await page.goto(url('/'), { waitUntil: 'networkidle' });

  const counter = page.locator('[data-counter]').first();
  await counter.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const counterStart = await counter.textContent();
  await page.waitForTimeout(1300);
  const counterEnd = await counter.textContent();
  record('counter reaches its published value', counterEnd === '15+', `${counterStart} -> ${counterEnd}`);

  const homeFeatured = page.locator('[data-testimonial-track] article.featured');
  const firstReview = await homeFeatured.textContent();
  await page.locator('[data-testimonial-next]').click();
  const nextReview = await homeFeatured.textContent();
  record('homepage testimonial control advances', firstReview !== nextReview);

  await page.goto(url('/faq/'), { waitUntil: 'networkidle' });
  const faq = page.locator('main details').first();
  await faq.locator('summary').click();
  record('FAQ accordion opens', await faq.evaluate((node) => node.open));

  await page.goto(url('/our-projects/'), { waitUntil: 'networkidle' });
  const filter = page.locator('[data-project-filter]').filter({ hasText: 'Commercial' }).first();
  await filter.click();
  const hidden = await page.locator('[data-project-categories][hidden]').count();
  record('project filter changes the visible set', hidden > 0, `${hidden} cards hidden`);

  await page.goto(url('/testimonials/'), { waitUntil: 'networkidle' });
  const heldTrack = page.locator('[data-held-testimonial-carousel] .testimonial-track');
  const transformBefore = await heldTrack.evaluate((node) => getComputedStyle(node).transform);
  await page.locator('[data-held-next]').click();
  await page.waitForTimeout(100);
  const transformAfter = await heldTrack.evaluate((node) => getComputedStyle(node).transform);
  record('testimonials-page carousel advances', transformBefore !== transformAfter);
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(url('/'), { waitUntil: 'networkidle' });
  const menu = mobilePage.locator('.exact-mobile-menu');
  await menu.locator('summary').click();
  record('mobile navigation opens', await menu.evaluate((node) => node.open));
  record('mobile navigation exposes service links', await menu.locator('a').first().isVisible());
  record('mobile homepage has no horizontal overflow', await mobilePage.evaluate(
    () => document.documentElement.scrollWidth <= innerWidth + 1,
  ));

  const requests = [];
  mobilePage.on('request', (request) => requests.push(request.url()));
  const form = mobilePage.locator('[data-preview-form]');
  await form.locator('[name="name"]').fill('Parity test');
  await form.locator('[name="phone"]').fill('01100000000');
  await form.locator('[name="service"]').selectOption({ index: 1 });
  await form.locator('[name="projectDetails"]').fill('Interface-only test; do not submit.');
  await form.locator('[name="consent"]').check();
  record('staging form fields are typeable', await form.locator('[name="name"]').inputValue() === 'Parity test');
  record('staging form remains explicitly unconfigured', await form.getAttribute('data-configured') === 'false');
  record('staging form has no action endpoint', (await form.getAttribute('action')) === null);
  record('form test sent no enquiry request', !requests.some((request) => /api\/enquiry|formspree|smtp/i.test(request)));
  await mobile.close();

  const reduced = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(url('/'), { waitUntil: 'networkidle' });
  const reducedFeatured = reducedPage.locator('[data-testimonial-track] article.featured');
  const reducedBefore = await reducedFeatured.textContent();
  await reducedPage.waitForTimeout(6500);
  const reducedAfter = await reducedFeatured.textContent();
  record('reduced motion disables testimonial autoplay', reducedBefore === reducedAfter);
  await reduced.close();
} finally {
  await browser.close();
}

const failures = checks.filter(({ passed }) => !passed);
const result = {
  testedAt: new Date().toISOString(),
  base,
  checks: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  results: checks,
};
await fs.mkdir(path.resolve('reports', 'public'), { recursive: true });
await fs.writeFile(
  path.resolve('reports', 'public', 'final-responsive-interaction-validation.json'),
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
