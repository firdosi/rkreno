import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const root = process.cwd();
export const registryPath = path.join(root, 'config', 'final-route-registry.json');

export async function loadRegistry() {
  return JSON.parse(await readFile(registryPath, 'utf8'));
}

export const routeSlug = (route) => route === '/' ? 'home'
  : route.slice(1).replace(/\/$/, '').replaceAll('/', '__');

export const builtHtmlPath = (route) => route === '/'
  ? path.join(root, 'dist', 'index.html')
  : path.join(root, 'dist', route.slice(1), 'index.html');

export async function validateRegistry() {
  const registry = await loadRegistry();
  const production = JSON.parse(await readFile(
    path.join(root, registry.dispositionRegistry.source), 'utf8',
  ));
  const errors = [];
  const publicRoutes = registry.publicRoutes;
  const requiredFields = [
    'path', 'sourceType', 'pageType', 'mirrored', 'indexability',
    'sitemapInclusion', 'canonical', 'expectedStatus', 'validationGroup',
    'sourceUrl', 'sourceSnapshotReference',
  ];
  if (new Set(publicRoutes.map(({ path: route }) => route)).size !== publicRoutes.length) {
    errors.push('Public route paths are not unique.');
  }
  for (const route of publicRoutes) {
    for (const field of requiredFields) {
      if (!(field in route)) errors.push(`${route.path}: missing ${field}`);
    }
    if (route.mirrored && (!route.sourceUrl || !route.sourceSnapshotReference)) {
      errors.push(`${route.path}: mirrored route lacks source references`);
    }
  }
  const actual = {
    mirroredRoutes: publicRoutes.filter(({ mirrored }) => mirrored).length,
    newRoutes: publicRoutes.filter(({ mirrored }) => !mirrored).length,
    publicRoutes: publicRoutes.length,
    sitemapRoutes: publicRoutes.filter(({ sitemapInclusion }) => sitemapInclusion).length,
    noindexTaxonomyArchives: publicRoutes.filter(({ indexability, validationGroup }) =>
      indexability === 'noindex' && validationGroup === 'archive').length,
    noindexRestoredPages: publicRoutes.filter(({ indexability, validationGroup }) =>
      indexability === 'noindex' && validationGroup === 'held').length,
    noindexThankYouRoutes: publicRoutes.filter(({ indexability, path: route }) =>
      indexability === 'noindex' && route === '/thank-you/').length,
  };
  for (const [name, expected] of Object.entries(registry.expectedTotals)) {
    if (actual[name] !== expected) errors.push(`${name}: expected ${expected}, found ${actual[name]}`);
  }
  const retain = production.entries.filter(({ action }) => action === 'RETAIN_200')
    .map(({ sourcePath }) => sourcePath);
  const registryPaths = publicRoutes.map(({ path: route }) => route);
  for (const route of [...retain, ...registryPaths]) {
    if (!retain.includes(route) || !registryPaths.includes(route)) {
      errors.push(`Production RETAIN_200 disagreement: ${route}`);
    }
  }
  for (const action of Object.values(registry.dispositionRegistry.classes)) {
    if (!production.entries.some((entry) => entry.action === action)) {
      errors.push(`No routes classified ${action}`);
    }
  }
  return { passed: errors.length === 0, errors, actual, registry };
}
