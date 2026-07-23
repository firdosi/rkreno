import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { chromium } from 'playwright';

const routes = [
  'house-renovation-in-kuala-lumpur', 'house-renovation-in-selangor',
  'home-renovation-contractor-in-subang-jaya', 'office-renovation-in-kuala-lumpur',
  'waterproofing-contractor-kuala-lumpur', 'plaster-ceiling-contractor-kl',
  'faq', 'blog', 'commercial-retail-shop-renovation-in-kuala-lumpur',
  'office-renovation-petaling-jaya-corporate-fit-out-experts',
  'waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026',
  'plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026',
];
const articleRoutes = new Set(routes.slice(8));
const failures = [];

for (const route of routes) {
  const html = await readFile(path.join('dist', route, 'index.html'), 'utf8');
  const $ = load(html);
  if ($('h1').length !== 1) failures.push(`${route}: expected one H1`);
  if ($('img:not([alt]),img[alt=""]').length) failures.push(`${route}: missing image alt`);
  if (/elementor|woocommerce|gravatar\.com|wp-comments|tag-cloud/i.test(html)) {
    failures.push(`${route}: WordPress/demo/hotlink marker`);
  }
  if (/1,250\+|5000\+|1000\+|24\/7|4\.9\/5|10-year warranty|100% dry|permanent fix|guaranteed/i.test(html)) {
    failures.push(`${route}: unsupported claim`);
  }
  const schema = $('script[type="application/ld+json"]').text();
  if (articleRoutes.has(route) && !schema.includes('BlogPosting')) {
    failures.push(`${route}: missing BlogPosting schema`);
  }
}

const origin = process.argv[2] || 'http://127.0.0.1:4174/rkreno/';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(new URL('faq/', origin).href, { waitUntil: 'networkidle' });
  await page.locator('.mobile-menu > summary').click();
  if (await page.locator('.mobile-menu[open] nav a:visible').count() < 5) {
    failures.push('mobile menu: links did not open');
  }
  await page.locator('.mobile-menu > summary').click();
  const answer = page.locator('.faq-list details').first();
  await answer.locator('summary').focus();
  await page.keyboard.press('Enter');
  if ((await answer.getAttribute('open')) === null) {
    failures.push('FAQ accordion: keyboard toggle failed');
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`Batch 2 content/UI checks failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Batch 2 article, image, claim, mobile-menu and accordion checks passed.');
}
