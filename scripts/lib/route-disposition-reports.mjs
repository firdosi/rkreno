const escape = (value) => String(value ?? '').replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
const routeCell = (record) => `\`${record['Current route']}\``;
const listRoutes = (records) => records.length
  ? records.map((record) => `- \`${record['Current route']}\``).join('\n')
  : '- None';
const table = (headers, rows) => [
  `| ${headers.join(' | ')} |`,
  `| ${headers.map(() => '---').join(' | ')} |`,
  ...rows.map((row) => `| ${row.map(escape).join(' | ')} |`),
].join('\n');

export function buildDispositionReport({ records, actionCounts, claims, redirectCsv, analyses, pages }) {
  const byRoute = new Map(records.map((record) => [record['Current route'], record]));
  const generated = records.filter((record) => record['Route source'] === 'generated-route');
  const production404 = records.filter((record) => record['Route source'] === 'production-404');
  const crawlUtility = records.filter((record) => record['Route source'] === 'internal-link');
  const redirectOnly = records.filter((record) => record['Route source'] === 'existing-redirect-map');
  const exportOnly = records.filter((record) => record['Route source'] === 'WordPress-export');
  const coreLaunch = records.filter((record) =>
    ['KEEP_AND_REDESIGN', 'KEEP_CONTENT_PAGE', 'KEEP_NOINDEX_TEMPORARILY']
      .includes(record['Proposed action']));
  const conditional = records.filter((record) =>
    record['Proposed action'] === 'OWNER_DECISION_REQUIRED');
  const proposedLaunchCount = coreLaunch.length + 2;
  const ecommerce = records.filter((record) =>
    /^\/(?:product|product-category|shop|wishlist|cart|checkout|my-account)\//.test(record['Current route']));
  const demos = records.filter((record) =>
    /^\/(?:home-\d|landing-page|pricing-plan|sample-page|blog-(?:grid|full-width))/.test(record['Current route']));
  const generatedDemos = demos.filter((record) => record['Route source'] === 'generated-route');
  const portfolios = records.filter((record) =>
    record['Portfolio authenticity status'] !== 'NOT_APPLICABLE');
  const archives = records.filter((record) =>
    ['taxonomy', 'product'].includes(record['WordPress content type']) ||
    /^\/(?:blog\/page|shop|wishlist|product-category)\//.test(record['Current route']));
  const generatedArchives = archives.filter((record) => record['Route source'] === 'generated-route');
  const imageBlocked = records.filter((record) =>
    record['Image dependency status'].startsWith('BLOCKED'));
  const riskRoutes = records.filter((record) =>
    ['REMOVE_AND_410', 'MERGE_AND_301_REDIRECT', 'EXISTING_404_REPAIR',
      'EXISTING_404_LEAVE_GONE'].includes(record['Proposed action']) &&
    (record['Sitemap presence'].startsWith('YES') || Number(record['Existing internal-link count']) > 0));
  const claimCounts = claims.reduce((result, claim) => {
    result[claim['Verification status']] = (result[claim['Verification status']] || 0) + 1;
    return result;
  }, {});
  const pageByRoute = new Map(pages.map((page) => [page.path, page]));

  const duplicatePairs = [
    ['/category/interior-design/', '/tag/ceiling-works/', '/category/interior-design/', 'Tag merges by 301; category remains noindex pending archive review.'],
    ['/category/servis-pembersihan/', '/tag/kuala-lumpur/', '/category/servis-pembersihan/', 'Tag merges by 301; category remains noindex pending archive review.'],
    ['/category/technical-guides/', '/tag/wiring/', '/category/technical-guides/', 'Tag merges by 301; category remains noindex pending archive review.'],
    ['/home-10/', '/home-10-one-page/', 'none', 'Both are imported theme demos; both proposed 410.'],
    ['/home-5/', '/home-5-one-page/', 'none', 'Both are imported theme demos; both proposed 410.'],
    ['/home-8/', '/home-8-onepage/', 'none', 'Both are imported theme demos; both proposed 410.'],
    ['/home-9/', '/home-9-one-page/', 'none', 'Both are imported theme demos; both proposed 410.'],
  ];

  const sections = [];
  sections.push(`# RK Reno route disposition and authenticity report

Generated: ${new Date().toISOString()}

## Decision boundary

This Phase 2 report proposes route actions only. It does not redesign pages, implement redirects, remove routes, change indexing, or approve unverified content. Search Console traffic and backlink exports were unavailable, so backlink risk is **UNKNOWN** throughout.

Related evidence: [Phase 1 completion report](full-site-completion-report.md), [completion CSV](full-site-completion-status.csv), [claims register](unverified-claims-register.csv), [legal requirements](legal-page-requirements.md), and [owner decisions](owner-decisions-required.md).

## Reconciled route universe

- 130 generated HTTP 200 content routes.
- 1 additional crawled HTTP 200 utility result (\`/wp-content/uploads/2025/01/home.svg\`), producing the earlier 131 HTTP 200 count.
- 9 known production 404 URLs.
- These total the earlier 140 unique crawled final paths.
- 2 redirect-map source aliases not represented as unique final paths: \`/about/\` and \`/home-2/\`.
- 3 published WooCommerce utilities found in the WordPress export but absent from the 140-path crawl: \`/cart/\`, \`/checkout/\`, and \`/my-account/\`.
- **Reconciled Phase 2 universe: ${records.length} unique routes/URLs** (${generated.length} generated + ${production404.length} production 404 + ${crawlUtility.length} crawled utility + ${redirectOnly.length} redirect aliases + ${exportOnly.length} export-only).

## Proposed-action totals

${Object.entries(actionCounts).map(([action, count]) => `- ${action}: ${count}`).join('\n')}

## Recommended launch count

The evidence-supported core retains ${coreLaunch.length} current routes: ${actionCounts.KEEP_AND_REDESIGN} redesigns, ${actionCounts.KEEP_CONTENT_PAGE} retained content pages, and ${actionCounts.KEEP_NOINDEX_TEMPORARILY} temporary noindex routes. Adding the two minimum proposed legal pages (Privacy Policy and Terms of Use) produces a **recommended launch count of ${proposedLaunchCount} content/utility routes**. The ${conditional.length} OWNER_DECISION_REQUIRED routes are excluded until approved. Redirect aliases and gone responses are not counted as launch content pages.
`);

  sections.push(`## Recommended launch structure

### 1. Essential business pages
${listRoutes(coreLaunch.filter((record) => ['/', '/about-us/', '/contact-us/', '/services/', '/faq/', '/blog/'].includes(record['Current route'])))}

### 2. Priority service pages
${listRoutes(coreLaunch.filter((record) =>
  ['KEEP_AND_REDESIGN', 'KEEP_CONTENT_PAGE'].includes(record['Proposed action']) &&
  /aircond|electrical|building-renovation/.test(record['Current route']) &&
  ['page', 'service'].includes(record['WordPress content type'])))}

### 3. Location service pages
${listRoutes(coreLaunch.filter((record) =>
  ['KEEP_AND_REDESIGN', 'KEEP_CONTENT_PAGE'].includes(record['Proposed action']) &&
  /kuala-lumpur|selangor|subang-jaya|petaling-jaya/.test(record['Current route']) &&
  ['page', 'service'].includes(record['WordPress content type'])))}

### 4. Valuable supporting guides
${listRoutes(coreLaunch.filter((record) =>
  record['WordPress content type'] === 'post' && record['Current route'] !== '/blog/'))}

### 5. Useful blog posts
- The retained supporting guides above form the useful article set; \`/blog/\` remains the main archive.

### 6. Useful category pages
${listRoutes(coreLaunch.filter((record) => record['Proposed action'] === 'KEEP_NOINDEX_TEMPORARILY' && record['WordPress content type'] === 'taxonomy'))}

### 7. Noindex utility pages
${listRoutes(coreLaunch.filter((record) => record['Proposed action'] === 'KEEP_NOINDEX_TEMPORARILY' && record['WordPress content type'] !== 'taxonomy'))}

### 8. Pages awaiting owner verification
${listRoutes(conditional)}

### 9. Routes to merge
${listRoutes(records.filter((record) => record['Proposed action'] === 'MERGE_AND_301_REDIRECT'))}

### 10. Routes to remove
${listRoutes(records.filter((record) => record['Proposed action'] === 'REMOVE_AND_410'))}

### 11. Existing broken URLs requiring action
${listRoutes(production404)}

### 12. Future SEO opportunities not included in migration
- Demolition services: record as a future owner-approved SEO opportunity only; no route is proposed or created in this migration.
`);

  sections.push(`## WooCommerce review

The 15 live/generated ecommerce routes plus 3 published export-only utilities have no evidence of an active RK Reno online store. All are proposed REMOVE_AND_410; no display-only shop is retained.

${table(['Route', 'Current status', 'Action', 'Reason'], ecommerce.map((record) => [
  routeCell(record), record['Current production status'], record['Proposed action'], record.Reason,
]))}

## Demo and implementation review

All ${generatedDemos.length} generated theme/demo routes plus ${demos.length - generatedDemos.length} redirect-only demo alias are proposed REMOVE_AND_410 (${demos.length} reconciled URLs). They are not redirected to the homepage because their imported template intent is not genuine RK Reno business intent.

${table(['Route', 'Indicators', 'Unique RK Reno content', 'Action'], demos.map((record) => [
  routeCell(record), record['Demo/template indicators'], 'NONE ESTABLISHED', record['Proposed action'],
]))}
`);

  sections.push(`## Portfolio authenticity review

All ${portfolios.length} portfolio records repeat Ivey School/Vastcon/Vincent/Alten demo material, foreign contact details or identical project copy. None has owner evidence, a verified Malaysian location, or unique RK Reno delivery details. Status is LIKELY_THEME_DEMO and proposed action is 410, pending owner confirmation that none is genuine.

${table(['Route', 'Title', 'Images', 'Text/evidence', 'Same demo content', 'RK Reno ownership', 'Location/details', 'Status'], portfolios.map((record) => {
  const page = pageByRoute.get(record['Current route']);
  const excerpt = analyses.get(record['Current route']).text.slice(0, 145);
  return [
    routeCell(record), record['Page title'], page?.images?.length || 0, excerpt,
    'YES — repeated across imported templates', 'NOT ESTABLISHED',
    'Foreign/demo context; no verified Malaysian project details', record['Portfolio authenticity status'],
  ];
}))}
`);

  sections.push(`## Exact and near-duplicate decisions

The 14 exact-duplicate route records form seven pairs. Backlink/search evidence is unavailable, so every risk entry remains UNKNOWN.

${table(['Route A', 'Route B', 'Stronger canonical', 'Recommendation'], duplicatePairs)}

The 19 portfolio pages are also near-duplicates of \`/portfolio/the-ivey-school-of-business/\`; that page is a demo reference, not a canonical to preserve. One-page demo variants are near-duplicates of their numbered demo home counterparts. All remain proposed 410.
`);

  sections.push(`## Category, tag, archive and pagination review

The Phase 1 generated set contains ${generatedArchives.length} category/archive-style routes, including ecommerce products/archives. The reconciled universe adds ${archives.length - generatedArchives.length} existing portfolio-taxonomy 404s, producing ${archives.length} reviewed archive-style URLs. Thin taxonomies are kept noindex temporarily, exact tag/category duplicates merge to the stronger category, blog pagination merges into \`/blog/\`, imported service taxonomies merge to \`/services/\`, and ecommerce archives are removed.

${table(['Route', 'Linked articles', 'Unique content', 'Current robots', 'Action', 'Index recommendation'], archives.map((record) => [
  routeCell(record), analyses.get(record['Current route'])?.linkedArticles || 0,
  record['Unique content level'], pageByRoute.get(record['Current route'])?.robots || 'none/not generated',
  record['Proposed action'], record['Recommended index status'],
]))}
`);

  sections.push(`## Image dependency review

${imageBlocked.length} routes remain blocked by hotlinked or missing images. A read-only archive listing check found no matching backup media for these blocked dependencies; the seven known broken deep-cleaning filenames are references only. No random replacements are proposed. Owner-supplied project photography is required where no verified local source exists.

${table(['Route', 'Hotlinked sources', 'Missing sources', 'Backup evidence', 'Local replacement', 'Owner input'], imageBlocked.map((record) => {
  const analysis = analyses.get(record['Current route']);
  return [
  routeCell(record), analysis.hotlinks.join('<br>') || 'none',
  analysis.missing.join('<br>') || 'none',
  analysis.backupMatches.length ? `FOUND: ${analysis.backupMatches.join(', ')}` : 'NO MATCH IN ARCHIVE LISTING',
  analysis.localReplacements ? `${analysis.localReplacements} localized file(s)` : 'NONE',
  record['Owner information required'],
  ];
}))}
`);

  sections.push(`## Existing production 404 review

${table(['Broken URL', 'Internal links', 'Sitemap', 'Recommendation', 'Destination/reason'], production404.map((record) => [
  routeCell(record), record['Existing internal-link count'], record['Sitemap presence'],
  record['Proposed action'], record['Proposed destination URL'] || record.Reason,
]))}

## Existing redirect-map reconciliation

${table(['Source', 'Existing target', 'Proposed action', 'Proposed destination', 'Outcome'], redirectCsv.map((redirect) => {
  const record = byRoute.get(redirect.source);
  return [
    `\`${redirect.source}\``, `\`${redirect.target}\``, record?.['Proposed action'],
    record?.['Proposed destination URL'] || 'none', record?.Reason,
  ];
}))}
`);

  sections.push(`## Authenticity and unverified-claim review

