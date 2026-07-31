import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export async function validateSafety(root) {
  const errors = [];
  const ignore = await readFile(path.join(root, '.gitignore'), 'utf8');
  for (const expected of ['wp-old-site-backup/', '/Media/', '.audit-cache/']) {
    if (!ignore.includes(expected)) errors.push(`Missing ignore rule: ${expected}`);
  }
  const tracked = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).stdout.split(/\r?\n/).filter(Boolean);
  for (const file of tracked) {
    if (/^(?:wp-old-site-backup|Media|\.audit-cache)\//i.test(file)) errors.push(`Ignored source/audit path is tracked: ${file}`);
  }
  const privateKey = spawnSync('git', ['grep', '-Il', '^-----BEGIN OPENSSH PRIVATE KEY-----$'], { cwd: root, encoding: 'utf8' });
  if (privateKey.status === 0 && privateKey.stdout.trim()) errors.push('Private key material found in tracked files.');
  const pagesWorkflow = await readFile(path.join(root, '.github/workflows/deploy-pages.yml'), 'utf8');
  const vpsWorkflow = await readFile(path.join(root, '.github/workflows/deploy-vps.yml'), 'utf8');
  if (!pagesWorkflow.includes('npm run test:migration -- --skip-build')) errors.push('Pages workflow does not run migration validation.');
  if (!vpsWorkflow.includes("github.event_name == 'workflow_dispatch'") || !vpsWorkflow.includes("RKRENO_VPS_DEPLOY_ENABLED == 'true'")) {
    errors.push('VPS workflow lacks manual-dispatch and enable-flag guards.');
  }
  return { errors, trackedFiles: tracked.length };
}
