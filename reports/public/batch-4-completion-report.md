# Phase 3 Batch 4 completion report

Generated: 2026-07-24

## Final review of all 14 taxonomy routes

| Route | Final action | Future destination |
|---|---|---|
| `/category/commercial/` | KEEP_NOINDEX_NATIVE | — |
| `/category/hvac-guides/` | KEEP_NOINDEX_NATIVE | — |
| `/category/interior-design/` | MERGE_AND_301_LATER | `/tag/interior-finishing/` |
| `/category/maintenance/` | KEEP_NOINDEX_NATIVE | — |
| `/category/renovation/` | KEEP_NOINDEX_NATIVE | — |
| `/category/servis-pembersihan/` | KEEP_NOINDEX_NATIVE | — |
| `/category/technical-guides/` | KEEP_NOINDEX_NATIVE | — |
| `/tag/aircond-maintenance/` | MERGE_AND_301_LATER | `/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/` |
| `/tag/cleaning/` | MERGE_AND_301_LATER | `/category/servis-pembersihan/` |
| `/tag/guide/` | MERGE_AND_301_LATER | `/blog/` |
| `/tag/interior-finishing/` | KEEP_NOINDEX_NATIVE | — |
| `/tag/office-fit-out/` | KEEP_NOINDEX_NATIVE | — |
| `/tag/pemasangan-aircond/` | MERGE_AND_301_LATER | `/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/` |
| `/tag/waterproofing/` | KEEP_NOINDEX_NATIVE | — |

## Native archives and article membership

| Native noindex archive | Articles | Retained article routes |
|---|---:|---|
| `/category/commercial/` | 3 | `/commercial-retail-shop-renovation-in-kuala-lumpur/`<br>`/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/`<br>`/office-renovation-petaling-jaya-corporate-fit-out-experts/` |
| `/category/hvac-guides/` | 3 | `/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/`<br>`/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/`<br>`/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/` |
| `/category/maintenance/` | 5 | `/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/`<br>`/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/`<br>`/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/`<br>`/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/`<br>`/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/` |
| `/category/renovation/` | 3 | `/commercial-retail-shop-renovation-in-kuala-lumpur/`<br>`/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/`<br>`/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/` |
| `/category/servis-pembersihan/` | 2 | `/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/`<br>`/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/` |
| `/category/technical-guides/` | 6 | `/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/`<br>`/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/`<br>`/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/`<br>`/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/`<br>`/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/`<br>`/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/` |
| `/tag/interior-finishing/` | 2 | `/commercial-retail-shop-renovation-in-kuala-lumpur/`<br>`/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/` |
| `/tag/office-fit-out/` | 2 | `/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/`<br>`/office-renovation-petaling-jaya-corporate-fit-out-experts/` |
| `/tag/waterproofing/` | 2 | `/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/`<br>`/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/` |

Nine archives were retained with unique introductions, local article imagery, relevant service
CTAs and CollectionPage schema. Five duplicate or one-item routes were omitted from staging and
documented for future server-side 301 redirects. No route was proposed for 410 and no route requires
an owner decision.

## Duplicate decisions

- Interior Design merges into the clearer Interior Finishing archive.
- Aircond Maintenance and Pemasangan Aircond merge directly into their matching retained guides.
- Cleaning merges into the broader two-article Servis Pembersihan category.
- The generic Guide tag merges into the main Blog archive.

## Indexing, sitemap and links

All nine native taxonomy pages use `noindex, follow`, self-referencing production canonicals and
remain outside the sitemap. The five retired routes are not generated and have no internal links.
The main Blog and all 14 retained articles remain in the sitemap. The final sitemap contains
**32 URLs**. Future Nginx rules are documented but remain inactive on GitHub Pages.

## Validation

Production and GitHub staging builds, built links, taxonomy membership, duplicate memberships,
sitemap, robots, canonicals, CollectionPage schema, local images, alt text, overflow,
accessibility basics, mobile navigation, retired-link scans, claims checks, private-file checks and
dependency audit passed.

## Completion

- Native Batch 4 archives completed: **9**
- Final retained content/utility routes: **42**
- Routes merged: **5**
- Routes proposed for 410: **0**
- Routes requiring owner decision in Batch 4: **0**
- Completion: **42 of 42 (100.0%)**

## Remaining production blockers

Legal pages, production form-service configuration, analytics decisions and production cutover
remain outside this batch. Existing owner-decision routes remain excluded. Verified project
photography is still unavailable for several content pages, and all documented 301/410 rules remain
inactive until a separately approved VPS deployment.

## Visual evidence

- [Desktop contact sheet](visuals/batch-4/batch-4-desktop-contact-sheet.png)
- [Tablet contact sheet](visuals/batch-4/batch-4-tablet-contact-sheet.png)
- [Mobile contact sheet](visuals/batch-4/batch-4-mobile-contact-sheet.png)
