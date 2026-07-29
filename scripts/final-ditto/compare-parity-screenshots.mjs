import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { loadRegistry, root, routeSlug } from './lib/route-registry.mjs';

const registry = await loadRegistry();
const checkOnly = process.argv.includes('--check');
if (checkOnly) {
  await sharp({ create: { width: 1, height: 1, channels: 4, background: 'white' } }).png().toBuffer();
  console.log('Visual comparison infrastructure ready; zero-tolerance status policy active.');
  process.exit(0);
}
const cache = path.join(root, '.audit-cache', 'prompt-1-1', 'visual');
const manifest = JSON.parse(await readFile(path.join(cache, 'manifest.json'), 'utf8'));
const reports = path.join(root, 'reports', 'public');

async function pixelDifference(sourcePath, astroPath, diffPath) {
  const source = sharp(sourcePath).ensureAlpha();
  const astro = sharp(astroPath).ensureAlpha();
  const [sourceMeta, astroMeta] = await Promise.all([source.metadata(), astro.metadata()]);
  if (sourceMeta.width !== astroMeta.width || sourceMeta.height !== astroMeta.height) {
    return { dimensionsMatch: false, source: sourceMeta, astro: astroMeta, percentage: 100 };
  }
  const [sourceRaw, astroRaw] = await Promise.all([
    source.raw().toBuffer(),
    astro.raw().toBuffer(),
  ]);
  const diff = Buffer.alloc(sourceRaw.length);
  let differentPixels = 0;
  for (let index = 0; index < sourceRaw.length; index += 4) {
    const changed = [0, 1, 2, 3].some((channel) =>
      sourceRaw[index + channel] !== astroRaw[index + channel]);
    if (changed) differentPixels += 1;
    diff[index] = changed ? 255 : 0;
    diff[index + 1] = 0;
    diff[index + 2] = 0;
    diff[index + 3] = 255;
  }
  await sharp(diff, {
    raw: { width: sourceMeta.width, height: sourceMeta.height, channels: 4 },
  }).png().toFile(diffPath);
  return {
    dimensionsMatch: true,
    percentage: (differentPixels / (sourceMeta.width * sourceMeta.height)) * 100,
  };
}

const routes = [];
await mkdir(path.join(cache, 'diff'), { recursive: true });
for (const route of registry.publicRoutes.filter(({ mirrored }) => mirrored)) {
  const captured = manifest.routes.find(({ path: item }) => item === route.path);
  const viewports = {};
  for (const viewport of Object.keys(manifest.viewports)) {
    const slug = routeSlug(route.path);
    const sourcePath = path.join(cache, viewport, `${slug}-wordpress.png`);
    const astroPath = path.join(cache, viewport, `${slug}-astro.png`);
    try {
      await Promise.all([access(sourcePath), access(astroPath)]);
      viewports[viewport] = await pixelDifference(
        sourcePath,
        astroPath,
        path.join(cache, 'diff', `${slug}-${viewport}.png`),
      );
      viewports[viewport].boundingBoxes = captured?.viewports?.[viewport] || null;
      viewports[viewport].status = viewports[viewport].dimensionsMatch
        && viewports[viewport].percentage === 0 ? 'PASS' : 'FAIL';
    } catch {
      viewports[viewport] = { status: 'NOT_TESTED' };
    }
  }
  const statuses = Object.values(viewports).map(({ status }) => status);
  routes.push({
    route: route.path,
    status: statuses.every((status) => status === 'PASS') ? 'PASS'
      : statuses.includes('FAIL') ? 'FAIL' : 'NOT_TESTED',
    viewports,
  });
}
await mkdir(reports, { recursive: true });
await writeFile(path.join(reports, 'prompt-1-1-visual-comparison.json'),
  `${JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), routes }, null, 2)}\n`);
