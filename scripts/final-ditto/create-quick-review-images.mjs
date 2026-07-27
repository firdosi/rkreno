import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const cache = path.join(root, '.audit-cache', 'final-ditto-review');
const output = path.join(root, 'reports', 'public', 'visuals', 'final-ditto-review');
await mkdir(output, { recursive: true });

const label = (text, width) => Buffer.from(`<svg width="${width}" height="54" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#071b37"/>
  <text x="18" y="35" fill="white" font-size="20" font-family="Arial, sans-serif" font-weight="700">${text}</text>
</svg>`);

async function panel(file, width, height, title) {
  const image = await sharp(file).resize({ width, withoutEnlargement: false }).png().toBuffer();
  const meta = await sharp(image).metadata();
  const visible = await sharp(image)
    .extract({ left: 0, top: 0, width, height: Math.min(height, meta.height) })
    .extend({ bottom: Math.max(0, height - meta.height), background: '#ffffff' })
    .png().toBuffer();
  return sharp({
    create: { width, height: height + 54, channels: 3, background: '#ffffff' },
  }).composite([{ input: label(title, width), top: 0, left: 0 }, { input: visible, top: 54, left: 0 }]).png().toBuffer();
}

async function sideBySide(name, leftFile, rightFile, width, height) {
  const [left, right] = await Promise.all([
    panel(leftFile, width, height, 'LIVE WORDPRESS'),
    panel(rightFile, width, height, 'ASTRO / GITHUB PAGES'),
  ]);
  await sharp({
    create: { width: width * 2 + 20, height: height + 54, channels: 3, background: '#dfe4e8' },
  }).composite([{ input: left, left: 0, top: 0 }, { input: right, left: width + 20, top: 0 }])
    .png({ compressionLevel: 9, palette: true }).toFile(path.join(output, name));
}

await sideBySide(
  'home-desktop-side-by-side.png',
  path.join(cache, 'live-wordpress', 'home-desktop.png'),
  path.join(cache, 'astro-after', 'home-desktop.png'),
  710, 1500,
);
await sideBySide(
  'home-mobile-side-by-side.png',
  path.join(cache, 'live-wordpress', 'home-mobile.png'),
  path.join(cache, 'astro-after', 'home-mobile.png'),
  390, 1600,
);
await sideBySide(
  'service-desktop-side-by-side.png',
  path.join(cache, 'live-wordpress', 'service-desktop.png'),
  path.join(cache, 'astro-after', 'service-desktop.png'),
  710, 1500,
);
await sideBySide(
  'article-mobile-side-by-side.png',
  path.join(cache, 'live-wordpress', 'article-mobile.png'),
  path.join(cache, 'astro-after', 'article-mobile.png'),
  390, 1600,
);
console.log(`Created four quick-review images in ${output}`);
