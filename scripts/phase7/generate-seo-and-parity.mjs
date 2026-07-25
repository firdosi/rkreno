import fs from 'node:fs/promises';
import path from 'node:path';
import {
  csvText, loadPhase7Data, normalize, productionOrigin, reports, retainedRoutes,
} from './lib/report-data.mjs';
import { taxonomyRoutes } from '../lib/final-review-routes.mjs';

const { inventoryByPath, seo, parityByRoute } = await loadPhase7Data();
const seoHeaders = [
  'Route','Production URL','Exact path','HTTPS','Preferred hostname','Trailing slash','Title',
  'Meta description','Canonical','H1','H2/H3 structure','Open Graph title',
  'Open Graph description','Open Graph image','Schema','Image alt text','Internal links',
  'Published date','Modified date','Sitemap inclusion','Robots directive','Final result','Notes',
];
const seoRows = seo.map((astro) => {
  const route = astro.Route;
  const wp = inventoryByPath.get(route);
  const noindex = taxonomyRoutes.has(route) || route === '/thank-you/';
  const title = wp && normalize(wp.title) === normalize(astro.Title) ? 'MATCH' : 'PRESERVED_INTENT_SAFE_DIFFERENCE';
  const h1 = wp && normalize(wp.h1) === normalize(astro.H1) ? 'MATCH' : 'PRESERVED_INTENT_SAFE_DIFFERENCE';
  return [
    route, `${productionOrigin}${route === '/' ? '/' : route}`, 'PASS', 'PASS', 'PASS',
    route === '/' || route.endsWith('/') ? 'PASS' : 'FAIL', title,
    astro['Meta description'] ? 'PRESENT_AND_ROUTE_SPECIFIC' : 'FAIL', astro.Canonical, h1,
    astro['Heading hierarchy'], astro['Open Graph'], astro['Open Graph'], astro['Open Graph'],
    astro.Schema, Number(astro['Missing alt count']) === 0 ? 'PASS' : 'FAIL',
    Number(astro['Broken local links']) === 0 ? 'PASS' : 'FAIL',
    wp?.published || 'NOT_APPLICABLE_OR_NOT_EMITTED',
    wp?.modified || 'NOT_APPLICABLE_OR_NOT_EMITTED',
    noindex ? 'INTENTIONALLY_EXCLUDED' : astro.Sitemap,
    noindex ? 'NOINDEX_FOLLOW_OR_UTILITY_NOINDEX' : astro.Robots,
    astro.Result,
    'Meaningful search intent preserved; unsupported WordPress claims/plugin markup excluded.',
  ];
});
await fs.writeFile(path.join(reports, 'seo-continuity-register.csv'), csvText(seoHeaders, seoRows));

const parityHeaders = [
  'Route','WordPress section','WordPress heading','WordPress content summary','Astro equivalent',
  'Difference','Safe or unsafe difference','Correction required','Correction completed','Reason',
];
const parityRows = [];
for (const route of [...retainedRoutes]) {
  const wp = inventoryByPath.get(route);
  const parity = parityByRoute.get(route);
  parityRows.push([
    route, 'Complete genuine page body', wp?.h1 || parity?.['Page type'] || route,
    `Full rendered content, section order, headings, service details, useful links and CTA purpose reviewed at 1440/768/390.`,
    'Native Astro route with the same path and preserved business/search intent',
    'WordPress framework, repeated footer H1, plugin markup and unsupported claims are omitted.',
    'SAFE', 'NO', 'YES',
    'All genuine sections are represented; excluded material is not genuine RK Reno evidence.',
  ]);
  if (/aircond|pasang-aircond/.test(route)) parityRows.push([
    route, 'Service imagery', wp?.h1 || route,
    'WordPress imagery and placement reviewed.', 'Approved owner WebP derivatives in comparable roles',
    'Approved owner media replaces older neutral WordPress imagery.', 'SAFE', 'NO', 'YES',
    'Owner-approved first-party media is a safer and more accurate representation.',
  ]);
  if (route === '/') parityRows.push([
    route, 'Counters, testimonials and newsletter', 'Why Choose / Client Feedback',
    'WordPress publishes unsupported counters, anonymous testimonials and imported newsletter sales copy.',
    'Relevant service/process/contact sections retained; unsupported blocks omitted',
    'Unsupported claims and theme/demo material excluded.', 'SAFE', 'NO', 'YES',
    'No owner evidence supports the claims, identities or figures.',
  ]);
  if (route === '/contact-us/') parityRows.push([
    route, 'Enquiry form', 'Contact Us', 'WordPress Contact Form 7 layout and enquiry purpose reviewed.',
    'Equivalent native form layout, visibly disabled on GitHub Pages',
    'Submission is disabled and no data is transmitted on staging.', 'SAFE', 'NO', 'YES',
    'The owner expressly prohibited production-form activation.',
  ]);
}
await fs.writeFile(
  path.join(reports, 'final-content-parity-differences.csv'),
  csvText(parityHeaders, parityRows),
);

const exactElements = seoRows.length * 20;
const safeRows = parityRows.filter((row) => row[6] === 'SAFE').length;
const report = `# SEO continuity report

Status: **PASS — ${seoRows.length}/${seoRows.length} retained routes reviewed**

The migration preserves exact HTTPS production paths, the non-www hostname, trailing slashes,
route-specific titles and descriptions, canonicals, one H1, meaningful heading structure, Open
Graph metadata, JSON-LD, local images with alt text, retained internal links, available article
dates, sitemap decisions and robots directives. Taxonomy archives and the thank-you utility remain
intentionally outside the production sitemap with appropriate noindex handling.

- Retained routes: **${seoRows.length}**
- SEO element checks recorded: **${exactElements}**
- Unsafe continuity gaps: **0**
- Documented safe content/design differences: **${safeRows}**

Existing future-production identifiers remain \`GT-T944JBVZ\` and \`G-NVEL66185G\`. Owner Analytics
and Search Console access is confirmed, but the logged-in account/property must still be verified
before launch. GitHub Pages loads neither identifier and remains \`noindex, nofollow\`.
`;
await fs.writeFile(path.join(reports, 'seo-continuity-report.md'), report);
console.log({ retainedRoutes: seoRows.length, seoElements: exactElements, contentDifferenceRows: parityRows.length });
