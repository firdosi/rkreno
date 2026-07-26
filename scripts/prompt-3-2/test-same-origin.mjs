import { spawn, spawnSync } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this test through npm.');
const build = spawnSync(process.execPath, [npmCli, 'run', 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DEPLOY_TARGET: 'local',
    PUBLIC_FORM_MODE: 'local_test',
    PUBLIC_FORM_ENDPOINT: '/api/enquiry',
    PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
  },
});
if (build.status !== 0) process.exit(build.status || 1);

function start(command, args, env) {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, ...env } });
  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  return child;
}
async function waitFor(url) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}
async function stop(child) {
  if (child.exitCode != null) return;
  child.kill('SIGTERM');
  await new Promise((resolveStop) => child.once('exit', resolveStop));
}

const service = start(process.execPath, ['server/enquiry/server.mjs'], {
  FORM_ENABLED: 'true',
  FORM_ENVIRONMENT: 'local_test',
  FORM_ALLOWED_ORIGINS: 'http://127.0.0.1:4173',
  FORM_RECIPIENT_EMAIL: 'capture@example.test',
  FORM_SENDER_EMAIL: 'website@example.test',
  FORM_MAIL_MODE: 'test_capture',
  ENQUIRY_SERVICE_PORT: '4174',
});
const simulator = start(process.execPath, ['scripts/prompt-3-1/production-simulator.mjs'], {
  ENQUIRY_SERVICE_ORIGIN: 'http://127.0.0.1:4174',
  SIMULATOR_FORM_ENABLED: 'true',
});
const results = [];
try {
  await waitFor('http://127.0.0.1:4173/__production-simulator/health');
  const page = await fetch('http://127.0.0.1:4173/contact-us/');
  const html = await page.text();
  const csp = page.headers.get('content-security-policy') || '';
  results.push({ name: 'future form controls enabled', passed: /data-configured="true"/.test(html) && /challenges\.cloudflare\.com/.test(html) });
  results.push({ name: 'form CSP permits only Turnstile addition', passed: csp.includes('https://challenges.cloudflare.com') && !csp.includes('google-analytics.com') && !csp.includes('script-src *') && !csp.includes('unsafe-eval') });
  const payload = {
    name: 'Local Test User', phone: '+60 11 0000 0000', email: 'local@example.test',
    service: 'House Renovation', projectDetails: 'Local same-origin test capture submission only.',
    consent: true, pageUrl: '/contact-us/', startedAt: new Date(Date.now() - 5000).toISOString(),
    website: '', turnstileToken: 'test-success',
  };
  const response = await fetch('http://127.0.0.1:4173/api/enquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:4173' },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  results.push({ name: 'same-origin simulator proxy accepted test capture', passed: response.status === 200 && body.ok === true && /^rk_[a-f0-9]{16}$/.test(body.requestId) });
  results.push({ name: 'success response excludes PII', passed: !JSON.stringify(body).match(/Local Test User|0000|example\.test|submission/i) });
  const replay = await fetch('http://127.0.0.1:4173/api/enquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:4173' },
    body: JSON.stringify(payload),
  });
  results.push({ name: 'same-origin replay rejected', passed: replay.status === 422 });
} finally {
  await stop(simulator);
  await stop(service);
}

const baseSimulator = start(process.execPath, ['scripts/prompt-3-1/production-simulator.mjs'], {});
try {
  await waitFor('http://127.0.0.1:4173/__production-simulator/health');
  const response = await fetch('http://127.0.0.1:4173/');
  const csp = response.headers.get('content-security-policy') || '';
  results.push({
    name: 'base CSP excludes inactive providers',
    passed: !/challenges\.cloudflare|googletagmanager|google-analytics/.test(csp)
      && csp.includes("connect-src 'self'") && csp.includes("frame-src 'none'"),
  });
} finally {
  await stop(baseSimulator);
}

const output = {
  total: results.length,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  results,
};
await mkdir(resolve('.audit-cache', 'prompt-3-2'), { recursive: true });
await writeFile(resolve('.audit-cache', 'prompt-3-2', 'same-origin.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (output.failed) process.exit(1);
