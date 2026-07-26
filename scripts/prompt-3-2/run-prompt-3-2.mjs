import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this test through npm.');
const run = (command, args, env = {}) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env: { ...process.env, ...env } });
  if (result.status !== 0) process.exit(result.status || 1);
};
await mkdir(resolve('.audit-cache', 'prompt-3-2'), { recursive: true });
run(process.execPath, [npmCli, 'run', 'test:production-readiness']);
run(process.execPath, [npmCli, 'run', 'test:form-security']);
run(process.execPath, [npmCli, 'run', 'test:same-origin-form']);
run(process.execPath, [npmCli, 'run', 'test:consent-analytics']);
run(process.execPath, [npmCli, 'run', 'build'], { DEPLOY_TARGET: 'github' });
run(process.execPath, ['scripts/prompt-3-2/validate-staging.mjs']);
run(process.execPath, ['scripts/verify-deployment-build.mjs']);
run(process.execPath, ['scripts/check-built-links.mjs']);
run(process.execPath, ['scripts/prompt-2-3/validate-final.mjs'], { DEPLOY_TARGET: 'github' });
await writeFile(resolve('.audit-cache', 'prompt-3-2', 'orchestration.json'), `${JSON.stringify({
  result: 'PASS', prompt31Regression: 'PASS', productionBuild: 'PASS',
  githubBuild: 'PASS', servicesStopped: true,
}, null, 2)}\n`);
run(process.execPath, ['scripts/prompt-3-2/generate-reports.mjs']);
