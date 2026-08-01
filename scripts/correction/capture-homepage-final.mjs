import { createReadStream, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const dist = path.join(root, 'dist');
const reportDir = path.join(root, 'reports/public/design-recovery');
const screenshotDir = path.join(reportDir, 'homepage-final-screenshots');
await mkdir(screenshotDir, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  let pathname = decodeURIComponent(url.pathname).replace(/^\/rkreno(?=\/|$)/, '') || '/';
  let file = path.join(dist, pathname.replace(/^\//, ''));
  if (pathname.endsWith('/')) file = path.join(file, 'index.html');
  if (!existsSync(file)) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.setHeader('content-type', mime[path.extname(file).toLowerCase()] || 'application/octet-stream');
  createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await chromium.launch({ headless: true });
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];
const results = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    const failedRequests = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('requestfailed', (request) => failedRequests.push(request.url()));
    await page.goto(`http://127.0.0.1:${port}/rkreno/`, { waitUntil: 'networkidle' });
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
      sections: document.querySelectorAll('[data-home-section]').length,
      featuredCards: document.querySelectorAll('[data-featured-card]').length,
      testimonials: document.querySelectorAll('[data-testimonial]').length,
      enabledFields: document.querySelectorAll('[data-staging-home-form] :is(input,select,textarea,button):not(:disabled)').length,
      heroImageVisible: document.querySelector('.home-hero-image')?.getBoundingClientRect().height > 100,
    }));
    if (viewport.name === 'desktop') {
      await page.locator('[name="your-name"]').fill('Staging Test');
      await page.locator('[name="your-phone"]').fill('0123456789');
      await page.locator('[name="your-email"]').fill('staging@example.test');
      await page.locator('[name="project-type"]').selectOption({ index: 1 });
      await page.locator('[name="your-budget"]').fill('Test budget');
      await page.locator('[name="your-message"]').fill('Staging interaction validation only.');
      await page.locator('[name="consent"]').check();
      let outboundSubmitRequests = 0;
      const watch = (request) => { if (request.method() !== 'GET') outboundSubmitRequests += 1; };
      page.on('request', watch);
      await page.locator('[data-staging-home-form] button[type="submit"]').click();
      metrics.formStatusVisible = await page.locator('[data-form-status]').isVisible();
      metrics.outboundSubmitRequests = outboundSubmitRequests;
      page.off('request', watch);
      await page.evaluate(() => {
        document.querySelector('[data-staging-home-form]')?.reset();
        const status = document.querySelector('[data-form-status]');
        if (status instanceof HTMLElement) status.hidden = true;
      });
    }
    await page.evaluate(() => {
      document.querySelectorAll('.home-recovery img').forEach((image) => { image.loading = 'eager'; });
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForTimeout(500);
    await page.waitForFunction(() => [...document.querySelectorAll('.home-recovery img')].every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 10000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    await page.evaluate(() => document.querySelector('.rk-header')?.classList.remove('is-stuck'));
    await page.addStyleTag({ content: '.rk-header.is-stuck .rk-header__desktop,.rk-header__desktop,.rk-header.is-stuck .rk-mobilebar,.rk-mobilebar{position:static!important;inset:auto!important}' });
    const screenshot = path.join(screenshotDir, `homepage-${viewport.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    results.push({ ...viewport, screenshot: path.relative(root, screenshot).replaceAll('\\', '/'), consoleErrors, failedRequests, ...metrics });
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

const failures = results.flatMap((item) => [
  item.overflow > 1 ? `${item.name}: horizontal overflow ${item.overflow}px` : null,
  item.brokenImages ? `${item.name}: ${item.brokenImages} broken images` : null,
  item.consoleErrors.length ? `${item.name}: console errors` : null,
  item.failedRequests.length ? `${item.name}: failed requests` : null,
  !item.heroImageVisible ? `${item.name}: hero image hidden` : null,
].filter(Boolean));
if (!results[0].formStatusVisible || results[0].outboundSubmitRequests !== 0) failures.push('desktop: staging form interception failed');
await writeFile(path.join(reportDir, 'homepage-final-visual-metrics.json'), `${JSON.stringify({ status: failures.length ? 'FAILED' : 'PASSED', viewports: results, failures }, null, 2)}\n`);
console.log(`HOMEPAGE VISUAL ${failures.length ? 'FAILED' : 'PASSED'}`);
for (const result of results) console.log(`${result.name}: overflow=${result.overflow}, broken=${result.brokenImages}, console=${result.consoleErrors.length}, requests=${result.failedRequests.length}`);
if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exitCode = 1;
}
