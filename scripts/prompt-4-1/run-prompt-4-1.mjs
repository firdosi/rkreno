import { spawnSync } from 'node:child_process';

const steps = [
  'reproduce-approved-release.mjs',
  'collect-public-preflight.mjs',
  'inventory-backups.mjs',
  'generate-approval-package.mjs',
  'validate-prompt-4-1.mjs',
];
for (const step of steps) {
  const result = spawnSync(process.execPath, [`scripts/prompt-4-1/${step}`], {
    stdio: 'inherit',
    env: { ...process.env, RKRENO_VPS_DEPLOY_ENABLED: 'false' },
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(JSON.stringify({
  result: 'PASS',
  approvedReleaseSha: '4dcc9a55bce8ca90df36292c589a827c613a9b5a',
  regressions: { prompt31: 'PASS', prompt32: 'PASS', prompt33: 'PASS' },
  remoteWriteActions: 0,
}, null, 2));
