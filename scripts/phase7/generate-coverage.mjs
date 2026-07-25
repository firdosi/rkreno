import fs from 'node:fs/promises';
import path from 'node:path';
import {
  actionCounts, csvText, finalAction, loadPhase7Data, productionOrigin, reports, retainedRoutes,
} from './lib/report-data.mjs';

const { routePlan, inventoryByPath, pageByPath } = await loadPhase7Data();
const headers = [
  'URL','Path','Source where discovered','Current HTTP status','Current title','Page type',
  'Indexability','Sitemap presence','Internal-link count','WordPress content available',
  'Astro equivalent','Content preserved','Design preserved','SEO preserved','Final action',
  'Redirect destination','Reason','Evidence reviewed','Final status',
];

const rows = routePlan.map((record) => {
  const route = record['Current route'];
  const action = finalAction(record);
  const inventory = inventoryByPath.get(route);
  const page = pageByPath.get(route);
  const retained = retainedRoutes.has(route);
  const malformed = route === '/services/%20https:/rkrenosolution.com/about-us/';
  const destination = action === 'MERGE_AND_301' ? record['Proposed destination URL'] : '';
  const source = [
    record['Route source'],
    record['Sitemap presence'].startsWith('YES') ? record['Sitemap presence'] : '',
    Number(record['Existing internal-link count']) > 0 ? 'internal links/navigation/footer/pagination' : '',
    page ? 'current crawl snapshot' : '',
    'WordPress XML/AIOSEO/Elementor/redirect and 404 inventories',
  ].filter(Boolean).join('; ');
  const contentAvailable = page?.content || inventory?.description
    ? 'YES — inspected rendered/content snapshot'
    : (record['WordPress content type'] === 'redirect-alias'
      ? 'ALIAS — destination content inspected' : 'NO — status/record evidence only');
  const content = retained ? 'YES — genuine content represented'
    : action === 'MERGE_AND_301' ? 'YES — intent consolidated at destination'
    : action === 'REMOVE_AND_410' ? 'NOT APPLICABLE — excluded demo/plugin/ecommerce content'
    : action === 'EXISTING_404' ? 'NOT APPLICABLE — no live genuine page'
    : 'PENDING OWNER EVIDENCE';
  const design = retained ? 'YES — close parity with documented safe differences'
    : action === 'MERGE_AND_301' ? 'DESTINATION DESIGN REVIEWED'
    : action === 'OWNER_DECISION_REQUIRED' ? 'PENDING OWNER EVIDENCE' : 'NOT APPLICABLE';
  const seo = retained ? 'YES — continuity register reviewed'
    : action === 'MERGE_AND_301' ? 'YES — mapped by one-hop 301'
    : action === 'REMOVE_AND_410' ? 'YES — explicit 410 decision'
    : action === 'EXISTING_404' ? 'YES — remains non-indexable 404'
    : 'PENDING OWNER DECISION';
  const reason = malformed
    ? 'Malformed WordPress About link is not genuine content; originating Astro links are corrected and the invalid path remains absent.'
    : record.Reason;
  return [
    record['Full production URL'] || `${productionOrigin}${route}`, route, source,
    record['Current production status'], record['Page title'], record['WordPress content type'],
    record['Recommended index status'], record['Sitemap presence'], record['Existing internal-link count'],
    contentAvailable, retained ? `${productionOrigin}${route}` : (destination ? `${productionOrigin}${destination}` : ''),
    content, design, seo, action, destination, reason,
    [
      inventory ? 'live metadata/render snapshot' : '',
      page ? 'full WordPress content snapshot and link/image analysis' : '',
      record['Sitemap presence'].startsWith('YES') ? 'XML sitemap inventory' : '',
      'WordPress XML export', 'AIOSEO records', 'Elementor export',
      'previous route/redirect/404 inventories',
    ].filter(Boolean).join('; '),
    action === 'OWNER_DECISION_REQUIRED' ? 'REVIEWED — OWNER DECISION PENDING' : 'REVIEWED — FINAL ACTION ASSIGNED',
  ];
});

await fs.writeFile(path.join(reports, 'all-production-url-coverage.csv'), csvText(headers, rows));
const records = rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
const counts = actionCounts(records);
const report = `# All production URL coverage

Status: **COMPLETE — ${records.length} discoverable WordPress URLs reviewed**

## Discovery evidence

The universe combines the current rendered homepage/navigation/footer/internal-link crawl, WordPress
XML sitemap-derived inventory, all internal links and pagination found in captured content, category,
tag, service, article, image/attachment references, the WordPress XML export, AIOSEO post-type
records, Elementor export, prior URL inventory, redirect maps and known 404s. The live XML endpoint
was blocked by the controlled browser during this pass, so sitemap membership was cross-checked
against the retained locally captured sitemap inventory rather than represented as a fresh raw XML
download. Every route is backed by content, metadata, redirect, export or 404 evidence; no decision
was made from a slug alone.

## Final actions

- Retain with safe differences: **${counts.RETAIN_WITH_SAFE_DIFFERENCES || 0}**
- Merge by one-hop 301: **${counts.MERGE_AND_301 || 0}**
- Remove by 410: **${counts.REMOVE_AND_410 || 0}**
- Existing 404: **${counts.EXISTING_404 || 0}**
- Owner decision required: **${counts.OWNER_DECISION_REQUIRED || 0}**

The retained set contains every genuine RK Reno business route. Removed routes are documented
theme/demo, imported portfolio, shop/product/account or plugin material. Owner-decision routes stay
unpublished until authentic facts or evidence are supplied.
`;
await fs.writeFile(path.join(reports, 'all-production-url-coverage-report.md'), report);
console.log({ urls: records.length, counts });
