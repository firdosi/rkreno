import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const pages = [
  'home',
  'services',
  'about',
  'contact',
  'aircond-servicing',
  'aircond-installation-kl',
  'aircond-installation-selangor',
  'aircond-price-guide',
  'renovation',
  'electrical-services',
];
const viewports = ['desktop', 'tablet', 'mobile'];
const label = process.argv[2] || 'before';
const requestedPages = new Set((process.argv[3] || '').split(',').filter(Boolean));
const requestedViewports = new Set((process.argv[4] || '').split(',').filter(Boolean));
const root = path.resolve('.audit-cache', 'visual-comparison', label);
const output = path.join(root, 'comparisons');
const publicOutput = path.resolve('reports', 'public', 'visuals', 'batch-1');
await fs.mkdir(output, { recursive: true });
await fs.mkdir(publicOutput, { recursive: true });
const selectedPages = requestedPages.size ? pages.filter((item) => requestedPages.has(item)) : pages;
const selectedViewports = requestedViewports.size
  ? viewports.filter((item) => requestedViewports.has(item))
  : viewports;

for (const page of selectedPages) {
  for (const viewport of selectedViewports) {
    const inputs = await Promise.all(
      ['production', 'staging'].map(async (source) => {
        const file = path.join(root, source, viewport, `${page}.png`);
        const buffer = await sharp(file)
          .resize({ width: 600 })
          .extract({ left: 0, top: 0, width: 600, height: 900 })
          .png()
          .toBuffer();
        return { input: buffer, left: source === 'production' ? 0 : 620, top: 60 };
      }),
    );
    const title = Buffer.from(
      `<svg width="1220" height="980"><rect width="1220" height="980" fill="#eee"/>
      <text x="300" y="38" text-anchor="middle" font-family="Arial" font-size="24">Production</text>
      <text x="920" y="38" text-anchor="middle" font-family="Arial" font-size="24">Staging</text></svg>`,
    );
    await sharp(title)
      .composite(inputs)
      .png()
      .toFile(path.join(output, `${page}-${viewport}.png`));
  }
}

for (const viewport of selectedViewports) {
  const cells = await Promise.all(selectedPages.map(async (page, index) => {
    const image = await sharp(path.join(output, `${page}-${viewport}.png`))
      .resize({ width: 600, height: 482, fit: 'fill' })
      .toBuffer();
    const label = Buffer.from(
      `<svg width="600" height="518"><rect width="600" height="518" fill="#eee"/>
      <text x="12" y="25" font-family="Arial" font-size="19" font-weight="700">${page}</text></svg>`,
    );
    const cell = await sharp(label).composite([{ input: image, left: 0, top: 36 }]).png().toBuffer();
    return { input: cell, left: (index % 2) * 610, top: Math.floor(index / 2) * 528 };
  }));
  const rows = Math.ceil(selectedPages.length / 2);
  await sharp({
    create: { width: 1210, height: rows * 528, channels: 3, background: '#ddd' },
  }).composite(cells).png().toFile(path.join(output, `overview-${viewport}.png`));
  await fs.copyFile(
    path.join(output, `overview-${viewport}.png`),
    path.join(publicOutput, `batch-1-${viewport}-contact-sheet.png`),
  );
}

console.log(`Saved contact sheets to ${output} and ${publicOutput}`);
