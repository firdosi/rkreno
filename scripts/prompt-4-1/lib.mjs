import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export const root = process.cwd();
export const auditRoot = resolve('.audit-cache/prompt-4-1');
export const reportRoot = resolve('reports/public');
export const approvedReleaseSha = '4dcc9a55bce8ca90df36292c589a827c613a9b5a';
export const evidenceCommitSha = '01a61d8a520d700cb551bdb2f80ea3c669bc4421';
export const releaseId = 'rkreno-4dcc9a5';
export const archiveSha256 = 'fb3b8203bab2b81169041a7667be85009dc8a513d4fa81a4428f6ff60543dba1';

export async function ensureParent(path) {
  await mkdir(dirname(resolve(path)), { recursive: true });
}

export async function writeText(path, content) {
  await ensureParent(path);
  await writeFile(resolve(path), content.endsWith('\n') ? content : `${content}\n`);
}

export async function writeJson(path, value) {
  await writeText(path, JSON.stringify(value, null, 2));
}

export async function readJson(path) {
  return JSON.parse(await readFile(resolve(path), 'utf8'));
}

export async function hashFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(resolve(path))) hash.update(chunk);
  return hash.digest('hex');
}

export function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function toCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}
