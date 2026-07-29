import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from './lib/route-registry.mjs';

const report = JSON.parse(await readFile(path.join(
  root, 'reports', 'public', 'prompt-1-1-interaction-inventory.json',
), 'utf8'));
const fields = [
  'stickyHeader', 'desktopDropdown', 'mobileMenu', 'carousel', 'slider',
  'previousControl', 'nextControl', 'dotNavigation', 'counters', 'accordions',
  'tabs', 'projectFilter', 'forms', 'stickySidebar', 'floatingPhone',
  'floatingWhatsApp',
];
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const rows = report.routes.map((route) => {
  if (!route.wordpress) {
    return { route: route.route, status: 'NEW_PAGE', differences: 'Not a WordPress-mirrored route' };
  }
  const differences = fields.filter((field) =>
    Number(route.wordpress[field] || 0) !== Number(route.astro[field] || 0))
    .map((field) => `${field}: ${route.wordpress[field] || 0} -> ${route.astro[field] || 0}`);
  const behaviorNotTested = Object.entries(route.behavior)
    .filter(([, value]) => value === 'NOT_TESTED').map(([field]) => field);
  if (behaviorNotTested.length) differences.push(`behavior not tested: ${behaviorNotTested.join(', ')}`);
  return {
    route: route.route,
    status: differences.length ? 'DIFFERENCE' : 'MATCH',
    differences: differences.join('; '),
  };
});
await writeFile(path.join(root, 'reports', 'public', 'prompt-1-1-interaction-differences.csv'), [
  ['Route', 'Status', 'Differences'].map(csv).join(','),
  ...rows.map((row) => [row.route, row.status, row.differences].map(csv).join(',')),
].join('\n') + '\n');
