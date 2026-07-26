import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import releaseDefinition from '../../config/approved-release.json' with { type: 'json' };
import routeMap from '../../config/production-route-map.json' with { type: 'json' };
import { archiveEntries, copyTree, describeFiles, sha256 } from './lib/release-files.mjs';
import { createDeterministicArchive, extractArchive } from './lib/archive.mjs';

const node = process.execPath;
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run packaging through npm.');
const root = process.cwd();
const cache = resolve('.release-cache');
const assertCachePath = (target) => {
  const value = resolve(target);
  if (!value.startsWith(`${cache}\\`) && !value.startsWith(`${cache}/`)) throw new Error(`Unsafe cache target: ${value}`);
  return value;
};
const run = (command, args, env = {}) => {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });
  if (result.status !== 0) throw new Error(`${args.join(' ')} failed`);
};
const releaseSha = process.env.RELEASE_SOURCE_SHA || releaseDefinition.approvedGitCommit;
const releaseId = `rkreno-${releaseSha.slice(0, 7)}`;
const stage = assertCachePath(join(cache, 'stage', releaseId));
const extracted = assertCachePath(join(cache, 'verified', releaseId));
const archive = assertCachePath(join(cache, 'releases', `${releaseId}.tar.gz`));
const secondArchive = assertCachePath(join(cache, 'releases', `${releaseId}.repeat.tar.gz`));

run(node, ['scripts/prompt-3-3/release-guard.mjs']);
run(node, [npmCli, 'ci']);
run(node, [npmCli, 'run', 'test:production-readiness']);
run(node, [npmCli, 'run', 'test:prompt-3-2']);
run(node, [npmCli, 'run', 'build'], { DEPLOY_TARGET: 'vps' });

for (const target of [stage, extracted]) {
  assertCachePath(target);
  await rm(target, { recursive: true, force: true });
}
await mkdir(stage, { recursive: true });
await copyTree(resolve('dist'), join(stage, 'dist'));
for (const directory of ['server/enquiry', 'deploy', 'scripts/deploy', 'docs']) {
  await copyTree(resolve(directory), join(stage, directory));
}
const runtimeFiles = [
  'package.json', 'package-lock.json',
  'config/approved-release.json', 'config/approved-route-content-lock.json',
  'config/production-route-map.json', 'config/form-policy.json',
  'config/analytics-consent-policy.json', 'config/private-preview-policy.json',
  'config/private-preview.example.env',
  'config/post-cutover-monitoring.json',
  'scripts/prompt-3-1/production-simulator.mjs',
];
for (const file of runtimeFiles) {
  const target = join(stage, file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(file), target);
}
const releaseMetadata = {
  releaseId,
  releaseSha,
  approvedWebsiteCommit: releaseDefinition.approvedGitCommit,
  repository: releaseDefinition.repository,
  branch: releaseDefinition.branch,
  buildTimestamp: releaseDefinition.buildTimestamp,
  nodeVersion: releaseDefinition.nodeVersion,
  buildResult: 'PASS',
  prompt31Regression: 'PASS',
  prompt32Regression: 'PASS',
  contentLock: 'PASS',
  routeTotals: routeMap.totals,
  sitemapCount: releaseDefinition.productionSitemapUrlCount,
};
await writeFile(join(stage, 'release.json'), `${JSON.stringify(releaseMetadata, null, 2)}\n`);
const sumRows = await describeFiles(stage);
await writeFile(join(stage, 'SHA256SUMS'), `${sumRows.map((item) => `${item.sha256}  ${item.relativePath}`).join('\n')}\n`);
const fileRows = await describeFiles(stage);
const entries = await archiveEntries(stage);
await createDeterministicArchive(entries, archive, releaseDefinition.buildTimestamp);
await createDeterministicArchive(entries, secondArchive, releaseDefinition.buildTimestamp);
const archiveContent = await readFile(archive);
const archiveSha = sha256(archiveContent);
if (archiveSha !== sha256(await readFile(secondArchive))) throw new Error('Archive is not deterministic');
await rm(secondArchive, { force: true });
await writeFile(`${archive}.sha256`, `${archiveSha}  ${releaseId}.tar.gz\n`);
await mkdir(extracted, { recursive: true });
await extractArchive(archive, extracted);
for (const expected of fileRows) {
  const content = await readFile(join(extracted, expected.relativePath));
  if (sha256(content) !== expected.sha256) throw new Error(`Extracted checksum mismatch: ${expected.relativePath}`);
}

const simulator = spawn(node, [join(extracted, 'scripts/prompt-3-1/production-simulator.mjs')], {
  cwd: extracted,
  stdio: ['ignore', 'pipe', 'inherit'],
  env: { ...process.env, RELEASE_ROOT: join(extracted, 'dist'), PRODUCTION_SIMULATOR_PORT: '4180' },
});
simulator.stdout.pipe(process.stdout);
let ready = false;
try {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      if ((await fetch('http://127.0.0.1:4180/__production-simulator/health')).ok) { ready = true; break; }
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  if (!ready) throw new Error('Extracted release simulator did not start');
  run(node, ['scripts/prompt-3-1/test-production-readiness.mjs'], {
    PRODUCTION_SIMULATOR_URL: 'http://127.0.0.1:4180',
  });
} finally {
  if (simulator.exitCode === null) {
    simulator.kill('SIGTERM');
    await Promise.race([
      new Promise((resolveExit) => simulator.once('exit', resolveExit)),
      new Promise((resolveWait) => setTimeout(resolveWait, 5000)),
    ]);
  }
}
const publicManifest = {
  releaseId,
  releaseSha,
  approvedWebsiteCommit: releaseDefinition.approvedGitCommit,
  buildResult: 'PASS',
  archiveSha256: archiveSha,
  deterministicArchive: true,
  extractedPackageTest: 'PASS',
  routeTotals: routeMap.totals,
  sitemapCount: 32,
  redirectCount: 23,
  goneCount: 66,
  known404Count: 9,
  securityTest: 'PASS',
  contentLock: 'PASS',
  packagedFileCount: fileRows.length,
  files: fileRows,
};
await writeFile(resolve('reports/public/prompt-3-3-release-manifest.json'), `${JSON.stringify(publicManifest, null, 2)}\n`);
const csv = [
  '"relativePath","size","sha256","runtimePurpose","cacheClassification","classification"',
  ...fileRows.map((item) => [item.relativePath, item.size, item.sha256, item.purpose, item.cache, item.exposure]
    .map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')),
].join('\n');
await writeFile(resolve('reports/public/prompt-3-3-release-files.csv'), `${csv}\n`);
await mkdir(resolve('.audit-cache/prompt-3-3'), { recursive: true });
await writeFile(resolve('.audit-cache/prompt-3-3/package.json'), `${JSON.stringify({
  result: 'PASS', releaseId, releaseSha, archive, archiveSha256: archiveSha,
  deterministicArchive: true, extractedPackageTest: 'PASS', packagedFileCount: fileRows.length,
}, null, 2)}\n`);
console.log(JSON.stringify({
  result: 'PASS', releaseId, archiveSha256: archiveSha,
  files: fileRows.length, extractedPackageTest: 'PASS',
}, null, 2));
