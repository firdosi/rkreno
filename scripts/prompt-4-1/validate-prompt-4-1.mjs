import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import {
  approvedReleaseSha, archiveSha256, auditRoot, evidenceCommitSha, readJson, writeJson,
} from './lib.mjs';

const failures = [];
const requiredReports = [
  'prompt-4-1-final-preflight-report.md',
  'prompt-4-1-owner-approval-form.md',
  'prompt-4-1-provider-values-checklist.md',
  'prompt-4-1-public-dns-snapshot.md',
  'prompt-4-1-public-dns-records.csv',
  'prompt-4-1-live-hosting-tls-snapshot.md',
  'prompt-4-1-search-console-preflight.md',
  'prompt-4-1-analytics-preflight.md',
  'prompt-4-1-backup-verification-report.md',
  'prompt-4-1-owner-held-routes.md',
  'prompt-4-1-go-no-go.csv',
  'prompt-4-1-prompt-4-2-input-guide.md',
  'prompt-4-1-no-remote-change-proof.md',
];
const actualReports = (await readdir(resolve('reports/public')))
  .filter((name) => name.startsWith('prompt-4-1-')).sort();
if (JSON.stringify(actualReports) !== JSON.stringify([...requiredReports].sort())) {
  failures.push(`Prompt 4.1 report set differs: ${actualReports.join(', ')}`);
}

const signoff = await readJson('config/final-release-signoff.json');
const expectedSignoff = {
  approvedWebsiteReleaseSha: approvedReleaseSha,
  evidenceCommitSha,
  releaseId: 'rkreno-4dcc9a5',
  archiveSha256,
  routeCount: 42,
  sitemapCount: 32,
  redirectCount: 23,
  goneCount: 66,
  known404Count: 9,
  ownerHeldCount: 5,
  contentLockHash: '1c42d6f677affee9fc73f73170dba8f876be29dc43f7aa69465b903b1e2307ff',
  routeMapHash: 'da5ff3b90d0928bc5c051f205df8a5acce10bece2e04e7c70512c9bade9ff7b8',
  releaseManifestHash: '48f9dfc10fba358c103ec38c3d2a9dc1c4db460afe9520ea539eb840a45ea574',
  status: 'AWAITING_OWNER_APPROVAL',
};
for (const [key, value] of Object.entries(expectedSignoff)) {
  if (signoff[key] !== value) failures.push(`Sign-off ${key} mismatch`);
}
if (!Number.isFinite(Date.parse(signoff.generatedAt))) failures.push('Sign-off generatedAt is invalid');

const reproduction = await readJson(`${auditRoot}/reproduction.json`);
if (reproduction.result !== 'PASS') failures.push('Approved release reproduction did not pass');
const backup = await readJson(`${auditRoot}/backup-summary.json`);
if (backup.result !== 'PASS') failures.push('Required local backup categories are incomplete');

const ownerForm = await readFile(resolve('reports/public/prompt-4-1-owner-approval-form.md'), 'utf8');
if ((ownerForm.match(/^- \[ \]/gm) || []).length !== 18) failures.push('Owner form must contain exactly 18 unchecked decisions');

