import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'reports', 'public', 'route-disposition-plan.csv');
const destination = path.join(root, 'src', 'data', 'route-policy.json');

function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

const rows = parseCsv(await readFile(source, 'utf8'));
const headers = rows.shift();
const records = rows.map((values) =>
  Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])),
);
const excludedActions = new Set([
  'MERGE_AND_301_REDIRECT',
  'REMOVE_AND_410',
  'OWNER_DECISION_REQUIRED',
  'MERGE_AND_301_LATER',
  'REMOVE_AND_410_LATER',
]);
const excluded = records
  .filter((record) => excludedActions.has(record['Proposed action']))
  .map((record) => record['Current route'])
  .filter((route) => route?.startsWith('/'))
  .sort();
for (const route of ['/blog/page/3/']) {
  if (!excluded.includes(route)) excluded.push(route);
}
excluded.sort();

await writeFile(
  destination,
  `${JSON.stringify({
    generatedFrom: 'reports/public/route-disposition-plan.csv',
    note: 'GitHub Pages omits these routes. Documented 301/410 status rules activate only on the VPS.',
    excluded,
  }, null, 2)}\n`,
);
console.log(`Wrote ${excluded.length} excluded routes to ${destination}`);
