import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import release from '../../config/approved-release.json' with { type: 'json' };
import routeMap from '../../config/production-route-map.json' with { type: 'json' };

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const hashFile = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');
const head = git('rev-parse', 'HEAD');
const explicit = process.env.RELEASE_SOURCE_SHA || '';
const tracked = git('status', '--porcelain', '--untracked-files=no');
const failures = [];
if (tracked) failures.push('tracked working tree modifications are present');
if (head !== release.approvedGitCommit && explicit !== head) failures.push('HEAD is not the approved or explicitly supplied release SHA');
if (explicit && !/^[a-f0-9]{40}$/.test(explicit)) failures.push('RELEASE_SOURCE_SHA must be a full commit SHA');
if ((await hashFile('package-lock.json')) !== release.npmLockfileSha256) failures.push('package-lock hash mismatch');
if ((await hashFile('config/approved-route-content-lock.json')) !== release.contentLockSha256) failures.push('content-lock hash mismatch');
if (routeMap.mapHash !== release.routeMapHash) failures.push('route-map hash mismatch');
const totals = routeMap.totals;
if (totals.RETAIN_200 !== 42 || totals.REDIRECT_301 !== 23 || totals.GONE_410 !== 66
  || totals.EXISTING_404 !== 9 || totals.OWNER_DECISION_UNPUBLISHED !== 5) failures.push('route totals mismatch');
try {
  execFileSync(process.execPath, [process.env.npm_execpath, 'ci', '--ignore-scripts', '--dry-run'], { stdio: 'pipe' });
} catch {
  failures.push('package-lock does not satisfy package.json');
}
const result = {
  result: failures.length ? 'FAIL' : 'PASS',
  approvedWebsiteCommit: release.approvedGitCommit,
  releaseSourceSha: explicit || head,
  head,
  trackedClean: !tracked,
  failures,
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
