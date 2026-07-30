import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const directory = path.join(process.cwd(), 'scripts', 'prompt-1-2');
const files = (await readdir(directory)).filter((file) => file.endsWith('.mjs'));
const allowedEnumFile = 'result-status.mjs';
const documentationFiles = new Set(['write-correction-reports.mjs', 'detect-hardcoded-results.mjs']);
const failures = [];
const forbidden = [
  { name: 'direct MATCH status assignment', pattern: /status\s*:\s*['"]MATCH['"]/ },
  { name: 'ternary MATCH assignment', pattern: /\?\s*['"]MATCH['"]/ },
  { name: 'uniform MATCH fill', pattern: /\.fill\(\s*['"]MATCH['"]\s*\)/ },
  { name: 'overflow-only visual pass', pattern: /visual comparison['"][\s\S]{0,160}\.every\([^)]*overflow/ },
  { name: 'short-string semantic containment', pattern: /semantic comparison[\s\S]{0,220}\.includes\(/ },
];

for (const file of files) {
  if (file === allowedEnumFile || documentationFiles.has(file)) continue;
  const content = await readFile(path.join(directory, file), 'utf8');
  for (const rule of forbidden) {
    if (rule.pattern.test(content)) failures.push(`${file}: ${rule.name}`);
  }
  if (file === 'generate-reports.mjs' && /['"]MATCH['"]/.test(content)) {
    failures.push(`${file}: report generator contains a MATCH literal`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Hardcoded-result guard passed across ${files.length} Prompt 1.2 scripts.`);
}
