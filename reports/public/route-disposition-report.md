# RK Reno route disposition and authenticity report

## Phase 3 implementation update — 24 July 2026

The owner approved the Phase 2 recommendations. GitHub Pages now omits all 66
`REMOVE_AND_410` routes, all 18 `MERGE_AND_301_REDIRECT` source routes and the five
`OWNER_DECISION_REQUIRED` pages. The ten Phase 3 Batch 1 routes are implemented with
native Astro components.

GitHub Pages cannot return true server-side 301 or 410 status codes. The approved rules
are documented in `ops/nginx/redirects.conf` for a future separately approved VPS
deployment; they are not active on staging. Removed demo and shop routes are not
redirected to the homepage.

Generated: 2026-07-23T19:12:24.404Z

## Decision boundary

This Phase 2 report proposes route actions only. It does not redesign pages, implement redirects, remove routes, change indexing, or approve unverified content. Search Console traffic and backlink exports were unavailable, so backlink risk is **UNKNOWN** throughout.

Related evidence: [Phase 1 completion report](full-site-completion-report.md), [completion CSV](full-site-completion-status.csv), [claims register](unverified-claims-register.csv), [legal requirements](legal-page-requirements.md), and [owner decisions](owner-decisions-required.md).

## Reconciled route universe

- 130 generated HTTP 200 content routes.
- 1 additional crawled HTTP 200 utility result (`/wp-content/uploads/2025/01/home.svg`), producing the earlier 131 HTTP 200 count.
- 9 known production 404 URLs.
- These total the earlier 140 unique crawled final paths.
- 2 redirect-map source aliases not represented as unique final paths: `/about/` and `/home-2/`.
- 3 published WooCommerce utilities found in the WordPress export but absent from the 140-path crawl: `/cart/`, `/checkout/`, and `/my-account/`.
- **Reconciled Phase 2 universe: 145 unique routes/URLs** (130 generated + 9 production 404 + 1 crawled utility + 2 redirect aliases + 3 export-only).

## Proposed-action totals

- KEEP_AND_REDESIGN: 25
- KEEP_CONTENT_PAGE: 7
- MERGE_AND_301_REDIRECT: 18
- REMOVE_AND_410: 66
- KEEP_NOINDEX_TEMPORARILY: 15
- OWNER_DECISION_REQUIRED: 5
- EXISTING_404_REPAIR: 1
- EXISTING_404_LEAVE_GONE: 8

## Recommended launch count

The evidence-supported core retains 47 current routes: 25 redesigns, 7 retained content pages, and 15 temporary noindex routes. Adding the two minimum proposed legal pages (Privacy Policy and Terms of Use) produces a **recommended launch count of 49 content/utility routes**. The 5 OWNER_DECISION_REQUIRED routes are excluded until approved. Redirect aliases and gone responses are not counted as launch content pages.

## Recommended launch structure

### 1. Essential business pages
- `/`
- `/about-us/`
- `/blog/`
- `/contact-us/`
- `/faq/`
- `/services/`

### 2. Priority service pages
- `/aircond-installation-kl/`
- `/electrical-services-selangor/`
- `/service/building-renovation/`
- `/servis-aircond-murah-kl/`
- `/upah-pasang-aircond-selangor/`

### 3. Location service pages
- `/electrical-services-selangor/`
- `/home-renovation-contractor-in-subang-jaya/`
- `/house-renovation-in-kuala-lumpur/`
- `/house-renovation-in-selangor/`
- `/office-renovation-in-kuala-lumpur/`
- `/upah-pasang-aircond-selangor/`
- `/waterproofing-contractor-kuala-lumpur/`

### 4. Valuable supporting guides
- `/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/`
- `/commercial-retail-shop-renovation-in-kuala-lumpur/`
- `/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/`
- `/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/`
- `/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/`
- `/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/`
- `/office-renovation-petaling-jaya-corporate-fit-out-experts/`
- `/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/`
- `/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/`
- `/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/`
- `/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/`
- `/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/`
- `/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/`
- `/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/`

### 5. Useful blog posts
- The retained supporting guides above form the useful article set; `/blog/` remains the main archive.

### 6. Useful category pages
- `/category/commercial/`
- `/category/hvac-guides/`
- `/category/interior-design/`
- `/category/maintenance/`
- `/category/renovation/`
- `/category/servis-pembersihan/`
- `/category/technical-guides/`
- `/tag/aircond-maintenance/`
- `/tag/cleaning/`
- `/tag/guide/`
- `/tag/interior-finishing/`
- `/tag/office-fit-out/`
- `/tag/pemasangan-aircond/`
- `/tag/waterproofing/`

### 7. Noindex utility pages
- `/thank-you/`

### 8. Pages awaiting owner verification
- `/company-history/`
- `/our-projects-2/`
- `/our-projects/`
- `/our-team/`
- `/testimonials/`

### 9. Routes to merge
- `/about/`
- `/blog/page/2/`
- `/blog/page/3/`
- `/blog/page/4/`
- `/service-category/building-architecture/`
- `/service-category/building-renovation/`
- `/service-category/flooring-roofing/`
- `/service-category/general-constracting/`
- `/service-category/interior-design/`
- `/service-category/repair-expand/`
- `/service/architecture-design/`
- `/service/building-construction/`
- `/service/flooring-roofing/`
- `/service/general-contracting/`
- `/service/repair-expand/`
- `/tag/ceiling-works/`
- `/tag/kuala-lumpur/`
- `/tag/wiring/`

