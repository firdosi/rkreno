# Prompt 1.1 truthful baseline

Source snapshot date: 2026-07-29T19:14:13.744Z

- Mirrored WordPress routes: 47
- Semantic MATCH routes: 0
- Semantic DIFFERENCE routes: 47
- Visual FAIL routes: 47
- Visual NOT_TESTED routes: 0
- Interaction DIFFERENCE routes: 47
- SOURCE_ASSET_MISSING routes: 0
- NEW_PAGE routes: 1

## Difference groups

- Header differences: 47
- Footer differences: 47
- Homepage differences: `/`
- Core-page differences: `/`, `/services/`, `/about-us/`, `/contact-us/`, `/faq/`, `/blog/`
- Service differences: `/services/`, `/servis-aircond-murah-kl/`, `/aircond-installation-kl/`, `/upah-pasang-aircond-selangor/`, `/service/building-renovation/`, `/electrical-services-selangor/`, `/house-renovation-in-kuala-lumpur/`, `/house-renovation-in-selangor/`, `/home-renovation-contractor-in-subang-jaya/`, `/office-renovation-in-kuala-lumpur/`, `/waterproofing-contractor-kuala-lumpur/`, `/plaster-ceiling-contractor-kl/`, `/servis-cuci-rumah-kl/`
- Article differences: `/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/`, `/commercial-retail-shop-renovation-in-kuala-lumpur/`, `/office-renovation-petaling-jaya-corporate-fit-out-experts/`, `/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/`, `/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/`, `/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/`, `/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/`, `/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/`, `/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/`, `/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/`, `/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/`, `/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/`, `/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/`, `/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/`
- Archive differences: `/category/commercial/`, `/category/hvac-guides/`, `/category/maintenance/`, `/category/renovation/`, `/category/servis-pembersihan/`, `/category/technical-guides/`, `/tag/interior-finishing/`, `/tag/office-fit-out/`, `/tag/waterproofing/`
- Restored-page differences: `/company-history/`, `/our-projects-2/`, `/our-projects/`, `/our-team/`, `/testimonials/`

## Validation limitations

- A route remains DIFFERENCE when visual or interaction behavior has not been tested.
- Pixel comparisons use a zero-difference PASS rule; no tolerance converts a visible difference into PASS.
- SOURCE_ASSET_MISSING is reserved for the seven documented cleaning images and is not assigned while other differences remain.
- The source snapshot is local evidence under `.audit-cache/` and is intentionally ignored by Git.

## Work remaining

- Prompt 1.2: shared design system, header, navigation, footer, spacing, typography and reusable animations.
- Prompts 1.3 through 3.3: page groups, services, articles, archives and restored pages.
- Prompts 4.1 through 4.3: responsive repair, final SEO/content/interaction validation and repository approval.

This is a measurement baseline, not a website-completion statement.
