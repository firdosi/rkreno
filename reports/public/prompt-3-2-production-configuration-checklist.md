# Prompt 3.2 production configuration checklist

| Item | Status | Requirement |
|---|---|---|
| Environment gating and disabled default | READY IN CODE | Keep GitHub Pages disabled |
| Same-origin /api/enquiry service | READY IN CODE | Proxy only this path to loopback |
| Validation, body limit and origin checks | READY IN CODE | Preserve current policy |
| Turnstile adapter and replay protection | READY IN CODE | Use separate preview/production widgets |
| Recipient address | NEEDS OWNER VALUE | Confirm candidate rkrenosolution@gmail.com |
| Verified business-domain sender | NEEDS OWNER VALUE | Never use visitor address as From |
| SMTP host, port, security and credentials | NEEDS PROVIDER CONFIGURATION | Store outside Git and GitHub Pages |
| Turnstile site/secret keys | NEEDS PROVIDER CONFIGURATION | Secret remains server-side |
| Private-preview origin and hostname | NEEDS PRIVATE PREVIEW TEST | Replace placeholder in Prompt 3.3 |
| Nginx loopback proxy and trusted proxy rule | NEEDS PRIVATE PREVIEW TEST | Do not trust arbitrary forwarded headers |
| Consent wording and retention notice | NEEDS OWNER VALUE | Obtain legal/owner review; not legal advice |
| Analytics property and hostname | NEEDS OWNER VALUE | Confirm existing property ownership |
| Analytics and form activation | NEEDS PRODUCTION APPROVAL | Activate only after full private-preview acceptance |
| VPS, DNS and cutover | NEEDS PRODUCTION APPROVAL | Outside this prompt |

Result: **PASS**. No secrets are included.
