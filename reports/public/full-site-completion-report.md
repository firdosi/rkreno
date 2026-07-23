# RK Reno full-site completion audit

## Phase 3 Batch 2 update — 24 July 2026

Twelve additional approved routes now use native structured Astro templates for renovation
locations, office/commercial work, waterproofing, plaster ceiling, FAQ, blog archive and
articles. Batch 1 and Batch 2 now complete 22 of 47 approved staging content routes (46.8%).
See the [Batch 2 completion report](batch-2-completion-report.md).

## Phase 3 Batch 1 update — 24 July 2026

The approved ten-page Batch 1 is complete in native Astro components: Homepage, Services,
About, Contact, Main Renovation, Aircond Servicing, Aircond Installation KL, Aircond
Installation Selangor, Aircond Price Guide and Electrical Services. All ten have desktop,
tablet and mobile Playwright evidence, sanitized schema, local images, responsive layouts
and no published unsupported claims identified by the Phase 2 register.

The 89 routes approved for removal, merge/redirect or owner-decision exclusion are no
longer generated on GitHub Pages. Because GitHub Pages cannot return true 301 or 410
responses, the final status rules remain documented for future VPS activation. See the
[Batch 1 completion report](batch-1-completion-report.md) and
[visual contact sheets](visuals/batch-1/).

The historical Phase 1 findings below are retained as the baseline for routes outside
Batch 1; they should not be read as the current status of the ten completed pages.

Generated: 2026-07-23T18:38:39.764Z

## Scope and acceptance warning

This Phase 1 audit inventories all 130 generated public routes. It does **not** claim the site is complete. Only the 10 prior priority routes have three-viewport evidence; every other route remains visually unreviewed. No route is marked FULLY APPROVED.

## Headline findings

- Generated routes audited: 130
- Production HTTP 200 responses: 130
- GitHub Pages HTTP 200 responses: 130
- Page-specific/custom layouts: 10
- Generic legacy-content layouts: 120
- Three-viewport priority reviews available: 10
- WooCommerce/product routes requiring a disposition decision: 15
- Demo/implementation routes requiring a disposition decision: 24
- Legacy portfolio/project routes without an approved template: 19
- Routes with exact duplicate content: 14
- Routes blocked by missing or hotlinked images: 15
- Legal routes found: 0 (privacy/terms/cookie coverage is missing)
- FULLY APPROVED routes: 0

## Final-status totals

- NEEDS REDESIGN: 77
- TECHNICALLY COMPLETE: 7
- NEEDS CONTENT: 31
- NEEDS IMAGES: 15

## Reusable-template classification

- About page: 5
- Aircond service landing pages: 3
- Blog/article pages: 15
- Category/archive pages: 41
- Cleaning pages: 1
- Contact page: 1
- Electrical service pages: 1
- Homepage: 1
- Main renovation page: 1
- Main services page: 1
- Office and commercial renovation pages: 1
- Plaster ceiling pages: 1
- Renovation service landing pages: 8
- Utility and 404 pages: 49
- Waterproofing pages: 1

## Interpretation

TECHNICALLY COMPLETE means prior automated and visual evidence exists, but it is not owner approval. NEEDS REDESIGN identifies generic, demo, ecommerce, archive, article, or service output that still needs an appropriate reusable layout. NEEDS CONTENT and NEEDS IMAGES take precedence when the audit found a clearer blocking deficiency. The requested template list has no portfolio/project template, so those 19 legacy routes are provisionally classified as utility routes and flagged for a Phase 2 decision.

## Route register

