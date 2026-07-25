# SEO measurement plan

## Business outcomes

Measure qualified enquiry opportunities, not traffic alone. The primary outcomes are successful
server-confirmed forms, intentional WhatsApp clicks and telephone clicks. Job value and closed work
remain owner-side business measures and must not be inferred from analytics.

## Approved event design

| Event | Trigger | Required guard |
|---|---|---|
| `whatsapp_click` | User activates a tracked WhatsApp link | Production analytics enabled after approved consent |
| `phone_click` | User activates a tracked telephone link | Production analytics enabled after approved consent |
| `generate_lead` | Server confirms a successful form submission | Never on validation, Turnstile, network, SMTP or direct thank-you failure |

Use the existing Google tag only after ownership is confirmed. Do not add GTM or Meta Pixel by
default. Exclude staff/test traffic where practical and document any filters.

## Weekly launch review

- Search Console: clicks, impressions, CTR, average position, indexed URLs, canonical issues and
  query/page changes.
- Analytics: landing pages, channel, contact events and successful lead events.
- Server: 301/410/404/5xx patterns, crawl activity and Core Web Vitals field data.
- Business: qualified enquiries, service requested, area, response time and outcome using a private
  owner-controlled record.

Segment the six priority services and major service areas only when sample sizes are meaningful.
Never publish personal enquiry details in reports.

## Baselines and comparisons

Capture a pre-cutover Search Console export when access is available, then compare 7-, 28- and
90-day periods with annotations for cutover, fixes and content changes. Allow for normal volatility;
investigate material sustained changes at query and landing-page level before rewriting content.

## Data quality checks

- One event per intended action; no events on staging/private preview.
- One `generate_lead` per accepted request ID.
- No duplicate Google property or tag.
- Consent state recorded and honoured where required.
- Time zone and currency documented.
- Internal/test traffic identified.
- Search Console and analytics landing URLs use the same canonical host/trailing slash.
