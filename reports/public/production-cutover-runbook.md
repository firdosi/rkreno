# Production cutover runbook

Status: **FUTURE PROCEDURE — DO NOT EXECUTE DURING PHASE 6**

## Approval gates

Do not start until the private preview passes, the owner approves legal/form/analytics choices, all
production secrets are configured privately, and a maintenance/rollback window is agreed.

## Runbook

1. Create and verify a final WordPress files/database backup; record its restore instructions.
2. Capture current A/AAAA/CNAME/MX/TXT/CAA records, TTLs, nameservers and current virtual-host/SSL
   configuration without changing them.
3. Preserve WordPress files, database, uploads, `.htaccess` and current Nginx/Apache configuration in
   a dated rollback set.
4. Check out the approved commit and build Astro with `DEPLOY_TARGET=vps`.
5. Upload the static output and form service to a new immutable release directory.
6. Add production form environment values privately: approved origin, recipient, verified sender,
   SMTP, Turnstile and the existing 5-per-15-minute rate limit.
7. Install the reviewed RK Reno server block and inactive route rules in a staging path; run
   `nginx -t`.
8. Test every 301 and 410 rule, including slash variants and query strings; confirm `/api/` and
   ConvortAI are unaffected.
9. Validate certificate chain, hostname coverage, renewal and HTTPS-only behaviour.
10. Test the new release through a hosts-file/private route without changing public DNS.
11. Obtain written owner approval for appearance, form recipient, legal drafts and tracking.
12. Announce the maintenance window, freeze WordPress content changes and assign rollback authority.
13. Switch only the RK Reno virtual host or DNS record selected in the approved change plan.
14. Immediately test homepage, priority services, blog, contact, 404, robots, sitemap, assets and
    mobile navigation from an external connection.
15. Submit `https://rkrenosolution.com/sitemap.xml` in the existing verified Search Console property.
16. If approved, verify `GT-T944JBVZ`/`G-NVEL66185G`, consent behaviour and debug events without
    creating a duplicate Google setup.
17. Submit one controlled production enquiry; verify one delivered email and safe Reply-To.
18. Test all documented redirects and 410 responses again on the public host.
19. Monitor Nginx, form-service, SMTP, 4xx/5xx and crawl logs during the agreed observation window.
20. If any rollback threshold is met, follow `production-rollback-plan.md` immediately.

## Evidence to retain

Record commit/release ID, backup location, DNS before/after values, `nginx -t`, SSL result, route test
output, sitemap fetch, analytics debug result, form request ID/delivery result, owner approval,
cutover time, observers and final go/no-go decision. Do not put secrets or enquiry contents in the
record.
