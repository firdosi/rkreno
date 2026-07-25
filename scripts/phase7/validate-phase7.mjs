import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  actionCounts, loadPhase7Data, parseCsv, reports, retainedRoutes, root,
} from './lib/report-data.mjs';

const required = [
  'all-production-url-coverage.csv', 'all-production-url-coverage-report.md',
  'final-content-parity-differences.csv', 'seo-continuity-register.csv',
  'seo-continuity-report.md', 'wordpress-parity-status.csv',
  'wordpress-parity-report.md', 'wordpress-parity-validation.md',
  'phase-7-completion-report.md',
];
const errors = [];
for (const file of required) {
  try { await fs.access(path.join(reports, file)); } catch { errors.push(`Missing report: ${file}`); }
}
const readCsv = (file) => fs.readFile(path.join(reports, file), 'utf8').then(parseCsv);
const [coverage, continuity, differences] = await Promise.all([
  readCsv('all-production-url-coverage.csv'),
  readCsv('seo-continuity-register.csv'),
  readCsv('final-content-parity-differences.csv'),
]);
if (coverage.length !== 145) errors.push(`Expected 145 coverage rows, found ${coverage.length}`);
if (new Set(coverage.map((row) => row.Path)).size !== coverage.length) errors.push('Coverage paths are not unique');
const allowed = new Set([
  'RETAIN_AND_MATCH', 'RETAIN_WITH_SAFE_DIFFERENCES', 'MERGE_AND_301',
  'REMOVE_AND_410', 'EXISTING_404', 'OWNER_DECISION_REQUIRED',
]);
for (const row of coverage) {
  if (!allowed.has(row['Final action'])) errors.push(`Invalid final action: ${row.Path}`);
  if (!row['Evidence reviewed'] || !row.Reason) errors.push(`Incomplete evidence/reason: ${row.Path}`);
}
const counts = actionCounts(coverage);
const expectedCounts = {
  RETAIN_WITH_SAFE_DIFFERENCES: 42, MERGE_AND_301: 23, REMOVE_AND_410: 66,
  EXISTING_404: 9, OWNER_DECISION_REQUIRED: 5,
};
for (const [action, count] of Object.entries(expectedCounts)) {
  if (counts[action] !== count) errors.push(`${action}: expected ${count}, found ${counts[action] || 0}`);
}
if (continuity.length !== retainedRoutes.size) errors.push(`Expected 42 continuity rows, found ${continuity.length}`);
for (const row of continuity) if (row['Final result'] !== 'PASS') errors.push(`SEO continuity failed: ${row.Route}`);
if (differences.some((row) => row['Safe or unsafe difference'] === 'UNSAFE')) {
  errors.push('Unsafe content difference remains');
}
const tracked = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).stdout.split(/\r?\n/);
for (const file of tracked) {
  if (/^(?:Media|wp-old-site-backup|\.audit-cache)\//.test(file)
    || /\.(?:sql|xml|tar|gz|zip|env|pem|key|p12|pfx)$/i.test(file)) {
    errors.push(`Private/backup file tracked: ${file}`);
  }
}
const { seo } = await loadPhase7Data();
if (seo.length !== 42 || seo.some((row) => row.Result !== 'PASS')) errors.push('Base SEO audit is not 42/42 PASS');
const [privacy, terms, config] = await Promise.all([
  fs.readFile(path.join(reports, 'draft-privacy-policy.md'), 'utf8'),
  fs.readFile(path.join(reports, 'draft-terms-of-use.md'), 'utf8'),
  fs.readFile(path.join(reports, 'production-configuration-register.csv'), 'utf8'),
]);
if (!privacy.includes('Enquiry information will be retained only for as long as reasonably necessary')) {
  errors.push('Approved purpose-based retention wording is missing');
}
if (!terms.includes('Information on the website does not create a fixed warranty or guarantee.')) {
  errors.push('Approved project-specific warranty wording is missing');
}
if (!config.includes('Rao Israr; operator, not a registered company')
  || !config.includes('No CRM; email-only recommended')) {
  errors.push('Confirmed owner/operator or CRM facts are missing from the configuration register');
}
const report = `# Phase 7 validation

- Coverage rows: **${coverage.length}**
- Retained SEO rows: **${continuity.length}**
- Content-difference rows: **${differences.length}**
- Errors: **${errors.length}**
- Result: **${errors.length ? 'FAIL' : 'PASS'}**

${errors.length ? errors.map((error) => `- ${error}`).join('\n') : 'All coverage, action-count, continuity, difference and repository-safety checks passed.'}
`;
await fs.writeFile(path.join(reports, 'phase-7-validation.md'), report);
console.log({ coverage: coverage.length, continuity: continuity.length, differences: differences.length, counts, errors });
if (errors.length) process.exitCode = 1;
