import { spawnSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this test through npm.');
const gitSha = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const env = { ...process.env, RELEASE_SOURCE_SHA: gitSha };
const run = (command, args, extraEnv = {}) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env: { ...env, ...extraEnv } });
  if (result.status !== 0) process.exit(result.status || 1);
};
const npm = (...args) => run(process.execPath, [npmCli, ...args]);

npm('run', 'package:production-release');
npm('run', 'test:private-preview');
npm('run', 'validate:deployment-config');
npm('run', 'rehearse:deployment');
npm('audit', '--audit-level=high');
run(process.execPath, [npmCli, 'run', 'build'], { DEPLOY_TARGET: 'github' });
run(process.execPath, ['scripts/prompt-3-2/validate-staging.mjs']);
run(process.execPath, ['scripts/verify-deployment-build.mjs']);
run(process.execPath, ['scripts/check-built-links.mjs']);
run(process.execPath, ['scripts/prompt-2-3/validate-final.mjs'], { DEPLOY_TARGET: 'github' });
run(process.execPath, ['scripts/prompt-3-3/validate-release-safety.mjs']);

const preview = JSON.parse(await readFile(resolve('.audit-cache/prompt-3-3/private-preview.json'), 'utf8'));
const rehearsal = JSON.parse(await readFile(resolve('.audit-cache/prompt-3-3/rehearsal.json'), 'utf8'));
const output = {
  result: preview.result === 'PASS' && rehearsal.result === 'PASS' ? 'PASS' : 'FAIL',
  releaseSha: gitSha,
  prompt31Regression: 'PASS',
  prompt32Regression: 'PASS',
  packageVerification: 'PASS',
  privatePreview: preview.result,
  deploymentRehearsal: rehearsal.result,
  stagingInactivity: 'PASS',
  noRemoteConnection: 'PASS',
  localSimulationCleanup: preview.servicesStopped ? 'PASS' : 'FAIL',
};
await mkdir(resolve('.audit-cache/prompt-3-3'), { recursive: true });
await writeFile(resolve('.audit-cache/prompt-3-3/master.json'), `${JSON.stringify(output, null, 2)}\n`);
run(process.execPath, ['scripts/prompt-3-3/generate-reports.mjs']);
console.log(JSON.stringify(output, null, 2));
if (output.result !== 'PASS' || output.localSimulationCleanup !== 'PASS') process.exit(1);
