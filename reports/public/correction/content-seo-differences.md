# Content and SEO differences

- Live WordPress SEO matched the stored crawl on all 32 source routes.
- 11 stored bodies differed from the normalized live body recorded by the content lock: /, /services/, /contact-us/, /servis-aircond-murah-kl/, /aircond-installation-kl/, /upah-pasang-aircond-selangor/, /upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/, /service/building-renovation/, /electrical-services-selangor/, /house-renovation-in-kuala-lumpur/, /house-renovation-in-selangor/.
- The six core routes are manually composed from approved business content; raw DOM order, duplicate responsive fragments, demo-theme wording, fake testimonials and broken form strings are intentionally excluded.
- Service-detail and article content remains rendered through the locked block engine.
- Staging robots remain `noindex, nofollow`; this is a documented safety exclusion from the live WordPress robots value.
- The demolition route remains classified `NEW_PAGE`.