const csv = await readFile(resolve('reports/public/prompt-4-1-go-no-go.csv'), 'utf8');
const expectedHeader = '"Checkpoint","Status","Evidence","Owner action","Provider action","Required before Prompt 4.2","Required before Prompt 4.3","Blocking level","Notes"';
if (!csv.startsWith(expectedHeader)) failures.push('Go/no-go header mismatch');
const allowedStatuses = new Set(['PASS','READY_IN_CODE','OWNER_CONFIRMATION_REQUIRED','PROVIDER_VALUE_REQUIRED','PRIVATE_PREVIEW_REQUIRED','SERVER_TEST_REQUIRED','CUTOVER_APPROVAL_REQUIRED','BLOCKED']);
const allowedBlocking = new Set(['NONE','PREVIEW_BLOCKER','CUTOVER_BLOCKER','CRITICAL']);
for (const line of csv.trim().split(/\r?\n/).slice(1)) {
  const fields = [...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map((match) => match[1].replaceAll('""', '"'));
  if (fields.length !== 9) failures.push(`Malformed go/no-go row: ${line}`);
  if (!allowedStatuses.has(fields[1])) failures.push(`Invalid go/no-go status: ${fields[1]}`);
  if (!allowedBlocking.has(fields[7])) failures.push(`Invalid blocking level: ${fields[7]}`);
}
const checkpoints = [
  'Exact release SHA','Release archive checksum','Content lock','Route map','42 retained routes',
  '32 sitemap URLs','Redirects','410s','Known 404s','Custom 404','GitHub staging inactivity',
  'WordPress backup inventory','Fresh backup requirement','Preview hostname','Preview authentication',
  'VPS approval','ConvortAI isolation','Nginx server test','systemd server test','TLS','SMTP',
  'Form recipient','Verified sender','Turnstile preview','Turnstile production','Consent wording',
  'Analytics property','Search Console property','DNS snapshot','DNS change approval',
  'Private-preview approval','Cutover approval','Rollback approval','Post-cutover monitoring',
];
for (const checkpoint of checkpoints) {
  if (!csv.includes(`"${checkpoint}"`)) failures.push(`Missing go/no-go checkpoint: ${checkpoint}`);
}

const exampleFiles = [
  '.env.example',
  'config/private-preview.example.env',
  'deploy/systemd/rkreno-enquiry.env.example',
];
for (const file of exampleFiles) {
  const text = await readFile(resolve(file), 'utf8');
  if (!/REQUIRED/i.test(text) || !/(NON-SECRET|SECRET)/i.test(text)) failures.push(`${file}: requirement labels missing`);
  if (!/REPLACE_|<.*?>|^(?:PUBLIC_GTM_ID|PUBLIC_META_PIXEL_ID|PUBLIC_GOOGLE_SITE_VERIFICATION)=$/m.test(text)) {
    failures.push(`${file}: placeholders missing`);
  }
  if (file !== '.env.example' && !text.includes('RKRENO_VPS_DEPLOY_ENABLED=false')) {
    failures.push(`${file}: deployment safety flag not false`);
  }
}

const git = (...args) => spawnSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const tracked = git('ls-files', '-z').stdout.split('\0').filter(Boolean);
for (const path of tracked) {
  if (/^(\.audit-cache|\.release-cache|Media|wp-old-site-backup)\//i.test(path)) failures.push(`Private path tracked: ${path}`);
  if (/(^|\/)\.env$/i.test(path)) failures.push(`Environment file tracked: ${path}`);
  if (/\.(sql|sqlite|zip|7z|rar|bak|dump|pem|p12|pfx)$/i.test(path)) failures.push(`Private archive/credential tracked: ${path}`);
}
const textExtensions = new Set(['.js','.mjs','.cjs','.json','.md','.txt','.csv','.sh','.env','.template','.astro','.ts','.yml','.yaml']);
const secretPatterns = [
  /^-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/m,
  /\b(?:ghp|github_pat|sk_live|AKIA)[A-Za-z0-9_-]{16,}\b/,
  /^(?:SMTP_PASSWORD|SMTP_PASS|TURNSTILE_SECRET_KEY)\s*=\s*(?!(?:REPLACE_|replace-|added-privately|<|$))\S+/im,
];
for (const path of tracked) {
  if (!textExtensions.has(extname(path)) && !path.endsWith('.example')) continue;
  let text = '';
  try { text = await readFile(resolve(path), 'utf8'); } catch { continue; }
  for (const pattern of secretPatterns) if (pattern.test(text)) failures.push(`Secret-like tracked value: ${path}`);
}

const orchestrators = [
  'scripts/prompt-4-1/reproduce-approved-release.mjs',
  'scripts/prompt-4-1/collect-public-preflight.mjs',
  'scripts/prompt-4-1/inventory-backups.mjs',
  'scripts/prompt-4-1/generate-approval-package.mjs',
  'scripts/prompt-4-1/validate-prompt-4-1.mjs',
  'scripts/prompt-4-1/run-prompt-4-1.mjs',
];
for (const path of orchestrators) {
  let text = '';
  try { text = await readFile(resolve(path), 'utf8'); } catch { failures.push(`Missing orchestrator: ${path}`); continue; }
  if (/spawnSync\(\s*['"](?:ssh|scp|sftp|rsync|certbot)['"]/i.test(text)) failures.push(`Remote command invocation in orchestrator: ${path}`);
  if (/fetch\([^)]*,\s*\{[^}]*method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/is.test(text)) {
    failures.push(`Write-capable HTTP request in orchestrator: ${path}`);
  }
}

const stagingHome = await fetch('https://firdosi.github.io/rkreno/').then((response) => response.text());
const stagingRobots = await fetch('https://firdosi.github.io/rkreno/robots.txt').then((response) => response.text());
if (!/<meta[^>]+name=["']robots["'][^>]+content=["']noindex,\s*nofollow["']/i.test(stagingHome)) failures.push('Staging noindex/nofollow missing');
if (!/Disallow:\s*\//i.test(stagingRobots)) failures.push('Staging robots disallow-all missing');
if (/googletagmanager|google-analytics|GT-T944JBVZ|G-NVEL66185G|challenges\.cloudflare\.com|data-consent-banner/i.test(stagingHome)) {
  failures.push('Staging provider/consent leakage');
}
if (/<form\b[^>]*(?:action=["']\/api\/enquiry|data-configured=["']true)/i.test(stagingHome)) failures.push('Staging form active');

const output = {
  result: failures.length ? 'FAIL' : 'PASS',
  reports: actualReports.length,
  approvedRelease: reproduction.result,
  stagingInactivity: failures.some((item) => item.startsWith('Staging')) ? 'FAIL' : 'PASS',
  deploymentFlagDefault: 'false',
  trackedSecrets: failures.filter((item) => item.includes('Secret-like')).length,
  trackedPrivateBackups: failures.filter((item) => item.includes('Private path')).length,
  remoteWriteActions: failures.filter((item) => item.includes('Remote command') || item.includes('Write-capable')).length,
  failures,
};
await writeJson(`${auditRoot}/master.json`, output);
console.log(JSON.stringify(output, null, 2));
if (failures.length) process.exit(1);
