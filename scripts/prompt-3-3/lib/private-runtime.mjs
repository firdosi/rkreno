import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const previewHost = 'preview.local.test';
export const previewAuth = 'preview:local-test';
export const simulatorOrigin = 'http://127.0.0.1:4280';
export const authHeader = `Basic ${Buffer.from(previewAuth).toString('base64')}`;

async function waitFor(url) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}
export async function startPrivateRuntime() {
  const packageResult = JSON.parse(await readFile(resolve('.audit-cache/prompt-3-3/package.json'), 'utf8'));
  const releaseRoot = resolve('.release-cache', 'verified', packageResult.releaseId);
  const service = spawn(process.execPath, [resolve(releaseRoot, 'server/enquiry/server.mjs')], {
    cwd: releaseRoot,
    stdio: ['ignore', 'pipe', 'inherit'],
    env: {
      ...process.env,
      FORM_ENABLED: 'true', FORM_ENVIRONMENT: 'local_test',
      FORM_ALLOWED_ORIGINS: `https://${previewHost}`,
      FORM_RECIPIENT_EMAIL: 'capture@example.test',
      FORM_SENDER_EMAIL: 'website@example.test',
      FORM_MAIL_MODE: 'test_capture',
      ENQUIRY_SERVICE_PORT: '4281',
    },
  });
  const simulator = spawn(process.execPath, [resolve(releaseRoot, 'scripts/prompt-3-1/production-simulator.mjs')], {
    cwd: releaseRoot,
    stdio: ['ignore', 'pipe', 'inherit'],
    env: {
      ...process.env,
      RELEASE_ROOT: resolve(releaseRoot, 'dist'),
      PRODUCTION_SIMULATOR_PORT: '4280',
      SIMULATOR_MODE: 'private_preview',
      PRIVATE_PREVIEW_HOSTNAME: previewHost,
      PRIVATE_PREVIEW_AUTH: previewAuth,
      ENQUIRY_SERVICE_ORIGIN: 'http://127.0.0.1:4281',
    },
  });
  service.stdout.pipe(process.stdout);
  simulator.stdout.pipe(process.stdout);
  await waitFor(`${simulatorOrigin}/__production-simulator/health`);
  return { service, simulator, releaseRoot, packageResult };
}
export async function stopPrivateRuntime(runtime) {
  for (const child of [runtime.simulator, runtime.service]) {
    if (child.exitCode !== null) continue;
    child.kill('SIGTERM');
    await Promise.race([
      new Promise((resolveExit) => child.once('exit', resolveExit)),
      new Promise((resolveWait) => setTimeout(resolveWait, 5000)),
    ]);
  }
}