### 10. Routes to remove
- `/blog-full-width/`
- `/blog-grid/`
- `/career/`
- `/cart/`
- `/checkout/`
- `/feedback-error/`
- `/home-1-one-page/`
- `/home-1/`
- `/home-10-one-page/`
- `/home-10/`
- `/home-2-2/`
- `/home-2-one-page/`
- `/home-2/`
- `/home-3-one-page/`
- `/home-3/`
- `/home-4-one-page/`
- `/home-4/`
- `/home-5-one-page/`
- `/home-5/`
- `/home-6-one-page/`
- `/home-6/`
- `/home-7-one-page/`
- `/home-8-onepage/`
- `/home-8/`
- `/home-9-one-page/`
- `/home-9/`
- `/landing-page/`
- `/my-account/`
- `/portfolio/axis-industrial-park/`
- `/portfolio/building-a-sustainable-tomorrow/`
- `/portfolio/building-excellence-through-innovation/`
- `/portfolio/crafting-landmark-construction-projects/`
- `/portfolio/cutting-edge-strategies-for-building-success/`
- `/portfolio/designing-the-future-of-urban-spaces/`
- `/portfolio/expert-solutions-for-modern-structures/`
- `/portfolio/innovating-the-next-generation-of-architecture/`
- `/portfolio/innovative-approaches-to-construction-excellence/`
- `/portfolio/innovative-construction-project-showcase/`
- `/portfolio/mastering-construction-with-precision/`
- `/portfolio/oakwood-residence/`
- `/portfolio/pioneering-solutions-for-architectural-excellence/`
- `/portfolio/precision-craftsmanship-in-construction/`
- `/portfolio/revolutionary-techniques-in-modern-construction/`
- `/portfolio/shaping-tomorrows-built-environment/`
- `/portfolio/skyline-hub/`
- `/portfolio/the-ivey-school-of-business/`
- `/portfolio/transforming-designs-into-reality/`
- `/pricing-plan/`
- `/product-category/repair-expand/`
- `/product/blackdecker-circular-saw/`
- `/product/bosch-js470e-7-0-amp-jigsaw/`
- `/product/cutting-circular-saw/`
- `/product/dewalt-dwe575sb-circular-saw/`
- `/product/festool-hk-circular-saw/`
- `/product/makita-5007mg-magnesium-circular-saw/`
- `/product/metabo-hpt-ripmax-pro-circular-saw/`
- `/product/milwaukee-fuel-circular-saw/`
- `/product/ryobi-p505-18v-circular-saw/`
- `/product/skil-5280-01-circular-saw/`
- `/product/vacuum-cleaner/`
- `/product/worx-compact-circular-saw/`
- `/sample-page/`
- `/shop/`
- `/team-detail/`
- `/wishlist/`
- `/wp-content/uploads/2025/01/home.svg`

### 11. Existing broken URLs requiring action
- `/6-ways-to-get-the-most-out-of-your-project-search-software`
- `/portfolio/commercial/`
- `/portfolio/electrical/`
- `/portfolio/home-renovation/`
- `/portfolio/office-renovation/`
- `/portfolio/residential/`
- `/portfolio/stadium/`
- `/portfolio/waterproofing/`
- `/services/%20https:/rkrenosolution.com/about-us/`

### 12. Future SEO opportunities not included in migration
- Demolition services: record as a future owner-approved SEO opportunity only; no route is proposed or created in this migration.

## WooCommerce review

The 15 live/generated ecommerce routes plus 3 published export-only utilities have no evidence of an active RK Reno online store. All are proposed REMOVE_AND_410; no display-only shop is retained.

| Route | Current status | Action | Reason |
| --- | --- | --- | --- |
| `/cart/` | 200 | REMOVE_AND_410 | Published WooCommerce utility exists in the export but has no supported RK Reno sales function. |
| `/checkout/` | 302 → https://rkrenosolution.com/cart/ | REMOVE_AND_410 | Published WooCommerce utility exists in the export but has no supported RK Reno sales function. |
| `/my-account/` | 200 | REMOVE_AND_410 | Published WooCommerce utility exists in the export but has no supported RK Reno sales function. |
| `/product-category/repair-expand/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/product/blackdecker-circular-saw/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/product/bosch-js470e-7-0-amp-jigsaw/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/product/cutting-circular-saw/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/product/dewalt-dwe575sb-circular-saw/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/product/festool-hk-circular-saw/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/product/makita-5007mg-magnesium-circular-saw/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/product/metabo-hpt-ripmax-pro-circular-saw/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/product/milwaukee-fuel-circular-saw/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/product/ryobi-p505-18v-circular-saw/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/product/skil-5280-01-circular-saw/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/product/vacuum-cleaner/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/product/worx-compact-circular-saw/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/shop/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |
| `/wishlist/` | 200 | REMOVE_AND_410 | Imported WooCommerce content; no evidence RK Reno sells these products online. |

## Demo and implementation review

All 24 generated theme/demo routes plus 1 redirect-only demo alias are proposed REMOVE_AND_410 (25 reconciled URLs). They are not redirected to the homepage because their imported template intent is not genuine RK Reno business intent.

| Route | Indicators | Unique RK Reno content | Action |
| --- | --- | --- | --- |
| `/blog-full-width/` | Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/blog-grid/` | Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-1-one-page/` | Vincent Pham/P.; Ivey School demo; Lorem ipsum; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-1/` | Vastcon; Vincent Pham/P.; Ivey School demo; Lorem ipsum; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-10-one-page/` | Vastcon; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-10/` | Vastcon; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-2-2/` | Vastcon; Vincent Pham/P.; Ivey School demo; Lorem ipsum; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-2-one-page/` | Vastcon; Vinceta; Vincent Pham/P.; Ivey School demo; Lorem ipsum; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-2/` | Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-3-one-page/` | Vastcon; Vinceta; Vincent Pham/P.; Ivey School demo; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-3/` | Vastcon; Vinceta; Vincent Pham/P.; Ivey School demo; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-4-one-page/` | Vinceta; Vincent Pham/P.; Lorem ipsum; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-4/` | Vastcon; Vincent Pham/P.; Lorem ipsum; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-5-one-page/` | Vastcon; Ivey School demo; Lorem ipsum; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-5/` | Vastcon; Ivey School demo; Lorem ipsum; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-6-one-page/` | Vastcon; Ivey School demo; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-6/` | Vastcon; Ivey School demo; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-7-one-page/` | Vastcon; Lorem ipsum; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-8-onepage/` | Vastcon; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-8/` | Vastcon; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-9-one-page/` | Vastcon; Ivey School demo; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/home-9/` | Vastcon; Ivey School demo; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/landing-page/` | Vastcon; Theme refund copy; Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/pricing-plan/` | Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |
| `/sample-page/` | Demo route name | NONE ESTABLISHED | REMOVE_AND_410 |