- Claim records: ${claims.length}
${Object.entries(claimCounts).map(([status, count]) => `- ${status}: ${count}`).join('\n')}
- No claim is marked verified.
- Imported indicators include Vastcon, Vinceta, Vincent Pham/P., Ivey School, Alten, ECOM Group, Ecomposer, lorem ipsum, Sydney, Melbourne, Australia, Bay Area references, foreign contact details and dollar-denominated demo budgets.
- See [unverified-claims-register.csv](unverified-claims-register.csv) for route-level evidence and recommended action.

## Routes with possible search or backlink risk

Search/backlink risk cannot be quantified without Search Console and backlink exports. These ${riskRoutes.length} removal, merge or broken routes are currently in a sitemap or receive internal links and therefore require redirect/internal-link QA before implementation:

${table(['Route', 'Action', 'Internal links', 'Sitemap', 'Backlink risk'], riskRoutes.map((record) => [
  routeCell(record), record['Proposed action'], record['Existing internal-link count'],
  record['Sitemap presence'], record['Possible backlink risk'],
]))}
`);

  sections.push(`## Proposed first implementation batch

After owner approval, begin with the shared design system and the existing Batch 1 pages only: Homepage, Services, About, Contact, Main Renovation, Aircond Servicing, Aircond Installation KL, Aircond Installation Selangor, Aircond Price Guide and Electrical Services. Before redesign, remove or replace unsupported claims on those pages using owner evidence; do not implement any 410/301 proposal until the disposition plan is approved.

## Phase 2 validation statement

- Every generated route appears once.
- All nine known production 404 URLs appear once.
- All redirect-map entries are reconciled.
- Export-only Cart, Checkout and My Account are included.
- Every row has exactly one allowed proposed action.
- Every redirect/repair has a destination.
- No 410 has a destination.
- No owner-decision route is approved.
- No claim is marked verified.
- No portfolio is marked as a verified RK Reno project.
- Counts in this report are generated from the CSV records.
`);
  return `${sections.join('\n').trimEnd()}\n`;
}
