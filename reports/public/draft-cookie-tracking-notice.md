# Draft Cookie and Tracking Notice

Status: **CONDITIONAL DRAFT — publish only if the approved production setup requires it**

## Recommended launch position

Keep GitHub Pages and private preview free of analytics. For production, preserve only the existing
Google tag after the owner confirms access to the property and the required consent approach. Do not
introduce GTM, Meta Pixel, Microsoft Clarity or advertising cookies without a verified purpose and
updated notice/consent review.

## Planned categories

| Category | Planned use | Default |
|---|---|---|
| Strictly necessary | Security, request delivery and form abuse prevention | Allowed where legally permitted |
| Functional | Only if a confirmed feature needs it | Off unless required |
| Analytics | Existing Google tag/GA4 for aggregate site and lead measurement | Off until approved consent state |
| Advertising | None planned | Off |

Cloudflare Turnstile may process technical signals to distinguish genuine submissions from abuse.
The final notice must link to the confirmed provider information and explain any storage used.

## Existing identifiers discovered

- Google tag: `GT-T944JBVZ`
- GA4 measurement identifier: `G-NVEL66185G`

These identifiers are present on WordPress and in backups, but ownership still requires confirmation.
No GTM container, Meta Pixel, Bing verification or Microsoft Clarity project ID was found.

## Consent behaviour if required

- Explain the purposes before non-essential tracking loads.
- Offer a clear accept and reject choice with equivalent prominence.
- Keep analytics off before a valid choice where prior consent is required.
- Store and honour the choice, provide a way to change it, and document its duration.
- Do not fire analytics events from staging or private preview.
- Fire `generate_lead` only after a server-confirmed successful form submission.

## Owner confirmations

The owner must confirm served countries, applicable consent requirements, the Google property,
consent-record retention, and whether any future advertising is planned. If production launches with
no non-essential tracking, use a short necessary-technology disclosure and do not add a consent
banner merely for appearance.
