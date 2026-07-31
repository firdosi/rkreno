import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { validateBrowser } from '../migration/validate-browser.mjs';
import { startServer } from '../migration/server.mjs';
import { validatePrompt2 } from './validate-prompt-2.mjs';
import { writePrompt2Reports } from './write-prompt-2-reports.mjs';

const root = process.cwd();
if (!process.argv.includes('--skip-build')) {
  const build = spawnSync('npm run build', { cwd: root, env: { ...process.env, DEPLOY_TARGET: 'github' }, shell: true, stdio: 'inherit' });
  if (build.status !== 0) process.exit(build.status || 1);
}
const prompt2 = await validatePrompt2(root);
const { server, origin } = await startServer(root);
let browserResult;
try { browserResult = await validateBrowser(origin, prompt2.routes); }
finally { await new Promise((resolve) => server.close(resolve)); }
await writePrompt2Reports(root, { prompt2, browserResult });
const errors = [...prompt2.errors, ...browserResult.errors];
console.log(JSON.stringify({ status: errors.length ? 'FAIL' : 'PASS', routes: prompt2.routes.length, responsiveChecks: browserResult.checkedPages, complete: prompt2.complete, newPages: prompt2.newPages, errors: errors.length }, null, 2));
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
