import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = process.cwd();
const baseUrl = process.env.STAGE1_REVIEW_URL || 'http://127.0.0.1:4323/rkreno';
const rawDir = join(root, '.audit-cache', 'prompt-1-3', 'captures');
const visualDir = join(root, 'reports', 'public', 'visuals', 'prompt-1-3');
const captureFilter = process.env.STAGE1_CAPTURE_FILTER || '';
const articleRoutes = [
  ['aircond-installation-guide', '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/'],
  ['commercial-retail-renovation', '/commercial-retail-shop-renovation-in-kuala-lumpur/'],
  ['electrical-safety-guide', '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/'],
  ['house-renovation-kl-guide', '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/'],
  ['house-renovation-selangor-guide', '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/'],
  ['office-renovation-kl-guide', '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/'],
  ['office-renovation-pj-guide', '/office-renovation-petaling-jaya-corporate-fit-out-experts/'],
  ['deep-cleaning-package', '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/'],
  ['plaster-ceiling-guide', '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/'],
  ['pu-injection-guide', '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/'],
  ['aircond-servicing-guide', '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/'],
  ['house-cleaning-guide', '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/'],
  ['aircond-price-guide', '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/'],
  ['waterproofing-guide', '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/'],
];
const archiveUtilityRoutes = [
  ['commercial-archive', '/category/commercial/'],
  ['hvac-guides-archive', '/category/hvac-guides/'],
  ['maintenance-archive', '/category/maintenance/'],
  ['renovation-archive', '/category/renovation/'],
  ['cleaning-archive', '/category/servis-pembersihan/'],
  ['technical-guides-archive', '/category/technical-guides/'],
  ['interior-finishing-tag', '/tag/interior-finishing/'],
  ['office-fit-out-tag', '/tag/office-fit-out/'],
  ['waterproofing-tag', '/tag/waterproofing/'],
  ['thank-you', '/thank-you/'],
  ['custom-404', '/missing-stage1-review-route/'],
];
const groups = { articles: articleRoutes, 'archives-utility': archiveUtilityRoutes };
const viewports = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

await mkdir(rawDir, { recursive: true });
await mkdir(visualDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

async function warmPage(page) {
  await page.evaluate(() => {
    for (const image of document.images) image.loading = 'eager';
  });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 1000) {
    await page.evaluate((position) => window.scrollTo(0, position), y);
    await page.waitForTimeout(45);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(160);
}

for (const [viewportName, viewport] of Object.entries(viewports)) {
  for (const [groupName, routes] of Object.entries(groups)) {
    const outputDir = join(rawDir, viewportName, groupName);
    await mkdir(outputDir, { recursive: true });
    for (const [name, route] of routes) {
      if (captureFilter && !name.includes(captureFilter)) continue;
      const page = await browser.newPage({ viewport });
      const consoleErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => consoleErrors.push(error.message));
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
      const expectedStatus = name === 'custom-404' ? 404 : 200;
      if (response?.status() !== expectedStatus) throw new Error(`${route}: status ${response?.status()}, expected ${expectedStatus}`);
      await warmPage(page);

      if (viewportName === 'mobile') {
        const menu = page.locator('.exact-mobile-menu > summary');
        if (await menu.count()) {
          await menu.click();
          if ((await page.locator('.exact-mobile-menu').getAttribute('open')) === null) throw new Error(`${route}: mobile menu did not open`);
          await menu.click();
        }
        const firstFaq = page.locator('.article-exact-content details').first();
        if (await firstFaq.count()) {
          await firstFaq.locator('summary').click();
          if ((await firstFaq.getAttribute('open')) === null) throw new Error(`${route}: FAQ did not open`);
        }
      }

      const audit = await page.evaluate(() => ({
        h1Count: document.querySelectorAll('h1').length,
        width: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        images: [...document.images].map((image) => ({
          src: image.currentSrc || image.src,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
        })),
      }));
      const brokenImages = audit.images.filter((image) => !image.complete || image.naturalWidth === 0);
      if (audit.h1Count !== 1) throw new Error(`${route}: expected one H1, found ${audit.h1Count}`);
      if (audit.width > audit.clientWidth) throw new Error(`${route}: horizontal overflow at ${viewportName}`);
      if (brokenImages.length) throw new Error(`${route}: broken images`);

      const output = join(outputDir, `${name}.png`);
      await page.screenshot({ path: output, fullPage: true, animations: 'disabled', timeout: 120000 });
      const relevantConsoleErrors = name === 'custom-404' ? [] : consoleErrors;
      results.push({ viewportName, groupName, name, route, output, consoleErrors: relevantConsoleErrors, brokenImages, ...audit });
      await page.close();
    }
  }
}
await browser.close();

