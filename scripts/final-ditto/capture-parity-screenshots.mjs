import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { loadRegistry, root, routeSlug } from './lib/route-registry.mjs';

const registry = await loadRegistry();
const checkOnly = process.argv.includes('--check');
if (checkOnly) {
  const browser = await chromium.launch({ headless: true });
  await browser.close();
  console.log(`Visual capture infrastructure ready for ${registry.expectedTotals.mirroredRoutes} routes.`);
  process.exit(0);
}
const astroOrigin = process.env.PARITY_ASTRO_ORIGIN || 'http://127.0.0.1:4321';
const cache = path.join(root, '.audit-cache', 'prompt-1-1', 'visual');
const viewports = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};
const manifest = { capturedAt: new Date().toISOString(), astroOrigin, viewports, routes: [] };
const browser = await chromium.launch({ headless: true });

async function stablePage(page, url) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({ content: `
    *,*::before,*::after { animation-duration: 0s !important; caret-color: transparent !important; }
    #wpadminbar,.cookie-notice,.cky-consent-container,.grecaptcha-badge { display:none !important; }
  ` });
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await Promise.race([
      Promise.all([...document.images].map((image) => image.decode?.().catch(() => {}))),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);
    scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => scrollTo(0, 0));
  return response?.status() || 0;
}

try {
  for (const [viewportName, viewport] of Object.entries(viewports)) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    for (const route of registry.publicRoutes.filter(({ mirrored }) => mirrored)) {
      const record = manifest.routes.find(({ path: item }) => item === route.path)
        || { path: route.path, viewports: {} };
      if (!manifest.routes.includes(record)) manifest.routes.push(record);
      const slug = routeSlug(route.path);
      const viewportDir = path.join(cache, viewportName);
      await mkdir(viewportDir, { recursive: true });
      const pair = {};
      for (const [side, url] of [
        ['wordpress', route.sourceUrl],
        ['astro', new URL(route.path.replace(/^\//, ''), `${astroOrigin}/`).href],
      ]) {
        const page = await context.newPage();
        try {
          pair[side] = {
            status: await stablePage(page, url),
            dimensions: await page.evaluate(() => ({
              width: document.documentElement.scrollWidth,
              height: document.documentElement.scrollHeight,
            })),
            boxes: await page.locator('header,main > section,main > article,footer').evaluateAll((nodes) =>
              nodes.map((node) => {
                const box = node.getBoundingClientRect();
                return { tag: node.tagName, x: box.x, y: box.y, width: box.width, height: box.height };
              })),
          };
          await page.screenshot({
            path: path.join(viewportDir, `${slug}-${side}.png`),
            fullPage: true,
            animations: 'disabled',
          });
          for (const [state, selector] of [['header', 'header'], ['footer', 'footer']]) {
            const locator = page.locator(selector).first();
            if (await locator.count()) {
              await locator.screenshot({ path: path.join(viewportDir, `${slug}-${side}-${state}.png`) });
            }
          }
        } catch (error) {
          pair[side] = { error: error.message };
        } finally {
          await page.close();
        }
      }
      record.viewports[viewportName] = pair;
      process.stdout.write(`visual ${viewportName} ${route.path}\n`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
await access(cache);
await writeFile(path.join(cache, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
