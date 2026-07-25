import { readFile, writeFile } from 'node:fs/promises';
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
const lines = [
  '# INACTIVE DOCUMENTATION — do not install until the cutover is approved.',
  '# Include inside only the rkrenosolution.com production server block.',
  '# Exact matches cannot affect another server block, including ConvortAI.',
  '',
  '# The form API is handled before static-site fallback and is never redirected.',
  'location ^~ /api/ {',
  '    proxy_pass http://127.0.0.1:8787;',
  '    proxy_set_header Host $host;',
  '    proxy_set_header X-Real-IP $remote_addr;',
  '    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
  '    proxy_set_header X-Forwarded-Proto $scheme;',
  '}',
  '',
  '# Static Astro site root and retained routes.',
  'location = / { try_files /index.html =404; }',
  '',
  '# Approved direct redirects. $is_args$args preserves query strings.',
];

for (const row of redirects) {
  const source = row['Current route'];
  const destination = row['Proposed destination URL'];
  const noSlash = source.length > 1 && source.endsWith('/') ? source.slice(0, -1) : '';
  if (noSlash) lines.push(`location = ${noSlash} { return 301 ${destination}$is_args$args; }`);
  lines.push(`location = ${source} { return 301 ${destination}$is_args$args; }`);
}
lines.push('', '# Approved gone routes. Both slash forms return 410.');
for (const row of gone) {
  const source = row['Current route'];
  const noSlash = source.length > 1 && source.endsWith('/') ? source.slice(0, -1) : '';
  if (noSlash) lines.push(`location = ${noSlash} { return 410; }`);
  lines.push(`location = ${source} { return 410; }`);
}
lines.push(
  '',
  '# Lowercase retained URLs with trailing slashes are canonical.',
  '# Unknown case variants remain 404; do not create broad case-insensitive rewrites.',
  'location / { try_files $uri $uri/ $uri/index.html =404; }',
  '',
);
await writeFile(path.join(reportDir, 'final-nginx-route-rules.conf'), lines.join('\n'));
console.log(`Wrote ${redirects.length} redirects and ${gone.length} 410 decisions.`);
