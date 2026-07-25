# Final redirect and gone-response validation

Status: **PASS — INACTIVE DOCUMENTATION**

Validated the approved disposition plan against `final-nginx-route-rules.conf`.

- 23 redirect sources each have one relevant final destination.
- 66 approved removal sources return 410.
- Both slash and no-slash forms are documented.
- Query strings are preserved on redirects with `$is_args$args`.
- No redirect points to another redirect after `/tag/ceiling-works/` was changed to point directly to
  `/tag/interior-finishing/`.
- No self-loop, duplicate source or homepage catch-all redirect exists.
- No redirect destination is an approved 410 or owner-decision route.
- `/api/` has a higher-priority dedicated location and is not touched by route dispositions.
- Rules are exact matches inside only the RK Reno production server block, so they cannot affect a
  separate ConvortAI server block.
- Unknown case variants remain 404. Broad case-insensitive rewrites are intentionally avoided.
- Static fallback uses `try_files`; unknown URLs reach the custom 404 instead of the homepage.

The rules remain inactive and must be syntax-tested in the private preview before any later cutover.
No Nginx, VPS, DNS or production change was made.