## Portfolio authenticity review

All 19 portfolio records repeat Ivey School/Vastcon/Vincent/Alten demo material, foreign contact details or identical project copy. None has owner evidence, a verified Malaysian location, or unique RK Reno delivery details. Status is LIKELY_THEME_DEMO and proposed action is 410, pending owner confirmation that none is genuine.

| Route | Title | Images | Text/evidence | Same demo content | RK Reno ownership | Location/details | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/portfolio/axis-industrial-park/` | Axis Industrial Park - RK Reno Solution | 11 | Axis Industrial Park about project The Ivey School of Business project is a landmark in modern educational construction, merging cutting-edge des | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/building-a-sustainable-tomorrow/` | Building a Sustainable Tomorrow - RK Reno Solution | 11 | Building a Sustainable Tomorrow about project The Ivey School of Business project is a landmark in modern educational construction, merging cutti | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/building-excellence-through-innovation/` | Building Excellence Through Innovation - RK Reno Solution | 11 | Building Excellence Through Innovation about project The Ivey School of Business project is a landmark in modern educational construction, mergin | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/crafting-landmark-construction-projects/` | Crafting Landmark Construction Projects - RK Reno Solution | 11 | Crafting Landmark Construction Projects about project The Ivey School of Business project is a landmark in modern educational construction, mergi | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/cutting-edge-strategies-for-building-success/` | Cutting-Edge Strategies for Building Success - RK Reno Solution | 11 | Cutting-Edge Strategies for Building Success about project The Ivey School of Business project is a landmark in modern educational construction, | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/designing-the-future-of-urban-spaces/` | Designing the Future of Urban Spaces - RK Reno Solution | 11 | Designing the Future of Urban Spaces about project The Ivey School of Business project is a landmark in modern educational construction, merging | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/expert-solutions-for-modern-structures/` | Expert Solutions for Modern Structures - RK Reno Solution | 11 | Expert Solutions for Modern Structures about project The Ivey School of Business project is a landmark in modern educational construction, mergin | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/innovating-the-next-generation-of-architecture/` | Innovating the Next Generation of Architecture - RK Reno Solution | 11 | Innovating the Next Generation of Architecture about project The Ivey School of Business project is a landmark in modern educational construction | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/innovative-approaches-to-construction-excellence/` | Innovative Approaches to Construction Excellence - RK Reno Solution | 11 | Innovative Approaches to Construction Excellence about project The Ivey School of Business project is a landmark in modern educational constructi | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/innovative-construction-project-showcase/` | Innovative Construction Project Showcase - RK Reno Solution | 11 | Innovative Construction Project Showcase about project The Ivey School of Business project is a landmark in modern educational construction, merg | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/mastering-construction-with-precision/` | Mastering Construction with Precision - RK Reno Solution | 11 | Mastering Construction with Precision about project The Ivey School of Business project is a landmark in modern educational construction, merging | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/oakwood-residence/` | Oakwood Residence - RK Reno Solution | 11 | Oakwood Residence about project The Ivey School of Business project is a landmark in modern educational construction, merging cutting-edge design | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/pioneering-solutions-for-architectural-excellence/` | Pioneering Solutions for Architectural Excellence - RK Reno Solution | 11 | Pioneering Solutions for Architectural Excellence about project The Ivey School of Business project is a landmark in modern educational construct | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/precision-craftsmanship-in-construction/` | Precision Craftsmanship in Construction - RK Reno Solution | 11 | Precision Craftsmanship in Construction about project The Ivey School of Business project is a landmark in modern educational construction, mergi | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/revolutionary-techniques-in-modern-construction/` | Revolutionary Techniques in Modern Construction - RK Reno Solution | 11 | Revolutionary Techniques in Modern Construction about project The Ivey School of Business project is a landmark in modern educational constructio | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/shaping-tomorrows-built-environment/` | Shaping Tomorrow’s Built Environment - RK Reno Solution | 11 | Shaping Tomorrow’s Built Environment about project The Ivey School of Business project is a landmark in modern educational construction, merging | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/skyline-hub/` | Skyline Hub - RK Reno Solution | 11 | Skyline Hub about project The Ivey School of Business project is a landmark in modern educational construction, merging cutting-edge design with | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/the-ivey-school-of-business/` | The Ivey School of Business - RK Reno Solution | 11 | The Ivey School of Business about project The Ivey School of Business project is a landmark in modern educational construction, merging cutting-e | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |
| `/portfolio/transforming-designs-into-reality/` | Transforming Designs Into Reality - RK Reno Solution | 11 | Transforming Designs Into Reality about project The Ivey School of Business project is a landmark in modern educational construction, merging cut | YES — repeated across imported templates | NOT ESTABLISHED | Foreign/demo context; no verified Malaysian project details | LIKELY_THEME_DEMO |

