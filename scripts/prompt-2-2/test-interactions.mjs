import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://127.0.0.1:4322').replace(/\/$/, '');
const routes = [
  '/electrical-services-selangor/',
  '/home-renovation-contractor-in-subang-jaya/',
  '/office-renovation-in-kuala-lumpur/',
  '/waterproofing-contractor-kuala-lumpur/',
  '/plaster-ceiling-contractor-kl/',
  '/servis-cuci-rumah-kl/',
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/',
  '/commercial-retail-shop-renovation-in-kuala-lumpur/',
  '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/',
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/',
  '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/',
  '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/',
  '/office-renovation-petaling-jaya-corporate-fit-out-experts/',
  '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/',
  '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/',
  '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/',
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/',
  '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/',
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/',
  '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/',
];

const browser = await chromium.launch({ headless: true });
const failures = [];
for (const route of routes) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
  if (response?.status() !== 200) failures.push(`${route}: HTTP ${response?.status()}`);

  const menu = page.locator('.exact-mobile-menu');
  if (await menu.count() !== 1 || !await menu.isVisible()) failures.push(`${route}: mobile menu missing`);
  else {
    await menu.locator('summary').click();
    if (!await menu.evaluate((node) => node.open)) failures.push(`${route}: mobile menu did not open`);
    await menu.locator('summary').click();
    if (await menu.evaluate((node) => node.open)) failures.push(`${route}: mobile menu did not close`);
  }

  const details = page.locator('main details');
  if (await details.count() > 0) {
    const first = details.first();
    await first.locator('summary').click();
    if (!await first.evaluate((node) => node.open)) failures.push(`${route}: FAQ/details did not open`);
  }

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    overflowingTables: [...document.querySelectorAll('main table')].filter((table) => {
      const parent = table.parentElement;
      return table.scrollWidth > table.clientWidth && (!parent || getComputedStyle(parent).overflowX === 'visible');
    }).length,
  }));
  if (layout.scrollWidth > layout.clientWidth + 1) failures.push(`${route}: horizontal page overflow`);
  if (layout.overflowingTables) failures.push(`${route}: uncontained table overflow`);
  if (errors.some((message) => !/favicon|ERR_NETWORK_CHANGED|404/i.test(message))) {
    failures.push(`${route}: browser console error`);
  }
  await page.close();
}
await browser.close();

if (failures.length) {
  console.error(`Prompt 2.2 interaction test failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Prompt 2.2 interaction test passed: 20 routes, mobile menus, accordions, tables, overflow and console.');
}
