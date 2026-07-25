# Phase 6 launch-readiness report

Status: **TECHNICALLY READY FOR A LATER PRIVATE PREVIEW — PRODUCTION BLOCKERS REMAIN**

Completed on 25 July 2026. No VPS, DNS, WordPress, Hostinger, ConvortAI, production form, production
analytics, email, Search Console or Google Business Profile change occurred.

## Completed

- Inspected public WordPress metadata, tracking, robots, sitemap and active form without submission.
- Safely inspected ignored WordPress XML, SQL, server, AIOSEO and Elementor backups.
- Recorded production configuration and form findings without exposing secrets or customer data.
- Prepared privacy, terms and conditional cookie drafts with unresolved facts marked.
- Audited all 42 retained routes and 32-URL production sitemap.
- Corrected fallback Open Graph metadata, `/thank-you/` robots, one heading jump and two orphaned
  indexable routes; no design, wording, image placement or section-order change was made.
- Validated 23 one-hop redirects and 66 410 decisions; collapsed one pre-existing redirect chain.
- Prepared inactive private-preview Nginx/environment documents, cutover runbook and rollback plan.
- Prepared post-launch SEO and measurement plans without inventing Search Console data.
- Confirmed staging analytics/form safety and the gated VPS workflow.

## Validation result

- Production Astro build: 43 HTML outputs including custom 404; 42 retained-route audit rows passed.
- Production sitemap: 32 URLs; production robots/canonicals/schema/Open Graph passed.
- GitHub Pages build: disallow-all robots, `noindex, nofollow`, disabled form and no tracking loader.
- Links, 42-route SEO comparison, 126 visual records, accessibility basics and redirect map: passed.
- Form validation, honeypot and rate-limit tests: 4/4 passed.
- Responsive browser checks: no overflow, broken images, missing alt or console errors on the
  production build at desktop/mobile widths and representative page templates.
- Root and form-service production dependency audits: zero known vulnerabilities.
- Private backups, owner originals, audit cache and environment secrets remain ignored/untracked.

## Existing production identifiers

- Google tag: `GT-T944JBVZ` (currently loaded on WordPress).
- GA4 measurement identifier: `G-NVEL66185G` (Site Kit backup).
- Search Console: URL-prefix property for the production origin.
- Ownership is unconfirmed; no GTM, Meta Pixel, Bing verification or Clarity identifier was found.

## Exact blockers before private form testing

1. Approved private preview hostname/access method and isolated VPS paths/port.
2. Test recipient, verified preview sender and private SMTP credentials.
3. Preview-specific Turnstile site/secret settings.
4. Owner approval of privacy consent wording and enquiry retention.

## Exact blockers before public cutover

1. Legal operator name, registration details if applicable, current address, governing-law review,
   retention and real warranty/contract terms.
2. Owner confirmation of the production recipient, sender/provider and any CRM use.
3. Owner access/ownership confirmation for Google tag, GA4 and Search Console.
4. Approved analytics consent approach and final legal pages.
5. Successful private preview, form/security tests, owner sign-off and maintenance/rollback window.
6. Final verified backup and captured DNS/virtual-host/SSL state.

## Recommendation

Next, collect the simple owner facts in `unresolved-owner-business-facts.md`, then schedule a private,
authenticated VPS preview using the prepared isolated plan. Do not begin public cutover until all
blockers and the post-preview checklist are closed.
