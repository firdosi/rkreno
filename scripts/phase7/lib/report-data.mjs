import fs from 'node:fs/promises';
import path from 'node:path';
import { finalReviewRoutes } from '../../lib/final-review-routes.mjs';

export const root = process.cwd();
export const reports = path.join(root, 'reports', 'public');
export const productionOrigin = 'https://rkrenosolution.com';
export const stagingOrigin = 'https://firdosi.github.io/rkreno';
export const retainedRoutes = new Set(finalReviewRoutes.map(({ route }) => route));

export function parseCsv(input) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (character === '"' && quoted && input[index + 1] === '"') {
      cell += '"'; index++;
    } else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index++;
      row.push(cell); cell = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers, ...values] = rows;
  return values.map((valuesRow) =>
    Object.fromEntries(headers.map((header, index) => [header, valuesRow[index] || ''])));
}

export const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
export const csvText = (headers, rows) =>
  [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
export const normalize = (value = '') =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export async function loadPhase7Data() {
  const [routePlan, inventory, seo, parity, pages] = await Promise.all([
    fs.readFile(path.join(reports, 'route-disposition-plan.csv'), 'utf8').then(parseCsv),
    fs.readFile(path.join(reports, 'url-inventory.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(reports, 'final-production-seo-audit.csv'), 'utf8').then(parseCsv),
    fs.readFile(path.join(reports, 'wordpress-parity-status.csv'), 'utf8').then(parseCsv),
    fs.readFile(path.join(root, 'src', 'data', 'site-pages.json'), 'utf8').then(JSON.parse),
  ]);
  return {
    routePlan, inventory, seo, parity, pages,
    inventoryByPath: new Map(inventory.map((item) => [item.path, item])),
    seoByRoute: new Map(seo.map((item) => [item.Route, item])),
    parityByRoute: new Map(parity.map((item) => [item.Route, item])),
    pageByPath: new Map(pages.map((item) => [item.path, item])),
  };
}

export function finalAction(record) {
  if (retainedRoutes.has(record['Current route'])) return 'RETAIN_WITH_SAFE_DIFFERENCES';
  if (record['Proposed action'].startsWith('MERGE_AND_301')) return 'MERGE_AND_301';
  if (record['Proposed action'] === 'REMOVE_AND_410') return 'REMOVE_AND_410';
  if (record['Proposed action'].startsWith('EXISTING_404')) return 'EXISTING_404';
  if (record['Proposed action'] === 'OWNER_DECISION_REQUIRED') return 'OWNER_DECISION_REQUIRED';
  throw new Error(`Unmapped action for ${record['Current route']}: ${record['Proposed action']}`);
}

export function actionCounts(records) {
  return Object.fromEntries(records.reduce((map, record) => {
    const action = record['Final action'] || finalAction(record);
    map.set(action, (map.get(action) || 0) + 1);
    return map;
  }, new Map()));
}
