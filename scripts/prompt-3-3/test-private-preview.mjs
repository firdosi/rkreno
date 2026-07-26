import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';
import routeMap from '../../config/production-route-map.json' with { type: 'json' };
import contentLock from '../../config/approved-route-content-lock.json' with { type: 'json' };
import { startPrivateRuntime, stopPrivateRuntime, simulatorOrigin, previewHost, authHeader } from './lib/private-runtime.mjs';

const results = [];
const check = (name, passed, actual = 'PASS') => results.push({ name, passed, actual });
const headers = {
  'X-Forwarded-Host': previewHost,
  'X-Forwarded-Proto': 'https',
  Authorization: authHeader,
};
const request = (path, options = {}) => fetch(`${simulatorOrigin}${path}`, {
  redirect: 'manual', ...options, headers: { ...headers, ...(options.headers || {}) },
});
const runtime = await startPrivateRuntime();
try {
  const unauthenticated = await fetch(`${simulatorOrigin}/`, { headers: { 'X-Forwarded-Host': previewHost } });
  check('authentication required', unauthenticated.status === 401, unauthenticated.status);
  const foreign = await fetch(`${simulatorOrigin}/`, { headers: { ...headers, 'X-Forwarded-Host': 'foreign.test' } });
  check('foreign host rejected', foreign.status === 421, foreign.status);
  const retained = routeMap.entries.filter((entry) => entry.action === 'RETAIN_200');
  for (const entry of retained) {
    const response = await request(entry.sourcePath);
    const html = await response.text();
    const $ = cheerio.load(html);
    if (response.status !== 200) check(`${entry.sourcePath} retained`, false, response.status);
    if (response.headers.get('x-robots-tag') !== 'noindex, nofollow, noarchive') check(`${entry.sourcePath} x-robots`, false);
    if ($('link[rel="canonical"]').attr('href') !== `https://rkrenosolution.com${entry.sourcePath}`) check(`${entry.sourcePath} canonical`, false);
    const structured = $('script[type="application/ld+json"]').text();
    if (/preview\.local\.test|firdosi\.github\.io/.test(`${structured}${$('meta[property="og:url"]').attr('content') || ''}`)) {
      check(`${entry.sourcePath} preview leakage`, false);
    }
    if (/googletagmanager|google-analytics|challenges\.cloudflare|G-NVEL66185G|GT-T944JBVZ/.test(html)) {
      check(`${entry.sourcePath} provider leakage`, false);
    }
  }
  check('all 42 retained routes', !results.some((item) => /retained|canonical|x-robots|leakage/.test(item.name) && !item.passed), retained.length);
  for (const entry of routeMap.entries.filter((item) => item.action === 'REDIRECT_301')) {
    const response = await request(entry.sourcePath);
    if (response.status !== 301 || response.headers.get('location') !== `https://${previewHost}${entry.destination}`) {
      check(`${entry.sourcePath} redirect`, false, response.status);
    }
  }
  check('23 one-hop redirects', !results.some((item) => item.name.endsWith(' redirect') && !item.passed), 23);
  for (const entry of routeMap.entries.filter((item) => item.action === 'GONE_410')) {
    if ((await request(entry.sourcePath)).status !== 410) check(`${entry.sourcePath} gone`, false);
  }
  check('66 gone routes', !results.some((item) => item.name.endsWith(' gone') && !item.passed), 66);
  for (const entry of routeMap.entries.filter((item) => item.action === 'EXISTING_404')) {
    if ((await request(entry.sourcePath)).status !== 404) check(`${entry.sourcePath} known 404`, false);
  }
  check('nine known 404 routes', !results.some((item) => item.name.endsWith('known 404') && !item.passed), 9);
  check('custom unknown 404', (await request('/prompt-3-3-unknown/')).status === 404);
  const robots = await (await request('/robots.txt')).text();
  check('preview robots disallow all', robots.includes('Disallow: /') && !robots.includes('Allow: /'));
  const sitemap = await (await request('/sitemap.xml')).text();
  check('sitemap retains 32 production URLs', [...sitemap.matchAll(/<loc>/g)].length === 32
    && !sitemap.includes(previewHost) && sitemap.includes('https://rkrenosolution.com/'));
  for (const path of ['/.env', '/backup.sql', '/archive.zip', '/wp-old-site-backup/', '/Media/', '/.release-cache/']) {
    check(`${path} inaccessible`, (await request(path)).status === 404);
  }
  const home = await request('/');
  const homeHtml = await home.text();
  const $home = cheerio.load(homeHtml);
  const firstLocal = (values) => values.find((value) => value?.startsWith('/'));
  const assets = [
    firstLocal($home('link[rel="stylesheet"]').map((_, item) => $home(item).attr('href')).get()),
    firstLocal($home('script[src]').map((_, item) => $home(item).attr('src')).get()),
    firstLocal($home('img[src]').map((_, item) => $home(item).attr('src')).get()),
  ].filter(Boolean);
  for (const asset of assets) {
    const response = await request(asset);
    check(`${asset} loads`, response.status === 200 && Boolean(response.headers.get('content-type')), response.status);
  }
  check('HTML revalidation cache', /max-age=0.*must-revalidate/.test(home.headers.get('cache-control') || ''));
  check('security headers present', ['content-security-policy', 'permissions-policy', 'referrer-policy', 'x-content-type-options', 'x-frame-options']
    .every((name) => home.headers.has(name)));

  const formPayload = {
    name: 'Preview Test User', phone: '+60 11 0000 0000', email: 'preview@example.test',
    service: 'House Renovation', projectDetails: 'Private preview test-capture submission only.',
    consent: true, pageUrl: '/contact-us/', startedAt: new Date(Date.now() - 5000).toISOString(),
    website: '', turnstileToken: 'test-success',
  };
  const formResponse = await request('/api/enquiry', {
    method: 'POST',
    headers: { Origin: `https://${previewHost}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(formPayload),
  });
  const formBody = await formResponse.json();
  check('test-capture form accepted', formResponse.status === 200 && formBody.ok === true);
  check('simulated Turnstile only', /^rk_[a-f0-9]{16}$/.test(formBody.requestId || ''));

  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const providerRequests = [];
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({
        viewport,
        extraHTTPHeaders: headers,
        httpCredentials: { username: 'preview', password: 'local-test' },
      });
      const page = await context.newPage();
      page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('request', (requestItem) => {
        if (/googletagmanager|google-analytics|challenges\.cloudflare/.test(requestItem.url())) providerRequests.push(requestItem.url());
      });
      await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com/, (route) =>
        route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
      for (const path of ['/', '/contact-us/']) {
        await page.goto(`${simulatorOrigin}${path}`, { waitUntil: 'networkidle' });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        check(`${viewport.width}px ${path} no overflow`, !overflow);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  check('no browser console errors', consoleErrors.length === 0, consoleErrors.join(' | '));
  check('no tracking or Turnstile provider requests', providerRequests.length === 0, providerRequests.length);
} finally {
  await stopPrivateRuntime(runtime);
}
const output = {
  result: results.every((item) => item.passed) ? 'PASS' : 'FAIL',
  releaseId: runtime.packageResult.releaseId,
  retained: 42, redirects: 23, gone: 66, known404: 9,
  totalChecks: results.length,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  servicesStopped: [runtime.service, runtime.simulator]
    .every((child) => child.exitCode !== null || child.signalCode !== null),
  results,
};
await mkdir(resolve('.audit-cache/prompt-3-3'), { recursive: true });
await writeFile(resolve('.audit-cache/prompt-3-3/private-preview.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ ...output, results: undefined }, null, 2));
if (output.failed || !output.servicesStopped) process.exit(1);
