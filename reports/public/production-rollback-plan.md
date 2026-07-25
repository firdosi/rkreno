# Production rollback plan

Status: **READY AS A PROCEDURE — NOT EXECUTED**

## Rollback triggers

Rollback if the production site is broadly unavailable, TLS or canonical host is wrong, priority
routes fail, the form leaks or loses enquiries, redirects loop, ConvortAI is affected, private data
is exposed, or the issue cannot be safely corrected inside the approved maintenance window.

## Procedure

1. Stop the cutover and record the failure time and symptoms.
2. Disable the new RK Reno form service if it is involved; keep enquiry logs private.
3. Restore the previous RK Reno virtual-host configuration or point the `current` symlink to the
   known-good WordPress configuration as defined in the approved cutover method.
4. Run `nginx -t`; reload only after it passes.
5. If DNS changed, restore the captured previous record values and preserve MX/TXT records.
6. Confirm WordPress homepage, priority routes, admin access, TLS and contact paths.
7. Confirm ConvortAI is healthy and unchanged.
8. Pause analytics/form launch validation to avoid duplicate events or mail.
9. Monitor propagation and server logs until the previous production state is stable.
10. Inform the owner of the rollback outcome, preserve evidence and create a corrective action list.

Do not delete the failed release, final backup or logs until the cause is understood. Do not restore
the database over a newer database without explicit approval and a verified need.