## Exact and near-duplicate decisions

The 14 exact-duplicate route records form seven pairs. Backlink/search evidence is unavailable, so every risk entry remains UNKNOWN.

| Route A | Route B | Stronger canonical | Recommendation |
| --- | --- | --- | --- |
| /category/interior-design/ | /tag/ceiling-works/ | /category/interior-design/ | Tag merges by 301; category remains noindex pending archive review. |
| /category/servis-pembersihan/ | /tag/kuala-lumpur/ | /category/servis-pembersihan/ | Tag merges by 301; category remains noindex pending archive review. |
| /category/technical-guides/ | /tag/wiring/ | /category/technical-guides/ | Tag merges by 301; category remains noindex pending archive review. |
| /home-10/ | /home-10-one-page/ | none | Both are imported theme demos; both proposed 410. |
| /home-5/ | /home-5-one-page/ | none | Both are imported theme demos; both proposed 410. |
| /home-8/ | /home-8-onepage/ | none | Both are imported theme demos; both proposed 410. |
| /home-9/ | /home-9-one-page/ | none | Both are imported theme demos; both proposed 410. |

The 19 portfolio pages are also near-duplicates of `/portfolio/the-ivey-school-of-business/`; that page is a demo reference, not a canonical to preserve. One-page demo variants are near-duplicates of their numbered demo home counterparts. All remain proposed 410.

## Category, tag, archive and pagination review

The Phase 1 generated set contains 41 category/archive-style routes, including ecommerce products/archives. The reconciled universe adds 7 existing portfolio-taxonomy 404s, producing 48 reviewed archive-style URLs. Thin taxonomies are kept noindex temporarily, exact tag/category duplicates merge to the stronger category, blog pagination merges into `/blog/`, imported service taxonomies merge to `/services/`, and ecommerce archives are removed.

| Route | Linked articles | Unique content | Current robots | Action | Index recommendation |
| --- | --- | --- | --- | --- | --- |
| `/blog/page/2/` | 5 | MEDIUM | noindex, nofollow, max-image-preview:large | MERGE_AND_301_REDIRECT | 301 redirect |
| `/blog/page/3/` | 5 | MEDIUM | noindex, nofollow, max-image-preview:large | MERGE_AND_301_REDIRECT | 301 redirect |
| `/blog/page/4/` | 3 | MEDIUM | noindex, nofollow, max-image-preview:large | MERGE_AND_301_REDIRECT | 301 redirect |
| `/category/commercial/` | 2 | MEDIUM | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/category/hvac-guides/` | 3 | MEDIUM | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/category/interior-design/` | 1 | EXACT_DUPLICATE | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/category/maintenance/` | 4 | MEDIUM | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/category/renovation/` | 3 | MEDIUM | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/category/servis-pembersihan/` | 1 | EXACT_DUPLICATE | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/category/technical-guides/` | 1 | EXACT_DUPLICATE | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/portfolio/commercial/` | 0 | LOW | noindex | EXISTING_404_LEAVE_GONE | remain 404 |
| `/portfolio/electrical/` | 0 | LOW | noindex | EXISTING_404_LEAVE_GONE | remain 404 |
| `/portfolio/home-renovation/` | 0 | LOW | noindex | EXISTING_404_LEAVE_GONE | remain 404 |
| `/portfolio/office-renovation/` | 0 | LOW | noindex | EXISTING_404_LEAVE_GONE | remain 404 |
| `/portfolio/residential/` | 0 | LOW | noindex | EXISTING_404_LEAVE_GONE | remain 404 |
| `/portfolio/stadium/` | 0 | LOW | noindex | EXISTING_404_LEAVE_GONE | remain 404 |
| `/portfolio/waterproofing/` | 0 | LOW | noindex | EXISTING_404_LEAVE_GONE | remain 404 |
| `/product-category/repair-expand/` | 0 | LOW | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/product/blackdecker-circular-saw/` | 0 | LOW | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/product/bosch-js470e-7-0-amp-jigsaw/` | 0 | MEDIUM | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/product/cutting-circular-saw/` | 0 | MEDIUM | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/product/dewalt-dwe575sb-circular-saw/` | 0 | LOW | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/product/festool-hk-circular-saw/` | 0 | LOW | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/product/makita-5007mg-magnesium-circular-saw/` | 0 | LOW | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/product/metabo-hpt-ripmax-pro-circular-saw/` | 0 | LOW | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/product/milwaukee-fuel-circular-saw/` | 0 | LOW | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/product/ryobi-p505-18v-circular-saw/` | 0 | LOW | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/product/skil-5280-01-circular-saw/` | 0 | LOW | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/product/vacuum-cleaner/` | 0 | LOW | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/product/worx-compact-circular-saw/` | 0 | LOW | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/service-category/building-architecture/` | 0 | LOW | max-image-preview:large | MERGE_AND_301_REDIRECT | 301 redirect |
| `/service-category/building-renovation/` | 0 | LOW | max-image-preview:large | MERGE_AND_301_REDIRECT | 301 redirect |
| `/service-category/flooring-roofing/` | 0 | LOW | max-image-preview:large | MERGE_AND_301_REDIRECT | 301 redirect |
| `/service-category/general-constracting/` | 0 | LOW | max-image-preview:large | MERGE_AND_301_REDIRECT | 301 redirect |
| `/service-category/interior-design/` | 0 | LOW | max-image-preview:large | MERGE_AND_301_REDIRECT | 301 redirect |
| `/service-category/repair-expand/` | 0 | LOW | max-image-preview:large | MERGE_AND_301_REDIRECT | 301 redirect |
| `/shop/` | 0 | MEDIUM | max-image-preview:large | REMOVE_AND_410 | gone (410) |
| `/tag/aircond-maintenance/` | 1 | LOW | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/tag/ceiling-works/` | 1 | EXACT_DUPLICATE | max-image-preview:large | MERGE_AND_301_REDIRECT | 301 redirect |
| `/tag/cleaning/` | 1 | LOW | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/tag/guide/` | 1 | LOW | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/tag/interior-finishing/` | 2 | MEDIUM | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/tag/kuala-lumpur/` | 1 | EXACT_DUPLICATE | max-image-preview:large | MERGE_AND_301_REDIRECT | 301 redirect |
| `/tag/office-fit-out/` | 1 | LOW | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/tag/pemasangan-aircond/` | 1 | LOW | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/tag/waterproofing/` | 2 | MEDIUM | max-image-preview:large | KEEP_NOINDEX_TEMPORARILY | noindex,follow |
| `/tag/wiring/` | 1 | EXACT_DUPLICATE | max-image-preview:large | MERGE_AND_301_REDIRECT | 301 redirect |
| `/wishlist/` | 0 | LOW | max-image-preview:large | REMOVE_AND_410 | gone (410) |

