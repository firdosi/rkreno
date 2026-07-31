import { mkdir, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { validatePrompt2 } from '../prompt-2/validate-prompt-2.mjs';
import { validatePrompt3 } from '../prompt-3/validate-prompt-3.mjs';
import { startServer } from '../migration/server.mjs';
import { auditBrowser } from './browser-audit.mjs';
import { auditProduction, auditRepositorySafety, cleanupProduction } from './production-audit.mjs';
import { auditStatic } from './static-audit.mjs';
import { writeFinalReports } from './write-reports.mjs';

const root = process.cwd();
const run = (command, env = {}) => {
  const result = spawnSync(command, { cwd: root, env: { ...process.env, ...env }, shell: true, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}.`);
};

const requiredReports = [
  'final-route-matrix.csv', 'final-route-matrix.json', 'final-content-validation.md',
  'final-image-validation.md', 'final-internal-link-validation.md', 'final-seo-validation.md',
  'final-schema-validation.md', 'final-responsive-validation.md', 'final-accessibility-validation.md',
  'final-performance-validation.md', 'final-form-and-lead-validation.md', 'final-claims-owner-review.md',
  'final-production-simulation.md', 'final-github-safety.md', 'final-completion-summary.md',
];

let server;
try {
  await rm(path.join(root, 'dist'), { recursive: true, force: true });
  run('npm run build', { DEPLOY_TARGET: 'github' });
  run('npm run test:migration -- --skip-build');
  run('npm run test:prompt-2 -- --skip-build');
  run('npm run test:prompt-3 -- --skip-build');

  const prompt2 = await validatePrompt2(root);
  const prompt3 = await validatePrompt3(root);
  const staticAudit = await auditStatic(root);
  const started = await startServer(root);
  server = started.server;
  const browserAudit = await auditBrowser(started.origin, staticAudit.rows.map((row) => row.route));
  await new Promise((resolve) => server.close(resolve));
  server = null;
  const safetyAudit = await auditRepositorySafety(root);
  const productionAudit = await auditProduction(root);
  const evidence = {
    staticAudit, browserAudit, prompt2, prompt3, productionAudit, safetyAudit,
    initial: { migration: 'PASS (48 routes, 33 indexable, 33 sitemap URLs, 144 checks)' },
  };
  const written = await writeFinalReports(root, evidence);
  await cleanupProduction(root);

  const reportErrors = [];
  const reportDir = path.join(root, 'reports/public/final');
  for (const name of requiredReports) {
    try {
      const content = await readFile(path.join(reportDir, name), 'utf8');
      if (!content.trim()) reportErrors.push(`${name} is empty.`);
    } catch { reportErrors.push(`${name} is missing.`); }
  }
  const matrixJson = JSON.parse(await readFile(path.join(reportDir, 'final-route-matrix.json'), 'utf8'));
  if (matrixJson.routes.length !== 48) reportErrors.push('Final matrix does not contain 48 routes.');
  if (matrixJson.routes.some((row) => row['Final result'] === 'FAIL') && written.complete) reportErrors.push('Completion report contradicts route failures.');
  const errors = [
    ...prompt2.errors, ...prompt3.errors, ...staticAudit.errors, ...browserAudit.errors,
    ...productionAudit.errors, ...safetyAudit.errors, ...reportErrors,
  ];
  const summary = {
    status: errors.length ? 'FAIL' : 'PASS', publicRoutes: staticAudit.counts.publicRoutes,
    prompt2Routes: prompt2.routes.length, prompt3Routes: prompt3.routes.length,
    indexableRoutes: staticAudit.counts.indexableRoutes, sitemapUrls: staticAudit.counts.sitemapUrls,
    brokenLinks: staticAudit.counts.brokenLinks, brokenImages: staticAudit.counts.brokenImages,
    remoteWordPressAssets: staticAudit.counts.remoteWordPressAssets,
    responsiveChecks: browserAudit.checkedPages, consoleErrors: browserAudit.consoleErrors,
    accessibilitySeriousErrors: staticAudit.counts.accessibilitySerious,
    unsupportedSchemas: staticAudit.counts.unsupportedSchemas,
    unsafeFormRequests: browserAudit.unsafeFormRequests,
    missingContent: staticAudit.counts.missingContent,
    missingOriginalAssetRoutes: staticAudit.counts.missingOriginalAssets,
    githubWebsite: errors.length ? 'INCOMPLETE' : 'COMPLETE',
    productionRelease: errors.length ? 'BLOCKED_BY_TECHNICAL_DEFECTS' : 'BLOCKED_BY_OWNER_CLAIM_REVIEW',
    errors: errors.length,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (errors.length) {
    console.error('\nFinal validation errors:\n' + errors.join('\n'));
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  await cleanupProduction(root).catch(() => {});
}
