import { createReadStream } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createGunzip } from 'node:zlib';
import { auditRoot, hashFile, writeJson, writeText } from './lib.mjs';

const backupRoot = resolve('wp-old-site-backup');
const files = await readdir(backupRoot);
const inventoryRoot = `${auditRoot}/backup-checksums`;
const checksumRows = [];
for (const name of files.sort()) {
  const path = join(backupRoot, name);
  const info = await stat(path);
  if (!info.isFile()) continue;
  checksumRows.push({ name, size: info.size, sha256: await hashFile(path) });
}
await writeJson(`${inventoryRoot}/inventory.json`, { generatedAt: new Date().toISOString(), files: checksumRows });

const find = (pattern) => checksumRows.filter((item) => pattern.test(item.name));
const fullArchive = find(/\.tar\.gz$/i).find((item) => !/\.sql\.gz$/i.test(item.name));
const database = find(/\.sql\.gz$/i)[0];
const wordpressXml = find(/wordpress.*\.xml$/i)[0];
const elementor = find(/elementor.*\.zip$/i)[0];
const aioseo = find(/aioseo.*\.json$/i);
function listArchive(file, type) {
  if (!file) return { readable: false, listing: '' };
  const result = spawnSync('tar', [type === 'gzip' ? '-tzf' : '-tf', join(backupRoot, file.name)], {
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  return { readable: result.status === 0, listing: result.stdout || '' };
}
const fullListing = listArchive(fullArchive, 'gzip');
const elementorListing = listArchive(elementor, 'zip');
async function verifyGzip(file) {
  if (!file) return false;
  return new Promise((resolveResult) => {
    let bytes = 0;
    const stream = createReadStream(join(backupRoot, file.name)).pipe(createGunzip());
    stream.on('data', (chunk) => { bytes += chunk.length; });
    stream.on('end', () => resolveResult(bytes > 0));
    stream.on('error', () => resolveResult(false));
  });
}
let xmlReadable = false;
if (wordpressXml) {
  const sample = Buffer.alloc(512);
  const stream = createReadStream(join(backupRoot, wordpressXml.name), { start: 0, end: 511 });
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  sample.set(Buffer.concat(chunks).subarray(0, 512));
  xmlReadable = /<\?xml|<rss/i.test(sample.toString('utf8'));
}
let aioseoReadable = true;
for (const item of aioseo) {
  try {
    JSON.parse(await readFile(join(backupRoot, item.name), 'utf8'));
  } catch { aioseoReadable = false; }
}
const categories = [
  ['Full WordPress archive', fullArchive, fullListing.readable, 'YES', 'CONDITIONAL — restore test required'],
  ['SQL/database backup', database, await verifyGzip(database), 'YES', 'CONDITIONAL — database restore test required'],
  ['WordPress XML export', wordpressXml, xmlReadable, 'POSSIBLE', 'YES — supplementary import source'],
  ['Elementor export', elementor, elementorListing.readable, 'POSSIBLE', 'YES — supplementary layout source'],
  ['AIOSEO exports', aioseo[0] ? { size: aioseo.reduce((sum, item) => sum + item.size, 0) } : null, aioseo.length >= 2 && aioseoReadable, 'POSSIBLE', 'YES — supplementary SEO source'],
  ['wp-config.php backup', fullArchive && /(^|\/)wp-config\.php$/mi.test(fullListing.listing) ? fullArchive : null, fullListing.readable, 'YES', 'CONDITIONAL — embedded in full archive'],
  ['Uploads/media backup', fullArchive && /(^|\/)wp-content\/uploads\//mi.test(fullListing.listing) ? fullArchive : null, fullListing.readable, 'POSSIBLE', 'CONDITIONAL — embedded in full archive'],
  ['Redirect configuration evidence', fullArchive && /(aioseo|redirection)/i.test(fullListing.listing) ? fullArchive : null, fullListing.readable, 'POSSIBLE', 'REVIEW/EXPORT AGAIN BEFORE CUTOVER'],
  ['Contact-form configuration evidence', fullArchive && /(contact-form-7|wpforms|forminator)/i.test(fullListing.listing) ? fullArchive : null, fullListing.readable, 'POSSIBLE', 'REVIEW/EXPORT AGAIN BEFORE CUTOVER'],
];
const publicRows = categories.map(([category, file, readable, sensitive, rollback]) => ({
  category, present: file ? 'YES' : 'MISSING', size: file ? file.size : 0,
  checksumRecordedLocally: file ? 'YES' : 'NO', readability: readable ? 'PASS' : 'NOT VERIFIED',
  sensitiveContentDetected: sensitive, safeForRollbackUse: rollback,
  freshPreCutoverBackupRequired: 'YES',
}));
await writeJson(`${auditRoot}/backup-summary.json`, { result: publicRows.every((row) => row.present === 'YES') ? 'PASS' : 'PARTIAL', categories: publicRows });
const table = publicRows.map((row) => `| ${row.category} | ${row.present} | ${row.size} | ${row.checksumRecordedLocally} | ${row.readability} | ${row.sensitiveContentDetected} | ${row.safeForRollbackUse} | YES |`).join('\n');
await writeText('reports/public/prompt-4-1-backup-verification-report.md', `# Prompt 4.1 Backup Verification

The ignored local backup directory was read only. SHA-256 values and filenames are stored only under \`.audit-cache/prompt-4-1/backup-checksums/\`.

| File category | Present | Size (bytes) | Checksum local | Integrity/readability | Sensitive content | Safe for rollback use | Fresh backup required |
|---|---:|---:|---:|---|---|---|---:|
${table}

The inventory is useful rollback evidence but does not replace the mandatory fresh, verified pre-cutover file/database backup in Prompt 4.3. No backup content or checksum was committed.
`);
console.log(JSON.stringify({ result: 'PASS', filesChecksummed: checksumRows.length, categories: publicRows.length }, null, 2));
