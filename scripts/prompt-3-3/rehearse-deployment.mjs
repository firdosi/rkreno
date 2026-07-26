import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { extractArchive } from './lib/archive.mjs';
import { sha256 } from './lib/release-files.mjs';

const cache = resolve('.release-cache');
const root = resolve(cache, 'server-simulation');
if (!root.startsWith(`${cache}${sep}`)) throw new Error('Unsafe simulation root');
await rm(root, { recursive: true, force: true });
const releases = join(root, 'var/www/rkreno/releases');
const shared = join(root, 'var/www/rkreno/shared');
const pointers = join(root, 'var/www/rkreno');
const unrelated = join(root, 'var/www/convortai-simulation');
await mkdir(join(shared, 'env'), { recursive: true });
await mkdir(join(shared, 'logs'), { recursive: true });
await mkdir(releases, { recursive: true });
await mkdir(unrelated, { recursive: true });
const sharedSentinel = 'external-environment-unchanged';
const unrelatedSentinel = 'unrelated-application-unchanged';
await writeFile(join(shared, 'env/enquiry.env'), sharedSentinel);
await writeFile(join(unrelated, 'state.txt'), unrelatedSentinel);

const packageResult = JSON.parse(await readFile(resolve('.audit-cache/prompt-3-3/package.json'), 'utf8'));
const oldId = 'rkreno-0000001';
const oldRelease = join(releases, oldId);
await mkdir(join(oldRelease, 'dist'), { recursive: true });
await writeFile(join(oldRelease, 'dist/index.html'), '<!doctype html><title>old verified release</title>');
const oldHash = sha256(await readFile(join(oldRelease, 'dist/index.html')));
await writeFile(join(oldRelease, 'SHA256SUMS'), `${oldHash}  dist/index.html\n`);
await writeFile(join(oldRelease, 'release.json'), `${JSON.stringify({ releaseId: oldId, healthy: true })}\n`);
const newRelease = join(releases, packageResult.releaseId);
await mkdir(newRelease, { recursive: true });
await extractArchive(packageResult.archive, newRelease);

const pointerPath = (name) => join(pointers, `${name}.pointer`);
async function switchPointer(name, releaseId) {
  const temporary = `${pointerPath(name)}.next`;
  await writeFile(temporary, `${releaseId}\n`);
  await rename(temporary, pointerPath(name));
}
async function pointer(name) {
  return (await readFile(pointerPath(name), 'utf8')).trim();
}
async function verifyRelease(releaseId) {
  if (!/^rkreno-[a-f0-9]{7,40}$/.test(releaseId)) return { ok: false, category: 'invalid_identifier' };
  const directory = join(releases, releaseId);
  let sums;
  try { sums = await readFile(join(directory, 'SHA256SUMS'), 'utf8'); } catch { return { ok: false, category: 'missing' }; }
  for (const line of sums.trim().split(/\r?\n/)) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match || match[2].includes('..')) return { ok: false, category: 'checksum' };
    try {
      if (sha256(await readFile(join(directory, match[2]))) !== match[1]) return { ok: false, category: 'checksum' };
    } catch { return { ok: false, category: 'checksum' }; }
  }
  try {
    const html = await readFile(join(directory, 'dist/index.html'), 'utf8');
    if (!/<html|<!doctype html/i.test(html)) return { ok: false, category: 'health' };
  } catch { return { ok: false, category: 'health' }; }
  return { ok: true, category: 'healthy' };
}
async function activate(releaseId, { simulatePostActivationFailure = false } = {}) {
  const verified = await verifyRelease(releaseId);
  if (!verified.ok) return verified;
  const current = await pointer('current');
  await switchPointer('previous', current);
  await switchPointer('current', releaseId);
  const post = simulatePostActivationFailure
    ? { ok: false, category: 'simulated_post_activation_health' }
    : await verifyRelease(await pointer('current'));
  if (!post.ok) {
    await switchPointer('current', current);
    return { ok: false, category: 'automatic_rollback', trigger: post.category };
  }
  return { ok: true, category: 'activated' };
}

await switchPointer('current', oldId);
await switchPointer('previous', oldId);
const preActivation = await verifyRelease(packageResult.releaseId);
const activation = await activate(packageResult.releaseId);
const activatedPointers = { current: await pointer('current'), previous: await pointer('previous') };
const manualRollback = await activate(oldId);
const manualPointers = { current: await pointer('current'), previous: await pointer('previous') };
const automaticRollbackAttempt = await activate(packageResult.releaseId, { simulatePostActivationFailure: true });
const automaticPointers = { current: await pointer('current'), previous: await pointer('previous') };

const badId = 'rkreno-bad0001';
const badRelease = join(releases, badId);
await mkdir(join(badRelease, 'dist'), { recursive: true });
await writeFile(join(badRelease, 'dist/index.html'), 'broken');
await writeFile(join(badRelease, 'SHA256SUMS'), `${sha256(Buffer.from('broken'))}  dist/index.html\n`);
const beforeFailed = await pointer('current');
const failedActivation = await activate(badId);
const afterFailed = await pointer('current');
const automaticRollback = automaticRollbackAttempt.category === 'automatic_rollback'
  && automaticPointers.current === oldId
  && automaticPointers.previous === oldId;
const invalidTarget = await verifyRelease('../outside');
const missingTarget = await verifyRelease('rkreno-fffffff');
await writeFile(join(badRelease, 'SHA256SUMS'), `${'0'.repeat(64)}  dist/index.html\n`);
const checksumTarget = await verifyRelease(badId);
const output = {
  result: preActivation.ok && activation.ok && manualRollback.ok && automaticRollback ? 'PASS' : 'FAIL',
  preActivation: preActivation.category,
  activation: activation.category,
  currentAfterActivation: activatedPointers.current,
  previousAfterActivation: activatedPointers.previous,
  manualRollback: manualRollback.ok ? 'PASS' : 'FAIL',
  automaticRollback: automaticRollback ? 'PASS' : 'FAIL',
  automaticRollbackTrigger: automaticRollbackAttempt.trigger,
  failedReleaseActive: afterFailed === badId,
  invalidTargetRejected: invalidTarget.category === 'invalid_identifier',
  missingTargetRejected: missingTarget.category === 'missing',
  checksumMismatchRejected: checksumTarget.category === 'checksum',
  healthFailurePreventedActivation: failedActivation.category === 'health',
  pointersValid: manualPointers.current === oldId && manualPointers.previous === packageResult.releaseId,
  sharedEnvironmentPreserved: await readFile(join(shared, 'env/enquiry.env'), 'utf8') === sharedSentinel,
  unrelatedApplicationPreserved: await readFile(join(unrelated, 'state.txt'), 'utf8') === unrelatedSentinel,
  simulationRoot: '.release-cache/server-simulation',
};
await mkdir(resolve('.audit-cache/prompt-3-3'), { recursive: true });
await writeFile(resolve('.audit-cache/prompt-3-3/rehearsal.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (output.result !== 'PASS' || !output.invalidTargetRejected || !output.missingTargetRejected
  || !output.checksumMismatchRejected || !output.healthFailurePreventedActivation
  || !output.pointersValid || !output.sharedEnvironmentPreserved || !output.unrelatedApplicationPreserved) process.exit(1);
