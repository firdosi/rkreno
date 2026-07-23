import { readdir } from 'node:fs/promises';
import path from 'node:path';

const origin = process.argv[2]?.replace(/\/+$/, '');
if (!origin || !origin.startsWith('https://')) {
  throw new Error('Usage: node scripts/test-deployed-routes.mjs https://preview.example.com');
}
const expectIndexable = process.env.EXPECT_INDEXABLE === 'true';
const dist = path.resolve('dist');
const routes = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name === 'index.html') {
      const relative = path.relative(dist, directory).replaceAll('\\', '/');
      routes.push(relative ? `/${relative}/` : '/');
    }
  }
}
await walk(dist);
routes.sort();

const failures = [];
let cursor = 0;
const workers = Array.from({ length: 10 }, async () => {
  while (cursor < routes.length) {
    const route = routes[cursor++];
    try {
      const response = await fetch(`${origin}${route}`, {
        headers: { 'User-Agent': 'RK-Reno-VPS-route-test/1.0' },
        redirect: 'manual',
        signal: AbortSignal.timeout(15_000),
      });
      const html = await response.text();
      if (response.status !== 200) failures.push(`${route}: HTTP ${response.status}`);
      if (!html.includes('https://rkrenosolution.com/')) failures.push(`${route}: canonical missing`);
      const expectedRobots = expectIndexable ? 'index, follow' : 'noindex, nofollow';
      if (!html.includes(`content="${expectedRobots}"`)) {
        failures.push(`${route}: expected ${expectedRobots}`);
      }
    } catch (error) {
      failures.push(`${route}: ${error.message}`);
    }
  }
});
await Promise.all(workers);

const missingResponse = await fetch(`${origin}/rkreno-route-that-must-not-exist/`, {
  redirect: 'manual',
  signal: AbortSignal.timeout(15_000),
});
if (missingResponse.status !== 404) failures.push(`custom 404: HTTP ${missingResponse.status}`);

for (const endpoint of ['/robots.txt', '/sitemap.xml', '/api/health']) {
  const response = await fetch(`${origin}${endpoint}`, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) failures.push(`${endpoint}: HTTP ${response.status}`);
}

if (failures.length) {
  console.error(`VPS route test failed (${failures.length}):\n- ${failures.slice(0, 100).join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`VPS route test passed: ${routes.length} content routes + custom 404 = ${routes.length + 1}.`);
}
