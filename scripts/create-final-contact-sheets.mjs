import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { finalReviewRoutes } from './lib/final-review-routes.mjs';

const sourceRoot = path.resolve('.audit-cache', 'final-review');
const outputRoot = path.resolve('reports', 'public', 'visuals', 'final-review');
await fs.mkdir(outputRoot, { recursive: true });

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[character]));
}

async function cellFor(route, viewport, width = 440, height = 460) {
  const screenshot = path.join(sourceRoot, viewport, `${route.id}.png`);
  const image = await sharp(screenshot)
    .resize({ width, height: height - 42, fit: 'cover', position: 'top' })
    .png()
    .toBuffer();
  const label = Buffer.from(
    `<svg width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="#f3f3f3"/>
      <text x="12" y="27" font-family="Arial" font-size="17" font-weight="700">${escapeXml(route.id)}</text>
    </svg>`,
  );
  return sharp(label).composite([{ input: image, left: 0, top: 42 }]).png().toBuffer();
}

async function createSheet(group, viewport, filename) {
  const routes = finalReviewRoutes.filter(({ group: routeGroup }) => routeGroup === group);
  const columns = 3;
  const cellWidth = 440;
  const cellHeight = 460;
  const gap = 10;
  const rows = Math.ceil(routes.length / columns);
  const composites = await Promise.all(routes.map(async (route, index) => ({
    input: await cellFor(route, viewport, cellWidth, cellHeight),
    left: (index % columns) * (cellWidth + gap),
    top: Math.floor(index / columns) * (cellHeight + gap),
  })));
  await sharp({
    create: {
      width: columns * cellWidth + (columns - 1) * gap,
      height: rows * cellHeight + (rows - 1) * gap,
      channels: 3,
      background: '#d9d9d9',
    },
  }).composite(composites).png().toFile(path.join(outputRoot, filename));
}

for (const group of ['service', 'article', 'archive']) {
  const plural = group === 'service' ? 'services' : `${group}s`;
  await createSheet(group, 'desktop', `final-${plural}-desktop.png`);
  await createSheet(group, 'mobile', `final-${plural}-mobile.png`);
}

const utilityRoutes = finalReviewRoutes.filter(({ group }) => group === 'utility');
const utilityCells = [];
for (const [viewportIndex, viewport] of ['desktop', 'tablet', 'mobile'].entries()) {
  for (const [routeIndex, route] of utilityRoutes.entries()) {
    utilityCells.push({
      input: await cellFor(route, viewport, 360, 400),
      left: viewportIndex * 370,
      top: routeIndex * 410,
    });
  }
}
await sharp({
  create: {
    width: 1100,
    height: utilityRoutes.length * 410 - 10,
    channels: 3,
    background: '#d9d9d9',
  },
}).composite(utilityCells).png().toFile(path.join(outputRoot, 'final-utility-pages.png'));

console.log(`Saved final-review contact sheets to ${outputRoot}`);
