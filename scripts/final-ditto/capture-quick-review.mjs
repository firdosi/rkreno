import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const liveBase = 'https://rkrenosolution.com/';
const pagesBase = 'https://firdosi.github.io/rkreno/';
const output = path.resolve('.audit-cache', 'final-ditto-review');
const captures = [
  ['home-desktop', '/', { width: 1440, height: 1000 }],
  ['home-mobile', '/', { width: 390, height: 844 }],
  ['service-desktop', '/aircond-installation-kl/', { width: 1440, height: 1000 }],
  ['article-mobile', '/commercial-retail-shop-renovation-in-kuala-lumpur/', { width: 390, height: 844 }],
];

const browser = await chromium.launch({ headless: true });
try {
  for (const [folder, base] of [['live-wordpress', liveBase], ['astro-after', pagesBase]]) {
    await fs.mkdir(path.join(output, folder), { recursive: true });
    for (const [name, route, viewport] of captures) {
      const context = await browser.newContext({ viewport, colorScheme: 'light', locale: 'en-MY' });
      const page = await context.newPage();
      await page.goto(new URL(route.replace(/^\/+/, ''), base).href, {
        waitUntil: 'networkidle',
        timeout: 60_000,
      });
      await page.evaluate(async () => {
        await document.fonts?.ready;
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * .8) {
          scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        scrollTo(0, 0);
      });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(output, folder, `${name}.png`),
        fullPage: true,
      });
      console.log(`${folder} ${name} captured`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
