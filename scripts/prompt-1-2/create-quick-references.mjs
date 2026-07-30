import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { evidenceDir, evidenceRoot, reportRoot } from './shared-config.mjs';

const comparison = JSON.parse(await readFile(path.join(evidenceRoot, 'comparison-results.json'), 'utf8'));
const outputDir = path.join(reportRoot, 'visuals', 'prompt-1-2');
await mkdir(outputDir, { recursive: true });
const route = '/';
const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const render = async ({ viewport, state, output }) => {
  const metric = comparison.visualMetrics.find((item) => item.route === route && item.viewport === viewport && item.state === state);
  if (!metric?.evidenceComplete) throw new Error(`Missing visual metric for ${viewport} ${state}`);
  const sourcePath = path.join(evidenceDir('source', viewport, route), `${state}.png`);
  const stagingPath = path.join(evidenceDir('staging', viewport, route), `${state}.png`);
  const sourceMeta = await sharp(sourcePath).metadata();
  const stagingMeta = await sharp(stagingPath).metadata();
  const panelWidth = viewport === 'desktop' ? 720 : 390;
  const displayHeight = Math.max(
    Math.round(sourceMeta.height * (panelWidth / sourceMeta.width)),
    Math.round(stagingMeta.height * (panelWidth / stagingMeta.width)),
  );
  const [source, staging] = await Promise.all([
    sharp(sourcePath).resize({ width: panelWidth, height: displayHeight, fit: 'contain', background: '#fff' }).png().toBuffer(),
    sharp(stagingPath).resize({ width: panelWidth, height: displayHeight, fit: 'contain', background: '#fff' }).png().toBuffer(),
  ]);
  const timestamp = comparison.generatedAt;
  const title = `Route / · ${viewport} · ${state} · ${timestamp} · changed pixels ${metric.changedPixelPercent.toFixed(4)}%`;
  const svg = Buffer.from(`<svg width="${panelWidth * 2}" height="70" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#151515"/>
    <text x="16" y="24" fill="#fff" font-family="Arial" font-size="15" font-weight="700">${escapeXml(title)}</text>
    <text x="16" y="54" fill="#e67e22" font-family="Arial" font-size="18" font-weight="700">WORDPRESS</text>
    <text x="${panelWidth + 16}" y="54" fill="#e67e22" font-family="Arial" font-size="18" font-weight="700">ASTRO</text>
  </svg>`);
  await sharp({ create: { width: panelWidth * 2, height: displayHeight + 70, channels: 4, background: '#fff' } })
    .composite([
      { input: svg, left: 0, top: 0 },
      { input: source, left: 0, top: 70 },
      { input: staging, left: panelWidth, top: 70 },
    ])
    .png()
    .toFile(path.join(outputDir, output));
};

await render({ viewport: 'desktop', state: 'header-initial', output: 'header-desktop-side-by-side.png' });
await render({ viewport: 'mobile', state: 'menu-open', output: 'header-mobile-menu-side-by-side.png' });
await render({ viewport: 'desktop', state: 'footer', output: 'footer-desktop-side-by-side.png' });
await render({ viewport: 'mobile', state: 'footer', output: 'footer-mobile-side-by-side.png' });
