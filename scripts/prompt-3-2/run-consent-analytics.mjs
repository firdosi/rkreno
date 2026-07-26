import { spawn, spawnSync } from 'node:child_process';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this test through npm.');
const build = spawnSync(process.execPath, [npmCli, 'run', 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DEPLOY_TARGET: 'local',
    PUBLIC_CONSENT_ENABLED: 'true',
    PUBLIC_ANALYTICS_ENABLED: 'true',
    PUBLIC_ANALYTICS_TEST_MODE: 'true',
    PUBLIC_GA4_MEASUREMENT_ID: 'G-NVEL66185G',
  },
});
if (build.status !== 0) process.exit(build.status || 1);

const simulator = spawn(process.execPath, ['scripts/prompt-3-1/production-simulator.mjs'], {
  stdio: ['ignore', 'pipe', 'inherit'],
  env: { ...process.env, SIMULATOR_ANALYTICS_ENABLED: 'true' },
});
let ready = false;
simulator.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  if (chunk.toString().includes('"ready":true')) ready = true;
});
const deadline = Date.now() + 10000;
while (!ready && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 100));
if (!ready) {
  simulator.kill();
  throw new Error('Production simulator did not start.');
}
const tests = spawnSync(process.execPath, ['scripts/prompt-3-2/test-consent-analytics.mjs'], {
  stdio: 'inherit', env: { ...process.env, CONSENT_TEST_ORIGIN: 'http://127.0.0.1:4173' },
});
simulator.kill('SIGTERM');
await new Promise((resolve) => simulator.once('exit', resolve));
if (tests.status !== 0) process.exit(tests.status || 1);
