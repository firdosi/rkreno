import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = process.cwd();
const rawDir = join(root, '.audit-cache', 'exact-wordpress-homepage');
const reviewDir = join(root, 'reports', 'public', 'visuals', 'homepage-exact-review');
const liveUrl = 'https://rkrenosolution.com/';
const localUrl = 'http://127.0.0.1:4322/rkreno/';
const sizes = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};
const astroOnly = process.argv.includes('--astro-only');

await mkdir(rawDir, { recursive: true });
await mkdir(reviewDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

async function warmPage(page) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 700) {
    await page.evaluate((position) => window.scrollTo(0, position), y);
    await page.waitForTimeout(180);
  }
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
}

async function capture(url, label, name, viewport) {
  const page = await browser.newPage({
    viewport,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136 Safari/537.36',
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await warmPage(page);
  if (label === 'wordpress') {
    await page.addStyleTag({
      content: '.elementor-invisible,.elementor-element,.pxl-swiper-container{opacity:1!important;visibility:visible!important;transform:none!important;animation:none!important}',
    });
    await page.waitForTimeout(300);
  }
  const output = join(rawDir, `${label}-${name}-${viewport.width}.png`);
  await page.screenshot({ path: output, fullPage: true });
  await page.close();
  return output;
}

const captures = {};
for (const [name, viewport] of Object.entries(sizes)) {
  captures[`wordpress-${name}`] = join(rawDir, `wordpress-${name}-${viewport.width}.png`);
  if (!astroOnly) captures[`wordpress-${name}`] = await capture(liveUrl, 'wordpress', name, viewport);
  captures[`astro-${name}`] = await capture(localUrl, 'astro', name, viewport);
}
await browser.close();

async function compact(source, output, width) {
  await sharp(source).resize({ width, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(output);
}

async function sideBySide(leftPath, rightPath, output, panelWidth) {
  const left = await sharp(leftPath).resize({ width: panelWidth }).png().toBuffer();
  const right = await sharp(rightPath).resize({ width: panelWidth }).png().toBuffer();
  const leftMeta = await sharp(left).metadata();
  const rightMeta = await sharp(right).metadata();
  const height = Math.max(leftMeta.height, rightMeta.height);
  await sharp({ create: { width: panelWidth * 2 + 16, height, channels: 3, background: '#e7e7e7' } })
    .composite([{ input: left, left: 0, top: 0 }, { input: right, left: panelWidth + 16, top: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(output);
}

const desktopWordPress = join(reviewDir, 'wordpress-desktop.png');
const desktopAstro = join(reviewDir, 'astro-desktop.png');
const mobileWordPress = join(reviewDir, 'wordpress-mobile.png');
const mobileAstro = join(reviewDir, 'astro-mobile.png');
await compact(captures['wordpress-desktop'], desktopWordPress, 720);
await compact(captures['astro-desktop'], desktopAstro, 720);
await compact(captures['wordpress-mobile'], mobileWordPress, 390);
await compact(captures['astro-mobile'], mobileAstro, 390);
await sideBySide(captures['wordpress-desktop'], captures['astro-desktop'], join(reviewDir, 'desktop-side-by-side.png'), 600);
await sideBySide(captures['wordpress-mobile'], captures['astro-mobile'], join(reviewDir, 'mobile-side-by-side.png'), 390);

const wpAligned = await sharp(captures['wordpress-desktop']).resize({ width: 720 }).png().toBuffer();
const astroAligned = await sharp(captures['astro-desktop']).resize({ width: 720 }).png().toBuffer();
const wpMeta = await sharp(wpAligned).metadata();
const astroMeta = await sharp(astroAligned).metadata();
const diffHeight = Math.max(wpMeta.height, astroMeta.height);
const wpCanvas = await sharp({ create: { width: 720, height: diffHeight, channels: 3, background: '#fff' } })
  .composite([{ input: wpAligned, left: 0, top: 0 }]).png().toBuffer();
const astroCanvas = await sharp({ create: { width: 720, height: diffHeight, channels: 3, background: '#fff' } })
  .composite([{ input: astroAligned, left: 0, top: 0 }]).png().toBuffer();
await sharp(wpCanvas)
  .composite([{ input: astroCanvas, blend: 'difference' }])
  .normalize()
  .png({ compressionLevel: 9 })
  .toFile(join(reviewDir, 'desktop-overlay-difference.png'));

console.log(JSON.stringify({ captures, reviewDir }, null, 2));
