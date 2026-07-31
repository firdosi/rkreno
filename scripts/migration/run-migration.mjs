import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { validateStatic } from './validate-static.mjs';
import { validateBrowser } from './validate-browser.mjs';
import { validateSafety } from './safety.mjs';
import { startServer } from './server.mjs';
import { writeReports } from './write-reports.mjs';
import { validatePrompt2 } from '../prompt-2/validate-prompt-2.mjs';
import { writePrompt2Reports } from '../prompt-2/write-prompt-2-reports.mjs';
import { validatePrompt3 } from '../prompt-3/validate-prompt-3.mjs';
import { writePrompt3Reports } from '../prompt-3/write-prompt-3-reports.mjs';

const root = process.cwd();
const skipBuild = process.argv.includes('--skip-build');
if (!skipBuild) {
  const build = spawnSync('npm run build', {
    cwd: root,
    env: { ...process.env, DEPLOY_TARGET: 'github' },
    shell: true,
    stdio: 'inherit',
  });
  if (build.status !== 0) process.exit(build.status || 1);
}

const staticResult = await validateStatic(root);
const safetyResult = await validateSafety(root);
const prompt2 = await validatePrompt2(root);
const prompt3 = await validatePrompt3(root);
const { server, origin } = await startServer(root);
let browserResult;
try {
  browserResult = await validateBrowser(origin, staticResult.routes.map((route) => route.path));
} finally { await new Promise((resolve) => server.close(resolve)); }
const report = await writeReports(root, { staticResult, browserResult, safetyResult });
const prompt2Browser = {
  errors: browserResult.errors.filter((error) => prompt2.routes.some((route) => error.includes(` ${route}:`))),
  checkedPages: prompt2.routes.length * 3,
};
await writePrompt2Reports(root, { prompt2, browserResult: prompt2Browser });
const prompt3Browser = {
  errors: browserResult.errors.filter((error) => prompt3.routes.some((route) => error.includes(` ${route}:`))),
  checkedPages: prompt3.routes.length * 3,
};
await writePrompt3Reports(root, { prompt3, browserResult: prompt3Browser });
const errors = [...staticResult.errors, ...browserResult.errors, ...safetyResult.errors, ...prompt2.errors, ...prompt3.errors];
console.log(JSON.stringify({
  status: report.passing ? 'PASS' : 'FAIL',
  publicRoutes: staticResult.routeCount,
  indexableRoutes: staticResult.indexableCount,
  sitemapUrls: staticResult.sitemapCount,
  browserChecks: browserResult.checkedPages,
  brokenLinks: staticResult.brokenLinks,
  brokenImages: staticResult.brokenImages,
  remoteWordPressImages: staticResult.remoteWordPressImages,
  errors: errors.length,
}, null, 2));
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
}
