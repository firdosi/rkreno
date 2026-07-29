import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { inventoryHtml } from './lib/semantic-inventory.mjs';
import { loadRegistry, root, routeSlug } from './lib/route-registry.mjs';

const registry = await loadRegistry();
const mirrored = registry.publicRoutes.filter(({ mirrored }) => mirrored);
const cache = path.join(root, '.audit-cache', 'prompt-1-1');
const viewports = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};
const withScreenshots = process.argv.includes('--screenshots');
const manifest = {
  schemaVersion: 1,
  capturedAt: new Date().toISOString(),
  origin: registry.productionOrigin,
  viewports,
  screenshotCapture: withScreenshots,
  routes: [],
};

for (const folder of [
  'live-wordpress', 'source-html', 'source-semantics', 'source-screenshots',
  'source-interactions',
]) {
  await mkdir(path.join(cache, folder), { recursive: true });
}

const browser = await chromium.launch({ headless: true });
try {
  for (const [viewportName, viewport] of Object.entries(viewports)) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.addStyleTag({ content: `
      html { scroll-behavior: auto !important; }
      *,*::before,*::after { animation-delay: 0s !important; animation-duration: 0s !important; caret-color: transparent !important; }
      #wpadminbar,.cookie-notice,.cky-consent-container,.grecaptcha-badge { display: none !important; }
    ` }).catch(() => {});
    for (const route of mirrored) {
      const slug = routeSlug(route.path);
      const record = manifest.routes.find(({ path: item }) => item === route.path)
        || { path: route.path, sourceUrl: route.sourceUrl, captures: {} };
      if (!manifest.routes.includes(record)) manifest.routes.push(record);
      try {
        const response = await page.goto(route.sourceUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 45000,
        });
        await page.evaluate(async () => {
          await document.fonts?.ready;
          const imagePromises = [...document.images].map((image) => image.complete
            ? Promise.resolve() : new Promise((resolve) => {
              image.addEventListener('load', resolve, { once: true });
              image.addEventListener('error', resolve, { once: true });
            }));
          await Promise.race([
            Promise.all(imagePromises),
            new Promise((resolve) => setTimeout(resolve, 8000)),
          ]);
          scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(500);
        await page.evaluate(() => scrollTo(0, 0));
        const dimensions = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
        }));
        record.captures[viewportName] = {
          status: response?.status() || 0,
          dimensions,
        };
        if (viewportName === 'desktop') {
          const html = await page.content();
          const semantics = inventoryHtml(html, { route: route.path, origin: 'wordpress' });
          const interactions = await page.evaluate(() => ({
            stickyHeader: Boolean(document.querySelector('header[class*="sticky"],.sticky-header,[data-sticky-header]')),
            desktopDropdown: document.querySelectorAll('header .sub-menu,header [class*="dropdown"]').length,
            mobileMenu: document.querySelectorAll('[class*="mobile-menu"],[data-mobile-menu]').length,
            carousel: document.querySelectorAll('.swiper,.slick-slider,[data-carousel]').length,
            slider: document.querySelectorAll('[class*="slider"],[data-slider]').length,
            previousControl: document.querySelectorAll('.swiper-button-prev,.slick-prev,[data-prev]').length,
            nextControl: document.querySelectorAll('.swiper-button-next,.slick-next,[data-next]').length,
            dotNavigation: document.querySelectorAll('.swiper-pagination,.slick-dots,[data-dots]').length,
            counters: document.querySelectorAll('[data-counter],[class*="counter"]').length,
            accordions: document.querySelectorAll('details,[class*="accordion"]').length,
            tabs: document.querySelectorAll('[role="tab"],[data-tab]').length,
            projectFilter: document.querySelectorAll('[data-project-filter],[class*="project-filter"]').length,
            forms: document.querySelectorAll('form').length,
            stickySidebar: document.querySelectorAll('aside[class*="sticky"],[data-sticky-sidebar]').length,
            floatingPhone: document.querySelectorAll('a[href^="tel:"]').length,
            floatingWhatsApp: document.querySelectorAll('a[href*="wa.me"],a[href*="whatsapp"]').length,
          }));
          await writeFile(path.join(cache, 'source-html', `${slug}.html`), html);
          await writeFile(path.join(cache, 'source-semantics', `${slug}.json`),
            `${JSON.stringify(semantics, null, 2)}\n`);
          await writeFile(path.join(cache, 'source-interactions', `${slug}.json`),
            `${JSON.stringify({ route: route.path, ...interactions }, null, 2)}\n`);
        }
        if (withScreenshots) {
          const screenshotDir = path.join(cache, 'source-screenshots', viewportName);
          await mkdir(screenshotDir, { recursive: true });
          await page.screenshot({
            path: path.join(screenshotDir, `${slug}.png`),
            fullPage: true,
            animations: 'disabled',
          });
        }
        process.stdout.write(`source ${viewportName} ${route.path}\n`);
      } catch (error) {
        record.captures[viewportName] = { error: error.message };
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(path.join(cache, 'live-wordpress', 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`);
const failures = manifest.routes.flatMap(({ path: route, captures }) =>
  Object.entries(captures).filter(([, value]) => value.error || value.status !== 200)
    .map(([viewport, value]) => ({ route, viewport, ...value })));
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
