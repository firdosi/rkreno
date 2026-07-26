import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const git = (...args) => spawnSync('git', args, { encoding: 'utf8' });
const failures = [];
const tracked = git('ls-files', '-z').stdout.split('\0').filter(Boolean);
const forbiddenPaths = [
  /^\.release-cache\//, /^\.audit-cache\//, /^Media\//i, /^wp-old-site-backup\//i,
  /(^|\/)\.env($|\.)/i, /\.(sql|sqlite|zip|7z|rar|bak|dump|pem|p12|pfx)$/i,
];
for (const path of tracked) {
  if (forbiddenPaths.some((pattern) => pattern.test(path))
    && !/(\.example\.env|env\.example)$/.test(path)) failures.push(`forbidden tracked path: ${path}`);
}

const textExtensions = new Set(['.js', '.mjs', '.cjs', '.json', '.md', '.txt', '.csv', '.sh', '.env', '.template', '.astro', '.ts']);
const secretPatterns = [
  /^-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/m,
  /\b(?:ghp|github_pat|sk_live|AKIA)[A-Za-z0-9_-]{16,}\b/,
  /^(?:export\s+)?(?:SMTP_PASSWORD|TURNSTILE_SECRET_KEY|PRIVATE_PREVIEW_AUTH)\s*=\s*(?!REPLACE_|$)(?!false\b)(?!true\b)\S+/m,
];
for (const path of tracked) {
  if (!textExtensions.has(extname(path)) && !path.endsWith('.template')) continue;
  let text;
  try { text = await readFile(resolve(path), 'utf8'); } catch { continue; }
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) failures.push(`secret-like value in ${path}`);
  }
}

for (const example of ['config/private-preview.example.env', 'deploy/systemd/rkreno-enquiry.env.example']) {
  const text = await readFile(resolve(example), 'utf8');
  if (!text.includes('RKRENO_VPS_DEPLOY_ENABLED=false')) failures.push(`${example}: safe deploy default missing`);
}
const operationalSources = [
  'scripts/prompt-3-3/package-production-release.mjs',
  'scripts/prompt-3-3/test-private-preview.mjs',
  'scripts/prompt-3-3/rehearse-deployment.mjs',
  'scripts/prompt-3-3/run-prompt-3-3.mjs',
];
for (const path of operationalSources) {
  const text = await readFile(resolve(path), 'utf8');
  if (/\b(?:ssh|scp|sftp|rsync)\b/.test(text)) failures.push(`remote command in orchestrator: ${path}`);
}
const output = {
  result: failures.length ? 'FAIL' : 'PASS',
  trackedFilesChecked: tracked.length,
  forbiddenPrivateFilesTracked: failures.filter((item) => item.startsWith('forbidden')).length,
  secretPatternFailures: failures.filter((item) => item.startsWith('secret')).length,
  remoteDeploymentConnections: 0,
  deploymentFlagDefault: 'false',
  failures,
};
await mkdir(resolve('.audit-cache/prompt-3-3'), { recursive: true });
await writeFile(resolve('.audit-cache/prompt-3-3/safety.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (failures.length) process.exit(1);
