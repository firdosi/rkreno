import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const node = process.execPath;
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is unavailable; run this command through npm.');
const run = (command, args, env = {}) => {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with ${result.status}`);
};
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

run(node, [npmCli, 'run', 'build'], { DEPLOY_TARGET: 'vps' });
const server = spawn(node, ['scripts/prompt-3-1/production-simulator.mjs'], {
  cwd: process.cwd(),
  env: { ...process.env, PRODUCTION_SIMULATOR_PORT: '4173' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
server.stdout.pipe(process.stdout);
let ready = false;
let simulatorStopped = false;
const exitPromise = new Promise((resolve) => server.once('exit', () => {
  simulatorStopped = true;
  resolve();
}));
try {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Production simulator exited with ${server.exitCode}`);
    try {
      const response = await fetch('http://127.0.0.1:4173/__production-simulator/health', {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) { ready = true; break; }
    } catch {}
    await wait(100);
  }
  if (!ready) throw new Error('Production simulator did not become ready');
  run(node, ['scripts/prompt-3-1/test-production-readiness.mjs']);
  run(node, ['scripts/prompt-3-1/performance-smoke.mjs']);
} finally {
  if (server.exitCode === null) {
    server.kill('SIGTERM');
    await Promise.race([
      exitPromise,
      wait(5000).then(() => { if (server.exitCode === null) server.kill(); }),
    ]);
  }
}
run(node, [npmCli, 'run', 'build'], { DEPLOY_TARGET: 'github' });
run(node, ['scripts/prompt-3-1/validate-staging-build.mjs'], { DEPLOY_TARGET: 'github' });
const result = {
  result: 'PASS',
  productionBuild: 'PASS',
  simulatorStopped,
  stagingBuild: 'PASS',
};
await mkdir(path.resolve('.audit-cache', 'prompt-3-1'), { recursive: true });
await writeFile(path.resolve('.audit-cache', 'prompt-3-1', 'orchestration-result.json'),
  `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
if (!simulatorStopped) process.exitCode = 1;
