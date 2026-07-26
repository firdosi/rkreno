import { gunzipSync, gzipSync } from 'node:zlib';
import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

function octal(value, length) {
  return `${Math.max(0, value).toString(8).padStart(length - 1, '0')}\0`;
}
function pathFields(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');
  if (Buffer.byteLength(normalized) <= 100) return { name: normalized, prefix: '' };
  for (let index = normalized.lastIndexOf('/'); index > 0; index = normalized.lastIndexOf('/', index - 1)) {
    const prefix = normalized.slice(0, index);
    const name = normalized.slice(index + 1);
    if (Buffer.byteLength(name) <= 100 && Buffer.byteLength(prefix) <= 155) return { name, prefix };
  }
  throw new Error(`Archive path is too long: ${relativePath}`);
}
function field(header, offset, length, value) {
  Buffer.from(value).copy(header, offset, 0, length);
}
function headerFor(entry, epochSeconds) {
  const header = Buffer.alloc(512);
  const { name, prefix } = pathFields(entry.path);
  field(header, 0, 100, name);
  field(header, 100, 8, octal(entry.mode || 0o644, 8));
  field(header, 108, 8, octal(0, 8));
  field(header, 116, 8, octal(0, 8));
  field(header, 124, 12, octal(entry.content.length, 12));
  field(header, 136, 12, octal(epochSeconds, 12));
  field(header, 148, 8, '        ');
  field(header, 156, 1, '0');
  field(header, 257, 6, 'ustar\0');
  field(header, 263, 2, '00');
  field(header, 265, 32, 'root');
  field(header, 297, 32, 'root');
  field(header, 345, 155, prefix);
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  field(header, 148, 8, `${checksum.toString(8).padStart(6, '0')}\0 `);
  return header;
}

export async function createDeterministicArchive(entries, destination, timestamp) {
  const epoch = Math.floor(new Date(timestamp).getTime() / 1000);
  const blocks = [];
  for (const entry of [...entries].sort((left, right) => left.path.localeCompare(right.path))) {
    blocks.push(headerFor(entry, epoch), entry.content);
    const padding = (512 - (entry.content.length % 512)) % 512;
    if (padding) blocks.push(Buffer.alloc(padding));
  }
  blocks.push(Buffer.alloc(1024));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, gzipSync(Buffer.concat(blocks), { level: 9, mtime: 0 }));
}

export async function extractArchive(archive, destination) {
  const data = gunzipSync(await readFile(archive));
  const root = resolve(destination);
  let offset = 0;
  while (offset + 512 <= data.length) {
    const header = data.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const readText = (start, length) => header.subarray(start, start + length).toString().replace(/\0.*$/, '');
    const name = readText(0, 100);
    const prefix = readText(345, 155);
    const relative = prefix ? `${prefix}/${name}` : name;
    if (!relative || relative.split('/').includes('..') || relative.startsWith('/')) throw new Error('Unsafe archive path');
    const size = Number.parseInt(readText(124, 12).trim() || '0', 8);
    const mode = Number.parseInt(readText(100, 8).trim() || '644', 8);
    const target = resolve(root, relative.replaceAll('/', sep));
    if (!target.startsWith(`${root}${sep}`)) throw new Error('Archive extraction escaped destination');
    const start = offset + 512;
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data.subarray(start, start + size));
    await chmod(target, mode);
    offset = start + Math.ceil(size / 512) * 512;
  }
}
