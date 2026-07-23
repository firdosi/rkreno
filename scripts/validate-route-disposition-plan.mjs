import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { allowedActions } from './lib/route-disposition-rules.mjs';

const root = process.cwd();
const parseCsv = (input) => {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (character === '"' && quoted && input[index + 1] === '"') { cell += '"'; index++; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if (/[\r\n]/.test(character) && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index++;
      row.push(cell); cell = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers, ...values] = rows;
  return values.map((valueRow) =>
    Object.fromEntries(headers.map((header, index) => [header, valueRow[index] || ''])));
};

const reportDirectory = path.join(root, 'reports/public');
const [pages, redirectMap, rows, claims, report] = await Promise.all([
  readFile(path.join(root, 'src/data/site-pages.json'), 'utf8').then(JSON.parse),
  readFile(path.join(reportDirectory, 'redirect-map.csv'), 'utf8').then(parseCsv),
  readFile(path.join(reportDirectory, 'route-disposition-plan.csv'), 'utf8').then(parseCsv),
  readFile(path.join(reportDirectory, 'unverified-claims-register.csv'), 'utf8').then(parseCsv),
  readFile(path.join(reportDirectory, 'route-disposition-report.md'), 'utf8'),
]);
const failures = [];
const claimStatuses = [
  'VERIFIED_FROM_OWNER_SOURCE', 'PRESENT_ON_PRODUCTION_ONLY', 'IMPORTED_DEMO_CONTENT',
  'NO_SUPPORT_FOUND', 'OWNER_CONFIRMATION_REQUIRED',
];
const expected = new Set(pages.filter((page) =>
  (page.status === 200 && page.type !== 'template' && page.title) || page.status === 404 ||
  page.path === '/wp-content/uploads/2025/01/home.svg').map((page) => page.path));
redirectMap.forEach((redirect) => expected.add(redirect.source));
['/cart/', '/checkout/', '/my-account/'].forEach((route) => expected.add(route));
const actual = new Set(rows.map((row) => row['Current route']));

if (rows.length !== expected.size || actual.size !== rows.length) {
  failures.push(`Expected ${expected.size} unique rows; found ${rows.length}/${actual.size}`);
}
for (const route of expected) if (!actual.has(route)) failures.push(`Missing route: ${route}`);
for (const route of actual) if (!expected.has(route)) failures.push(`Unexpected route: ${route}`);
for (const redirect of redirectMap) {
  if (!actual.has(redirect.source)) failures.push(`Redirect-map source absent: ${redirect.source}`);
}
for (const row of rows) {
  const action = row['Proposed action'];
  const destination = row['Proposed destination URL'];
  if (!allowedActions.includes(action)) failures.push(`${row['Current route']}: invalid action`);
  if (['MERGE_AND_301_REDIRECT', 'EXISTING_404_REPAIR'].includes(action) && !destination) {
    failures.push(`${row['Current route']}: redirect missing destination`);
  }
  if (['REMOVE_AND_410', 'EXISTING_404_LEAVE_GONE'].includes(action) && destination) {
    failures.push(`${row['Current route']}: gone route has destination`);
  }
  if (action === 'OWNER_DECISION_REQUIRED' &&
      row['Final decision status'] !== 'OWNER_CONFIRMATION_REQUIRED') {
    failures.push(`${row['Current route']}: owner decision treated as approved`);
  }
  if (row['WordPress content type'] === 'portfolio' &&
      row['Portfolio authenticity status'] === 'VERIFIED_RK_RENO_PROJECT') {
    failures.push(`${row['Current route']}: unverified portfolio marked genuine`);
  }
}
if (rows.filter((row) => row['Route source'] === 'generated-route').length !== 130) {
  failures.push('Generated-route count is not 130');
}
if (rows.filter((row) => row['Route source'] === 'production-404').length !== 9) {
  failures.push('Production-404 count is not 9');
}
if (rows.filter((row) => row['Unique content level'] === 'EXACT_DUPLICATE').length !== 14) {
  failures.push('Exact-duplicate route count is not 14');
}
if (rows.filter((row) => row['Image dependency status'].startsWith('BLOCKED')).length !== 15) {
  failures.push('Image-blocked route count is not 15');
}
if (claims.some((claim) => claim['Verification status'] === 'VERIFIED_FROM_OWNER_SOURCE')) {
  failures.push('Unsupported claim was marked verified');
}
if (claims.some((claim) => !claimStatuses.includes(claim['Verification status']))) {
  failures.push('Claim register contains an invalid verification status');
}
for (const action of allowedActions) {
  const count = rows.filter((row) => row['Proposed action'] === action).length;
  if (!report.includes(`- ${action}: ${count}`)) failures.push(`Report count mismatch: ${action}`);
}
if (/C:\\Users\\|wp-old-site-backup|BEGIN OPENSSH PRIVATE KEY/.test(report)) {
  failures.push('Report contains a private/local source reference');
}

if (failures.length) {
  console.error(`Disposition validation failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${rows.length} unique route dispositions and ${claims.length} claim records.`);
}
