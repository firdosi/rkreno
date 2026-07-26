import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = process.cwd();
const baseUrl = process.env.SERVICE_REVIEW_URL || 'http://127.0.0.1:4322/rkreno';
const rawDir = join(root, '.audit-cache', 'prompt-1-2');
const visualDir = join(root, 'reports', 'public', 'visuals', 'prompt-1-2');
const routes = [
  ['aircond-service-kl', '/servis-aircond-murah-kl/'],
  ['aircond-installation-kl', '/aircond-installation-kl/'],
  ['aircond-installation-selangor', '/upah-pasang-aircond-selangor/'],
  ['building-renovation', '/service/building-renovation/'],
  ['electrical-selangor', '/electrical-services-selangor/'],
  ['house-renovation-kl', '/house-renovation-in-kuala-lumpur/'],
  ['house-renovation-selangor', '/house-renovation-in-selangor/'],
  ['renovation-subang-jaya', '/home-renovation-contractor-in-subang-jaya/'],
  ['office-renovation-kl', '/office-renovation-in-kuala-lumpur/'],
  ['waterproofing-kl', '/waterproofing-contractor-kuala-lumpur/'],
  ['plaster-ceiling-kl', '/plaster-ceiling-contractor-kl/'],
  ['house-cleaning-kl', '/servis-cuci-rumah-kl/'],
];
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
  for (let y = 0; y < height; y += 900) {
    await page.evaluate((position) => window.scrollTo(0, position), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(180);
  await page.evaluate(async () => {
    await Promise.all([...document.images].map(async (image) => {
      if (image.complete) return;
      await new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 4000);
      });
    }));
  });
}

for (const [viewportName, viewport] of Object.entries(viewports)) {
  await mkdir(join(rawDir, viewportName), { recursive: true });
  for (const [name, route] of routes) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
    await warmPage(page);

    if (viewportName === 'mobile') {
      const menu = page.locator('.exact-mobile-menu > summary');
      if (await menu.count()) {
        await menu.click();
        if ((await page.locator('.exact-mobile-menu').getAttribute('open')) === null) {
          throw new Error(`Mobile menu did not open on ${route}`);
        }
        await menu.click();
      }
      const firstFaq = page.locator('.service-exact-faqs details').first();
      if (await firstFaq.count()) {
        await firstFaq.locator('summary').click();
        if ((await firstFaq.getAttribute('open')) === null) throw new Error(`FAQ did not open on ${route}`);
      }
    }

    const audit = await page.evaluate(() => ({
      title: document.title,
      h1Count: document.querySelectorAll('h1').length,
      width: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      images: [...document.images].map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
      })),
      sectionCount: document.querySelectorAll('.service-exact-section').length,
      faqCount: document.querySelectorAll('.service-exact-faqs details').length,
    }));
    const brokenImages = audit.images.filter((image) => !image.complete || image.naturalWidth === 0);
    if (audit.width > audit.clientWidth) throw new Error(`Horizontal overflow on ${route} at ${viewportName}`);
    if (audit.h1Count !== 1) throw new Error(`Expected one H1 on ${route}, found ${audit.h1Count}`);
    if (brokenImages.length) throw new Error(`Broken images on ${route}: ${brokenImages.map((item) => item.src).join(', ')}`);

    const output = join(rawDir, viewportName, `${name}.png`);
    await page.screenshot({ path: output, fullPage: true, timeout: 120000, animations: 'disabled' });
    results.push({ viewportName, name, route, output, consoleErrors, brokenImages, ...audit });
    await page.close();
  }
}
await browser.close();

async function makeContactSheet(viewportName, outputName, panelWidth) {
  const tiles = [];
  for (const [name, route] of routes) {
    const image = await sharp(join(rawDir, viewportName, `${name}.png`)).resize({ width: panelWidth }).png().toBuffer();
    const meta = await sharp(image).metadata();
    const labelHeight = 54;
    const escapedRoute = route.replaceAll('&', '&amp;');
    const label = Buffer.from(
      `<svg width="${panelWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#071b37"/>
        <text x="14" y="23" fill="#ff7b00" font-family="Arial" font-size="13" font-weight="700">${name.toUpperCase()}</text>
        <text x="14" y="42" fill="#ffffff" font-family="Arial" font-size="10">${escapedRoute}</text>
      </svg>`,
    );
    const tile = await sharp({
      create: { width: panelWidth, height: meta.height + labelHeight, channels: 3, background: '#ffffff' },
    }).composite([{ input: label, top: 0, left: 0 }, { input: image, top: labelHeight, left: 0 }]).png().toBuffer();
    tiles.push({ tile, height: meta.height + labelHeight });
  }

  const columns = 3;
  const rows = Math.ceil(tiles.length / columns);
  const gap = 14;
  const rowHeights = Array.from({ length: rows }, (_, row) =>
    Math.max(...tiles.slice(row * columns, row * columns + columns).map((item) => item.height)));
  const width = panelWidth * columns + gap * (columns + 1);
  const height = rowHeights.reduce((sum, value) => sum + value, 0) + gap * (rows + 1);
  const composites = [];
  let top = gap;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      if (tiles[index]) composites.push({ input: tiles[index].tile, left: gap + column * (panelWidth + gap), top });
    }
    top += rowHeights[row] + gap;
  }
  await sharp({ create: { width, height, channels: 3, background: '#e7eaee' } })
    .composite(composites)
    .png({ compressionLevel: 9, palette: true, colours: 128, quality: 82 })
    .toFile(join(visualDir, outputName));
}

await makeContactSheet('desktop', 'service-pages-desktop-contact-sheet.png', 300);
await makeContactSheet('mobile', 'service-pages-mobile-contact-sheet.png', 230);
await writeFile(join(rawDir, 'validation.json'), `${JSON.stringify(results, null, 2)}\n`);

const failures = results.filter((result) =>
  result.consoleErrors.some((message) => !message.includes('ERR_NETWORK_CHANGED')) || result.brokenImages.length);
console.log(JSON.stringify({
  captures: results.length,
  failures: failures.map(({ viewportName, route, consoleErrors }) => ({ viewportName, route, consoleErrors })),
  visualDir,
}, null, 2));
if (failures.length) process.exitCode = 1;