| Route | Classification | Current layout | Final status | Problems found |
| --- | --- | --- | --- | --- |
| `/` | homepage / Homepage | BaseLayout + restored WordPress theme layout | NEEDS REDESIGN | Raw WordPress/Elementor/WooCommerce markup indicators remain; 3 images have missing or blank alt text |
| `/about-us/` | page / About page | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 8 images have missing or blank alt text |
| `/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 1 images have missing or blank alt text |
| `/aircond-installation-kl/` | page / Aircond service landing pages | BaseLayout + page-specific custom layout | TECHNICALLY COMPLETE | No automated issue; full visual/content review still required |
| `/blog-full-width/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 6 images have missing or blank alt text |
| `/blog-grid/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 6 images have missing or blank alt text |
| `/blog/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 4 images have missing or blank alt text; Missing meta description |
| `/blog/page/2/` | page / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 4 images have missing or blank alt text; Missing meta description |
| `/blog/page/3/` | page / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 4 images have missing or blank alt text; Missing meta description |
| `/blog/page/4/` | page / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 2 images have missing or blank alt text; Missing meta description |
| `/career/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed |
| `/category/commercial/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 2 images have missing or blank alt text; Missing meta description |
| `/category/hvac-guides/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 3 images have missing or blank alt text; Missing meta description |
| `/category/interior-design/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (254 normalized characters); 1 images have missing or blank alt text; Exact content duplicate of /tag/ceiling-works/; Missing meta description |
| `/category/maintenance/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 4 images have missing or blank alt text; Missing meta description |
| `/category/renovation/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 3 images have missing or blank alt text; Missing meta description |
| `/category/servis-pembersihan/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (235 normalized characters); 1 images have missing or blank alt text; Exact content duplicate of /tag/kuala-lumpur/; Missing meta description |
| `/category/technical-guides/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (267 normalized characters); 1 images have missing or blank alt text; Exact content duplicate of /tag/wiring/; Missing meta description |
| `/commercial-retail-shop-renovation-in-kuala-lumpur/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 1 WordPress image hotlinks remain; 1 images have missing or blank alt text |
| `/company-history/` | page / About page | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed |
| `/contact-us/` | page / Contact page | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 2 images have missing or blank alt text |
| `/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 1 images have missing or blank alt text |
| `/electrical-services-selangor/` | page / Electrical service pages | BaseLayout + page-specific custom layout | TECHNICALLY COMPLETE | No automated issue; full visual/content review still required |
| `/faq/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 1 images have missing or blank alt text |
| `/feedback-error/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (130 normalized characters) |
| `/home-1-one-page/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 26 images have missing or blank alt text |
| `/home-1/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 26 images have missing or blank alt text |
| `/home-10-one-page/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 10 images have missing or blank alt text; Exact content duplicate of /home-10/ |
| `/home-10/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 10 images have missing or blank alt text; Exact content duplicate of /home-10-one-page/ |
| `/home-2-2/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 14 images have missing or blank alt text |
| `/home-2-one-page/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 13 images have missing or blank alt text |
| `/home-3-one-page/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 4 images have missing or blank alt text |
| `/home-3/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 4 images have missing or blank alt text |
| `/home-4-one-page/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 10 images have missing or blank alt text |
| `/home-4/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 10 images have missing or blank alt text |
| `/home-5-one-page/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 5 images have missing or blank alt text; Exact content duplicate of /home-5/ |
| `/home-5/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 5 images have missing or blank alt text; Exact content duplicate of /home-5-one-page/ |
| `/home-6-one-page/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 13 images have missing or blank alt text |
| `/home-6/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 13 images have missing or blank alt text |
| `/home-7-one-page/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 14 images have missing or blank alt text |
| `/home-8-onepage/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 10 images have missing or blank alt text; Exact content duplicate of /home-8/ |
| `/home-8/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 10 images have missing or blank alt text; Exact content duplicate of /home-8-onepage/ |
| `/home-9-one-page/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 17 images have missing or blank alt text; Exact content duplicate of /home-9/ |
| `/home-9/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 17 images have missing or blank alt text; Exact content duplicate of /home-9-one-page/ |
| `/home-renovation-contractor-in-subang-jaya/` | page / Renovation service landing pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 1 WordPress image hotlinks remain |
| `/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; Raw WordPress/Elementor/WooCommerce markup indicators remain; 3 WordPress image hotlinks remain; 1 images have missing or blank alt text |
| `/house-renovation-in-kuala-lumpur/` | page / Renovation service landing pages | BaseLayout + page-specific custom layout | TECHNICALLY COMPLETE | No automated issue; full visual/content review still required |
| `/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 2 WordPress image hotlinks remain; 1 images have missing or blank alt text |
| `/house-renovation-in-selangor/` | page / Renovation service landing pages | BaseLayout + page-specific custom layout | TECHNICALLY COMPLETE | No automated issue; full visual/content review still required |
| `/landing-page/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; Raw WordPress/Elementor/WooCommerce markup indicators remain; 48 images have missing or blank alt text |
| `/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 1 WordPress image hotlinks remain; 1 images have missing or blank alt text |
| `/office-renovation-in-kuala-lumpur/` | page / Office and commercial renovation pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; Raw WordPress/Elementor/WooCommerce markup indicators remain; 3 WordPress image hotlinks remain |
| `/office-renovation-petaling-jaya-corporate-fit-out-experts/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 1 WordPress image hotlinks remain; 1 images have missing or blank alt text |
| `/our-projects-2/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 6 images have missing or blank alt text |
| `/our-projects/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 6 images have missing or blank alt text |
| `/our-team/` | page / About page | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 14 images have missing or blank alt text |
| `/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 7 known source images unavailable; 1 images have missing or blank alt text |
| `/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 1 WordPress image hotlinks remain; 1 images have missing or blank alt text |
| `/plaster-ceiling-contractor-kl/` | page / Plaster ceiling pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 3 WordPress image hotlinks remain |
| `/portfolio/axis-industrial-park/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/building-a-sustainable-tomorrow/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/building-excellence-through-innovation/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/crafting-landmark-construction-projects/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/cutting-edge-strategies-for-building-success/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/designing-the-future-of-urban-spaces/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/expert-solutions-for-modern-structures/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/innovating-the-next-generation-of-architecture/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/innovative-approaches-to-construction-excellence/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/innovative-construction-project-showcase/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/mastering-construction-with-precision/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/oakwood-residence/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/pioneering-solutions-for-architectural-excellence/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/precision-craftsmanship-in-construction/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/revolutionary-techniques-in-modern-construction/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/shaping-tomorrows-built-environment/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/skyline-hub/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/the-ivey-school-of-business/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/portfolio/transforming-designs-into-reality/` | portfolio / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 7 images have missing or blank alt text |
| `/pricing-plan/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route; 6 images have missing or blank alt text |
| `/product-category/repair-expand/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Thin content (211 normalized characters); Missing meta description |
| `/product/blackdecker-circular-saw/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Thin content (221 normalized characters) |
| `/product/bosch-js470e-7-0-amp-jigsaw/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress |
| `/product/cutting-circular-saw/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress |
| `/product/dewalt-dwe575sb-circular-saw/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Thin content (227 normalized characters) |
| `/product/festool-hk-circular-saw/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Thin content (217 normalized characters) |
| `/product/makita-5007mg-magnesium-circular-saw/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Thin content (243 normalized characters) |
| `/product/metabo-hpt-ripmax-pro-circular-saw/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Thin content (239 normalized characters) |
| `/product/milwaukee-fuel-circular-saw/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Thin content (225 normalized characters) |
| `/product/ryobi-p505-18v-circular-saw/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Thin content (225 normalized characters) |
| `/product/skil-5280-01-circular-saw/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Thin content (221 normalized characters) |
| `/product/vacuum-cleaner/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Thin content (199 normalized characters) |
| `/product/worx-compact-circular-saw/` | product / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Thin content (221 normalized characters) |
| `/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 1 WordPress image hotlinks remain; 1 images have missing or blank alt text |
| `/sample-page/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; WordPress demo or implementation route |
| `/service-category/building-architecture/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (166 normalized characters); 2 images have missing or blank alt text; Missing meta description |
| `/service-category/building-renovation/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (153 normalized characters); 2 images have missing or blank alt text; Missing meta description |
| `/service-category/flooring-roofing/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (168 normalized characters); 2 images have missing or blank alt text; Missing meta description |
| `/service-category/general-constracting/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (175 normalized characters); 2 images have missing or blank alt text; Missing meta description |
| `/service-category/interior-design/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (176 normalized characters); 2 images have missing or blank alt text; Missing meta description |
| `/service-category/repair-expand/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (172 normalized characters); 2 images have missing or blank alt text; Missing meta description |
| `/service/architecture-design/` | service / Renovation service landing pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 1 images have missing or blank alt text |
| `/service/building-construction/` | service / Renovation service landing pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 1 images have missing or blank alt text |
| `/service/building-renovation/` | service / Main renovation page | BaseLayout + restored WordPress theme layout | NEEDS REDESIGN | Raw WordPress/Elementor/WooCommerce markup indicators remain; 1 images have missing or blank alt text |
| `/service/flooring-roofing/` | service / Renovation service landing pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 1 images have missing or blank alt text |
| `/service/general-contracting/` | service / Renovation service landing pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 1 images have missing or blank alt text |
| `/service/repair-expand/` | service / Renovation service landing pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 1 images have missing or blank alt text |
| `/services/` | page / Main services page | BaseLayout + restored WordPress theme layout | NEEDS REDESIGN | Raw WordPress/Elementor/WooCommerce markup indicators remain; 6 images have missing or blank alt text |
| `/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 1 WordPress image hotlinks remain; 1 images have missing or blank alt text |
| `/servis-aircond-murah-kl/` | page / Aircond service landing pages | BaseLayout + page-specific custom layout | TECHNICALLY COMPLETE | No automated issue; full visual/content review still required |
| `/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 1 WordPress image hotlinks remain; 1 images have missing or blank alt text |
| `/servis-cuci-rumah-kl/` | page / Cleaning pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed |
| `/shop/` | page / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Missing meta description |
| `/tag/aircond-maintenance/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (228 normalized characters); 1 images have missing or blank alt text; Missing meta description |
| `/tag/ceiling-works/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (254 normalized characters); 1 images have missing or blank alt text; Exact content duplicate of /category/interior-design/; Missing meta description |
| `/tag/cleaning/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (227 normalized characters); 1 images have missing or blank alt text; Missing meta description |
| `/tag/guide/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (242 normalized characters); 1 images have missing or blank alt text; Missing meta description |
| `/tag/interior-finishing/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 2 images have missing or blank alt text; Missing meta description |
| `/tag/kuala-lumpur/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (235 normalized characters); 1 images have missing or blank alt text; Exact content duplicate of /category/servis-pembersihan/; Missing meta description |
| `/tag/office-fit-out/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (253 normalized characters); 1 images have missing or blank alt text; Missing meta description |
| `/tag/pemasangan-aircond/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (241 normalized characters); 1 images have missing or blank alt text; Missing meta description |
| `/tag/waterproofing/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 2 images have missing or blank alt text; Missing meta description |
| `/tag/wiring/` | taxonomy / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (267 normalized characters); 1 images have missing or blank alt text; Exact content duplicate of /category/technical-guides/; Missing meta description |
| `/team-detail/` | page / About page | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 1 images have missing or blank alt text |
| `/testimonials/` | page / About page | BaseLayout + generic legacy-content renderer | NEEDS REDESIGN | Generic legacy-content layout; page-specific design not reviewed; 6 images have missing or blank alt text |
| `/thank-you/` | page / Utility and 404 pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Thin content (112 normalized characters) |
| `/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/` | post / Blog/article pages | BaseLayout + page-specific custom layout | TECHNICALLY COMPLETE | No automated issue; full visual/content review still required |
| `/upah-pasang-aircond-selangor/` | page / Aircond service landing pages | BaseLayout + page-specific custom layout | TECHNICALLY COMPLETE | No automated issue; full visual/content review still required |
| `/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/` | post / Blog/article pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 1 WordPress image hotlinks remain; 1 images have missing or blank alt text |
| `/waterproofing-contractor-kuala-lumpur/` | page / Waterproofing pages | BaseLayout + generic legacy-content renderer | NEEDS IMAGES | Generic legacy-content layout; page-specific design not reviewed; 1 WordPress image hotlinks remain |
| `/wishlist/` | page / Category/archive pages | BaseLayout + generic legacy-content renderer | NEEDS CONTENT | Generic legacy-content layout; page-specific design not reviewed; Irrelevant WooCommerce/shop route retained from WordPress; Thin content (80 normalized characters) |
