import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = (process.env.PRODUCTION_SIMULATOR_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const routes = [
  '/', '/services/', '/aircond-installation-kl/', '/house-renovation-in-kuala-lumpur/',
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/',
  '/blog/', '/category/maintenance/',
];
const viewports = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
};
const browser = await chromium.launch({ headless: true });
const records = [];

for (const [viewportName, viewport] of Object.entries(viewports)) {
  for (const route of routes) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__rkMetrics = { cls: 0, lcp: 0, tbt: 0 };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__rkMetrics.cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        window.__rkMetrics.lcp = entries.at(-1)?.startTime || 0;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__rkMetrics.tbt += Math.max(0, entry.duration - 50);
      }).observe({ type: 'longtask', buffered: true });
    });
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await page.coverage.startCSSCoverage({ resetOnNavigation: false });
    const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(750);
    const [jsCoverage, cssCoverage, metrics] = await Promise.all([
      page.coverage.stopJSCoverage(), page.coverage.stopCSSCoverage(),
      page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        const images = [...document.images].map((image) => ({
          source: image.currentSrc || image.src,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          width: image.getAttribute('width'),
          height: image.getAttribute('height'),
          loading: image.loading,
        }));
        return {
          ...window.__rkMetrics,
          resources: resources.map((item) => ({
            name: item.name, type: item.initiatorType,
            transferSize: item.transferSize, decodedBodySize: item.decodedBodySize,
          })),
          images,
          renderBlocking: [
            ...document.querySelectorAll('link[rel="stylesheet"],script[src]:not([defer]):not([async])'),
          ].length,
          thirdPartyScripts: [...document.scripts].map((script) => script.src)
            .filter((source) => source && new URL(source).origin !== location.origin),
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        };
      }),
    ]);
    const coverage = (entries) => ({
      total: entries.reduce((sum, item) => sum + item.text.length, 0),
      used: entries.reduce((sum, item) => sum + item.ranges.reduce((rangeSum, range) =>
        rangeSum + range.end - range.start, 0), 0),
    });
    const html = await response.body();
    records.push({
      route, viewport: viewportName, status: response.status(), htmlBytes: html.length,
      lcpMs: Math.round(metrics.lcp), cls: Number(metrics.cls.toFixed(4)),
      totalBlockingTimeMs: Math.round(metrics.tbt),
      css: coverage(cssCoverage), javascript: coverage(jsCoverage),
      cssTransferBytes: metrics.resources.filter((item) =>
        /\.css(?:\?|$)|fonts\.googleapis\.com\/css/i.test(item.name))
        .reduce((sum, item) => sum + item.transferSize, 0),
      javascriptTransferBytes: metrics.resources.filter((item) => /\.js(?:\?|$)/i.test(item.name))
        .reduce((sum, item) => sum + item.transferSize, 0),
      renderBlockingResources: metrics.renderBlocking,
      thirdPartyScripts: metrics.thirdPartyScripts,
      imageSizingFailures: metrics.images.filter((image) =>
        !image.width || !image.height).length,
      eagerImageLoadFailures: metrics.images.filter((image) =>
        image.loading !== 'lazy' && (!image.naturalWidth || !image.naturalHeight)).length,
      deferredLazyImages: metrics.images.filter((image) =>
        image.loading === 'lazy' && (!image.naturalWidth || !image.naturalHeight)).length,
      horizontalOverflow: metrics.scrollWidth > metrics.clientWidth,
    });
    await context.close();
  }
}
await browser.close();
const failures = records.filter((item) =>
  item.status !== 200 || item.imageSizingFailures || item.eagerImageLoadFailures
  || item.horizontalOverflow || item.thirdPartyScripts.length);
await mkdir(path.resolve('.audit-cache', 'prompt-3-1'), { recursive: true });
await writeFile(path.resolve('.audit-cache', 'prompt-3-1', 'performance-result.json'),
  `${JSON.stringify({ methodology: 'Playwright PerformanceObserver and coverage smoke test', records, failures }, null, 2)}\n`);
console.log(JSON.stringify({
  records: records.length,
  maxLcpMs: Math.max(...records.map((item) => item.lcpMs)),
  maxCls: Math.max(...records.map((item) => item.cls)),
  maxTbtMs: Math.max(...records.map((item) => item.totalBlockingTimeMs)),
  imageSizingFailures: records.reduce((sum, item) => sum + item.imageSizingFailures, 0),
  failures: failures.length,
}, null, 2));
if (failures.length) process.exitCode = 1;
