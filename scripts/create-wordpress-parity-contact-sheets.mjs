import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { finalReviewRoutes } from './lib/final-review-routes.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const auditRoot = path.join(root, '.audit-cache', 'wordpress-parity');
const outputRoot = path.join(root, 'reports', 'public', 'visuals', 'wordpress-parity');
const cellWidth = 220;
const imageHeight = 620;
const labelHeight = 46;
const cellHeight = imageHeight + labelHeight;
const gap = 12;
const sources = [
  ['before', 'wordpress', 'WordPress'],
  ['before', 'astro', 'Astro before'],
  ['after', 'astro', 'Astro after'],
];
const routeById = Object.fromEntries(finalReviewRoutes.map((route) => [route.id, route]));
const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&apos;');

function textSvg(width, height, text, size = 18, color = '#0d2b52', background = '#fff') {
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${background}"/>
    <text x="12" y="${Math.round(height * .65)}" font-family="Arial,sans-serif" font-size="${size}" font-weight="700" fill="${color}">${escapeXml(text)}</text>
  </svg>`);
}

async function fullPageCell(imagePath, label) {
  const image = await sharp(imagePath)
    .resize({ width: cellWidth, height: imageHeight, fit: 'contain', background: '#f2f3f5' })
    .png()
    .toBuffer();
  return sharp({
    create: { width: cellWidth, height: cellHeight, channels: 4, background: '#fff' },
  }).composite([
    { input: textSvg(cellWidth, labelHeight, label, 15, '#fff', '#0d2b52'), top: 0, left: 0 },
    { input: image, top: labelHeight, left: 0 },
  ]).png().toBuffer();
}

async function chromeCell(imagePath, label) {
  const metadata = await sharp(imagePath).metadata();
  const cropHeight = Math.min(420, Math.floor((metadata.height || 840) / 2));
  const top = await sharp(imagePath).extract({ left: 0, top: 0, width: metadata.width, height: cropHeight })
    .resize({ width: cellWidth, height: imageHeight / 2, fit: 'cover', position: 'top' }).png().toBuffer();
  const bottom = await sharp(imagePath)
    .extract({ left: 0, top: Math.max(0, metadata.height - cropHeight), width: metadata.width, height: cropHeight })
    .resize({ width: cellWidth, height: imageHeight / 2, fit: 'cover', position: 'bottom' }).png().toBuffer();
  return sharp({
    create: { width: cellWidth, height: cellHeight, channels: 4, background: '#fff' },
  }).composite([
    { input: textSvg(cellWidth, labelHeight, label, 15, '#fff', '#0d2b52'), top: 0, left: 0 },
    { input: top, top: labelHeight, left: 0 },
    { input: bottom, top: labelHeight + imageHeight / 2, left: 0 },
  ]).png().toBuffer();
}

async function createSheet(title, routeIds, viewport, filename, chromeOnly = false) {
  const rows = [];
  for (const id of routeIds) {
    const route = routeById[id];
    const cells = [];
    for (const [phase, source, label] of sources) {
      const imagePath = path.join(auditRoot, phase, source, viewport, `${id}.png`);
      cells.push(await (chromeOnly ? chromeCell(imagePath, label) : fullPageCell(imagePath, label)));
    }
    rows.push({ route, cells });
  }
  const titleHeight = 58;
  const routeHeight = 34;
  const rowHeight = routeHeight + cellHeight + gap;
  const width = gap * 4 + cellWidth * 3;
  const height = titleHeight + rows.length * rowHeight + gap;
  const composites = [{ input: textSvg(width, titleHeight, title, 22, '#fff', '#f58220'), top: 0, left: 0 }];
  rows.forEach(({ route, cells }, rowIndex) => {
    const top = titleHeight + rowIndex * rowHeight;
    composites.push({
      input: textSvg(width - gap * 2, routeHeight, `${route.route} · ${viewport}`, 15),
      top, left: gap,
    });
    cells.forEach((cell, column) => composites.push({
      input: cell,
      top: top + routeHeight,
      left: gap + column * (cellWidth + gap),
    }));
  });
  await sharp({ create: { width, height, channels: 4, background: '#e8ebef' } })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputRoot, filename));
}

await fs.mkdir(outputRoot, { recursive: true });
const services = finalReviewRoutes.filter(({ group }) => group === 'service').map(({ id }) => id);
const articles = finalReviewRoutes.filter(({ group }) => group === 'article').map(({ id }) => id);
const archives = finalReviewRoutes.filter(({ group }) => group === 'archive').map(({ id }) => id);
const representatives = ['home','services','aircond-installation-kl','renovation-kl','aircond-installation-article','blog','contact','hvac-archive'];

await createSheet('Global header and footer comparison', ['home','services','aircond-installation-kl','blog'], 'desktop', 'global-header-footer.png', true);
await createSheet('Homepage comparison', ['home'], 'desktop', 'homepage-comparison.png');
await createSheet('Main pages comparison', ['services','about','faq'], 'desktop', 'main-pages-comparison.png');
await createSheet('Service pages comparison', services, 'desktop', 'service-pages-comparison.png');
await createSheet('Article pages comparison', articles, 'desktop', 'article-pages-comparison.png');
await createSheet('Blog and archive comparison', ['blog', ...archives], 'desktop', 'blog-archive-comparison.png');
await createSheet('Contact and utility comparison', ['contact','thank-you'], 'desktop', 'contact-utility-comparison.png');
await createSheet('Desktop comparison', representatives, 'desktop', 'desktop-comparison.png');
await createSheet('Tablet comparison', representatives, 'tablet', 'tablet-comparison.png');
await createSheet('Mobile comparison', representatives, 'mobile', 'mobile-comparison.png');
console.log('Created 10 WordPress/Astro parity comparison sheets.');
