# WordPress-to-Astro Parity Report

## Scope

- Retained routes reviewed: **42**
- Full-page baseline captures: **252** (WordPress and Astro, desktop/tablet/mobile)
- Full-page after captures: **252**
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
