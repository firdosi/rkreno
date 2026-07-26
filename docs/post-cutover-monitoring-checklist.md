# RK Reno post-cutover monitoring checklist

Use this only after an approved Stage 4 cutover. Record timestamps, operator, release SHA and evidence in the private operations log. Never copy enquiry content, credentials or full IP addresses into monitoring notes.

## Every monitoring period

- [ ] Homepage returns 200 over valid HTTPS.
- [ ] Priority service pages and articles return 200.
- [ ] Sample approved redirects are one-hop 301s.
- [ ] Sample removed URLs return 410.
- [ ] Known and unknown missing URLs return real 404s.
- [ ] `robots.txt` allows production crawling.
- [ ] `sitemap.xml` contains exactly 32 production URLs.
- [ ] Canonicals remain on `https://rkrenosolution.com`.
- [ ] No intended indexable route has `noindex`.
- [ ] Form delivery and Turnstile pass with approved synthetic data.
- [ ] Consent defaults denied and withdrawal works.
- [ ] Analytics page views occur only after consent.
- [ ] `generate_lead` occurs only after accepted delivery.
- [ ] Search Console verification remains active.
- [ ] Nginx and enquiry-service errors are reviewed.
- [ ] Disk and memory remain within approved limits.
- [ ] ConvortAI health and unrelated services remain unchanged.

## First 15 minutes

Run all critical web, TLS, DNS, form and rollback-trigger checks continuously. Roll back immediately for homepage/contact, TLS, DNS, crawler-blocking or ConvortAI failures.

## First hour

Repeat full route samples, form, consent and logs at least twice. Confirm authoritative and public DNS consistency.

## First 24 hours

Check crawl access, sitemap processing, Search Console verification, server errors, enquiries and analytics at agreed intervals.

## First 3 days

Review indexing, crawl errors, clicks, impressions, form delivery and resource use daily. Avoid unnecessary content or URL changes.

## First 7 days

Compare search and enquiry trends with the pre-cutover baseline. Investigate material changes without promising zero fluctuation.

## First 14 days

Confirm sitemap processing, priority URL indexing, stable redirects and the absence of preview/staging leakage.

## First 30 days

Complete a migration review covering search performance, enquiries, reliability, security, resource use and owner feedback. Keep rollback assets until the owner approves their retirement.
