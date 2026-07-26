import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = process.cwd();
const phase = process.env.PROMPT21_PHASE || 'before';
const astroBase = (process.env.PROMPT21_ASTRO_URL || 'https://firdosi.github.io/rkreno').replace(/\/$/, '');
const rawRoot = join(root, '.audit-cache', 'prompt-2-1');
const liveDir = join(rawRoot, 'live-wordpress', phase);
const astroDir = join(rawRoot, `astro-${phase}`);
const visualDir = join(root, 'reports', 'public', 'visuals', 'prompt-2-1');
const internalVisualDir = join(rawRoot, `${phase}-side-by-side`);

const groups = {
  core: [
    ['home', '/'],
    ['services', '/services/'],
    ['about', '/about-us/'],
    ['contact', '/contact-us/'],
    ['faq', '/faq/'],
    ['blog', '/blog/'],
  ],
  'high-value-services': [
    ['aircond-service', '/servis-aircond-murah-kl/'],
    ['aircond-installation-kl', '/aircond-installation-kl/'],
    ['aircond-installation-selangor', '/upah-pasang-aircond-selangor/'],
    ['building-renovation', '/service/building-renovation/'],
    ['house-renovation-kl', '/house-renovation-in-kuala-lumpur/'],
    ['house-renovation-selangor', '/house-renovation-in-selangor/'],
  ],
};
const routes = Object.values(groups).flat();
const viewports = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

for (const directory of [liveDir, astroDir, visualDir, internalVisualDir]) {
  await mkdir(directory, { recursive: true });
}

const browser = await chromium.launch({ headless: true });
const records = [];

async function warm(page) {
  await page.addStyleTag({
    content: `
      *,*::before,*::after{animation:none!important;transition:none!important}
      .elementor-invisible,.elementor-element,.pxl-swiper-container{
        opacity:1!important;visibility:visible!important;transform:none!important
      }`,
  });
  await page.evaluate(() => {
    for (const image of document.images) image.loading = 'eager';
  });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 900) {
    await page.evaluate((position) => window.scrollTo(0, position), y);
    await page.waitForTimeout(70);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.complete
      ? undefined
      : new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
          setTimeout(resolve, 5000);
        })));
  });
  await page.waitForTimeout(350);
}

async function capture(site, base, outputDir, name, route, viewportName, viewport) {
  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136 Safari/537.36',
  });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await warm(page);
  const metrics = await page.evaluate(() => {
    const clean = (value = '') => value.replace(/\s+/g, ' ').trim();
    const visible = (element) => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
    };
    const text = (selector) => [...document.querySelectorAll(selector)].filter(visible).map((node) => clean(node.textContent)).filter(Boolean);
    return {
      title: document.title,
      h1: text('main h1'),
      headings: text('main h1,main h2,main h3,main h4'),
      paragraphs: text('main p'),
      listItems: text('main li'),
      tableRows: text('main table tr'),
      faqQuestions: text('main details summary'),
      buttons: [...document.querySelectorAll('main a,main button')].filter(visible).map((node) => ({
        label: clean(node.textContent),
        href: node instanceof HTMLAnchorElement ? node.href : '',
      })).filter((item) => item.label),
      images: [...document.images].filter(visible).map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt,
        width: image.naturalWidth,
        height: image.naturalHeight,
      })),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
    };
  });
  const output = join(outputDir, viewportName, `${name}.png`);
  await mkdir(join(outputDir, viewportName), { recursive: true });
  await page.screenshot({ path: output, fullPage: true, animations: 'disabled', timeout: 120000 });
  records.push({
    phase, site, route, viewportName, status: response?.status(), output, consoleErrors, ...metrics,
  });
  await page.close();
}

for (const [viewportName, viewport] of Object.entries(viewports)) {
  for (const [name, route] of routes) {
    await capture('wordpress', 'https://rkrenosolution.com', liveDir, name, route, viewportName, viewport);
    await capture('astro', astroBase, astroDir, name, route, viewportName, viewport);
  }
}
await browser.close();

const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

