# Private VPS preview plan

Status: **PREPARED — DO NOT EXECUTE YET**

## Isolation

Use a dedicated directory such as `/var/www/rkreno-preview/releases/<release-id>`, a dedicated
Unix service for the test form API, and a dedicated Nginx server block on a private preview hostname.
Do not reuse the ConvortAI directory, process, port or server block. Do not change the production
domain, DNS, WordPress or the current RK Reno virtual host.

## Preview controls

- Basic Authentication or equivalent access restriction.
- `X-Robots-Tag: noindex, nofollow, noarchive` on every response.
- Astro build target `vps-preview`, which also emits noindex metadata and disallow-all robots.
- Analytics disabled regardless of identifiers.
- Test-only `/api/enquiry`, test recipient and preview-specific Turnstile settings.
- Same-origin allowlist restricted to the preview origin.
- Separate logs, environment file, service account and release directory.
- No secrets in Git, shell history, build artifacts or public reports.

## Future sequence

1. Confirm the preview hostname/access method without changing public DNS.
2. Create the isolated directory, service account and empty release.
3. Add private environment secrets on the VPS.
4. Build production-style static output with `DEPLOY_TARGET=vps-preview`.
5. Upload to a new release directory; do not overwrite another app.
6. Install the inactive preview Nginx server block and authentication file.
7. Run `nginx -t`, then reload only after review.
8. Test desktop/mobile navigation, 42 routes, 404, robots headers, analytics absence and form failure
   states before using the test recipient.
9. Test the form using Turnstile preview settings and confirm no production mail or analytics.
10. Record owner approval or remove the preview release.

Rollback is removal of the preview server block/service and restoration of its previous isolated
configuration. Production WordPress remains the live rollback by design.
