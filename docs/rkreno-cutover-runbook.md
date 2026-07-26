# RK Reno Stage 4 cutover and rollback runbook

This is a future operating procedure, not authorization to deploy. Record every approval and result in the private change record. Never put credentials, private backups, IP addresses or customer data in Git.

## Global checkpoint format

Every externally visible step uses four fields:

- **Preconditions:** evidence that must exist before starting.
- **Success criteria:** objective result required to continue.
- **Stop condition:** any result that halts the cutover.
- **Rollback action:** exact restoration action if the step fails.

## 1. Required owner approvals

Preconditions: owner has reviewed the frozen release, form wording, consent wording and planned maintenance window.
Success criteria: written approval identifies the exact release SHA and responsible operator.
Stop condition: incomplete, ambiguous or expired approval.
Rollback action: make no external change; keep WordPress live.

## 2. Required provider values

Preconditions: values are supplied privately for the server address, SMTP, Turnstile, private-preview access and TLS.
Success criteria: values pass private validation without appearing in logs or Git.
Stop condition: a value is missing, shared in an unsafe channel or cannot be verified.
Rollback action: revoke exposed values and postpone.

## 3. Final release SHA

Preconditions: `approved-release.json`, archive checksum and manifest agree.
Success criteria: operator and owner approve the full SHA, never an unqualified “latest”.
Stop condition: dirty source, checksum mismatch or different SHA.
Rollback action: discard the candidate archive and rebuild from the approved commit.

## 4. WordPress backup confirmation

Create and independently verify:

- full WordPress file backup;
- complete database dump and restore test;
- `wp-config.php` and uploads backup;
- Elementor and AIOSEO exports;
- WordPress XML export;
- redirects and response-status inventory;
- DNS record snapshot including MX, SPF, DKIM, DMARC and verification records;
- SSL certificate/renewal state;
- analytics and Search Console verification method;
- contact-form and email-delivery settings;
- dated full-page screenshots of live pages.

Store encrypted copies in an owner-approved backup system and a second independent secure location. Do not place backups in Git or the release directory.

Success criteria: checksums, restore test and access permissions are recorded.
Stop condition: database or file backup is incomplete or untested.
Rollback action: remain on WordPress.

## 5. Existing DNS snapshot

Preconditions: authorized DNS access and complete export/screenshot.
Success criteria: every relevant record, TTL and proxy state is recorded.
Stop condition: current values are unknown.
Rollback action: do not edit DNS.

## 6. Existing Search Console verification

Preconditions: owner can access the correct property.
Success criteria: active verification method is recorded and preserved.
Stop condition: property access or verification is unavailable.
Rollback action: postpone cutover.

## 7. Existing Analytics property confirmation

Preconditions: owner confirms `GT-T944JBVZ` and `G-NVEL66185G` belong to the intended property.
Success criteria: consented private-preview collection is verified without PII.
Stop condition: property ownership, consent or event behavior is uncertain.
Rollback action: keep analytics disabled.

## 8. SMTP confirmation

Preconditions: verified business-domain sender, approved recipient and private credentials.
Success criteria: private-preview delivery, Reply-To, timeout and rejection tests pass.
Stop condition: no mail, spoofed sender, leakage or duplicate delivery.
Rollback action: disable the form and retain phone/WhatsApp.

## 9. Turnstile confirmation

Preconditions: separate private-preview and production widgets.
Success criteria: hostname, action, expiry and replay checks pass server-side.
Stop condition: secret exposure or validation bypass.
Rollback action: disable form submission.

## 10. Private-preview approval

Preconditions: authenticated HTTPS preview with no public links.
Success criteria: full route, visual, mobile, form, consent and rollback acceptance signed off.
Stop condition: any priority page, content lock or security test fails.
Rollback action: remove preview access and repair locally.

## 11. Production server preparation

Preconditions: dedicated user, `/var/www/rkreno` structure, external env file and release archive available.
Success criteria: Nginx and systemd validation pass without touching unrelated applications.
Stop condition: root execution, unsafe paths, port conflict or ConvortAI impact.
Rollback action: remove only unactivated RK Reno candidate files.

## 12. Production deployment

Preconditions: deploy flag, exact commit confirmation and environment approval are explicitly set.
Success criteria: checksum, pre-activation health, atomic pointer switch and post-activation health pass.
Stop condition: any safeguard or health check fails.
Rollback action: switch `current` to `previous`; restart only RK Reno service and reload validated Nginx.

