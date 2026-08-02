# Office Renovation Petaling Jaya and blog archive review

## Article

- Route: `/office-renovation-petaling-jaya-corporate-fit-out-experts/`
- Exact content match: PASSED
- Missing content: 0
- Rewritten content: 0
- SEO regressions: 0
- H1: PASSED, exactly one
- Five-entry TOC: PASSED
- Three fit-out demands: PASSED
- Four corporate services: PASSED
- Four price tiers: PASSED
- Four-step process: PASSED
- Reinstatement section: PASSED
- WhatsApp link: PASSED, one exact source URL
- Three internal links: PASSED
- About mapping: PASSED, source `/about/` renders as `/about-us/`
- Correct original images: 0/1
- Image fallbacks: 1
- Image limitation: the transformed and base WordPress media URLs returned HTML rather than the source JPEG. A local modern-office illustration is used consistently for the article and blog card, is captioned as illustrative, and is not represented as RK Reno project work. The exact production image URL remains in BlogPosting JSON-LD.
- SOURCE_ONLY claims: 21
- FAQPage schema: PASSED, four exact source questions and answers in a separate JSON-LD object
- Visible FAQ absence: PASSED
- Structured-data SEO risk: SOURCE_ONLY; hidden/non-visible FAQPage requires owner verification before production indexing
- Broken links: 0
- Broken images: 0
- Overflow: 0
- Console errors: 0
- Desktop 1440px: PASSED
- Tablet 768px: PASSED
- Mobile 390px: PASSED

## Blog archive

- Expected genuine posts: 14
- Rendered cards: 14
- Missing posts: 0
- Duplicate posts: 0
- Extra/non-post cards: 0
- Broken card links: 0
- Broken card images: 0
- Wrong titles: 0
- Wrong routes: 0
- Publication-date ordering: PASSED, newest first
- Local images: PASSED
- Petaling Jaya card: PASSED, exactly once
- Previously recovered posts: PASSED
- Desktop: PASSED, three columns
- Tablet: PASSED, two columns
- Mobile: PASSED, one column

## Safety and regression

- Homepage: unchanged
- Previously approved route-specific components, data and styles: unchanged
- Shared header and footer: unchanged
- Other routes: not redesigned
- Blog SEO: unchanged; only the listing data/layout changed
- Smoke routes: 12/12 returned HTTP 200 with one H1, one shared header and one shared footer
- Production safety: GitHub staging remains `noindex, nofollow`; no VPS, WordPress, DNS, Hostinger, Cloudflare, SMTP, Turnstile, analytics or production system was changed
- Remaining visible defects: none beyond the documented source-image limitation
- Legacy full-suite result: FAILED on 70 pre-existing repository-wide migration rules. Its Petaling Jaya checks still expect an older two-image/link/schema contract that conflicts with this prompt's exact one-image, three-link and source FAQPage requirements. No unrelated route was changed to mask those failures.
