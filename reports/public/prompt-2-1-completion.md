# Prompt 2.1 completion

## Result

All 12 requested routes were compared against the current live WordPress pages at 1440×1000,
768×1024 and 390×844, corrected, and recaptured with identical browser settings. Raw captures remain
under `.audit-cache/prompt-2-1/`; only the four requested side-by-side contact sheets are committed.

Corrected routes:

- `/`
- `/services/`
- `/about-us/`
- `/contact-us/`
- `/faq/`
- `/blog/`
- `/servis-aircond-murah-kl/`
- `/aircond-installation-kl/`
- `/upah-pasang-aircond-selangor/`
- `/service/building-renovation/`
- `/house-renovation-in-kuala-lumpur/`
- `/house-renovation-in-selangor/`

## Main corrections

- Services now follows the live centered introduction, three-value row, wide renovation image,
  compact primary-service links and dark guide-card section instead of an oversized directory.
- About now follows the WordPress image-led order and restores the exact safe Who We Are, Mission,
  Core Values, renovation introduction, approach and area text. Rao Israr is identified only as the
  operator; no registration details were added.
- Contact now uses the live dark split and matching field arrangement. The staging form remains
  visually present but every control is disabled.
- FAQ now uses the compact WordPress accordion and orange question CTA while retaining the nine
  approved safe entries.
- Blog now uses the WordPress list/sidebar pattern while retaining all 14 required cards, images,
  dates, categories, excerpts and topic links.
- Building Renovation now restores the relevant sidebar, image-led scope, service list, process and
  FAQ structure without imported Vastcon business content.
- Aircond Installation KL and Selangor now use the exact localized WordPress technician image.
- Shared title casing, spacing, desktop/tablet/mobile stacking, navigation, footer and floating
  contact presentation were corrected without changing SEO fields.

## Images

Exact localized WordPress images used include the aircond technician installation photograph, page
title background, Services renovation image, About/service-area images, Contact visual, FAQ
illustration, and all 14 retained Blog card images.

Substitutions remain where the current source itself fails:

- Two Servis Aircond Murah KL photographs: approved owner aircond media.
- Kuala Lumpur house-renovation living-area and kitchen photographs: closest local neutral
  renovation images.
- Selangor terrace and tiling photographs: closest local neutral renovation images.
- Building Renovation demo imagery: relevant local construction images, because imported demo
  projects cannot safely be presented as RK Reno work.

No substitute is described as an RK Reno completed project.

## Restored content and unavoidable differences

The correction restores the visible section families, safe source wording, service descriptions,
price presentation, process layouts, FAQ presentation, contact fields, article list/sidebar, service
links and calls to action. Remaining differences are limited to:

- static Astro cards in place of Elementor carousel motion;
- intentionally disabled staging form controls;
- all 14 Blog posts shown together instead of WordPress pagination;
- broken/unavailable live source images listed above; and
- imported demo claims, unsupported counters, warranties, foreign contacts, fake staff/projects and
  Vastcon content that remain excluded.

## Validation and deployment

- Production and GitHub Pages builds: 43 HTML files.
- Full Stage 1: 42/42 retained routes plus custom 404 pass.
- Production sitemap: unchanged at 32 indexable URLs.
- Nine production taxonomy archives remain `noindex, follow` and outside the sitemap.
- Thank-you remains `noindex, nofollow` and outside the sitemap.
- GitHub Pages remains `noindex, nofollow`, disallow-all, analytics-free and form-disabled.
- All 72 final live/Astro route-and-viewport captures passed status, image, H1, overflow and console
  checks on the Astro side.
- Blog retains 14 cards and nine archive links; FAQ retains nine safe accordions.
- Internal links, images, metadata, canonicals, Open Graph data, JSON-LD, mobile menu, FAQ
  interaction, accessibility basics and private-file checks pass.
- `npm audit --audit-level=high`: zero vulnerabilities.
- GitHub Pages workflow result and skipped VPS workflow are linked in the final handoff.

No VPS preview/deployment, DNS, WordPress, Hostinger, analytics, advertising tracking, production
form or production cutover change was made.
