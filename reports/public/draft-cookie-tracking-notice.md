# Draft Cookie and Tracking Notice

Status: **CONDITIONAL DRAFT — publish only if the approved production setup requires it**

## Recommended launch position

GitHub Pages staging remains analytics-free and noindex, nofollow. For a future production launch,
preserve the existing Google Analytics setup only after verifying the correct logged-in
account/property and the required consent approach. Owner access to Google Analytics and Search
Console is confirmed.

Do not add Google Tag Manager, Meta Pixel, Microsoft Clarity, Bing scripts, new advertising tracking
or advertising cookies.

## Planned categories

| Category | Planned use | Default |
|---|---|---|
| Strictly necessary | Security, request delivery and future form abuse prevention | Allowed where legally permitted |
| Functional | Only if a confirmed feature needs it | Off unless required |
| Analytics | Existing Google tag/GA4 for aggregate production measurement | Off until account/property and consent state are verified |
| Advertising | None planned | Off |

Cloudflare Turnstile is recommended for the future production form and may process technical signals
to distinguish genuine submissions from abuse. The final notice must name the confirmed providers
and explain any storage used.

## Existing future-production identifiers

- Google tag: `GT-T944JBVZ`
- GA4 measurement identifier: `G-NVEL66185G`
- Search Console: existing URL-prefix property for `https://rkrenosolution.com/`

Do not create a new GA4 property unless the existing property is inaccessible or incorrect. Do not
load these identifiers on GitHub Pages.

## Consent behaviour if required

- Explain purposes before non-essential tracking loads.
- Offer clear accept and reject choices with equivalent prominence.
- Keep analytics off before a valid choice where prior consent is required.
- Store and honour the choice and provide a way to change it.
- Do not fire analytics events from staging.
- Fire `generate_lead` only after a future server-confirmed successful form submission.

## Remaining confirmations

Before publication, confirm the applicable consent/legal wording, the exact logged-in Google
account/property, provider disclosures and consent-record handling. If production launches with no
non-essential tracking, use a short necessary-technology disclosure and do not add a banner merely
for appearance.
