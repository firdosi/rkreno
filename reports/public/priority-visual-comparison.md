# RK Reno priority-page visual comparison

Compared on 23 July 2026 with headless Chromium at 1440×1000, 768×1024 and 390×844. Production was loaded directly from `https://rkrenosolution.com/`; the Astro build was loaded with the GitHub Pages `/rkreno/` base path. Full screenshots and side-by-side contact sheets are saved locally under `.audit-cache/visual-comparison/`.

| Page | Visual/content result | Remaining difference |
| --- | --- | --- |
| Homepage | Restored the production Elementor layout, real logo, hero image, headings, buttons, service sections and responsive ordering. | WordPress motion/carousel behaviour is static; the staging warning adds intentional height. |
| Main services | Restored the production title banner, intro, cards, renovation image, section order and responsive columns. | WordPress animation effects are omitted. |
| Aircond servicing | Restored the page-specific blue/orange layout, title banner, cards, pricing highlights, CTA and mobile stacking. | Interactive accordion behaviour is presented as static content. |
| Aircond installation Kuala Lumpur | Restored the production hero, technician image, pricing badges, cards, CTA and responsive layout. | WordPress entrance animations are omitted. |
| Aircond installation Selangor | Restored the production hero, technician image, service cards, price summary and responsive layout. | WordPress entrance animations are omitted. |
| Aircond price guide | Restored the article title banner, price guide layout, cards, CTA and mobile flow. | WordPress article sidebar/widgets are not interactive. |
| Main renovation | Restored the production theme layout, title banner, service navigation, images, lists and responsive columns. | WordPress animation effects are omitted. |
| House renovation Kuala Lumpur | Restored the production dark-blue hero, headings, service sections, CTA and mobile stacking. | WordPress entrance animations are omitted. |
| House renovation Selangor | Restored the production dark-blue hero, headings, service sections, CTA and mobile stacking. | WordPress entrance animations are omitted. |
| Electrical services | Restored the production blue/orange layout, statistics, content cards, CTA and responsive flow. | Interactive accordion behaviour is presented as static content. |

## Validation summary

- All ten pages returned HTTP 200 in production and Astro checks at desktop, tablet and mobile sizes.
- SEO titles, descriptions, production canonical URLs and schema counts match.
- Staging remains `noindex, nofollow`.
- First H1 text matches production on all ten pages.
- All tested staging internal URLs retain the `/rkreno/` base path.
- No horizontal overflow or broken priority-page images were detected.
- The mobile menu opened successfully in automated tests; the Astro menu exposed 14 navigation links.
- The fixed Call and WhatsApp actions are present and usable.
- Production also has blank alt attributes on decorative/theme images. The retained counts are homepage 3, services 6 and main renovation 1; priority service landing pages have none.
- No dedicated demolition-services page was created because none exists in the production sitemap/export. It remains a possible future SEO page.

## Unsupported WordPress-only behaviour

- Elementor entrance animations, carousels and accordion scripting are represented as accessible static content.
- WordPress search, cart, comments and server-side form handlers are not part of the static staging site.
- The Astro enquiry form opens the visitor's email application; it does not store or submit data to a server.
