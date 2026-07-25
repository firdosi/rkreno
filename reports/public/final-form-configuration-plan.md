# Final production form configuration plan

Status: **READY FOR PRIVATE CONFIGURATION — NOT ACTIVE**

## Existing WordPress form

The homepage currently renders Contact Form 7 form `9854`. The backup confirms required-looking
name, email, phone, company, project type, budget, message and acceptance controls, but several HTML
types and placeholders are swapped. The acceptance control is configured as optional even though its
copy ends with an asterisk. Mail uses the WordPress admin-email placeholder, a development sender
placeholder and visitor email in `Reply-To`. Standard Contact Form 7 success and error messages are
present; no redirect or secondary mail is active. No verified SMTP, CAPTCHA, retention or CRM
configuration was found. These settings should not be copied as-is.

## Recommended production configuration

- Fields: full name (required, 2–100), phone (required, 7–30), email (optional, valid format),
  service (required approved value), project details (required, 10–2,000), privacy consent
  (required), page URL and start time (hidden), and company website (honeypot).
- Endpoint: same-origin `POST /api/enquiry`, JSON only, maximum request body 16 KiB.
- Origin policy: allow only the production origin; use a separate preview origin during testing.
- Spam controls: Cloudflare Turnstile, honeypot, minimum/maximum completion time, server validation,
  and 5 accepted attempts per 15 minutes per client IP.
- Email: candidate recipient `rkrenosolution@gmail.com`; verified same-domain or provider-approved
  sender; visitor email only as a sanitized `Reply-To`; no visitor-controlled sender, subject or
  recipient.
- Subject: `Website enquiry: [service] - [name]`; plain-text and escaped HTML versions; no remote
  content or attachments.
- Success: confirm that the enquiry was sent, reset the form, and emit the internal lead event only
  after the server confirms mail acceptance.
- Failure: keep entered data where safe, show a clear error and telephone/WhatsApp fallback, and emit
  no lead event.
- Analytics: production-only `whatsapp_click`, `phone_click`, and one `generate_lead` per confirmed
  form success. Direct `/thank-you/` visits never count as leads.
- Retention: email/CRM retention remains unresolved and must be approved before activation.

## Private-preview acceptance tests

Test required and boundary values, invalid email/phone/service, absent consent, Turnstile failure,
honeypot, fast/stale submissions, disallowed origins, wrong content type, oversized bodies, rate
limit, SMTP failure, safe Reply-To, duplicate submission, accessibility announcements, and all
success/failure analytics rules. Use preview Turnstile settings and a test recipient only.

Secrets belong in private environment configuration. Do not activate the endpoint until the owner
approves recipient, sender, privacy text, retention, and a successful private-preview test.
