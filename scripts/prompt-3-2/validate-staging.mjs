import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import * as cheerio from 'cheerio';
import contentLock from '../../config/approved-route-content-lock.json' with { type: 'json' };

const root = resolve('dist');
const failures = [];
for (const route of Object.keys(contentLock.routes)) {
  const file = route === '/' ? join(root, 'index.html') : join(root, route.slice(1), 'index.html');
  const html = await readFile(file, 'utf8');
  const $ = cheerio.load(html);
  if ($('meta[name="robots"]').attr('content') !== 'noindex, nofollow') failures.push(`${route}: indexability`);
  for (const form of $('form').toArray()) {
    const controls = $(form).find('input,select,textarea,button').toArray();
    if (controls.some((control) => !$(control).is(':disabled'))) failures.push(`${route}: enabled form control`);
    if ($(form).attr('action') === '/api/enquiry' || $(form).attr('data-configured') === 'true') failures.push(`${route}: active form`);
  }
  if (/challenges\.cloudflare\.com|googletagmanager\.com|google-analytics\.com|G-NVEL66185G|GT-T944JBVZ/.test(html)) failures.push(`${route}: provider leakage`);
  if (/data-consent-banner|data-consent-settings/.test(html)) failures.push(`${route}: consent UI present`);
  if ($('a[href^="tel:"]').length === 0 || $('a[href*="wa.me"]').length === 0) failures.push(`${route}: contact alternative`);
}
const robots = await readFile(join(root, 'robots.txt'), 'utf8');
if (!robots.includes('Disallow: /')) failures.push('robots.txt');
const assets = await readdir(join(root, '_astro'));
const scripts = (await Promise.all(assets.filter((name) => name.endsWith('.js'))
  .map((name) => readFile(join(root, '_astro', name), 'utf8')))).join('\n');
if (/G-NVEL66185G|GT-T944JBVZ|challenges\.cloudflare\.com\/turnstile/.test(scripts)) failures.push('bundled provider leakage');
const output = { routes: Object.keys(contentLock.routes).length, failures };
await writeFile(resolve('.audit-cache', 'prompt-3-2', 'staging.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (failures.length) process.exit(1);
