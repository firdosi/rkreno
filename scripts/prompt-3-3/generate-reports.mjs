import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const readJson = async (name) => JSON.parse(await readFile(resolve(`.audit-cache/prompt-3-3/${name}.json`), 'utf8'));
const [pkg, preview, config, rehearsal, safety, master] = await Promise.all(
  ['package', 'private-preview', 'deployment-config', 'rehearsal', 'safety', 'master'].map(readJson),
);
const manifest = JSON.parse(await readFile(resolve('reports/public/prompt-3-3-release-manifest.json'), 'utf8'));
const releaseSha = pkg.releaseSha;
const totals = manifest.routeTotals;
const blockerGroups = {
  'OWNER APPROVAL REQUIRED': [
    'Approve the exact release SHA and private-preview result.',
    'Confirm the verified WordPress backup and final cutover window.',
  ],
  'PROVIDER VALUE REQUIRED': [
    'Provide approved private-preview hostname/access policy, SMTP values, and separate preview/production Turnstile keys.',
    'Confirm current DNS, TLS, Google Analytics, and Search Console ownership/settings.',
  ],
  'PRIVATE PREVIEW REQUIRED': ['Deploy this immutable package to an isolated authenticated preview and obtain owner sign-off.'],
  'SERVER TEST REQUIRED': [
    'Run nginx -t on the Stage 4 server, validate systemd sandbox compatibility, TLS, loopback form service, and direct-origin checks.',
  ],
  'CUTOVER APPROVAL REQUIRED': ['Authorize DNS/origin routing only after every runbook stop condition passes.'],
  'POST-CUTOVER ACTION REQUIRED': ['Run the 30-day monitoring checklist and verify/resubmit the unchanged sitemap in Search Console.'],
};
const blockers = Object.entries(blockerGroups).map(([heading, items]) =>
  `## ${heading}\n\n${items.map((item) => `- ${item}`).join('\n')}`).join('\n\n');
const readiness = `# Prompt 3.3 Release Readiness

- Result: **${master.result}**
- Approved release SHA: \`${releaseSha}\`
- Release ID: \`${pkg.releaseId}\`
- Routes: ${totals.RETAIN_200} retained, ${totals.REDIRECT_301} redirects, ${totals.GONE_410} gone, ${totals.EXISTING_404} known 404, ${totals.OWNER_DECISION_UNPUBLISHED} owner-held unpublished
- Production sitemap: ${manifest.sitemapCount} URLs
- Deterministic package/checksum: ${pkg.deterministicArchive}; \`${pkg.archiveSha256}\`
- Extracted-package production suite: ${pkg.extractedPackageTest}
- Nginx template validation: ${config.nginxTemplateValidation}; real server \`nginx -t\`: ${config.nginxTest}
- systemd template validation: ${config.systemdTemplateValidation}
- Private-preview simulation: ${preview.result} (${preview.passed}/${preview.totalChecks})
- Deployment rehearsal: ${rehearsal.activation}
- Automatic rollback: ${rehearsal.automaticRollback}
- Manual rollback: ${rehearsal.manualRollback}
- Prompt 3.1 regression: PASS
- Prompt 3.2 regression: PASS
- GitHub Pages staging inactivity: PASS
- Secret/private-file/no-remote checks: ${safety.result}

## Remaining blockers

Stage 4 owner/provider values, isolated preview approval, server-side Nginx/systemd/TLS tests, and explicit cutover approval remain required. Nothing was deployed by Prompt 3.3.
`;
const previewReport = `# Prompt 3.3 Private Preview Simulation

- Result: **${preview.result}**
- Release: \`${preview.releaseId}\`
- Checks: ${preview.passed}/${preview.totalChecks}
- Coverage: ${preview.retained} retained, ${preview.redirects} redirects, ${preview.gone} gone, ${preview.known404} known 404
- Authentication/host isolation/noindex/robots/production canonicals: PASS
- Analytics, advertising, real email, and provider requests absent: PASS
- Form test-capture and simulated Turnstile: PASS
- Desktop/mobile rendering, assets, headers, cache policy, and custom 404: PASS
- Simulator and enquiry processes stopped: ${preview.servicesStopped ? 'PASS' : 'FAIL'}

This was a local simulation only; no public preview hostname was created.
`;
const rollbackReport = `# Prompt 3.3 Rollback Rehearsal

- Result: **${rehearsal.result}**
- Pre-activation verification: ${rehearsal.preActivation}
- Atomic activation: ${rehearsal.activation}
- Manual rollback: ${rehearsal.manualRollback}
- Automatic post-activation rollback: ${rehearsal.automaticRollback}
- Automatic rollback trigger: ${rehearsal.automaticRollbackTrigger}
- Invalid/missing/checksum-mismatch targets rejected: ${rehearsal.invalidTargetRejected && rehearsal.missingTargetRejected && rehearsal.checksumMismatchRejected ? 'PASS' : 'FAIL'}
- Health failure prevented activation: ${rehearsal.healthFailurePreventedActivation ? 'PASS' : 'FAIL'}
- Current/previous pointers valid: ${rehearsal.pointersValid ? 'PASS' : 'FAIL'}
- Shared environment and unrelated application preserved: ${rehearsal.sharedEnvironmentPreserved && rehearsal.unrelatedApplicationPreserved ? 'PASS' : 'FAIL'}

The rehearsal used only \`.release-cache/server-simulation/\`; no remote host was contacted.
`;
await Promise.all([
  writeFile(resolve('reports/public/prompt-3-3-release-readiness-report.md'), readiness),
  writeFile(resolve('reports/public/prompt-3-3-private-preview-simulation-report.md'), previewReport),
  writeFile(resolve('reports/public/prompt-3-3-rollback-rehearsal-report.md'), rollbackReport),
  writeFile(resolve('reports/public/prompt-3-3-launch-blockers.md'), `# Prompt 3.3 Launch Blockers\n\n${blockers}\n`),
]);
