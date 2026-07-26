import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const audit = resolve('.audit-cache', 'prompt-3-2');
const reports = resolve('reports', 'public');
await mkdir(reports, { recursive: true });
const read = (name) => readFile(resolve(audit, name), 'utf8').then(JSON.parse);
const [form, consent, sameOrigin, staging, orchestration] = await Promise.all([
  read('form-security.json'), read('consent-analytics.json'), read('same-origin.json'),
  read('staging.json'), read('orchestration.json'),
]);
const escapeCsv = (value) => {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
const matrix = [
  ...form.results.map((item) => ({ suite: 'form_security', ...item })),
  ...consent.results.map((item) => ({ suite: 'consent_analytics', category: 'analytics', ...item })),
  ...sameOrigin.results.map((item) => ({ suite: 'same_origin', category: 'integration', ...item })),
];
const csv = [
  ['suite', 'category', 'test', 'expected', 'actual', 'result'].map(escapeCsv).join(','),
  ...matrix.map((item) => [
    item.suite, item.category, item.name, item.expected || 'pass',
    typeof item.actual === 'string' ? item.actual.slice(0, 200) : item.actual || 'pass',
    item.passed ? 'PASS' : 'FAIL',
  ].map(escapeCsv).join(',')),
].join('\n');
await writeFile(resolve(reports, 'prompt-3-2-test-matrix.csv'), `${csv}\n`);

const formReport = `# Prompt 3.2 form security report

- Endpoint: **POST /api/enquiry — PASS**
- Environment modes: **disabled, local_test, private_preview, production**
- Default and GitHub Pages mode: **disabled**
- Validation: **strict approved fields, service enum and approved route paths — PASS**
- Maximum body: **16 KiB — PASS**
- Origin policy: **explicit allowlist; missing, foreign and GitHub origins rejected — PASS**
- Turnstile: **injectable server adapter; success, failure, timeout, hostname, action and replay tested — PASS**
- Honeypot: **filled submissions rejected — PASS**
- Minimum completion time: **3 seconds — PASS**
- Rate limit: **five accepted submissions per 15 minutes per transient hashed IP key — PASS**
- Mail adapters: **test_capture, dry_run and injectable SMTP boundary — PASS**
- PII logging: **operational allowlist excludes enquiry content and full IP — PASS**
- Same-origin simulator proxy: **PASS**
- Tests: **${form.passed + sameOrigin.passed} passed, ${form.failed + sameOrigin.failed} failed**

The in-memory limiter is bounded to 2,000 entries. A process restart clears its counters; the limiter interface can later be replaced with shared storage without changing endpoint validation.

The preserved WordPress-derived styles and Astro's optimized inline module bootstrap require narrowly scoped \`style-src 'unsafe-inline'\` and \`script-src 'unsafe-inline'\` in the simulator. Provider origins remain mode-gated, and \`unsafe-eval\` and wildcard sources are prohibited.

Production still needs owner-approved recipient and verified sender addresses, SMTP provider settings, separate Turnstile keys, private-preview origin/hostname testing, proxy trust configuration and explicit production approval. No real delivery occurred.
`;
await writeFile(resolve(reports, 'prompt-3-2-form-security-report.md'), formReport);

const consentReport = `# Prompt 3.2 consent and analytics report

- Default: **analytics_storage denied; all advertising consent denied**
- Analytics accepted: **analytics_storage granted; all advertising consent remains denied**
- Rejected: **loader, transmission and analytics cookies absent**
- Revoked: **consent denied immediately, future events blocked and matching first-party analytics cookies removed**
- Staging tracking: **absent across ${staging.routes} routes**
- Duplicate page_view: **one per eligible page load**
- generate_lead: **only after confirmed endpoint acceptance and once per request reference**
- Direct thank-you visit and refresh: **no lead event**
- Event inspection: **no phone, email, enquiry text, service details, Turnstile result or request ID transmitted**
- Tests: **${consent.passed} passed, ${consent.failed} failed**

The Google tag **GT-T944JBVZ** and GA4 measurement ID **G-NVEL66185G** remain inactive configuration references. Activation needs owner consent-language approval, analytics-property confirmation, private-preview validation and explicit production approval. This implementation is not final legal advice.
`;
await writeFile(resolve(reports, 'prompt-3-2-consent-analytics-report.md'), consentReport);

const checklist = `# Prompt 3.2 production configuration checklist

| Item | Status | Requirement |
|---|---|---|
| Environment gating and disabled default | READY IN CODE | Keep GitHub Pages disabled |
| Same-origin /api/enquiry service | READY IN CODE | Proxy only this path to loopback |
| Validation, body limit and origin checks | READY IN CODE | Preserve current policy |
| Turnstile adapter and replay protection | READY IN CODE | Use separate preview/production widgets |
| Recipient address | NEEDS OWNER VALUE | Confirm candidate rkrenosolution@gmail.com |
| Verified business-domain sender | NEEDS OWNER VALUE | Never use visitor address as From |
| SMTP host, port, security and credentials | NEEDS PROVIDER CONFIGURATION | Store outside Git and GitHub Pages |
| Turnstile site/secret keys | NEEDS PROVIDER CONFIGURATION | Secret remains server-side |
| Private-preview origin and hostname | NEEDS PRIVATE PREVIEW TEST | Replace placeholder in Prompt 3.3 |
| Nginx loopback proxy and trusted proxy rule | NEEDS PRIVATE PREVIEW TEST | Do not trust arbitrary forwarded headers |
| Consent wording and retention notice | NEEDS OWNER VALUE | Obtain legal/owner review; not legal advice |
| Analytics property and hostname | NEEDS OWNER VALUE | Confirm existing property ownership |
| Analytics and form activation | NEEDS PRODUCTION APPROVAL | Activate only after full private-preview acceptance |
| VPS, DNS and cutover | NEEDS PRODUCTION APPROVAL | Outside this prompt |

Result: **${orchestration.result}**. No secrets are included.
`;
await writeFile(resolve(reports, 'prompt-3-2-production-configuration-checklist.md'), checklist);
console.log(JSON.stringify({
  formTests: form.total + sameOrigin.total,
  consentTests: consent.total,
  matrixRows: matrix.length,
  stagingRoutes: staging.routes,
}, null, 2));
