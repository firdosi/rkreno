# WordPress-to-Astro Parity Report

## Scope

- Retained routes reviewed: **42**
- Full-page baseline captures: **252** (WordPress and Astro, desktop/tablet/mobile)
- Full-page after captures: **126**
- Baseline manifest hash: `f8ce01c0c9cc6dee69b59c53d170715dec9c93b4b0965b106885532569d9a7b2`

## Final status

- CLOSE_PARITY_WITH_SAFE_DIFFERENCES: **42**

## Restored parity

The native Astro implementation restores the WordPress blue/orange visual language, Roboto/Maven typography, contact bar, navigation hierarchy, page-title treatment, service lead sections, long-form service/article content, cards, tables, FAQ roles, contact form layout, archive imagery, CTA placement and multi-column footer. Useful retained internal links and genuine service wording are preserved.

## Intentional safe differences

- Approved owner-supplied aircond imagery remains in place instead of older neutral WordPress imagery.
- Unsupported counters, testimonials, exact pricing, ratings, warranties, guarantees and credentials are not restored.
- Elementor/plugin markup, ecommerce, comments, newsletter sales copy and repeated invalid footer H1 content remain excluded.
- GitHub Pages forms stay disabled; analytics and production lead events are not activated.
- Taxonomy archives remain `noindex, follow` and outside the sitemap.
- Broken or unavailable WordPress imagery uses the closest approved local neutral image, without completed-project claims.

Detailed route evidence is in `wordpress-parity-status.csv` and `wordpress-parity-differences.csv`. Compact visual evidence is under `reports/public/visuals/wordpress-parity/`.

## Phase 7 revalidation

All 42 retained routes were rechecked after the exhaustive 145-URL coverage audit. The Astro side
was freshly rendered at 1440, 768 and 390 pixels for **126/126 successful captures**. Each complete
page was reviewed for section order, important headings, service information, useful tables/FAQs,
contact details, CTA purpose, image placement, internal links, URL, canonical, robots and search
intent. The controlled browser was blocked from freshly downloading WordPress XML and automated
full-page screenshots, so the already-captured full WordPress baselines were cross-checked against
the current live rendered crawl, current metadata snapshot, and 23 July 2026 WordPress/AIOSEO/XML/
Elementor exports. WordPress remained unchanged.

The refreshed compact sheets are the `phase7-*.png` files in
`reports/public/visuals/wordpress-parity/`. No unsafe genuine-content difference remains.
