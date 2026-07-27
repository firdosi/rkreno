# Prompt 3.3 Launch Blockers

## OWNER APPROVAL REQUIRED

- Approve the exact release SHA and private-preview result.
- Confirm the verified WordPress backup and final cutover window.

## PROVIDER VALUE REQUIRED

- Provide approved private-preview hostname/access policy, SMTP values, and separate preview/production Turnstile keys.
- Confirm current DNS, TLS, Google Analytics, and Search Console ownership/settings.

## PRIVATE PREVIEW REQUIRED

- Deploy this immutable package to an isolated authenticated preview and obtain owner sign-off.

## SERVER TEST REQUIRED

- Run nginx -t on the Stage 4 server, validate systemd sandbox compatibility, TLS, loopback form service, and direct-origin checks.

## CUTOVER APPROVAL REQUIRED

- Authorize DNS/origin routing only after every runbook stop condition passes.

## POST-CUTOVER ACTION REQUIRED

- Run the 30-day monitoring checklist and verify/resubmit the unchanged sitemap in Search Console.
