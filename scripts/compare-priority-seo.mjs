import { readFile } from 'node:fs/promises';
import path from 'node:path';

const metricsPath = path.resolve(
  process.argv[2] || '.audit-cache/wordpress-parity/after/manifest.json',
);
const input = JSON.parse(await readFile(metricsPath, 'utf8'));
const currentRecords = Array.isArray(input) ? input : input.captures;
const baselinePath = path.resolve('.audit-cache/wordpress-parity/before/manifest.json');
const baseline = Array.isArray(input)
  ? []
  : JSON.parse(await readFile(baselinePath, 'utf8')).captures
    .filter((record) => record.source === 'wordpress');
const records = [...baseline, ...currentRecords];
const desktop = records.filter((record) => record.viewport === 'desktop');
const ids = [...new Set(desktop.map((record) => record.id))];
const failures = [];
const rows = [];
const modernManifest = !Array.isArray(input);

for (const id of ids) {
  const productionSource = modernManifest ? 'wordpress' : 'production';
  const stagingSource = modernManifest ? 'astro' : 'staging';
  const production = desktop.find((record) => record.id === id && record.source === productionSource);
  const staging = desktop.find((record) => record.id === id && record.source === stagingSource);
  if (!production?.dom || !staging?.dom) {
    failures.push(`${id}: missing production or staging DOM record`);
    continue;
  }
  const stagingH1 = modernManifest
    ? staging.dom.headings.filter(({ level }) => level === 'H1')
    : staging.dom.h1;
  const stagingSchemas = modernManifest ? staging.dom.schemas : staging.dom.schema;
  const expectedRobots = modernManifest && (/^\/(?:category|tag)\//.test(staging.route)
      || staging.route === '/thank-you/')
    ? /^noindex,\s*follow$/i
    : /noindex.*nofollow/i;
  const canonicalMatches = modernManifest
    ? new URL(production.dom.canonical || production.url).pathname
      === new URL(staging.dom.canonical || staging.url).pathname
    : production.dom.canonical === staging.dom.canonical;
  const checks = {
    status: production.status === 200 && staging.status === 200,
    title: Boolean(staging.dom.title?.trim()),
    description: Boolean(staging.dom.description?.trim()),
    canonical: canonicalMatches && staging.dom.canonical?.startsWith('https://rkrenosolution.com/'),
    robots: expectedRobots.test(staging.dom.robots || ''),
    schema: stagingSchemas.length > 0 && !stagingSchemas.includes('invalid'),
    h1: stagingH1.length === 1 && Boolean(stagingH1[0]?.text),
    internalLinks: modernManifest
      ? staging.dom.internalLinks.every((link) => new URL(link.href).origin === new URL(staging.url).origin)
      : staging.dom.internalLinks.every((link) => new URL(link.href).pathname.startsWith('/rkreno/')),
    overflow: !staging.dom.horizontalOverflow,
    images: staging.dom.brokenImages.length === 0,
  };
  checks.claims = !/1,250\+|500\+|1000\+|24\/7 emergency|100% safety|4\.9\/5|certified wireman|years? of experience|warrant(?:y|ies)|guarantee/i
    .test(modernManifest ? staging.dom.bodyText : JSON.stringify(staging.dom));
  for (const [name, passed] of Object.entries(checks)) {
    if (!passed) failures.push(`${id}: ${name}`);
  }
  rows.push({ id, ...checks, missingAlt: staging.dom.missingAlt });
}

console.table(rows);
if (failures.length) {
  console.error(`SEO comparison failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`SEO comparison passed for ${rows.length} priority pages.`);
}
