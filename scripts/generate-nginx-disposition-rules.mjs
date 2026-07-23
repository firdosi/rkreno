import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

function parseCsv(input) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value); value = '';
    } else if (/[\r\n]/.test(character) && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some(Boolean)) rows.push(row);
      row = []; value = '';
    } else value += character;
  }
  const headers = rows.shift();
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

const root = process.cwd();
const records = parseCsv(await readFile(
  path.join(root, 'reports', 'public', 'route-disposition-plan.csv'), 'utf8',
));
const lines = [
  '# Generated from the approved Phase 2 route-disposition plan.',
  '# These server-side rules are documented only and are inactive on GitHub Pages.',
  '# Activate only during a separately approved VPS deployment.',
  '',
];

for (const record of records) {
  const route = record['Current route'];
  const action = record['Proposed action'];
  if (!route?.startsWith('/')) continue;
  if (action === 'MERGE_AND_301_REDIRECT' && record['Proposed destination URL']) {
    lines.push(`location = ${route} { return 301 ${record['Proposed destination URL']}; }`);
  } else if (action === 'REMOVE_AND_410') {
    lines.push(`location = ${route} { return 410; }`);
  }
}
lines.push('');
await writeFile(path.join(root, 'ops', 'nginx', 'redirects.conf'), lines.join('\n'));
console.log(`Wrote ${lines.length - 5} approved Nginx disposition rules.`);
