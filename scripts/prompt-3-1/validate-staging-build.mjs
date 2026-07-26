import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { finalReviewRoutes } from '../lib/final-review-routes.mjs';

const failures = [];
const root = path.resolve('dist');
for (const { route } of finalReviewRoutes) {
  const file = route === '/' ? path.join(root, 'index.html') : path.join(root, route.slice(1), 'index.html');
  const html = await readFile(file, 'utf8');
  const $ = load(html);
  if ($('meta[name="robots"]').attr('content') !== 'noindex, nofollow') failures.push(`${route}: staging indexability`);
  if (/googletagmanager|google-analytics|connect\.facebook\.net|clarity\.ms|bat\.bing\.com|fbq\s*\(/i.test(html)) {
    failures.push(`${route}: tracking loader`);
  }
  if ($('form input:not([disabled]),form select:not([disabled]),form textarea:not([disabled]),form button:not([disabled])').length) {
    failures.push(`${route}: enabled form control`);
  }
  if ($('link[rel="canonical"]').attr('href')?.startsWith('https://firdosi.github.io')) failures.push(`${route}: staging canonical`);
}
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
if (!robots.includes('Disallow: /') || robots.includes('Allow: /')) failures.push('staging robots.txt');
await mkdir(path.resolve('.audit-cache', 'prompt-3-1'), { recursive: true });
await writeFile(path.resolve('.audit-cache', 'prompt-3-1', 'staging-result.json'), `${JSON.stringify({
  result: failures.length ? 'FAIL' : 'PASS', routes: finalReviewRoutes.length, failures,
}, null, 2)}\n`);
console.log(JSON.stringify({ result: failures.length ? 'FAIL' : 'PASS', routes: finalReviewRoutes.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
