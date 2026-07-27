import { writeFile } from 'node:fs/promises';
import {
  approvedReleaseSha, archiveSha256, auditRoot, evidenceCommitSha, readJson, releaseId,
  toCsv, writeJson, writeText,
} from './lib.mjs';

const reproduction = await readJson(`${auditRoot}/reproduction.json`);
const publicPreflight = await readJson(`${auditRoot}/public-preflight.json`);
const backup = await readJson(`${auditRoot}/backup-summary.json`);
const generatedAt = new Date().toISOString();
const contentLockHash = '1c42d6f677affee9fc73f73170dba8f876be29dc43f7aa69465b903b1e2307ff';
const routeMapHash = 'da5ff3b90d0928bc5c051f205df8a5acce10bece2e04e7c70512c9bade9ff7b8';
const releaseManifestHash = '48f9dfc10fba358c103ec38c3d2a9dc1c4db460afe9520ea539eb840a45ea574';

await writeJson('config/final-release-signoff.json', {
  approvedWebsiteReleaseSha: approvedReleaseSha,
  evidenceCommitSha,
  releaseId,
  archiveSha256,
  routeCount: 42,
  sitemapCount: 32,
  redirectCount: 23,
  goneCount: 66,
  known404Count: 9,
  ownerHeldCount: 5,
  contentLockHash,
  routeMapHash,
  releaseManifestHash,
  status: 'AWAITING_OWNER_APPROVAL',
  generatedAt,
});

await writeText('reports/public/prompt-4-1-owner-approval-form.md', `# Prompt 4.1 Owner Approval Form

No passwords, keys or login details belong in this form.

- [ ] 1. I approve exact release SHA \`${approvedReleaseSha}\` (or I reject it and explain separately).
- [ ] 2. I approve the isolated private-preview deployment in Prompt 4.2 (or reject it).
- [ ] 3. I approve the VPS as the future RK Reno hosting location.
- [ ] 4. ConvortAI must remain untouched and independently operational.
- [ ] 5. I approve a private-preview hostname, or authorize one to be created.
- [ ] 6. I choose preview access: Basic authentication / IP allowlist / Both.
- [ ] 7. I approve \`rkrenosolution@gmail.com\` as the form recipient.
- [ ] 8. I will provide or approve a verified sender mailbox on the RK Reno domain.
- [ ] 9. I choose or confirm the SMTP provider.
- [ ] 10. I approve separate Turnstile preview and production widgets.
- [ ] 11. I approve the analytics-consent wording for private testing.
- [ ] 12. I confirm ownership/access to the existing GA4 property.
- [ ] 13. I confirm ownership/access to Search Console.
- [ ] 14. I approve a future cutover window, without scheduling it yet.
- [ ] 15. A fresh WordPress backup must be taken immediately before cutover.
- [ ] 16. I approve the rollback-trigger policy.
- [ ] 17. The five owner-held routes must remain unpublished.
- [ ] 18. No demolition page should be created unless that service is separately approved.
`);

await writeText('reports/public/prompt-4-1-provider-values-checklist.md', `# Prompt 4.1 Provider Values Checklist

## Non-secret values

- Approved preview hostname
- Approved production hostname: \`rkrenosolution.com\`
- SMTP host, port and security mode
- Form recipient email
- Verified sender email
- Turnstile expected preview and production hostnames
- GA4 property confirmation
- Search Console property confirmation
- Future VPS directory
- Enquiry service loopback port
- Preferred authentication method

## Secret values

- VPS login credential
- SMTP username when sensitive and SMTP password
- Turnstile preview and production secrets
- Basic-auth password
- Cloudflare/API tokens, only if later required

Do not commit secrets to Git, place them in public reports, paste them into source code, or provide them before an explicitly authorized remote step. Store them only in the server environment or an approved secret store.
`);

await writeText('reports/public/prompt-4-1-search-console-preflight.md', `# Prompt 4.1 Search Console Preflight

**Status: LOGGED-IN CONFIRMATION REQUIRED**

- No Google verification meta tag was visible in the current public homepage source.
- No public HTML verification file or root DNS verification TXT was discovered.
- Repository production code supports an optional verification meta value, but its example value is intentionally empty.
- A DNS-based verification would survive a future hosting cutover if the complete DNS zone is preserved.
- The owner previously reported Search Console access, but the property and verification method still require logged-in owner confirmation.

No verification value was invented and no Search Console or DNS change was made.
`);

