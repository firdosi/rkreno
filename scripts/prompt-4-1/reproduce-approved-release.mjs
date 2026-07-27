import { spawnSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import {
  approvedReleaseSha, archiveSha256, auditRoot, evidenceCommitSha, hashFile, writeJson,
} from './lib.mjs';

const expected = {
  nodeVersion: 'v24.16.0',
  lockHash: '01247b3b9e75885f4e655970c4a4c2450c7c1f70eaf007ae440195639e9a3447',
  contentLockHash: '1c42d6f677affee9fc73f73170dba8f876be29dc43f7aa69465b903b1e2307ff',
  routeMapHash: 'da5ff3b90d0928bc5c051f205df8a5acce10bece2e04e7c70512c9bade9ff7b8',
  manifestHash: '48f9dfc10fba358c103ec38c3d2a9dc1c4db460afe9520ea539eb840a45ea574',
  fileCount: 382,
};
const workspace = process.cwd();
const tempBase = resolve(tmpdir());
const worktree = resolve(tempBase, `rkreno-prompt-4-1-${process.pid}`);
if (!worktree.startsWith(`${tempBase}\\`) && !worktree.startsWith(`${tempBase}/`)) {
  throw new Error('Unsafe temporary worktree path');
}
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: options.cwd || workspace,
    env: { ...process.env, ...options.env },
    encoding: options.capture ? 'utf8' : undefined,
    stdio: options.capture ? 'pipe' : 'inherit',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed${result.error ? `: ${result.error.message}` : ''}${result.stderr ? `: ${result.stderr}` : ''}`);
  }
  return result.stdout?.trim() || '';
};
let added = false;
try {
  run('git', ['-c', 'core.autocrlf=false', 'worktree', 'add', '--detach', worktree, approvedReleaseSha]);
  added = true;
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error('Run Prompt 4.1 through npm.');
  const npm = (args, options = {}) => run(process.execPath, [npmCli, ...args], options);
  npm(['ci'], { cwd: worktree });
  npm(['run', 'test:prompt-3-3'], {
    cwd: worktree,
    env: { RELEASE_SOURCE_SHA: approvedReleaseSha },
  });
  npm(['audit', '--audit-level=high'], { cwd: worktree });

  const packageAudit = JSON.parse(await readFile(join(worktree, '.audit-cache/prompt-3-3/package.json'), 'utf8'));
  const masterAudit = JSON.parse(await readFile(join(worktree, '.audit-cache/prompt-3-3/master.json'), 'utf8'));
  const manifestPath = join(worktree, 'reports/public/prompt-3-3-release-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const archivePath = packageAudit.archive;
  const checks = {
    approvedShaCheckedOut: run('git', ['rev-parse', 'HEAD'], { cwd: worktree, capture: true }) === approvedReleaseSha,
    nodeVersion: process.version === expected.nodeVersion,
    packageLock: await hashFile(join(worktree, 'package-lock.json')) === expected.lockHash,
    archiveChecksum: packageAudit.archiveSha256 === archiveSha256
      && await hashFile(archivePath) === archiveSha256,
    releaseSha: packageAudit.releaseSha === approvedReleaseSha && manifest.releaseSha === approvedReleaseSha,
    deterministicArchive: packageAudit.deterministicArchive === true,
    extractedPackageTest: packageAudit.extractedPackageTest === 'PASS',
    packagedFileCount: packageAudit.packagedFileCount === expected.fileCount,
    contentLock: await hashFile(join(worktree, 'config/approved-route-content-lock.json')) === expected.contentLockHash,
    routeMap: JSON.parse(await readFile(join(worktree, 'config/production-route-map.json'), 'utf8')).mapHash === expected.routeMapHash,
    releaseManifest: await hashFile(manifestPath) === expected.manifestHash,
    prompt31Regression: masterAudit.prompt31Regression === 'PASS',
    prompt32Regression: masterAudit.prompt32Regression === 'PASS',
    prompt33Regression: masterAudit.result === 'PASS',
    stagingInactivity: masterAudit.stagingInactivity === 'PASS',
  };
  const forbidden = manifest.files.filter(({ relativePath }) => /^(?:\.audit-cache|\.release-cache|wp-old-site-backup|Media|src)(?:\/|$)|(^|\/)\.env(?:$|\.)|\.sql$|\.bak$/i.test(relativePath));
  checks.archiveExclusions = forbidden.length === 0;
  const evidenceDiff = run('git', ['diff', '--name-only', approvedReleaseSha, evidenceCommitSha], { capture: true })
    .split(/\r?\n/).filter(Boolean);
  const evidenceOnly = evidenceDiff.length === 6
    && evidenceDiff.every((path) => path.startsWith('reports/public/prompt-3-3-'));
  checks.evidenceCommitWebsiteUnchanged = evidenceOnly;
  const result = Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL';
  await mkdir(auditRoot, { recursive: true });
  await writeJson(`${auditRoot}/reproduction.json`, {
    result,
    approvedReleaseSha,
    evidenceCommitSha,
    archiveSha256,
    packageLockHash: expected.lockHash,
    contentLockHash: expected.contentLockHash,
    routeMapHash: expected.routeMapHash,
    releaseManifestHash: expected.manifestHash,
    packagedFileCount: packageAudit.packagedFileCount,
    checks,
  });
  console.log(JSON.stringify({ result, checks }, null, 2));
  if (result !== 'PASS') process.exitCode = 1;
} finally {
  if (added) run('git', ['worktree', 'remove', '--force', worktree]);
  run('git', ['worktree', 'prune']);
}
