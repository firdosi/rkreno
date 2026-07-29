import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadRegistry, root, routeSlug } from './lib/route-registry.mjs';

const registry = await loadRegistry();
const cache = path.join(root, '.audit-cache', 'prompt-1-1');
const manifest = JSON.parse(await readFile(
  path.join(cache, 'live-wordpress', 'manifest.json'), 'utf8',
));
const errors = [];
if (manifest.routes.length !== registry.expectedTotals.mirroredRoutes) {
  errors.push(`Source manifest contains ${manifest.routes.length} routes.`);
}
if (!manifest.screenshotCapture) errors.push('Source screenshot capture is not recorded.');
for (const route of registry.publicRoutes.filter(({ mirrored }) => mirrored)) {
  const slug = routeSlug(route.path);
  const capture = manifest.routes.find(({ path: item }) => item === route.path);
  for (const viewport of Object.keys(manifest.viewports || {})) {
    if (capture?.captures?.[viewport]?.status !== 200) {
      errors.push(`${route.path}: invalid ${viewport} source capture`);
    }
  }
  for (const file of [
    path.join(cache, 'source-html', `${slug}.html`),
    path.join(cache, 'source-semantics', `${slug}.json`),
    path.join(cache, 'source-interactions', `${slug}.json`),
    ...Object.keys(manifest.viewports || {}).map((viewport) =>
      path.join(cache, 'source-screenshots', viewport, `${slug}.png`)),
  ]) {
    try { await access(file); } catch { errors.push(`Missing ${path.relative(root, file)}`); }
  }
}
console.log(JSON.stringify({
  passed: errors.length === 0,
  capturedAt: manifest.capturedAt,
  routes: manifest.routes.length,
  errors,
}, null, 2));
if (errors.length) process.exitCode = 1;