## Image dependency review

15 routes remain blocked by hotlinked or missing images. A read-only archive listing check found no matching backup media for these blocked dependencies; the seven known broken deep-cleaning filenames are references only. No random replacements are proposed. Owner-supplied project photography is required where no verified local source exists.

| Route | Hotlinked sources | Missing sources | Backup evidence | Local replacement | Owner input |
| --- | --- | --- | --- | --- | --- |
| `/commercial-retail-shop-renovation-in-kuala-lumpur/` | https://rkrenosolution.com/wp-content/uploads/2026/01/Commercial-retail-shop-renovation-in-Kuala-Lumpur-showing-custom-display-shelving.jpeg?q=80&w=1000&auto=format&fit=crop | none | NO MATCH IN ARCHIVE LISTING | NONE | Evidence for business claims; Verified original images/project photos |
| `/home-renovation-contractor-in-subang-jaya/` | https://rkrenosolution.com/wp-content/uploads/2026/01/Home-renovation-contractor-in-subang-jaya-modern-living-room-makeover-usj.jpeg?q=80&w=1000&auto=format&fit=crop | none | NO MATCH IN ARCHIVE LISTING | NONE | Evidence for business claims; Verified original images/project photos |
| `/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/` | https://rkrenosolution.com/wp-content/uploads/2026/01/Completed-modern-house-renovation-in-Kuala-Lumpur-featuring-a-renovated-living-area.jpeg<br>https://rkrenosolution.com/wp-content/uploads/2026/01/Completed-modern-house-renovation-in-Kuala-Lumpur-featuring-a-renovated-living-area.jpeg<br>https://rkrenosolution.com/wp-content/uploads/2026/01/Quality-craftsmanship-in-house-renovation-in-Kuala-Lumpur-showing-detailed-kitchen-finishing-work.jpeg | none | NO MATCH IN ARCHIVE LISTING | NONE | Verified original images/project photos |
| `/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/` | https://rkrenosolution.com/wp-content/uploads/2026/01/House-Renovation-in-Selangor-modern-terrace-extension-and-interior-remodeling-project.jpeg?q=80&w=1000&auto=format&fit=crop<br>https://rkrenosolution.com/wp-content/uploads/2026/01/Quality-House-Renovation-in-Selangor-featuring-wet-works-and-tiling-installation.jpeg?q=80&w=1000&auto=format&fit=crop | none | NO MATCH IN ARCHIVE LISTING | NONE | Evidence for business claims; Verified original images/project photos |
| `/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/` | https://rkrenosolution.com/wp-content/uploads/2026/01/Modern-Office-Renovation-in-Kuala-Lumpur-featuring-open-plan-layout-and-glass-partitions.jpeg?q=80&w=1000&auto=format&fit=crop | none | NO MATCH IN ARCHIVE LISTING | NONE | Verified original images/project photos |
| `/office-renovation-in-kuala-lumpur/` | https://rkrenosolution.com/wp-content/uploads/2026/01/Modern-Office-Renovation-in-Kuala-Lumpur-featuring-open-plan-layout-and-glass-partitions.jpeg<br>https://rkrenosolution.com/wp-content/uploads/2026/01/Modern-Office-Renovation-in-Kuala-Lumpur-featuring-open-plan-layout-and-glass-partitions.jpeg<br>https://rkrenosolution.com/wp-content/uploads/2026/01/Detailed-Office-Renovation-in-Kuala-Lumpur-showing-carpet-flooring-and-workstation-setup.jpeg | none | NO MATCH IN ARCHIVE LISTING | NONE | Verified original images/project photos |
| `/office-renovation-petaling-jaya-corporate-fit-out-experts/` | https://rkrenosolution.com/wp-content/uploads/2026/01/Office-renovation-petaling-jaya-corporate-fit-out-experts.jpeg?q=80&w=1000&auto=format&fit=crop | none | NO MATCH IN ARCHIVE LISTING | NONE | Evidence for business claims; Verified original images/project photos |
| `/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/` | none | deep-cleaning-rumah-kuala-lumpur.webp<br>cuci-bilik-air-rumah-kl.webp<br>pakej-cuci-rumah-hari-raya.webp<br>cucian-selepas-renovasi-rumah.webp<br>cuci-dapur-rumah-berminyak.webp<br>cuci-habuk-plaster-ceiling.webp<br>servis-aircond-dan-cuci-rumah.webp | NO MATCH IN ARCHIVE LISTING | NONE | Verified original images/project photos |
| `/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/` | https://rkrenosolution.com/wp-content/uploads/2026/01/Plaster-Ceiling-Contractor-KL-installing-modern-L-box-gypsum-ceiling-with-cove-lighting-in-living-room.jpeg?q=80&w=1000&auto=format&fit=crop | none | NO MATCH IN ARCHIVE LISTING | NONE | Verified original images/project photos |
| `/plaster-ceiling-contractor-kl/` | https://rkrenosolution.com/wp-content/uploads/2026/01/Plaster-Ceiling-Contractor-KL-installing-modern-L-box-gypsum-ceiling-with-cove-lighting-in-living-room.jpeg?q=80&w=600&auto=format&fit=crop<br>https://rkrenosolution.com/wp-content/uploads/2026/01/Modern-flat-plaster-ceiling-design-kuala-lumpur-minimalist.jpeg?q=80&w=600&auto=format&fit=crop<br>https://rkrenosolution.com/wp-content/uploads/2026/01/Elegant-cornice-and-plaster-ceiling-installation-kl.jpeg?q=80&w=600&auto=format&fit=crop | none | NO MATCH IN ARCHIVE LISTING | NONE | Evidence for business claims; Verified original images/project photos |
| `/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/` | https://rkrenosolution.com/wp-content/uploads/2026/01/PU-injection-waterproofing-KL-technician-sealing-wall-cracks.jpeg?q=80&w=1000&auto=format&fit=crop | none | NO MATCH IN ARCHIVE LISTING | NONE | Evidence for business claims; Verified original images/project photos |
| `/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/` | https://rkrenosolution.com/wp-content/uploads/2026/01/Servis-Aircond-Murah-KL-technician-cleaning-wall-mounted-unit-filter.jpeg?q=80&w=1000&auto=format&fit=crop | none | NO MATCH IN ARCHIVE LISTING | NONE | Evidence for business claims; Verified original images/project photos |
| `/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/` | https://rkrenosolution.com/wp-content/uploads/2026/01/Professional-Servis-Cuci-Rumah-KL-team-performing-deep-cleaning-in-living-room.jpeg?q=80&w=1000&auto=format&fit=crop | none | NO MATCH IN ARCHIVE LISTING | NONE | Evidence for business claims; Verified original images/project photos |
| `/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/` | https://rkrenosolution.com/wp-content/uploads/2026/01/Waterproofing-Contractor-Kuala-Lumpur-technician-inspecting-ceiling-leak-for-PU-injection-repair.jpeg?q=80&w=1000&auto=format&fit=crop | none | NO MATCH IN ARCHIVE LISTING | NONE | Evidence for business claims; Verified original images/project photos |
| `/waterproofing-contractor-kuala-lumpur/` | https://rkrenosolution.com/wp-content/uploads/2026/01/Waterproofing-Contractor-Kuala-Lumpur-technician-inspecting-ceiling-leak-for-PU-injection-repair.jpeg?q=80&w=1000&auto=format&fit=crop | none | NO MATCH IN ARCHIVE LISTING | NONE | Evidence for business claims; Verified original images/project photos |

