# Search Console verification continuity

## Evidence inspected

- Current live HTML across all 42 retained routes: no `google-site-verification` meta value found.
- Current live homepage: Google tag `GT-T944JBVZ` is loaded by Site Kit; this analytics tag is not itself a Search Console verification token.
- WordPress backup HTML/PHP/text/config material: no verification meta value or Google verification HTML file found.
- Repository public root: no Google verification HTML file found.
- Current public DNS TXT lookup: no Google Search Console verification token was returned.

## Preservation status

No safe verification value is available to copy, so none was invented. The production code retains support for a future validated `PUBLIC_GOOGLE_SITE_VERIFICATION` meta value, while GitHub Pages emits no verification tag. The known Google tag `GT-T944JBVZ` and GA4 measurement ID `G-NVEL66185G` are recorded in an inactive configuration example and do not load on staging.

## Launch requirement

The owner's logged-in Search Console property and its active verification method must be checked before cutover. If the property uses Site Kit/OAuth or DNS verification, preserve that verified method during migration; if it uses an HTML tag/file, obtain the exact existing value from Search Console and test it without creating a new property or changing DNS in this phase.
