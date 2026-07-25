# Production configuration discovery

Status: **DISCOVERY COMPLETE — owner facts integrated; launch-time verification and secrets remain**

Reviewed on 25 July 2026. Sources were the public WordPress pages and browser-loaded source, public
`robots.txt` and sitemap, the ignored WordPress XML/SQL/server archives, the AIOSEO and Elementor
exports, and the local Astro/form implementation. Raw backups, credentials, tokens and enquiry data
remain ignored and are not reproduced here.

## Confirmed public production facts

- Canonical origin: `https://rkrenosolution.com` with post-name permalinks and trailing slashes.
- Public brand: RK Reno Solution.
- Legal operator: Rao Israr, described as the operator rather than a registered company. No
  business registration number applies based on the supplied facts.
- Public contact: `rkrenosolution@gmail.com`, `+60 11 1133 4496`, and
  `4-2, Jalan 3/50C, Setapak, 53000 Kuala Lumpur`.
- WordPress currently loads Google tag `GT-T944JBVZ`; the connected GA4 measurement identifier in
  the backup is `G-NVEL66185G`. Owner access is confirmed; verify the exact logged-in property
  immediately before launch.
- Site Kit was connected to the URL-prefix Search Console property
  `https://rkrenosolution.com/`; owner access is confirmed, but the logged-in property still needs
  launch-time verification.
- No GTM container, Meta Pixel, Bing verification or Microsoft Clarity identifier was found.
- AIOSEO supplies canonicals, robots, Open Graph, schema and the production sitemap index.
- WordPress `robots.txt` allows public crawling, blocks WordPress/WooCommerce private paths, and
  references `sitemap.xml` and `sitemap.rss`.
- Contact Form 7 form `9854` is rendered on the homepage. Its field types/labels contain inherited
  template mismatches and it relies on the WordPress admin email. No reusable SMTP configuration
  was verified. The owner confirmed email-only delivery with no CRM, purpose-based retention and an
  internal annual review; Cloudflare Turnstile is recommended for the future production form.
- `.htaccess` contains LiteSpeed cache rules and standard WordPress front-controller rewrites. No
  business redirect set was found there.
- Installed backup plugins included AIOSEO, Elementor, Google Site Kit, Contact Form 7, LiteSpeed,
  Hostinger tools and WooCommerce. Plugin presence does not prove that every integration is active.

## Analytics and verification register

| Identifier | Where found | Loaded on WordPress | In backup | Platform | Ownership | Migration action |
|---|---|---:|---:|---|---|---|
| `GT-T944JBVZ` | Live script and Site Kit settings | Yes | Yes | Google tag | Access confirmed | Verify logged-in property and consent; preserve for production only |
| `G-NVEL66185G` | Site Kit GA4 settings | Via the Google tag destination | Yes | GA4 | Access confirmed | Use the existing destination; do not create a duplicate property |
| URL-prefix property | Site Kit settings | Not applicable | Yes | Search Console | Access confirmed | Verify logged-in property and preserve ownership |
| GTM | No identifier found | No | No | Google Tag Manager | Not applicable | Do not introduce |
| Meta Pixel | No identifier found | No | No | Meta | Not applicable | Do not introduce |
| Bing verification | No value found | No | No | Bing Webmaster Tools | Not applicable | Do not add |
| Microsoft Clarity | No project ID found | No | No | Microsoft Clarity | Not applicable | Do not introduce |

## Production recommendation

Keep analytics disabled on GitHub Pages. At a separately approved production cutover, enable only the
verified existing Google tag after consent requirements and the logged-in property are confirmed. Configure
`whatsapp_click`, `phone_click`, and server-confirmed `generate_lead`; never emit `generate_lead`
after a failed form request or a direct visit to `/thank-you/`.

The detailed, row-by-row record is in `production-configuration-register.csv`.