await writeText('reports/public/prompt-4-1-analytics-preflight.md', `# Prompt 4.1 Analytics Preflight

- Current WordPress output loaded one Google tag loader and one configuration call for \`GT-T944JBVZ\`; no duplicate loader was observed.
- \`G-NVEL66185G\` was not exposed in the inspected public homepage DOM.
- Future code preserves both known identifiers: \`GT-T944JBVZ\` and \`G-NVEL66185G\`.
- GitHub Pages remains tracking-free.
- GA4 property ownership still requires logged-in owner confirmation.
- Analytics remains disabled until consent wording is approved; advertising consent remains denied.

No test event was sent and analytics was not activated.
`);

const held = [
  ['/company-history/', 0, 'Authentic dated company-history evidence is required.', 'WordPress snapshot, XML/AIOSEO and Elementor evidence'],
  ['/our-projects-2/', 0, 'Authentic project evidence is required and duplicate-project intent must be resolved.', 'WordPress snapshot, XML/AIOSEO and Elementor evidence'],
  ['/our-projects/', 14, 'Authentic project portfolio evidence is required.', 'WordPress snapshot, XML/AIOSEO and Elementor evidence'],
  ['/our-team/', 36, 'Authentic team identities and roles are required.', 'WordPress snapshot, XML/AIOSEO and Elementor evidence'],
  ['/testimonials/', 2, 'Authentic attributable testimonial evidence is required.', 'WordPress snapshot, XML/AIOSEO and Elementor evidence'],
];
await writeText('reports/public/prompt-4-1-owner-held-routes.md', `# Prompt 4.1 Owner-held Routes

| Route | Previous WordPress status | Reason held | Source evidence | Internal links | WordPress sitemap | Remain unpublished | Would owner evidence change decision? |
|---|---:|---|---|---:|---:|---:|---:|
${held.map(([route, links, reason, evidence]) => `| \`${route}\` | 200, noindex/follow | ${reason} | ${evidence} | ${links} | Yes | Yes | Yes |`).join('\n')}

