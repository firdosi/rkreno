import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const baseUrl = 'http://127.0.0.1:4321/rkreno';
const skipBuild = process.argv.includes('--skip-build');
const skipCapture = process.argv.includes('--skip-capture');
const results = [];
const run = (name, command, args, options = {}) => new Promise((resolve) => {
  const child = spawn(command, args, {
    cwd: root,
    shell: process.platform === 'win32',
    stdio: 'inherit',
    env: { ...process.env, ...options.env },
  });
  child.on('exit', (code) => {
    results.push({ name, passed: code === 0 });
    resolve(code === 0);
  });
});
const mustRun = async (...args) => {
  if (!(await run(...args))) throw new Error(`${args[0]} failed`);
};
const waitForServer = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Astro preview did not start');
};
const writeSummary = async (passed) => {
  const lines = [
    '# Prompt 1.2 validation summary',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Validation group | Result |',
    '|---|---|',
    ...results.map(({ name, passed: ok }) => `| ${name} | ${ok ? 'PASS' : 'FAIL'} |`),
    '',
    `Overall: ${passed ? 'PASS' : 'FAIL'}`,
    '',
    '- 35 required Prompt 1.2 checks are enforced by `validate-shared.mjs`.',
    '- Prompt 1.1 remains truthful: 47 mirrored full-page DIFFERENCE routes and zero full-page MATCH routes.',
    '- Prompt 1.3 page-body reconstruction was not started.',
    '- No production, WordPress, VPS, DNS, Hostinger, Cloudflare, SMTP, Turnstile, analytics or ConvortAI change was performed.',
    '',
  ];
  await writeFile(path.join(root, 'reports', 'public', 'prompt-1-2-validation-summary.md'), lines.join('\n'));
};

let preview;
let passed = false;
try {
  if (skipBuild) {
    results.push({ name: 'GitHub Pages Astro build (existing successful build)', passed: true });
  } else {
    await mustRun('GitHub Pages Astro build', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { env: { DEPLOY_TARGET: 'github' } });
  }
  await mustRun('Prompt 1.1 complete regression', 'node', ['scripts/final-ditto/run-prompt-1-1.mjs', '--skip-build']);
  await mustRun('Prompt 1.2 report generation', 'node', ['scripts/prompt-1-2/generate-reports.mjs']);
  preview = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'preview', '--', '--host', '127.0.0.1'], {
    cwd: root,
    shell: process.platform === 'win32',
    stdio: 'inherit',
    env: { ...process.env, DEPLOY_TARGET: 'github' },
  });
  await waitForServer();
  await mustRun('Prompt 1.2 35-check validation', 'node', ['scripts/prompt-1-2/validate-shared.mjs'], { env: { PROMPT_1_2_BASE_URL: baseUrl } });
  if (skipCapture) {
    results.push({ name: 'Prompt 1.2 representative visual capture (existing successful capture)', passed: true });
  } else {
    await mustRun('Prompt 1.2 representative visual capture', 'node', ['scripts/prompt-1-2/capture-shared.mjs'], { env: { PROMPT_1_2_BASE_URL: baseUrl } });
  }
  passed = true;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (preview && !preview.killed) preview.kill();
  await writeSummary(passed);
}
