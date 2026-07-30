import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { evidenceRoot, stagingBase } from './shared-config.mjs';

const root = process.cwd();
const results = [];
const run = (name, command, args, options = {}) => new Promise((resolve) => {
  const child = spawn(command, args, {
    cwd: root,
    shell: process.platform === 'win32' && command.endsWith('.cmd'),
    stdio: 'inherit',
    env: { ...process.env, ...options.env },
  });
  child.on('exit', (code) => {
    results.push({ name, passed: code === 0 });
    resolve(code === 0);
  });
});
const required = async (...args) => {
  if (!(await run(...args))) throw new Error(`${args[0]} failed`);
};
const waitForPreview = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if ((await fetch(`${stagingBase}/`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Astro preview did not become ready');
};
const writeSummary = async (passed) => {
  let measured = null;
  try {
    measured = JSON.parse(await readFile(path.join(evidenceRoot, 'comparison-results.json'), 'utf8'));
  } catch {}
  const promptOne = JSON.parse(await readFile(path.join(root, 'reports', 'public', 'prompt-1-1-bidirectional-parity.json'), 'utf8'));
  const sharedDifferenceCount = measured
    ? measured.records.reduce((total, item) => total + Object.values(item).filter((value) => value?.status === 'DIFFERENCE').length, 0)
    : null;
  const lines = [
    '# Prompt 1.2 correction validation summary', '',
    `Generated: ${new Date().toISOString()}`, '',
    '| Calculated validation group | Result |', '|---|---|',
    ...results.map((item) => `| ${item.name} | ${item.passed ? 'PASS' : 'FAIL'} |`), '',
    `Overall: ${passed ? 'PASS' : 'FAIL'}`, '',
    `- Fresh capture session: ${measured?.records[0]?.capturedSessionId || 'unavailable'}`,
    `- Independently measured shared-difference results: ${sharedDifferenceCount ?? 'unavailable'}`,
    `- Full-page DIFFERENCE results from Prompt 1.1: ${promptOne.routes.filter((item) => item.status === 'DIFFERENCE').length}`,
    '- Prompt 1.3 page-body reconstruction was not started.',
    '- No production or VPS operation is part of this validator.',
    '',
  ];
  await writeFile(path.join(root, 'reports', 'public', 'prompt-1-2-validation-summary.md'), lines.join('\n'));
};

let preview;
let passed = false;
try {
  await required('GitHub regression build', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { env: { DEPLOY_TARGET: 'github' } });
  await required('Prompt 1.1 regression', 'node', ['scripts/final-ditto/run-prompt-1-1.mjs', '--skip-build']);
  await required('Local evidence build', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);
  preview = spawn(process.execPath, [path.join(root, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'preview', '--host', '127.0.0.1'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  await waitForPreview();
  const environment = { PROMPT_1_2_BASE_URL: stagingBase };
  await required('Fresh 47-route shared capture', 'node', ['scripts/prompt-1-2/capture-shared.mjs'], { env: environment });
  await required('Route-specific evidence comparison', 'node', ['scripts/prompt-1-2/compare-shared.mjs'], { env: environment });
  await required('Calculated report generation', 'node', ['scripts/prompt-1-2/generate-reports.mjs'], { env: environment });
  await required('Correction report generation', 'node', ['scripts/prompt-1-2/write-correction-reports.mjs'], { env: environment });
  await required('Labeled quick-reference generation', 'node', ['scripts/prompt-1-2/create-quick-references.mjs'], { env: environment });
  await required('Hardcoded-result detection', 'node', ['scripts/prompt-1-2/detect-hardcoded-results.mjs']);
  await required('Measured Prompt 1.2 validation', 'node', ['scripts/prompt-1-2/validate-shared.mjs'], {
    env: { ...environment, PROMPT_ONE_REGRESSION_PASSED: 'true' },
  });
  await required('GitHub Pages build', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { env: { DEPLOY_TARGET: 'github' } });
  passed = true;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (preview && !preview.killed) preview.kill();
  await writeSummary(passed);
}
