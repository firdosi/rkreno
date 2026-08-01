# Article pages design recovery review

Status: **PASS** for Prompt 3 blog and article scope only. This is not a production-readiness approval.

| Route | Family | Semantic sections | Pricing or comparison | FAQ accordions | Result |
|---|---|---:|---|---:|---|
| `/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/` | Aircond | 14 | Structured | 8 | PASS |
| `/commercial-retail-shop-renovation-in-kuala-lumpur/` | Renovation and commercial | 6 | Structured | Source has no FAQ block | PASS |
| `/office-renovation-petaling-jaya-corporate-fit-out-experts/` | Renovation and commercial | 6 | Structured | Source has no FAQ block | PASS |
| `/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/` | Technical and specialist | 7 | Structured | Source has no FAQ block | PASS |
| `/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/` | Technical and specialist | 7 | Structured | Source has no FAQ block | PASS |
| `/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/` | Aircond | 7 | Structured | Source has no FAQ block | PASS |
| `/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/` | Technical and specialist | 7 | Structured | Source has no FAQ block | PASS |
| `/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/` | Renovation and commercial | 13 | Structured | 9 | PASS |
| `/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/` | Renovation and commercial | 7 | Structured | Source has no FAQ block | PASS |
| `/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/` | Renovation and commercial | 8 | Structured | Source has no FAQ block | PASS |
| `/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/` | Cleaning | 12 | Structured | 5 | PASS |
| `/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/` | Technical and specialist | 6 | Structured | Source has no FAQ block | PASS |
| `/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/` | Aircond | 7 | Structured | Source has no FAQ block | PASS |
| `/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/` | Cleaning | 7 | Structured | Source has no FAQ block | PASS |

## Archive and architecture

- Blog archive: hero, topic navigation, featured guide, 14 article cards, grouped topics, related services and final CTA.
- Article renderer: 14/14 routes use `data-article-recovery`; the former locked article/sidebar composition is absent.
- Families: Aircond 3; Renovation and commercial 5; Technical and specialist 4; Cleaning 2.
- Related service CTA: 14/14.
- Related guide navigation: 14/14.
- Seven unavailable cleaning originals retain the documented contextual fallback and are not represented as originals.

## Automated review counts

- Excessive blank-space issues: 0.
- Narrow desktop reading-column issues: 0.
- Desktop article text below 17px: 0.
- Adjacent duplicate hero/body image issues: 0.
- Broken internal links across full validation: 0.
- Broken images across full validation: 0.
- Article content regressions: 0.
- Article SEO regressions: 0.

## Required visual evidence

1. `article-screenshots/blog-archive-desktop.png`
2. `article-screenshots/aircond-installation-kl-desktop.png`
3. `article-screenshots/aircond-installation-kl-mobile.png`
4. `article-screenshots/house-renovation-kl-desktop.png`
5. `article-screenshots/commercial-retail-renovation-desktop.png`
6. `article-screenshots/deep-cleaning-desktop.png`

Safety: staging remains `noindex, nofollow`; forms remain disabled; no VPS, WordPress, DNS, analytics, SMTP, Turnstile or other production system was changed.