## Existing production 404 review

| Broken URL | Internal links | Sitemap | Recommendation | Destination/reason |
| --- | --- | --- | --- | --- |
| `/6-ways-to-get-the-most-out-of-your-project-search-software` | 1 | NO | EXISTING_404_LEAVE_GONE | Unrelated legacy software article has no intent-matched RK Reno replacement. |
| `/portfolio/commercial/` | 128 | YES — portfolio-category-sitemap | EXISTING_404_LEAVE_GONE | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/portfolio/electrical/` | 44 | YES — portfolio-category-sitemap | EXISTING_404_LEAVE_GONE | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/portfolio/home-renovation/` | 78 | YES — portfolio-category-sitemap | EXISTING_404_LEAVE_GONE | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/portfolio/office-renovation/` | 107 | YES — portfolio-category-sitemap | EXISTING_404_LEAVE_GONE | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/portfolio/residential/` | 27 | YES — portfolio-category-sitemap | EXISTING_404_LEAVE_GONE | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/portfolio/stadium/` | 58 | YES — portfolio-category-sitemap | EXISTING_404_LEAVE_GONE | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/portfolio/waterproofing/` | 61 | YES — portfolio-category-sitemap | EXISTING_404_LEAVE_GONE | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/services/%20https:/rkrenosolution.com/about-us/` | 6 | NO | EXISTING_404_REPAIR | /about-us/ |

## Existing redirect-map reconciliation

| Source | Existing target | Proposed action | Proposed destination | Outcome |
| --- | --- | --- | --- | --- |
| `/about/` | `/about-us/` | MERGE_AND_301_REDIRECT | /about-us/ | Legacy alias has a direct equivalent canonical About page. |
| `/6-ways-to-get-the-most-out-of-your-project-search-software` | `/blog/` | EXISTING_404_LEAVE_GONE | none | Unrelated legacy software article has no intent-matched RK Reno replacement. |
| `/portfolio/commercial/` | `/our-projects/` | EXISTING_404_LEAVE_GONE | none | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/portfolio/electrical/` | `/our-projects/` | EXISTING_404_LEAVE_GONE | none | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/portfolio/home-renovation/` | `/our-projects/` | EXISTING_404_LEAVE_GONE | none | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/portfolio/office-renovation/` | `/our-projects/` | EXISTING_404_LEAVE_GONE | none | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/portfolio/residential/` | `/our-projects/` | EXISTING_404_LEAVE_GONE | none | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/portfolio/stadium/` | `/our-projects/` | EXISTING_404_LEAVE_GONE | none | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/portfolio/waterproofing/` | `/our-projects/` | EXISTING_404_LEAVE_GONE | none | Remove remaining internal references; the portfolio destination is unverified theme-demo content. Linked unique article count: 0; unique introduction not established. |
| `/home-2/` | `/home-2-2/` | REMOVE_AND_410 | none | Theme-demo alias/asset is not a public RK Reno content page. |

## Authenticity and unverified-claim review

- Claim records: 147
- OWNER_CONFIRMATION_REQUIRED: 34
- IMPORTED_DEMO_CONTENT: 113
- No claim is marked verified.
- Imported indicators include Vastcon, Vinceta, Vincent Pham/P., Ivey School, Alten, ECOM Group, Ecomposer, lorem ipsum, Sydney, Melbourne, Australia, Bay Area references, foreign contact details and dollar-denominated demo budgets.
- See [unverified-claims-register.csv](unverified-claims-register.csv) for route-level evidence and recommended action.

## Routes with possible search or backlink risk

Search/backlink risk cannot be quantified without Search Console and backlink exports. These 89 removal, merge or broken routes are currently in a sitemap or receive internal links and therefore require redirect/internal-link QA before implementation:

| Route | Action | Internal links | Sitemap | Backlink risk |
| --- | --- | --- | --- | --- |
| `/6-ways-to-get-the-most-out-of-your-project-search-software` | EXISTING_404_LEAVE_GONE | 1 | NO | UNKNOWN — no Search Console or backlink export available |
| `/about/` | MERGE_AND_301_REDIRECT | 7 | NO | UNKNOWN — no Search Console or backlink export available |
| `/blog-full-width/` | REMOVE_AND_410 | 4 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/blog-grid/` | REMOVE_AND_410 | 4 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/blog/page/2/` | MERGE_AND_301_REDIRECT | 4 | NO | UNKNOWN — no Search Console or backlink export available |
| `/blog/page/3/` | MERGE_AND_301_REDIRECT | 4 | NO | UNKNOWN — no Search Console or backlink export available |
| `/blog/page/4/` | MERGE_AND_301_REDIRECT | 4 | NO | UNKNOWN — no Search Console or backlink export available |
| `/career/` | REMOVE_AND_410 | 11 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/feedback-error/` | REMOVE_AND_410 | 0 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-1-one-page/` | REMOVE_AND_410 | 17 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-1/` | REMOVE_AND_410 | 16 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-10-one-page/` | REMOVE_AND_410 | 1 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-10/` | REMOVE_AND_410 | 3 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-2-2/` | REMOVE_AND_410 | 8 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-2-one-page/` | REMOVE_AND_410 | 9 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-2/` | REMOVE_AND_410 | 3 | NO | UNKNOWN — no Search Console or backlink export available |
| `/home-3-one-page/` | REMOVE_AND_410 | 7 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-3/` | REMOVE_AND_410 | 9 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-4-one-page/` | REMOVE_AND_410 | 8 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-4/` | REMOVE_AND_410 | 10 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-5-one-page/` | REMOVE_AND_410 | 1 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-5/` | REMOVE_AND_410 | 3 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-6-one-page/` | REMOVE_AND_410 | 25 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-6/` | REMOVE_AND_410 | 27 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-7-one-page/` | REMOVE_AND_410 | 4 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-8-onepage/` | REMOVE_AND_410 | 2 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-8/` | REMOVE_AND_410 | 4 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-9-one-page/` | REMOVE_AND_410 | 2 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/home-9/` | REMOVE_AND_410 | 4 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/landing-page/` | REMOVE_AND_410 | 1 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/axis-industrial-park/` | REMOVE_AND_410 | 46 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/building-a-sustainable-tomorrow/` | REMOVE_AND_410 | 34 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/building-excellence-through-innovation/` | REMOVE_AND_410 | 45 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/commercial/` | EXISTING_404_LEAVE_GONE | 128 | YES — portfolio-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/crafting-landmark-construction-projects/` | REMOVE_AND_410 | 65 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/cutting-edge-strategies-for-building-success/` | REMOVE_AND_410 | 28 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/designing-the-future-of-urban-spaces/` | REMOVE_AND_410 | 22 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/electrical/` | EXISTING_404_LEAVE_GONE | 44 | YES — portfolio-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/expert-solutions-for-modern-structures/` | REMOVE_AND_410 | 39 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/home-renovation/` | EXISTING_404_LEAVE_GONE | 78 | YES — portfolio-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/innovating-the-next-generation-of-architecture/` | REMOVE_AND_410 | 45 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/innovative-approaches-to-construction-excellence/` | REMOVE_AND_410 | 30 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/innovative-construction-project-showcase/` | REMOVE_AND_410 | 48 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/mastering-construction-with-precision/` | REMOVE_AND_410 | 60 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/oakwood-residence/` | REMOVE_AND_410 | 46 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/office-renovation/` | EXISTING_404_LEAVE_GONE | 107 | YES — portfolio-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/pioneering-solutions-for-architectural-excellence/` | REMOVE_AND_410 | 28 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/precision-craftsmanship-in-construction/` | REMOVE_AND_410 | 39 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/residential/` | EXISTING_404_LEAVE_GONE | 27 | YES — portfolio-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/revolutionary-techniques-in-modern-construction/` | REMOVE_AND_410 | 28 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/shaping-tomorrows-built-environment/` | REMOVE_AND_410 | 30 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/skyline-hub/` | REMOVE_AND_410 | 45 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/stadium/` | EXISTING_404_LEAVE_GONE | 58 | YES — portfolio-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/the-ivey-school-of-business/` | REMOVE_AND_410 | 48 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/transforming-designs-into-reality/` | REMOVE_AND_410 | 81 | YES — portfolio-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/portfolio/waterproofing/` | EXISTING_404_LEAVE_GONE | 61 | YES — portfolio-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/pricing-plan/` | REMOVE_AND_410 | 14 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product-category/repair-expand/` | REMOVE_AND_410 | 1 | YES — product_cat-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product/blackdecker-circular-saw/` | REMOVE_AND_410 | 1 | YES — product-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product/bosch-js470e-7-0-amp-jigsaw/` | REMOVE_AND_410 | 1 | YES — product-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product/cutting-circular-saw/` | REMOVE_AND_410 | 1 | YES — product-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product/dewalt-dwe575sb-circular-saw/` | REMOVE_AND_410 | 1 | YES — product-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product/festool-hk-circular-saw/` | REMOVE_AND_410 | 1 | YES — product-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product/makita-5007mg-magnesium-circular-saw/` | REMOVE_AND_410 | 1 | YES — product-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product/metabo-hpt-ripmax-pro-circular-saw/` | REMOVE_AND_410 | 1 | YES — product-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product/milwaukee-fuel-circular-saw/` | REMOVE_AND_410 | 1 | YES — product-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product/ryobi-p505-18v-circular-saw/` | REMOVE_AND_410 | 1 | YES — product-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product/skil-5280-01-circular-saw/` | REMOVE_AND_410 | 1 | YES — product-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product/vacuum-cleaner/` | REMOVE_AND_410 | 1 | YES — product-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/product/worx-compact-circular-saw/` | REMOVE_AND_410 | 1 | YES — product-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/sample-page/` | REMOVE_AND_410 | 0 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/service-category/building-architecture/` | MERGE_AND_301_REDIRECT | 0 | YES — service-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/service-category/building-renovation/` | MERGE_AND_301_REDIRECT | 0 | YES — service-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/service-category/flooring-roofing/` | MERGE_AND_301_REDIRECT | 0 | YES — service-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/service-category/general-constracting/` | MERGE_AND_301_REDIRECT | 0 | YES — service-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/service-category/interior-design/` | MERGE_AND_301_REDIRECT | 0 | YES — service-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/service-category/repair-expand/` | MERGE_AND_301_REDIRECT | 0 | YES — service-category-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/service/architecture-design/` | MERGE_AND_301_REDIRECT | 36 | YES — service-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/service/building-construction/` | MERGE_AND_301_REDIRECT | 36 | YES — service-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/service/flooring-roofing/` | MERGE_AND_301_REDIRECT | 36 | YES — service-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/service/general-contracting/` | MERGE_AND_301_REDIRECT | 36 | YES — service-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/service/repair-expand/` | MERGE_AND_301_REDIRECT | 70 | YES — service-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/services/%20https:/rkrenosolution.com/about-us/` | EXISTING_404_REPAIR | 6 | NO | UNKNOWN — no Search Console or backlink export available |
| `/shop/` | REMOVE_AND_410 | 28 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/tag/ceiling-works/` | MERGE_AND_301_REDIRECT | 2 | YES — post_tag-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/tag/kuala-lumpur/` | MERGE_AND_301_REDIRECT | 2 | YES — post_tag-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/tag/wiring/` | MERGE_AND_301_REDIRECT | 2 | YES — post_tag-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/team-detail/` | REMOVE_AND_410 | 46 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |
| `/wishlist/` | REMOVE_AND_410 | 1 | YES — page-sitemap | UNKNOWN — no Search Console or backlink export available |

## Proposed first implementation batch

After owner approval, begin with the shared design system and the existing Batch 1 pages only: Homepage, Services, About, Contact, Main Renovation, Aircond Servicing, Aircond Installation KL, Aircond Installation Selangor, Aircond Price Guide and Electrical Services. Before redesign, remove or replace unsupported claims on those pages using owner evidence; do not implement any 410/301 proposal until the disposition plan is approved.

## Phase 2 validation statement

- Every generated route appears once.
- All nine known production 404 URLs appear once.
- All redirect-map entries are reconciled.
- Export-only Cart, Checkout and My Account are included.
- Every row has exactly one allowed proposed action.
- Every redirect/repair has a destination.
- No 410 has a destination.
- No owner-decision route is approved.
- No claim is marked verified.
- No portfolio is marked as a verified RK Reno project.
- Counts in this report are generated from the CSV records.
