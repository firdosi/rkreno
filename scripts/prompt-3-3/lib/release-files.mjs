import { createHash } from 'node:crypto';
import { copyFile, mkdir, readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

export const sha256 = (content) => createHash('sha256').update(content).digest('hex');

export async function walkFiles(root) {
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const full = join(directory, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) files.push(full);
    }
  }
  await walk(root);
  return files.sort();
}

export async function copyTree(source, destination) {
  for (const file of await walkFiles(source)) {
    const target = join(destination, relative(source, file));
    await mkdir(dirname(target), { recursive: true });
    await copyFile(file, target);
  }
}

export function classify(relativePath) {
  const value = relativePath.replaceAll('\\', '/');
  if (value.startsWith('dist/_astro/')) return { purpose: 'versioned static asset', cache: 'immutable_1_year', exposure: 'public' };
  if (value.startsWith('dist/')) return { purpose: 'static website response', cache: value.endsWith('.html') ? 'revalidate' : 'weekly', exposure: 'public' };
  if (value.startsWith('server/')) return { purpose: 'loopback enquiry service', cache: 'not_applicable', exposure: 'server_only' };
  if (value.startsWith('deploy/')) return { purpose: 'inactive deployment template', cache: 'not_applicable', exposure: 'server_only' };
  if (value.startsWith('scripts/')) return { purpose: 'release runtime or operation script', cache: 'not_applicable', exposure: 'server_only' };
  if (value.startsWith('config/')) return { purpose: 'non-secret runtime policy', cache: 'not_applicable', exposure: 'server_only' };
  if (value.startsWith('docs/')) return { purpose: 'operator runbook', cache: 'not_applicable', exposure: 'server_only' };
  return { purpose: 'release metadata or dependency definition', cache: 'not_applicable', exposure: 'server_only' };
}

export async function describeFiles(root) {
  const rows = [];
  for (const file of await walkFiles(root)) {
    const content = await readFile(file);
    const relativePath = relative(root, file).replaceAll('\\', '/');
    rows.push({
      relativePath,
      size: (await stat(file)).size,
      sha256: sha256(content),
      ...classify(relativePath),
    });
  }
  return rows;
}

export async function archiveEntries(root) {
  const entries = [];
  for (const file of await walkFiles(root)) {
    const info = await stat(file);
    entries.push({
      path: relative(resolve(root), file).replaceAll('\\', '/'),
      content: await readFile(file),
      mode: file.endsWith('.sh') || info.mode & 0o111 ? 0o755 : 0o644,
    });
  }
  return entries;
}
