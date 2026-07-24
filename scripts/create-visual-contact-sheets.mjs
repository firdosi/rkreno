import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const batch1Pages = [
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
const batch2Pages = [
  'renovation-kl', 'renovation-selangor', 'renovation-subang', 'office-kl',
  'waterproofing', 'plaster-ceiling', 'faq', 'blog', 'commercial-article',
  'office-pj-article', 'waterproofing-article', 'plaster-article',
];
const batch3Pages = [
  'aircond-installation-article', 'electrical-article', 'renovation-kl-article',
  'renovation-selangor-article', 'office-kl-article', 'deep-cleaning-article',
  'pu-injection-article', 'aircond-servicing-article', 'cleaning-article',
  'cleaning-service', 'thank-you',
];
const viewports = ['desktop', 'tablet', 'mobile'];
const label = process.argv[2] || 'before';
const pages = label.startsWith('batch3') ? batch3Pages
  : label.startsWith('batch2') ? batch2Pages : batch1Pages;
const requestedPages = new Set((process.argv[3] || '').split(',').filter(Boolean));
const requestedViewports = new Set((process.argv[4] || '').split(',').filter(Boolean));
const root = path.resolve('.audit-cache', 'visual-comparison', label);
const output = path.join(root, 'comparisons');
const batchName = label.startsWith('batch3') ? 'batch-3'
  : label.startsWith('batch2') ? 'batch-2' : 'batch-1';
const publicOutput = path.resolve('reports', 'public', 'visuals', batchName);
await fs.mkdir(output, { recursive: true });
await fs.mkdir(publicOutput, { recursive: true });
const selectedPages = requestedPages.size ? pages.filter((item) => requestedPages.has(item)) : pages;
const selectedViewports = requestedViewports.size
  ? viewports.filter((item) => requestedViewports.has(item))
  : viewports;

for (const page of selectedPages) {
  for (const viewport of selectedViewports) {
    const sources = label.startsWith('batch3') ? ['staging'] : ['production', 'staging'];
    const inputs = await Promise.all(
      sources.map(async (source, sourceIndex) => {
        const file = path.join(root, source, viewport, `${page}.png`);
        const buffer = await sharp(file)
          .resize({ width: 600, height: 900, fit: 'cover', position: 'top' })
          .png()
          .toBuffer();
        return { input: buffer, left: sourceIndex * 620, top: 60 };
      }),
    );
    const comparisonWidth = sources.length === 1 ? 600 : 1220;
    const title = Buffer.from(
      `<svg width="${comparisonWidth}" height="960"><rect width="${comparisonWidth}" height="960" fill="#eee"/>
      ${sources.map((source, index) => `<text x="${300 + (index * 620)}" y="38" text-anchor="middle" font-family="Arial" font-size="24">${source === 'staging' && sources.length === 1 ? 'Native Batch 3' : source}</text>`).join('')}</svg>`,
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
    path.join(publicOutput, `${batchName}-${viewport}-contact-sheet.png`),
  );
}

console.log(`Saved contact sheets to ${output} and ${publicOutput}`);