async function comparisonTile(groupName, name, route, viewportName, panelWidth) {
  const leftPath = join(liveDir, viewportName, `${name}.png`);
  const rightPath = join(astroDir, viewportName, `${name}.png`);
  const left = await sharp(leftPath).resize({ width: panelWidth }).png().toBuffer();
  const right = await sharp(rightPath).resize({ width: panelWidth }).png().toBuffer();
  const leftMeta = await sharp(left).metadata();
  const rightMeta = await sharp(right).metadata();
  const labelHeight = 72;
  const gap = 8;
  const width = panelWidth * 2 + gap;
  const height = labelHeight + Math.max(leftMeta.height, rightMeta.height);
  const label = Buffer.from(`<svg width="${width}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#071b37"/>
    <text x="12" y="22" fill="#ff7b00" font-family="Arial" font-size="13" font-weight="700">${escapeXml(name.toUpperCase())}</text>
    <text x="12" y="43" fill="#fff" font-family="Arial" font-size="10">${escapeXml(route)}</text>
    <text x="${Math.floor(panelWidth / 2)}" y="62" text-anchor="middle" fill="#fff" font-family="Arial" font-size="10">CURRENT WORDPRESS</text>
    <text x="${panelWidth + gap + Math.floor(panelWidth / 2)}" y="62" text-anchor="middle" fill="#fff" font-family="Arial" font-size="10">CORRECTED ASTRO</text>
  </svg>`);
  const tile = await sharp({ create: { width, height, channels: 3, background: '#e8ebef' } })
    .composite([
      { input: label, left: 0, top: 0 },
      { input: left, left: 0, top: labelHeight },
      { input: right, left: panelWidth + gap, top: labelHeight },
    ]).png().toBuffer();
  return { groupName, tile, width, height };
}

async function contactSheet(groupName, viewportName, outputPath) {
  const panelWidth = viewportName === 'desktop' ? 260 : 180;
  const tiles = [];
  for (const [name, route] of groups[groupName]) {
    tiles.push(await comparisonTile(groupName, name, route, viewportName, panelWidth));
  }
  const columns = 2;
  const gap = 14;
  const rows = Math.ceil(tiles.length / columns);
  const rowHeights = Array.from({ length: rows }, (_, row) =>
    Math.max(...tiles.slice(row * columns, row * columns + columns).map((tile) => tile.height)));
  const width = tiles[0].width * columns + gap * (columns + 1);
  const height = rowHeights.reduce((sum, value) => sum + value, 0) + gap * (rows + 1);
  const composites = [];
  let top = gap;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      if (tiles[index]) composites.push({
        input: tiles[index].tile,
        left: gap + column * (tiles[index].width + gap),
        top,
      });
    }
    top += rowHeights[row] + gap;
  }
  await sharp({ create: { width, height, channels: 3, background: '#dfe3e8' } })
    .composite(composites)
    .png({ compressionLevel: 9, palette: true, colours: 160, quality: 86 })
    .toFile(outputPath);
}

for (const groupName of Object.keys(groups)) {
  for (const viewportName of ['desktop', 'mobile']) {
    const fileName = `${groupName}-${viewportName}-side-by-side-contact-sheet.png`;
    const outputPath = phase === 'after' ? join(visualDir, fileName) : join(internalVisualDir, fileName);
    await contactSheet(groupName, viewportName, outputPath);
  }
}
await writeFile(join(rawRoot, `${phase}-metrics.json`), `${JSON.stringify(records, null, 2)}\n`);

const failures = records.filter((record) =>
  record.status !== 200
  || record.scrollWidth > record.clientWidth
  || (record.site === 'astro' && record.h1.length !== 1)
  || (record.site === 'astro' && record.images.some((image) => !image.width || !image.height))
  || record.consoleErrors.some((message) => !/favicon|ERR_NETWORK_CHANGED|404/i.test(message)));
console.log(JSON.stringify({ phase, captures: records.length, failures: failures.map(({ site, route, viewportName }) => ({ site, route, viewportName })) }, null, 2));
if (failures.length) process.exitCode = 1;
