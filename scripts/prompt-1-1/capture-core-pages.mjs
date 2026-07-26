import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = process.cwd();
const baseUrl = process.env.CORE_REVIEW_URL || 'http://127.0.0.1:4322/rkreno';
const rawDir = join(root, '.audit-cache', 'prompt-1-1');
const visualDir = join(root, 'reports', 'public', 'visuals', 'prompt-1-1');
const routes = [
  ['home', '/'],
  ['services', '/services/'],
  ['about-us', '/about-us/'],
  ['contact-us', '/contact-us/'],
  ['faq', '/faq/'],
  ['blog', '/blog/'],
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
  for (let position = 0; position < height; position += 800) {
    await page.evaluate((y) => window.scrollTo(0, y), position);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.evaluate(async () => {
    await Promise.all([...document.images].map(async (image) => {
      if (image.complete) return;
      await new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 5000);
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
      if (route === '/faq/') {
        const secondFaq = page.locator('.core-faq-list details').nth(1);
        await secondFaq.locator('summary').click();
        if ((await secondFaq.getAttribute('open')) === null) throw new Error('FAQ accordion did not open');
      }
    }

    const audit = await page.evaluate(() => ({
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim() || '',
      width: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      images: [...document.images].map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
      })),
      disabledControls: [...document.querySelectorAll('form input, form select, form textarea, form button')]
        .every((control) => control.disabled),
      faqCount: document.querySelectorAll('.core-faq-list details').length,
      articleCount: document.querySelectorAll('.core-blog-grid article').length,
    }));
    const brokenImages = audit.images.filter((image) => !image.complete || image.naturalWidth === 0);
    if (audit.width > audit.clientWidth) throw new Error(`Horizontal overflow on ${route} at ${viewportName}`);
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
    const source = join(rawDir, viewportName, `${name}.png`);
    const image = await sharp(source).resize({ width: panelWidth }).png().toBuffer();
    const meta = await sharp(image).metadata();
    const labelHeight = 54;
    const label = Buffer.from(
      `<svg width="${panelWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#071b37"/>
        <text x="18" y="24" fill="#ff7b00" font-family="Arial" font-size="15" font-weight="700">${name.toUpperCase()}</text>
        <text x="18" y="43" fill="#ffffff" font-family="Arial" font-size="12">${route}</text>
      </svg>`,
    );
    const tile = await sharp({
      create: {
        width: panelWidth,
        height: meta.height + labelHeight,
        channels: 3,
        background: '#ffffff',
      },
    }).composite([{ input: label, left: 0, top: 0 }, { input: image, left: 0, top: labelHeight }]).png().toBuffer();
    tiles.push({ tile, height: meta.height + labelHeight });
  }

  const columns = 2;
  const gap = 18;
  const rowHeights = [0, 1, 2].map((row) =>
    Math.max(...tiles.slice(row * columns, row * columns + columns).map((item) => item.height)),
  );
  const width = panelWidth * columns + gap * (columns + 1);
  const height = rowHeights.reduce((sum, value) => sum + value, 0) + gap * (rowHeights.length + 1);
  const composites = [];
  let top = gap;
  for (let row = 0; row < rowHeights.length; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      composites.push({ input: tiles[index].tile, left: gap + column * (panelWidth + gap), top });
    }
    top += rowHeights[row] + gap;
  }
  await sharp({ create: { width, height, channels: 3, background: '#e7eaee' } })
    .composite(composites)
    .png({ compressionLevel: 9, palette: true, colours: 128, quality: 82 })
    .toFile(join(visualDir, outputName));
}

await makeContactSheet('desktop', 'core-pages-desktop-contact-sheet.png', 430);
await makeContactSheet('mobile', 'core-pages-mobile-contact-sheet.png', 330);
await writeFile(join(rawDir, 'validation.json'), `${JSON.stringify(results, null, 2)}\n`);

const failures = results.filter((result) =>
  result.consoleErrors.some((message) => !message.includes('ERR_NETWORK_CHANGED')) || result.brokenImages.length,
);
console.log(JSON.stringify({
  captures: results.length,
  failures: failures.map(({ viewportName, route, consoleErrors, brokenImages }) => ({
    viewportName,
    route,
    consoleErrors,
    brokenImages,
  })),
  visualDir,
}, null, 2));
if (failures.length) process.exitCode = 1;