## 13. Pre-DNS direct-origin testing

Preconditions: owner-approved local hosts override or direct-origin technique; no public DNS change.
Success criteria: HTTPS, host normalization, 42 routes, form and assets pass.
Stop condition: certificate, route, form or content defect.
Rollback action: remove local override and keep WordPress routing.

## 14. DNS change

Preserve the public domain and every path. Change only approved origin-routing records to `REPLACE_WITH_APPROVED_SERVER_ADDRESS`. Preserve MX, SPF, DKIM, DMARC, Search Console verification, Cloudflare and ConvortAI records. Reduce TTL only when approved.

Preconditions: prior DNS values and rollback values are recorded.
Success criteria: authoritative and public resolvers return approved values.
Stop condition: email or unrelated records change.
Rollback action: restore the exact prior routing values and proxy state.

## 15. TLS validation

Verify certificate names for the apex and approved `www` handling, full chain, renewal, HTTP-to-HTTPS behavior and mixed content. Use no preview certificate in production. Enable HSTS only after stable HTTPS; do not preload.

Stop condition: invalid name, chain, renewal or mixed content.
Rollback action: restore previous DNS/hosting routing and certificate configuration.

## 16–20. Production web validation

Check homepage and all priority URLs, all 42 retained responses, 23 one-hop redirects, 66 real 410s, nine known 404s, custom unknown 404, production `robots.txt`, 32-URL sitemap and production canonicals.

Success criteria: exact Prompt 3.1 totals and no preview/staging host leakage.
Stop condition: homepage/contact failure, more than one retained failure, disallow-all robots, wrong sitemap count, noindex on an indexable route, redirect chain or staging canonical.
Rollback action: atomic application rollback; restore WordPress routing if public impact persists.

## 21. Form-delivery test

Use one owner-approved synthetic submission. Confirm Turnstile, acceptance, one email and no PII logs.
Stop condition: no email, duplicate, leakage or failure hidden as success.
Rollback action: disable form immediately and retain phone/WhatsApp.

## 22. Consent and analytics test

Confirm denied defaults, no pre-consent requests, one consented page view, withdrawal, and one lead only after mail acceptance.
Stop condition: tracking before consent, ad consent grant, PII or premature lead.
Rollback action: disable analytics configuration.

## 23–24. Search Console verification and sitemap

Confirm the existing verification first. Submit or resubmit the same `/sitemap.xml` only after production passes. Do not request indexing for every URL.

Stop condition: verification disappears or sitemap differs from 32 URLs.
Rollback action: restore verification; do not submit changed sitemap.

## 25. Immediate monitoring

Use `docs/post-cutover-monitoring-checklist.md`. Record response, service, mail, Nginx and search signals without personal data.

## 26. Mandatory rollback triggers

Rollback when TLS/DNS fails, WordPress backup restoration is needed, homepage/contact fails, important statuses are wrong, crawlers are blocked, the form fails, analytics disappears unexpectedly, a serious visual/content defect appears, ConvortAI is affected, or the owner withdraws approval.

## 27. Rollback procedure

1. Disable form/analytics if implicated.
2. Switch the RK Reno `current` pointer to the verified previous release.
3. Validate and reload only RK Reno service and Nginx.
4. If the domain must return to WordPress, restore the recorded DNS/hosting routing values.
5. Restore WordPress files/database only when the original instance itself changed or is unhealthy.
6. Validate web content, DNS, TLS, email, WordPress forms, analytics and Search Console.
7. Do not call rollback complete until both web content and DNS/hosting routing are restored.

## 28. Final owner sign-off

Preconditions: monitoring is stable and every checkpoint has evidence.
Success criteria: owner accepts production behavior and any documented residual risks.
Stop condition: missing evidence or unresolved blocker.
Rollback action: follow section 27.

## Search-engine safety sequence

Before cutover, keep WordPress live/indexable and private preview noindex; submit nothing. At cutover, validate crawlability, canonical URLs, the 32-URL sitemap, one-hop redirects and real error statuses. After cutover, inspect priority URLs, processing, crawl errors, clicks and impressions. Do not promise zero ranking fluctuation or that Google will not notice the hosting change.
