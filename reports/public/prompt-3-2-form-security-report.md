# Prompt 3.2 form security report

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
- Tests: **83 passed, 0 failed**

The in-memory limiter is bounded to 2,000 entries. A process restart clears its counters; the limiter interface can later be replaced with shared storage without changing endpoint validation.

The preserved WordPress-derived styles and Astro's optimized inline module bootstrap require narrowly scoped `style-src 'unsafe-inline'` and `script-src 'unsafe-inline'` in the simulator. Provider origins remain mode-gated, and `unsafe-eval` and wildcard sources are prohibited.

Production still needs owner-approved recipient and verified sender addresses, SMTP provider settings, separate Turnstile keys, private-preview origin/hostname testing, proxy trust configuration and explicit production approval. No real delivery occurred.