const splitRoute = (route, limit = 48) => {
  if (route.length <= limit) return [route, ''];
  let split = route.lastIndexOf('-', limit);
  if (split < 20) split = route.lastIndexOf('/', limit);
  return [route.slice(0, split + 1), route.slice(split + 1)];
};

async function makeSheet(groupName, viewportName, outputName, panelWidth) {
  const routes = groups[groupName];
  const tiles = [];
  for (const [name, route] of routes) {
    const source = join(rawDir, viewportName, groupName, `${name}.png`);
    const metadata = await sharp(source).metadata();
    const scaledHeight = Math.round(metadata.height * panelWidth / metadata.width);
    const image = await sharp(source).resize({
      width: panelWidth,
      height: Math.min(scaledHeight, 5500),
      fit: scaledHeight > 5500 ? 'fill' : 'inside',
    }).png().toBuffer();
    const imageMeta = await sharp(image).metadata();
    const [line1, line2] = splitRoute(route);
    const labelHeight = 70;
    const label = Buffer.from(
      `<svg width="${panelWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#071b37"/>
        <text x="12" y="20" fill="#ff7b00" font-family="Arial" font-size="11" font-weight="700">${name.toUpperCase()}</text>
        <text x="12" y="40" fill="#fff" font-family="Arial" font-size="8.5">${line1}</text>
        <text x="12" y="55" fill="#fff" font-family="Arial" font-size="8.5">${line2}</text>
      </svg>`,
    );
    const tile = await sharp({
      create: { width: panelWidth, height: imageMeta.height + labelHeight, channels: 3, background: '#fff' },
    }).composite([{ input: label, top: 0, left: 0 }, { input: image, top: labelHeight, left: 0 }]).png().toBuffer();
    tiles.push({ tile, height: imageMeta.height + labelHeight });
  }

  const columns = 4;
  const rows = Math.ceil(tiles.length / columns);
  const gap = 12;
  const rowHeights = Array.from({ length: rows }, (_, row) =>
    Math.max(...tiles.slice(row * columns, row * columns + columns).map((item) => item.height)));
  const width = panelWidth * columns + gap * (columns + 1);
  const height = rowHeights.reduce((sum, value) => sum + value, 0) + gap * (rows + 1);
  const composites = [];
  let top = gap;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const item = tiles[row * columns + column];
      if (item) composites.push({ input: item.tile, left: gap + column * (panelWidth + gap), top });
    }
    top += rowHeights[row] + gap;
  }
  await sharp({ create: { width, height, channels: 3, background: '#e7eaee' } })
    .composite(composites)
    .png({ compressionLevel: 9, palette: true, colours: 128, quality: 82 })
    .toFile(join(visualDir, outputName));
}

await makeSheet('articles', 'desktop', 'articles-desktop-contact-sheet.png', 260);
await makeSheet('articles', 'mobile', 'articles-mobile-contact-sheet.png', 190);
await makeSheet('archives-utility', 'desktop', 'archives-utility-desktop-contact-sheet.png', 260);
await makeSheet('archives-utility', 'mobile', 'archives-utility-mobile-contact-sheet.png', 190);
await writeFile(join(rawDir, 'validation.json'), `${JSON.stringify(results, null, 2)}\n`);

const failures = results.filter((result) => result.consoleErrors.length || result.brokenImages.length);
console.log(JSON.stringify({ captures: results.length, failures: failures.length, visualDir }, null, 2));
if (failures.length) {
  console.error(failures.map(({ route, viewportName, consoleErrors }) => ({ route, viewportName, consoleErrors })));
  process.exitCode = 1;
}
