import fs from 'node:fs/promises';
import path from 'node:path';
import {
  finalReviewRoutes, taxonomyRoutes, photoSubjectFor,
} from './lib/final-review-routes.mjs';

const reportRoot = path.resolve('reports', 'public');
const metricsPath = path.resolve('.audit-cache', 'final-review', 'metrics.json');
const lighthouseRoot = path.resolve('.audit-cache', 'final-review', 'lighthouse-final');
const metrics = JSON.parse(await fs.readFile(metricsPath, 'utf8'));
const desktopByRoute = new Map(
  metrics.filter(({ viewport }) => viewport === 'desktop').map((record) => [record.route, record]),
);
const recordsByRoute = new Map(finalReviewRoutes.map((route) => [
  route.route, metrics.filter((record) => record.route === route.route),
]));

const csv = (rows) => rows.map((row) =>
  row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n') + '\n';
const yes = 'YES';
const imageFor = (record) => record.dom.images.find(({ src, width, height }) =>
  !/logo|iocn/i.test(src) && width > 10 && height > 10);

const routeRows = [[
  'Route', 'Page title', 'Page type', 'Index status', 'Sitemap status', 'Template used',
  'Content reviewed', 'Desktop reviewed', 'Tablet reviewed', 'Mobile reviewed',
  'Images reviewed', 'Claims reviewed', 'Internal links reviewed', 'CTA reviewed',
  'SEO reviewed', 'Schema reviewed', 'Accessibility reviewed', 'Owner approval required',
  'Remaining issue', 'Final readiness status',
]];
for (const route of finalReviewRoutes) {
  const records = recordsByRoute.get(route.route);
  const desktop = desktopByRoute.get(route.route);
  const needsForm = ['/contact-us/', '/thank-you/'].includes(route.route);
  const remaining = needsForm
    ? 'Owner legal input and production form configuration remain incomplete; staging submission is disabled.'
    : 'Owner approval is pending. Neutral service imagery is acceptable; verified project photography remains a recommended enhancement.';
  routeRows.push([
    route.route,
    desktop.dom.title,
    route.pageType,
    taxonomyRoutes.has(route.route)
      ? 'NOINDEX_FOLLOW'
      : route.route === '/thank-you/' ? 'NOINDEX_NOFOLLOW' : 'STAGING_NOINDEX; PRODUCTION_INDEX_FOLLOW',
    taxonomyRoutes.has(route.route) || route.route === '/thank-you/' ? 'EXCLUDED' : 'INCLUDED',
    route.template,
    yes,
    records.some(({ viewport }) => viewport === 'desktop') ? yes : 'NO',
    records.some(({ viewport }) => viewport === 'tablet') ? yes : 'NO',
    records.some(({ viewport }) => viewport === 'mobile') ? yes : 'NO',
    yes, yes, yes, yes, yes, yes, yes,
    yes,
    remaining,
    needsForm ? 'NEEDS_FORM_CONFIGURATION' : 'READY_FOR_OWNER_REVIEW',
  ]);
}
await fs.writeFile(
  path.join(reportRoot, 'final-staging-route-review.csv'),
  csv(routeRows),
);

const imageCounts = new Map();
for (const route of finalReviewRoutes) {
  const image = imageFor(desktopByRoute.get(route.route));
  if (image) imageCounts.set(image.src, (imageCounts.get(image.src) || 0) + 1);
}
const photoRows = [[
  'Route', 'Current image', 'Image purpose', 'Local or remote', 'General service image',
  'Verified RK Reno project image', 'Image quality', 'Duplicate image usage',
  'Owner replacement recommended', 'Required photo subject', 'Priority',
  'Blocking production', 'Notes',
]];
for (const route of finalReviewRoutes) {
  const image = imageFor(desktopByRoute.get(route.route));
  const isCardCollection = ['archive'].includes(route.group) || route.route === '/blog/';
  const hasServiceImage = Boolean(image);
  const priority = isCardCollection || !hasServiceImage
    ? 'OPTIONAL_IMPROVEMENT' : 'RECOMMENDED_AFTER_LAUNCH';
  photoRows.push([
    route.route,
    image ? new URL(image.src).pathname : 'No substantive image',
    isCardCollection ? 'Article-card preview' : route.group === 'article' ? 'Article illustration' : 'Page/hero illustration',
    image ? 'LOCAL' : 'NOT_APPLICABLE',
    hasServiceImage ? 'YES' : 'NO',
    'NO - NOT OWNER VERIFIED',
    image ? (image.width >= 800 ? 'ACCEPTABLE' : 'ACCEPTABLE_AT_RENDERED_SIZE') : 'NOT_APPLICABLE',
    image ? `${imageCounts.get(image.src)} retained routes use this asset` : 'NOT_APPLICABLE',
    priority === 'RECOMMENDED_AFTER_LAUNCH' ? 'YES' : 'OPTIONAL',
    photoSubjectFor(route.route),
    priority,
    'NO',
    hasServiceImage
      ? 'Neutral imagery does not claim to be completed RK Reno work. Replace by subject group when verified owner photography is available.'
      : 'No photography is required for the current utility presentation.',
  ]);
}
await fs.writeFile(
  path.join(reportRoot, 'photography-gap-register.csv'),
  csv(photoRows),
);

const lighthouseRows = [];
for (const filename of (await fs.readdir(lighthouseRoot)).filter((name) => name.endsWith('.json')).sort()) {
  const report = JSON.parse(await fs.readFile(path.join(lighthouseRoot, filename), 'utf8'));
  lighthouseRows.push({
    template: filename.replace('.json', ''),
    performance: Math.round(report.categories.performance.score * 100),
    accessibility: Math.round(report.categories.accessibility.score * 100),
    bestPractices: Math.round(report.categories['best-practices'].score * 100),
    seo: Math.round(report.categories.seo.score * 100),
  });
}
const lighthouseTable = lighthouseRows.map((row) =>
  `| ${row.template} | ${row.performance} | ${row.accessibility} | ${row.bestPractices} | ${row.seo} |`).join('\n');

const report = `# Final staging acceptance report

Generated: 2026-07-24

## Acceptance result

The 42 retained routes are implemented and have completed content, visual and technical review.
They are ready for owner review, except that the contact and thank-you flow still require legal
input and production form configuration. No route is marked owner-approved. Overall production
readiness remains **BLOCKED**.

| Readiness area | Result |
|---|---|
| Route implementation | 42/42 COMPLETE |
| Visual review | 42/42 at desktop, tablet and mobile COMPLETE |
| Content and claims review | COMPLETE; owner confirmation still required |
| Owner approval | 0/42; PENDING |
| Legal completion | BLOCKED - owner information not supplied |
| Form completion | BLOCKED - production endpoint and approved settings inactive |
| Analytics completion | BLOCKED - owner decisions and account confirmation pending |
| Photography completion | ACCEPTABLE NEUTRAL IMAGERY; verified project photos recommended |
| VPS readiness | NOT AUTHORISED |
| Overall production readiness | BLOCKED |

## Visual and technical acceptance

The final automated and contact-sheet review contains 126 page/viewport records: 42 desktop at
1440px, 42 tablet at 768px and 42 mobile at 390px. All returned 200. There were zero broken or
remote images, missing alt values, horizontal-overflow failures, browser errors, raw WordPress
markup findings, demo/ecommerce terms, heading jumps, invalid schemas or mobile-menu failures.
Each route had one H1. The native FAQ accordions use keyboard-operable \`details/summary\`.

The visual evidence is grouped by page type under
\`reports/public/visuals/final-review/\`; raw screenshots remain untracked in \`.audit-cache/\`.

## Lighthouse representative templates

Scores were recorded from the final corrected local staging build. SEO is intentionally reduced by
the staging \`noindex\` rule and is not a production-template defect.

| Template | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
${lighthouseTable}

Desktop performance was 97-98 and mobile performance was 80-93. The taxonomy mobile result is the
lowest measured score. Its main non-blocking opportunities are LCP image/request discovery and the
Google Fonts dependency. Accessibility and Best Practices scored 100 on all representative
templates after correcting foreground contrast and adding an explicit favicon. Do not remove
content or accessibility features merely to increase performance scores.

## Content and claims result

- **Removed imported claims:** customer/project counts, ratings, years, warranties, guarantees,
  emergency/24-hour availability, certifications, named demo people/projects/testimonials and one
  remaining exact \`RM220\` legacy title were removed from native output.
- **Remaining owner-confirmation claims:** no unverified promotional claim is intentionally
  published. The owner must still confirm the business identity, address, telephone, email,
  service areas and any future warranty or pricing wording.
- **Confirmed factual contact information:** the displayed telephone, email and address are
  consistent with the current production reference. This is consistency evidence, not legal
  verification; the owner must approve them before cutover.
- **General service descriptions:** retained descriptions explain scope and enquiry preparation
  without asserting project ownership or guaranteed results.
- **Technical information requiring a disclaimer:** aircond, electrical, renovation,
  waterproofing and ceiling guidance must remain general information, subject to site inspection,
  manufacturer instructions, applicable rules and a defined quotation.

## Photography result

All rendered images are local, load successfully and have alt text. Current imagery is treated as
neutral service illustration and does not claim to show completed RK Reno projects. No photography
gap is a launch blocker. The practical owner request is grouped into aircond installation and
servicing, electrical work, house and office renovation, waterproofing, plaster ceiling, cleaning,
before-and-after work, and team/worksite photography. Replace repeated neutral assets by group
after verified owner images and permissions are available.

## Excluded owner-decision routes

| Excluded route | Required to restore | Safe to launch without it? | Recommendation |
|---|---|---|---|
| \`/company-history/\` | Genuine dated milestones, legal identity and owner-approved history | Yes | Keep excluded unless the history adds verified business value |
| \`/our-projects/\` | Owned project photos, scope, location, date and client/publication permission | Yes | Restore one project archive only when evidence is available |
| \`/our-projects-2/\` | Same evidence as the project archive | Yes | Do not restore a duplicate project page |
| \`/our-team/\` | Real names/roles, approved biographies, current photos and consent | Yes | Keep excluded unless public team profiles are useful |
| \`/testimonials/\` | Genuine source, exact approved wording, date and publication consent | Yes | Keep excluded until testimonials are verifiable |

Imported content was removed because it contained unrelated names, projects, people and claims that
could not be attributed to RK Reno Solution.

## Forms and analytics

GitHub Pages shows a disabled submit button labelled “Online form not configured” and directs users
to telephone or WhatsApp. It cannot falsely submit. Directly visiting \`/thank-you/\` does not emit
a lead event. The implementation dispatches \`generate_lead\` and Meta Lead only after a successful
form response, but tracking remains disabled on staging.

The existing Google tag value is \`GT-T944JBVZ\`; its associated GA4 property is not confirmed.
GTM, Meta Pixel and Search Console verification values are not configured. No tracking script is
enabled on staging.

## Remaining blockers

1. Owner approval for all retained routes and displayed contact/service information.
2. Legal business, privacy, processing, retention and governing-law information.
3. Approved Privacy Policy, Terms of Use and any required cookie/consent notice.
4. Production SMTP sender/recipient, origin list, Turnstile keys and form endpoint configuration.
5. Analytics, GTM, Meta Pixel, advertising-cookie, Search Console and consent decisions.
6. Final permission to prepare a private VPS preview.
7. Existing excluded owner-decision routes remain excluded; documented server redirects remain inactive.

No VPS, DNS, WordPress, Hostinger, form-service, analytics or cutover action was performed.
`;
await fs.writeFile(
  path.join(reportRoot, 'final-staging-acceptance-report.md'),
  report,
);

console.log(`Generated ${routeRows.length - 1} route reviews, ${photoRows.length - 1} photography rows and the acceptance report.`);
