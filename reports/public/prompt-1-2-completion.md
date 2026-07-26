# Prompt 1.2 completion — exact WordPress service pages

Completed locally on 26 July 2026 from the current rendered WordPress routes, route-specific WordPress parity extraction, localized media, and existing full-page WordPress screenshots. The six Prompt 1.1 core pages were preserved.

## Completed routes and source restoration

| Route | Route-specific source and restored structure | Images |
|---|---|---|
| `/servis-aircond-murah-kl/` | Live WordPress + parity extraction: Malay introduction, price table, service packages, four-step workflow, broader aircond services, FAQ and quote CTA. | Approved owner aircond image. |
| `/aircond-installation-kl/` | Live WordPress + parity extraction: installation options, cost factors, base prices, work images, four-step process, KL areas, seven FAQs and quote CTA. | Approved owner indoor, trunking and condenser images. |
| `/upah-pasang-aircond-selangor/` | Live WordPress + parity extraction: Malay installation options, extra-cost factors, base prices, work images, process, Selangor areas, seven FAQs and quote CTA. | Approved owner indoor, trunking and condenser images. |
| `/service/building-renovation/` | Live route + screenshot + backup parity: old service-layout hero, renovation introduction, commercial/interior/structural/exterior scope, process, consultation and maintenance content. | Closest localized neutral renovation image. |
| `/electrical-services-selangor/` | Live WordPress + parity extraction: service introduction, inspection/wiring/repair/upgrade scope, property types, process, quotation factors and FAQs. | Local neutral electrical/construction-planning image. |
| `/house-renovation-in-kuala-lumpur/` | Live WordPress + parity extraction: service types, six published starting-price cards, quotation factors, work examples, process, KL areas, FAQs and CTA. | Local neutral renovation images in the original content positions. |
| `/house-renovation-in-selangor/` | Live WordPress + parity extraction: property/room scope, six published starting-price cards, price factors, examples, process, Selangor areas, FAQs and CTA. | Local neutral property and renovation images. |
| `/home-renovation-contractor-in-subang-jaya/` | Live WordPress + parity extraction: introduction, published cost table, renovation scope, planning/process content and page-specific FAQs. | Local neutral renovation-planning image. |
| `/office-renovation-in-kuala-lumpur/` | Live WordPress + parity extraction: fit-out services, three published pricing cards, quotation factors, business scope, building rules, examples, process, areas, FAQs and CTA. | Local neutral office renovation images. |
| `/waterproofing-contractor-kuala-lumpur/` | Live WordPress + parity extraction: leakage treatment introduction, published cost table, methods, inspection/repair sequence, limitations and FAQs. | Local neutral bathroom/waterproofing image. |
| `/plaster-ceiling-contractor-kl/` | Live WordPress + parity extraction: introduction, published cost table, ceiling services, design options, process, lighting coordination and FAQs. | Local neutral plaster-ceiling image. |
| `/servis-cuci-rumah-kl/` | Live WordPress + parity extraction: original Malay introduction, service scope, deep/post-renovation cleaning distinctions, preparation/process content, package cards and FAQs. | Local neutral kitchen and cleaning images. |

All pages use the Prompt 1.1 header, navigation, page-title banner, buttons, CTA/footer, and floating actions. Three page-specific visual families remain visible: detailed modern services, legacy service pages, and the older building-renovation service layout.

## Source gaps, substitutions and exclusions

- The building-renovation route's recoverable content is an imported Vastcon demo page. Its visible route-relevant renovation structure was retained, but demo contact details, careers, unrelated help prompts, credentials and demo FAQs were not restored because no genuine RK Reno page-specific source exists for them.
- Broken or non-local WordPress imagery was replaced only with the closest already-localized neutral image. Neutral images are labelled as scope illustrations and are not presented as completed RK Reno projects.
- The approved owner aircond WebP derivatives remain in the aircond routes. No held or rejected owner media is published.
- Imported or unsupported counters, ratings, testimonials, certification/licensing claims, emergency/24-hour claims, warranty durations and guarantees were excluded. This follows the owner's locked instruction not to invent a warranty or guarantee and not to restore unrelated demo claims.

## Published pricing and numerical wording retained

- Aircond servicing: normal service RM60–RM80, chemical wash RM120–RM150, gas top-up RM50–RM120, inspection/troubleshooting RM50–RM80.
- Aircond installation: RM220 for 1.0/1.5HP and RM280 for 2.0/2.5HP, with 5 feet of copper pipe and 5 feet of wiring in the base installation.
- House renovation: painting from RM400/room, tile labour from RM6/sq ft, bathroom refresh from RM3,000, basic bathroom renovation from RM6,000, basic home/condo refresh from RM8,000, and basic kitchen renovation from RM15,000.
- Subang Jaya estimates: living-room makeover RM4,000–RM12,000, kitchen extension RM15,000–RM35,000+, and bathroom remodelling RM6,000–RM15,000.
- Office renovation: light refresh from RM30/sq ft, basic fit-out from RM50/sq ft, and reinstatement from RM20/sq ft.
- Waterproofing: PU injection RM150–RM300/point, no-hack bathroom treatment RM800–RM1,500/room, and torch-on membrane RM15–RM25/sq ft.
- Plaster ceiling: flat ceiling RM3.50–RM6.00/sq ft, L-box RM15–RM25/foot run, light trough RM18–RM28/foot run, cornice RM5–RM12/foot run, and access panel RM80–RM150/unit.
- Cleaning: the published RM300–RM400 example for a 1,000 sq ft move-in deep clean.

All amounts remain described as base, starting or estimated figures where WordPress did so. Site scope, measurements, access, extra materials and quotation conditions remain visible. The retained numerical service wording also includes the WordPress 3–5 week indicative kitchen-extension period, 4–6 hour deep-cleaning session with a 2–3 person team, 3–4 month ordinary aircond-cleaning suggestion, and typical 4–6 inch plaster-ceiling drop. No claim was expanded to another route.

## Internal links and SEO continuity

Natural links were retained or restored among aircond installation KL, Selangor installation, aircond servicing, the aircond price guide, renovation routes, office renovation, electrical services, waterproofing, plaster ceiling, cleaning, contact and relevant retained guides. Removed demo, WooCommerce, project, team and testimonial destinations were not linked.

Every route retains its trailing-slash URL, production canonical, existing title and meta description, one H1, Open Graph fields, local image alt text, sitemap inclusion, Service schema and visible-content-matched FAQPage schema where FAQs exist. GitHub Pages remains `noindex, nofollow`, robots disallow-all, analytics-free and form-disabled.

## Validation

- Production and GitHub Pages builds: 43 pages built successfully.
- All 12 service-route metadata, canonical, H1, image, schema, pricing and staging-privacy checks passed.
- Desktop 1440 px, tablet 768 px and mobile 390 px: 36 captures passed with no broken images, overflow or browser-console errors.
- Mobile navigation and service FAQ interactions passed.
- Six Prompt 1.1 core routes passed regression checks; the blog still has 14 cards, the FAQ has nine accordions, and the contact form remains disabled.
- All 43 built HTML files passed local-link checks. Deployment verification and accessibility basics passed.
- Dependency audit: zero vulnerabilities.

## Remaining for Prompt 1.3

Prompt 1.3 can address the next explicitly assigned route group only. Production activation, analytics, forms, WordPress changes, DNS, Hostinger, VPS deployment and cutover remain out of scope.
