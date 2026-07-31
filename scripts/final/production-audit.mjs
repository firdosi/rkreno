import { readFile, readdir, rm, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { load } from 'cheerio';
import { clean, exists, htmlFile, localFile, readJson } from './helpers.mjs';

const productionDir = '.final-production-dist';

const run = (command, root, env = {}) => spawnSync(command, {
  cwd: root, env: { ...process.env, ...env }, shell: true, encoding: 'utf8', stdio: 'pipe',
});

export async function auditProduction(root) {
  await rm(path.join(root, productionDir), { recursive: true, force: true });
  const build = run('npm run build', root, {
    DEPLOY_TARGET: 'vps', RKRENO_OUT_DIR: `./${productionDir}`,
    PUBLIC_FORM_MODE: 'disabled', PUBLIC_ANALYTICS_ENABLED: 'false', PUBLIC_CONSENT_ENABLED: 'false',
  });
  const errors = [];
  if (build.status !== 0) errors.push(`Production build failed: ${clean(build.stderr || build.stdout)}`);
  const registry = await readJson(path.join(root, 'config/final-route-registry.json'));
  if (!errors.length) {
    for (const route of registry.publicRoutes) {
      const html = await readFile(htmlFile(root, route.path, productionDir), 'utf8');
      const $ = load(html);
      const expectedRobots = route.indexability === 'index' ? /^index\s*,\s*follow$/i : /^noindex\s*,\s*(?:no)?follow$/i;
      if (!expectedRobots.test($('meta[name="robots"]').attr('content') || '')) errors.push(`${route.path}: wrong production robots.`);
      if ($('link[rel="canonical"]').attr('href') !== route.canonical) errors.push(`${route.path}: wrong production canonical.`);
      if (/firdosi\.github\.io|(?:href|src)="\/rkreno\//i.test(html)) errors.push(`${route.path}: staging path in production output.`);
      if ($('form[action]').length) errors.push(`${route.path}: form enabled in production simulation.`);
      for (const asset of $('[src],[href]').toArray()) {
        const value = $(asset).attr('src') || $(asset).attr('href') || '';
        if (value.startsWith('/') && !value.startsWith('//') && /\.[a-z0-9]+(?:[?#]|$)/i.test(value) && !(await exists(localFile(root, value, productionDir)))) {
          errors.push(`${route.path}: broken production asset ${value}`);
        }
      }
    }
    const sitemap = await readFile(path.join(root, productionDir, 'sitemap.xml'), 'utf8');
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    if (urls.length !== 33 || new Set(urls).size !== 33 || urls.some((url) => url.includes('/rkreno/'))) errors.push('Production sitemap is not the approved 33 unique URLs.');
    const robots = await readFile(path.join(root, productionDir, 'robots.txt'), 'utf8');
    if (!/Allow:\s*\//.test(robots) || !/Sitemap:\s*https:\/\/rkrenosolution\.com\/sitemap\.xml/.test(robots) || /Disallow:\s*\//.test(robots)) errors.push('Production robots policy is invalid.');
  }
  const summary = await performanceSummary(root, productionDir, registry.publicRoutes.map((item) => item.path));
  return { errors, buildStatus: build.status, buildWarnings: (build.stdout || '').split('\n').filter((line) => line.includes('[WARN]')).length, output: productionDir, performance: summary };
}

async function performanceSummary(root, output, routes) {
  const groups = {
    homepage: '/', service: '/house-renovation-in-kuala-lumpur/',
    article: '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/',
    archive: '/blog/', contact: '/contact-us/',
  };
  const rows = [];
  for (const [template, route] of Object.entries(groups)) {
    const file = htmlFile(root, route, output); const html = await readFile(file, 'utf8'); const $ = load(html);
    const assets = [...new Set($('[src],link[rel="stylesheet"][href]').toArray().map((node) => $(node).attr('src') || $(node).attr('href')).filter((url) => url?.startsWith('/')))];
    let assetBytes = 0; let largestAsset = 0;
    for (const url of assets) {
      const asset = localFile(root, url, output);
      if (await exists(asset)) { const size = (await stat(asset)).size; assetBytes += size; largestAsset = Math.max(largestAsset, size); }
    }
    rows.push({ template, route, htmlBytes: Buffer.byteLength(html), requests: assets.length + 1, assetBytes, largestAsset });
  }
  return rows;
}

export async function auditRepositorySafety(root) {
  const errors = [];
  const tracked = run('git ls-files -z', root).stdout.split('\0').filter(Boolean);
  const secretPatterns = [/^-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----$/m, /AKIA[0-9A-Z]{16}/, /\bgh[pousr]_[A-Za-z0-9]{30,}\b/, /\bsk-[A-Za-z0-9_-]{32,}\b/];
  for (const file of tracked) {
    const absolute = path.join(root, file);
    let data; try { data = await readFile(absolute, 'utf8'); } catch { continue; }
    if (secretPatterns.some((pattern) => pattern.test(data))) errors.push(`Possible secret in ${file}`);
  }
  const ignored = ['node_modules', 'dist', '.astro', '.audit-cache', 'reports/private', 'wp-old-site-backup', 'Media', productionDir];
  for (const item of ignored) {
    const result = run(`git check-ignore -q -- "${item}/.final-audit-probe"`, root);
    if (result.status !== 0) errors.push(`Generated/private directory is not ignored: ${item}`);
  }
  const pages = await readFile(path.join(root, '.github/workflows/deploy-pages.yml'), 'utf8');
  const vps = await readFile(path.join(root, '.github/workflows/deploy-vps.yml'), 'utf8');
  const finalGate = /npm run test:final/.test(pages);
  if ((!finalGate && !/DEPLOY_TARGET:\s*github/.test(pages)) || (!finalGate && !/test:migration -- --skip-build/.test(pages))) errors.push('Pages workflow lacks staging-safe validation.');
  if (!/github\.event_name == 'workflow_dispatch'.*RKRENO_VPS_DEPLOY_ENABLED == 'true'/.test(vps)) errors.push('VPS workflow is not manual-and-flag gated.');
  if (/pull_request:|schedule:/.test(vps)) errors.push('VPS workflow has an automatic trigger.');
  return { errors, trackedFiles: tracked.length, ignoredChecked: ignored.length };
}

export async function cleanupProduction(root) {
  await rm(path.join(root, productionDir), { recursive: true, force: true });
}
