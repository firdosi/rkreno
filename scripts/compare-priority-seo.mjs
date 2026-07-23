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
    title: production.dom.title === staging.dom.title,
    description: production.dom.description === staging.dom.description,
    canonical:
      production.dom.canonical === staging.dom.canonical &&
      staging.dom.canonical?.startsWith('https://rkrenosolution.com/'),
    robots: /noindex/i.test(staging.dom.robots || '') && /nofollow/i.test(staging.dom.robots || ''),
    schema: production.dom.schema.length === staging.dom.schema.length,
    h1: staging.dom.h1.length > 0 && production.dom.h1[0]?.text === staging.dom.h1[0]?.text,
    basePaths: staging.dom.internalLinks.every((link) =>
      new URL(link.href).pathname.startsWith('/rkreno/'),
    ),
    overflow: !staging.dom.horizontalOverflow,
    images: staging.dom.brokenImages.length === 0,
  };
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
