import { readFile } from 'node:fs/promises';
import path from 'node:path';

const metricsPath = path.resolve(
  process.argv[2] || '.audit-cache/visual-comparison/validation/metrics.json',
);
const records = JSON.parse(await readFile(metricsPath, 'utf8'));
const desktop = records.filter((record) => record.viewport === 'desktop');
const ids = [...new Set(desktop.map((record) => record.id))];
const failures = [];
const rows = [];

for (const id of ids) {
  const production = desktop.find((record) => record.id === id && record.source === 'production');
  const staging = desktop.find((record) => record.id === id && record.source === 'staging');
  if (!production?.dom || !staging?.dom) {
    failures.push(`${id}: missing production or staging DOM record`);
    continue;
  }
  const checks = {
    status: production.status === 200 && staging.status === 200,
    title: Boolean(staging.dom.title?.trim()),
    description: Boolean(staging.dom.description?.trim()),
    canonical:
      production.dom.canonical === staging.dom.canonical &&
      staging.dom.canonical?.startsWith('https://rkrenosolution.com/'),
    robots: /noindex/i.test(staging.dom.robots || '') && /nofollow/i.test(staging.dom.robots || ''),
    schema: staging.dom.schema.length > 0 && !staging.dom.schema.includes('invalid'),
    h1: staging.dom.h1.length === 1 && Boolean(staging.dom.h1[0]?.text),
    basePaths: staging.dom.internalLinks.every((link) =>
      new URL(link.href).pathname.startsWith('/rkreno/'),
    ),
    overflow: !staging.dom.horizontalOverflow,
    images: staging.dom.brokenImages.length === 0,
  };
  checks.claims = !/1,250\+|500\+|1000\+|24\/7 emergency|100% safety|4\.9\/5|certified wireman|years? of experience|warrant(?:y|ies)|guarantee/i
    .test(JSON.stringify(staging.dom));
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