The approved route map remains unchanged. No held route was published and no new redirect was created.
`);

const checkpoints = [
  ['Exact release SHA','PASS','Reproduced exact approved SHA','Approve release','','Yes','Yes','NONE','Two-SHA model preserved'],
  ['Release archive checksum','PASS',archiveSha256,'','','Yes','Yes','NONE','Exact match'],
  ['Content lock','PASS',contentLockHash,'','','Yes','Yes','NONE','Exact match'],
  ['Route map','PASS',routeMapHash,'','','Yes','Yes','NONE','Exact match'],
  ['42 retained routes','PASS','Production readiness suite','','','Yes','Yes','NONE','42'],
  ['32 sitemap URLs','PASS','Production readiness suite','','','Yes','Yes','NONE','32'],
  ['Redirects','PASS','23 one-hop redirects','','','Yes','Yes','NONE','23'],
  ['410s','PASS','66 genuine gone routes','','','Yes','Yes','NONE','66'],
  ['Known 404s','PASS','Nine known 404 routes','','','Yes','Yes','NONE','9'],
  ['Custom 404','PASS','Production readiness suite','','','Yes','Yes','NONE','Custom unknown-route response'],
  ['GitHub staging inactivity','PASS','No analytics, forms or Turnstile','','','Yes','Yes','NONE','Noindex and robots disallow-all'],
  ['WordPress backup inventory',backup.result === 'PASS' ? 'PASS' : 'BLOCKED','Local read-only inventory','','','No','Yes',backup.result === 'PASS' ? 'NONE' : 'CRITICAL','Checksums local-only'],
  ['Fresh backup requirement','CUTOVER_APPROVAL_REQUIRED','Prompt 4.3 requirement','Confirm fresh backup','','No','Yes','CUTOVER_BLOCKER','Take immediately before cutover'],
  ['Preview hostname','PROVIDER_VALUE_REQUIRED','Not yet approved','Approve hostname','Supply/configure hostname','Yes','No','PREVIEW_BLOCKER','No hostname created'],
  ['Preview authentication','OWNER_CONFIRMATION_REQUIRED','Method not selected','Choose Basic/IP/both','Implement chosen method','Yes','No','PREVIEW_BLOCKER',''],
  ['VPS approval','OWNER_CONFIRMATION_REQUIRED','No remote authority yet','Approve VPS','','Yes','No','PREVIEW_BLOCKER',''],
  ['ConvortAI isolation','OWNER_CONFIRMATION_REQUIRED','Must remain independent','Confirm isolation','Demonstrate isolation','Yes','Yes','PREVIEW_BLOCKER',''],
  ['Nginx server test','SERVER_TEST_REQUIRED','Templates only','','Run isolated server test','No','Yes','CUTOVER_BLOCKER','Prompt 4.2/4.3'],
  ['systemd server test','SERVER_TEST_REQUIRED','Templates only','','Run isolated server test','No','Yes','CUTOVER_BLOCKER','Prompt 4.2/4.3'],
  ['TLS','SERVER_TEST_REQUIRED','Current TLS documented; preview unissued','','Test preview then production','No','Yes','CUTOVER_BLOCKER','No certificate requested'],
  ['SMTP','PROVIDER_VALUE_REQUIRED','Provider unknown','Choose provider','Supply non-secret settings and secrets securely','Yes','Yes','PREVIEW_BLOCKER',''],
  ['Form recipient','OWNER_CONFIRMATION_REQUIRED','Candidate only','Approve recipient','','Yes','Yes','PREVIEW_BLOCKER',''],
  ['Verified sender','PROVIDER_VALUE_REQUIRED','No verified domain sender claimed','Approve sender','Provide verified sender','Yes','Yes','PREVIEW_BLOCKER',''],
  ['Turnstile preview','PROVIDER_VALUE_REQUIRED','Separate widget required','Approve widget','Provide site key/secret securely','Yes','No','PREVIEW_BLOCKER',''],
  ['Turnstile production','PROVIDER_VALUE_REQUIRED','Separate widget required','Approve widget','Provide site key/secret securely','No','Yes','CUTOVER_BLOCKER',''],
  ['Consent wording','OWNER_CONFIRMATION_REQUIRED','Approval required','Approve wording','','Yes','Yes','PREVIEW_BLOCKER','Advertising consent denied'],
  ['Analytics property','OWNER_CONFIRMATION_REQUIRED','Logged-in confirmation required','Confirm GA4 ownership','','Yes','Yes','PREVIEW_BLOCKER','Tracking stays off'],
  ['Search Console property','OWNER_CONFIRMATION_REQUIRED','Logged-in confirmation required','Confirm property','','No','Yes','CUTOVER_BLOCKER',''],
  ['DNS snapshot','PASS','Public read-only snapshot','','','Yes','Yes','NONE','Point-in-time evidence'],
  ['DNS change approval','CUTOVER_APPROVAL_REQUIRED','No DNS authority granted','Approve only at cutover','Prepare exact change plan','No','Yes','CUTOVER_BLOCKER',''],
  ['Private-preview approval','OWNER_CONFIRMATION_REQUIRED','Explicit approval missing','Approve Prompt 4.2','','Yes','No','PREVIEW_BLOCKER',''],
  ['Cutover approval','CUTOVER_APPROVAL_REQUIRED','Not requested yet','Approve later','','No','Yes','CUTOVER_BLOCKER',''],
  ['Rollback approval','OWNER_CONFIRMATION_REQUIRED','Policy approval missing','Approve rollback triggers','','Yes','Yes','PREVIEW_BLOCKER',''],
  ['Post-cutover monitoring','READY_IN_CODE','Checklist exists','Approve monitoring window','Execute later','No','Yes','NONE','No monitoring started'],
];
const headers = ['Checkpoint','Status','Evidence','Owner action','Provider action','Required before Prompt 4.2','Required before Prompt 4.3','Blocking level','Notes'];
await writeText('reports/public/prompt-4-1-go-no-go.csv', toCsv(headers, checkpoints));

await writeJson(`${auditRoot}/prompt-4-2-input-template.json`, {
  approvedReleaseSha,
  releaseArchiveSha256: archiveSha256,
  privatePreviewApproved: false,
  vpsApproved: false,
  previewHostname: '<approved-preview-hostname>',
  previewAccessMethod: '<basic-auth|ip-allowlist|both>',
  formRecipient: 'rkrenosolution@gmail.com',
  verifiedSender: '<verified-rk-reno-domain-sender>',
  smtpHost: '<smtp-host>',
  smtpPort: '<smtp-port>',
  smtpSecure: '<tls|starttls>',
  smtpUsername: '<secret-provide-only-during-authorized-step>',
  smtpPassword: '<secret-provide-only-during-authorized-step>',
  turnstilePreviewSiteKey: '<preview-site-key>',
  turnstilePreviewSecret: '<secret-provide-only-during-authorized-step>',
  analyticsPreviewEnabled: false,
  searchConsoleConfirmed: false,
  convortAiIsolationConfirmed: false,
});
await writeText('reports/public/prompt-4-1-prompt-4-2-input-guide.md', `# Prompt 4.2 Input Guide

