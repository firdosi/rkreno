# Form production readiness

Status: **BLOCKED — production endpoint remains inactive**

## Current interface

| Field | Required | Current validation |
|---|---:|---|
| Full name | Yes | 2-100 characters |
| Phone | Yes | 7-30 characters; server validates telephone characters |
| Email | No | Email format when supplied; maximum 254 |
| Service | Yes | Must match the approved service list |
| Project details | Yes | 10-2,000 characters |
| Privacy consent | Yes | Must equal the approved consent value |
| Page URL | Hidden | Maximum 500 characters server-side |
| Form start time | Hidden | Rejects implausibly fast or stale submissions |
| Company website | Honeypot | Non-empty submissions are treated as spam |
| Turnstile response | Production only | Required and verified server-side |

## Owner and legal inputs required

- Approved consent wording and a link to the approved Privacy Policy.
- Approved enquiry recipient.
- Approved SMTP sender address and Reply-To behaviour.
- Enquiry-email and any CRM retention period.
- Confirmation whether project details may contain property-address information.

## Production configuration required

- `PUBLIC_FORM_ENDPOINT=/api/enquiry`
- Public Turnstile site key and server-side secret.
- Allowed production and private-preview origins.
- Allowed Turnstile hostnames.
- SMTP host, port, secure mode, user and secret.
- Approved sender and recipient addresses.
- Rate limit; current default is 5 requests per 15 minutes per client IP.
- Request body limit; current implementation is 16 KiB.

Secrets must remain in deployment secrets/environment configuration and never in the repository.

## Submission behaviour

- GitHub Pages has no endpoint or site key, the button is disabled, and the page states that the
  online form is not configured. It cannot falsely submit an enquiry.
- A successful server response resets the form, announces a success message and dispatches the
  internal `rkreno:lead` event.
- Failed validation, Turnstile, network or SMTP responses keep the user on the form and provide an
  error state with telephone/WhatsApp fallback.
- `/thank-you/` explains that a direct visit does not prove submission. Visiting it does not emit a
  lead event.
- `generate_lead` and Meta `Lead` fire only from `rkreno:lead`, after a confirmed successful
  response. Tracking remains disabled on staging.

## Test plan before activation

1. Confirm the legal wording and privacy link.
2. Configure a private preview origin, SMTP test recipient and Turnstile test/preview keys.
3. Test every required field and boundary length.
4. Test invalid email, phone, service, missing consent and missing/expired Turnstile.
5. Test honeypot behaviour without sending mail.
6. Test disallowed origin, rate limit, oversized request and unsupported content type.
7. Confirm sender, recipient and safe Reply-To handling.
8. Confirm one email for one accepted submission and no email for rejected requests.
9. Confirm success/error messages with keyboard and screen-reader status announcements.
10. Confirm no lead event on failure or direct `/thank-you/` visit.
11. Confirm one `generate_lead` and, if approved, one Meta Lead event after success.
12. Confirm retention and deletion procedures with the owner.

Do not enable the endpoint until this plan and a private VPS preview are separately approved.
