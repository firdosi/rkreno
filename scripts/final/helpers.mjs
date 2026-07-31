import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

export const clean = (value = '') => value.replace(/\s+/g, ' ').trim();
export const exists = (file) => access(file).then(() => true).catch(() => false);
export const htmlFile = (root, route, output = 'dist') => route === '/'
  ? path.join(root, output, 'index.html')
  : path.join(root, output, route.slice(1), 'index.html');
export const localFile = (root, url, output = 'dist') => path.join(
  root,
  output,
  decodeURIComponent(url.split(/[?#]/)[0]).replace(/^\/rkreno\/?/, '').replace(/^\//, ''),
);
export const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
export const schemaTypes = (value) => {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const own = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
    const graph = Array.isArray(item['@graph']) ? item['@graph'].flatMap((node) => schemaTypes(node)) : [];
    return [...own.filter(Boolean), ...graph];
  }))];
};
export const normalizeRoute = (href, current = '/') => {
  if (!href || /^(?:mailto:|tel:|javascript:|data:|#)/i.test(href)) return null;
  try {
    const url = new URL(href, `https://rkrenosolution.com${current}`);
    if (!['rkrenosolution.com', 'www.rkrenosolution.com', 'firdosi.github.io'].includes(url.hostname)) return null;
    const value = url.pathname.replace(/^\/rkreno(?=\/|$)/, '') || '/';
    return value.endsWith('/') || path.posix.extname(value) ? value : `${value}/`;
  } catch { return null; }
};
export const csv = (rows) => rows.map((row) => row.map((value) => {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}).join(',')).join('\n') + '\n';
export const reportTable = (headers, rows) => [
  `| ${headers.join(' | ')} |`,
  `| ${headers.map(() => '---').join(' | ')} |`,
  ...rows.map((row) => `| ${row.map((value) => String(value ?? '').replace(/\|/g, '\\|')).join(' | ')} |`),
].join('\n');