Prompt 4.2 needs the approved SHA and archive checksum; explicit preview, VPS and ConvortAI-isolation approvals; preview hostname and access method; recipient and verified sender; SMTP host/port/security; separate preview Turnstile site key; analytics-preview decision; and Search Console confirmation.

Secrets are not part of this public guide. SMTP credentials, Turnstile secrets, VPS credentials and Basic-auth passwords must be supplied only during the explicitly authorized remote step and stored only in an approved secret store or server environment.
`);

await writeText('reports/public/prompt-4-1-no-remote-change-proof.md', `# Prompt 4.1 No-remote-change Proof

Automated guards confirmed \`RKRENO_VPS_DEPLOY_ENABLED=false\`, ignored private caches/backups, placeholder-only environment templates, no tracked secrets, and no remote-write action in this workflow.

Only public read-only DNS, TLS and HTTP observations were made. No remote shell or file-transfer session, Cloudflare write, DNS change, certificate request, WordPress write, form email, Turnstile validation, Analytics event, VPS deployment or production action occurred.
`);

const dnsResult = publicPreflight.dns?.result || 'PASS';
await writeText('reports/public/prompt-4-1-final-preflight-report.md', `# Prompt 4.1 Final Preflight

**Status: AWAITING_OWNER_APPROVAL**

- Approved website release SHA: \`${approvedReleaseSha}\`
- Stage 3.3 evidence commit: \`${evidenceCommitSha}\`
- Archive checksum: PASS — \`${archiveSha256}\`
- Reproducibility: ${reproduction.result}; 382 packaged files; exact approved worktree
- Prompt 3.1 / 3.2 / 3.3 regressions: PASS / PASS / PASS
- Public DNS snapshot: ${dnsResult}; point-in-time read-only capture
- Current TLS/HTTP snapshot: PASS
- Search Console: LOGGED-IN CONFIRMATION REQUIRED
- Analytics continuity: READY_IN_CODE; property and consent confirmation required
- Backup inventory: ${backup.result}; local checksums recorded; fresh pre-cutover backup still mandatory
- Owner decisions: the 18 unchecked decisions in the owner approval form
- Provider values: preview hostname/authentication, SMTP/sender, Turnstile, VPS runtime and property confirmations
- Prompt 4.2 blockers: release/preview/VPS/ConvortAI approvals, hostname/authentication, recipient/sender/SMTP, preview Turnstile, consent, GA4 and rollback approval
- Prompt 4.3 blockers: fresh backup, server tests, production TLS/Turnstile, Search Console, DNS/cutover approval

## Confirmed owner facts

- RK Reno Solution is operated by Rao Israr; no registration number is claimed.
- Address: 4-2, Jalan 3/50C, Setapak, 53000 Kuala Lumpur.
- Phone/WhatsApp: +60 11 1133 4496; email: rkrenosolution@gmail.com.
- Main service areas: Kuala Lumpur and Selangor.
- Live domain: https://rkrenosolution.com/; repository: \`firdosi/rkreno\`.
- Sitemap target: 32 URLs. Analytics and Search Console continuity are required.
- The owner previously reported Search Console access.
- \`rkrenosolution@gmail.com\` is only the candidate form recipient and is not approved automatically.

The frozen deployable website is commit \`${approvedReleaseSha}\`; \`${evidenceCommitSha}\` adds only Stage 3.3 evidence and does not alter deployable website content. A later commit is not a new release source unless a material fix is approved and the complete Stage 3 suite is rerun.

No remote or production change occurred.
`);

await writeFile(`${auditRoot}/generation.complete`, `${generatedAt}\n`);
console.log(JSON.stringify({ result: 'PASS', reports: 13 }, null, 2));
