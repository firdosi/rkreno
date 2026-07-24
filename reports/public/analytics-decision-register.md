# Analytics decision register

Status: **DECISIONS REQUIRED — all tracking remains disabled on staging**

| Item | Current implementation/status | Owner decision required |
|---|---|---|
| Google tag | Default value `GT-T944JBVZ`; not loaded unless production analytics is enabled | Confirm the associated GA4 property and ownership |
| Google Tag Manager | No GTM ID configured | Use GTM or omit it |
| Meta Pixel | No Pixel ID configured | Add a verified Pixel or omit it |
| Search Console | No verification value configured; ownership unknown | Confirm property ownership and verification method |
| WhatsApp click | `whatsapp_click` implementation exists behind the analytics flag | Approve event and destination |
| Telephone click | `phone_click` implementation exists behind the analytics flag | Approve event |
| Form lead | `generate_lead` fires only after a confirmed successful response | Approve event name/property and test it privately |
| Meta Lead | Fires only after confirmed success and only when Meta Pixel is enabled | Approve or omit |
| Consent | No consent banner is active | Confirm jurisdictions and legal requirement before tracking |

## Owner decisions

1. **Existing Google tag:** use `GT-T944JBVZ` only after confirming the linked GA4 property, or
   replace/omit it.
2. **Google Tag Manager:** add GTM only if the owner needs central tag management and accepts the
   additional governance burden.
3. **Meta Pixel:** add only with a verified Pixel ID, a defined advertising purpose and required
   consent.
4. **Advertising cookies:** explicitly approve or omit. Omission is the lower-complexity default.
5. **Search Console:** confirm who owns the property and which verification method will be used.
6. **Consent banner:** obtain a decision based on served regions and enabled tools. Non-essential
   scripts must not load before consent where prior consent is required.

## Staging safety

`analyticsEnabled` requires both the production deployment target and
`PUBLIC_ANALYTICS_ENABLED=true`. GitHub Pages therefore loads no Google tag, GTM or Meta Pixel even
if identifiers exist in code defaults. Do not change this staging behaviour.
