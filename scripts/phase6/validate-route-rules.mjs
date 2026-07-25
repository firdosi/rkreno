import { readFile } from 'node:fs/promises';
import path from 'node:path';

function parseCsv(input) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"' && quoted && input[index + 1] === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if (/[\r\n]/.test(character) && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(cell); cell = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += character;
  }
  const [headers, ...values] = rows;
  return values.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] || ''])));
}

const reportDir = path.resolve('reports/public');
const rows = parseCsv(await readFile(path.join(reportDir, 'route-disposition-plan.csv'), 'utf8'));
const redirects = rows.filter((row) =>
  ['MERGE_AND_301_REDIRECT', 'MERGE_AND_301_LATER'].includes(row['Proposed action']));
const gone = rows.filter((row) => row['Proposed action'] === 'REMOVE_AND_410');
const redirectSources = new Set(redirects.map((row) => row['Current route']));
const excluded = new Set(rows.filter((row) =>
  ['REMOVE_AND_410', 'OWNER_DECISION_REQUIRED'].includes(row['Proposed action']))
  .map((row) => row['Current route']));
const failures = [];

for (const row of redirects) {
  const source = row['Current route'];
  const destination = row['Proposed destination URL'];
  if (!destination) failures.push(`${source}: missing destination`);
  if (source === destination) failures.push(`${source}: redirect loop`);
  if (redirectSources.has(destination)) failures.push(`${source}: destination creates a chain`);
  if (excluded.has(destination)) failures.push(`${source}: destination is excluded`);
  if (source.startsWith('/api/') || destination.startsWith('/api/')) {
    failures.push(`${source}: rule touches /api/`);
  }
}
const duplicateSources = [...new Set(redirects.map((row) => row['Current route'])
  .filter((source, index, all) => all.indexOf(source) !== index))];
if (duplicateSources.length) failures.push(`duplicate sources: ${duplicateSources.join(', ')}`);

const rules = await readFile(path.join(reportDir, 'final-nginx-route-rules.conf'), 'utf8');
if (!rules.includes('location ^~ /api/')) failures.push('Nginx rules do not protect /api/');
if (!rules.includes('location = /')) failures.push('Nginx rules do not define the site root');
for (const row of [...redirects, ...gone]) {
  if (!rules.includes(`location = ${row['Current route']}`)) {
    failures.push(`${row['Current route']}: missing documented rule`);
  }
}

if (failures.length) {
  console.error(`Route-rule validation failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${redirects.length} redirects and ${gone.length} 410 routes without chains or loops.`);
}
