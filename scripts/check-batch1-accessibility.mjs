import { readFile } from 'node:fs/promises';
import path from 'node:path';

const metricsFile = path.resolve(
  process.argv[2] || '.audit-cache/visual-comparison/after/metrics.json',
);
const records = JSON.parse(await readFile(metricsFile, 'utf8'))
  .filter((record) => record.source === 'staging');
const failures = [];

for (const record of records) {
  const label = `${record.id}/${record.viewport}`;
  if (record.status !== 200 || !record.dom) failures.push(`${label}: page did not load`);
  if (record.errors.length) failures.push(`${label}: browser errors: ${record.errors.join('; ')}`);
  if (record.dom?.h1.length !== 1) failures.push(`${label}: expected one H1`);
  if (record.dom?.missingAlt) failures.push(`${label}: ${record.dom.missingAlt} image alt values missing`);
  if (record.dom?.horizontalOverflow) failures.push(`${label}: horizontal overflow`);
  if (record.dom?.lang !== 'en') failures.push(`${label}: document language is not en`);
}

const mobileHome = records.find((record) =>
  record.id === 'home' && record.viewport === 'mobile');
if (!mobileHome?.mobileMenu?.opened || mobileHome.mobileMenu.visibleLinks < 5) {
  failures.push('home/mobile: mobile menu did not expose its navigation links');
}

if (failures.length) {
  console.error(`Batch 1 accessibility basics failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Accessibility basics passed for ${records.length} viewport/page records.`);
}
