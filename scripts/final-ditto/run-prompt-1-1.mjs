import { execFileSync, spawn } from 'node:child_process';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { root, validateRegistry } from './lib/route-registry.mjs';

const results = [];
const run = (name, command, args, options = {}) => new Promise((resolve) => {
  const child = spawn(command, args, {
    cwd: root,
    shell: process.platform === 'win32',
    stdio: 'inherit',
    env: { ...process.env, ...options.env },
  });
  child.on('exit', (code) => {
    results.push({ name, passed: code === 0, exitCode: code });
    resolve(code === 0);
  });
});
const stop = async (name, command, args, options) => {
  if (!(await run(name, command, args, options))) {
    await finish();
    process.exit(1);
  }
};
const finish = async () => {
  const reportPath = path.join(root, 'reports', 'public', 'prompt-1-1-validation-summary.md');
  const lines = [
    '# Prompt 1.1 validation summary',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Check | Result |',
    '|---|---|',
    ...results.map(({ name, passed }) => `| ${name} | ${passed ? 'PASS' : 'FAIL'} |`),
    '',
    `Overall: ${results.every(({ passed }) => passed) ? 'PASS' : 'FAIL'}`,
    '',
  ];
  await writeFile(reportPath, lines.join('\n'));
};

const registry = await validateRegistry();
results.push({ name: 'Route-registry validation', passed: registry.passed, exitCode: registry.passed ? 0 : 1 });
if (!registry.passed) {
  console.error(registry.errors.join('\n'));
  await finish();
  process.exit(1);
}
await stop('Source-snapshot validation', 'node', ['scripts/final-ditto/validate-source-snapshot.mjs']);
await stop('Astro GitHub Pages build', process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'build'], { env: { DEPLOY_TARGET: 'github' } });
await stop('Interaction inventory', 'node', ['scripts/final-ditto/inventory-interactions.mjs']);
await stop('Interaction comparison', 'node', ['scripts/final-ditto/compare-interactions.mjs']);
await stop('Visual capture infrastructure', 'node', ['scripts/final-ditto/capture-parity-screenshots.mjs', '--check']);
await stop('Visual comparison infrastructure', 'node', ['scripts/final-ditto/compare-parity-screenshots.mjs', '--check']);
await stop('Bidirectional semantic comparison', 'node', ['scripts/final-ditto/compare-bidirectional-parity.mjs']);
await stop('Required report generation', 'node', ['scripts/final-ditto/generate-prompt-1-1-reports.mjs']);
await stop('Report schema and false-exact guards', 'node', ['scripts/final-ditto/validate-prompt-1-1-foundation.mjs']);
await stop('Staging noindex, robots, analytics and form guards', 'node', ['scripts/final-ditto/validate-build.mjs', 'github']);

const gitignore = await readFile(path.join(root, '.gitignore'), 'utf8');
const repositoryFiles = execFileSync('git', [
  'ls-files', '--cached', '--others', '--exclude-standard',
], { cwd: root, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
const backupSafe = ['wp-old-site-backup/', '.audit-cache/', '/Media/']
  .every((entry) => gitignore.split(/\r?\n/).includes(entry))
  && !repositoryFiles.some((file) =>
    /^(?:wp-old-site-backup|Media|\.audit-cache)\//.test(file.replaceAll('\\', '/')));
results.push({ name: 'Backup and audit-cache tracking guard', passed: backupSafe, exitCode: backupSafe ? 0 : 1 });
const secretPatterns = [
  /-----BEGIN (?:OPENSSH|RSA|EC) PRIVATE KEY-----\s+[A-Za-z0-9+/=]{40,}/,
  /\b(?:ghp|github_pat|sk_live)_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
];
const scannable = repositoryFiles.filter((file) =>
  !/\.(?:png|jpe?g|gif|webp|avif|ico|woff2?|ttf|eot|zip|gz|pdf)$/i.test(file));
let secretSafe = true;
for (const file of scannable) {
  const absolute = path.join(root, file);
  if ((await stat(absolute)).size > 5_000_000) continue;
  const content = await readFile(absolute, 'utf8');
  if (content.includes('\0')) continue;
  if (secretPatterns.some((pattern) => pattern.test(content))) secretSafe = false;
}
results.push({ name: 'Secret scanning', passed: secretSafe, exitCode: secretSafe ? 0 : 1 });
await finish();
if (!results.every(({ passed }) => passed)) process.exitCode = 1;
