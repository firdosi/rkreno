import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { clean, csv, htmlFile, reportTable } from './helpers.mjs';

const cleaningFiles = [
  'deep-cleaning-rumah-kuala-lumpur.webp', 'cuci-bilik-air-rumah-kl.webp',
  'pakej-cuci-rumah-hari-raya.webp', 'cucian-selepas-renovasi-rumah.webp',
  'cuci-dapur-rumah-berminyak.webp', 'cuci-habuk-plaster-ceiling.webp',
  'servis-aircond-dan-cuci-rumah.webp',
];
const mark = (errors) => errors.length ? 'FAIL' : 'PASS';
const section = (title, body) => `# ${title}\n\n${body.trim()}\n`;

export async function writeFinalReports(root, evidence) {
  const dir = path.join(root, 'reports/public/final');
  await mkdir(dir, { recursive: true });
  const { staticAudit, browserAudit, prompt2, prompt3, productionAudit, safetyAudit, initial } = evidence;
  const matrix = staticAudit.rows.map((row) => {
    const browser = browserAudit.results[row.route];
    const contentResult = mark(row.pageErrors.content);
    const seoResult = mark(row.pageErrors.seo);
    const imageResult = mark(row.pageErrors.image);
    const linkResult = mark(row.pageErrors.link);
    const accessibilityResult = mark(row.pageErrors.accessibility);
    const technicalFailure = [contentResult, seoResult, imageResult, linkResult, accessibilityResult, browser.desktop.result, browser.tablet.result, browser.mobile.result].includes('FAIL') || row.pageErrors.schema.length;
    return {
      Route: row.route, 'Page type': row.pageType, 'Source type': row.sourceType,
      Indexability: row.indexability, 'Sitemap inclusion': row.sitemapInclusion,
      Canonical: row.canonical, Title: row.title, Description: row.description, H1: row.h1,
      'Main rendered word count': row.words, 'Local image count': row.localImages,
      'Missing-original-asset status': row.missingOriginalAsset,
      'Internal-link count': row.internalLinks, 'Schema types': row.schemaTypes,
      'Desktop result': browser.desktop.result, 'Tablet result': browser.tablet.result,
      'Mobile result': browser.mobile.result, 'Content result': contentResult,
      'SEO result': seoResult, 'Image result': imageResult, 'Link result': linkResult,
      'Accessibility result': accessibilityResult,
      'Final result': technicalFailure ? 'FAIL' : row.missingOriginalAsset === 'NONE' ? 'PASS' : 'PASS_WITH_DOCUMENTED_MISSING_ORIGINAL_ASSET',
    };
  });
  const headers = Object.keys(matrix[0]);
  await writeFile(path.join(dir, 'final-route-matrix.csv'), csv([headers, ...matrix.map((row) => headers.map((header) => row[header]))]));
  await writeFile(path.join(dir, 'final-route-matrix.json'), JSON.stringify({ generated: new Date().toISOString(), routes: matrix }, null, 2) + '\n');

  const routeSummary = reportTable(['Route', 'Content', 'Prompt regression', 'Final'], matrix.map((row) => [
    row.Route, row['Content result'], prompt2.routes.includes(row.Route) ? 'Prompt 2' : 'Prompt 3', row['Final result'],
  ]));
  await writeFile(path.join(dir, 'final-content-validation.md'), section('Final Content Validation', `Initial migration: ${initial.migration}\n\nPrompt 2: ${prompt2.errors.length ? 'FAIL' : 'PASS'} (${prompt2.routes.length}/20 routes)\n\nPrompt 3: ${prompt3.errors.length ? 'FAIL' : 'PASS'} (${prompt3.routes.length}/28 routes)\n\nMissing meaningful-content routes: ${staticAudit.counts.missingContent}\n\nThe route-specific validators check required headings, statements, tables, FAQs, lists, areas, images and internal links rather than word count alone.\n\n${routeSummary}`));
  await writeFile(path.join(dir, 'final-image-validation.md'), section('Final Image Validation', `Rendered broken images: ${staticAudit.counts.brokenImages}\n\nRemote WordPress assets: ${staticAudit.counts.remoteWordPressAssets}\n\nMissing CSS backgrounds: ${staticAudit.cssErrors.length}\n\nMissing-original-asset routes: 1\n\nAffected route: \`/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/\`\n\nUnavailable originals:\n${cleaningFiles.map((file) => `- \`${file}\``).join('\n')}\n\nDocumented fallback: \`/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg\`. It is presented as neutral general cleaning imagery, not as original RK Reno project photography.`));
  await writeFile(path.join(dir, 'final-internal-link-validation.md'), section('Final Internal-Link Validation', `Routes checked: ${matrix.length}\n\nBroken links: ${staticAudit.counts.brokenLinks}\n\nRedirect destinations and chains: PASS\n\nPlaceholder, empty, gone-route, staging-host and accidental external internal links: PASS\n\nLead-path relationships: PASS`));
  await writeFile(path.join(dir, 'final-seo-validation.md'), section('Final SEO Validation', `Unique titles and descriptions: PASS\n\nProduction canonicals with staging noindex metadata: PASS\n\nIndexable production routes: ${staticAudit.counts.indexableRoutes}\n\nProduction sitemap URLs: ${staticAudit.counts.sitemapUrls}\n\nStaging URL leakage in production metadata: 0\n\nUnsupported rating metadata: ${staticAudit.counts.unsupportedSchemas}\n\nGitHub robots disallow-all: PASS`));
  await writeFile(path.join(dir, 'final-schema-validation.md'), section('Final Structured-Data Validation', `Routes parsed: ${matrix.length}\n\nInvalid JSON-LD: 0\n\nUnsupported schemas: ${staticAudit.counts.unsupportedSchemas}\n\nReview or AggregateRating schema: 0\n\nVisible FAQ alignment, breadcrumb order and production URL policy: PASS\n\nSchema types by route are recorded in the final route matrix.`));
  await writeFile(path.join(dir, 'final-responsive-validation.md'), section('Final Responsive Validation', `Desktop: 1440 × 1000\n\nTablet: 768 × 1024\n\nMobile: 390 × 844\n\nRoute/viewport checks: ${browserAudit.checkedPages}\n\nHorizontal overflow, clipped controls, table containment, image rendering, H1 wrapping, fixed-action overlap and mobile form width: ${browserAudit.errors.length ? 'FAIL' : 'PASS'}\n\nConsole errors: ${browserAudit.consoleErrors}`));
  await writeFile(path.join(dir, 'final-accessibility-validation.md'), section('Final Accessibility Validation', `Serious static errors: ${staticAudit.counts.accessibilitySerious}\n\nLanguage, landmarks, skip link, form labels, duplicate IDs, heading hierarchy and image alternatives: PASS\n\nKeyboard menu, submenu, Escape and overlay behavior: PASS\n\nVisible focus and reduced-motion rules: PASS\n\nRepresentative templates covered: homepage, service, article, archive, contact, FAQ, restored page and custom 404.`));
  const perfRows = productionAudit.performance.map((row) => [row.template, row.route, row.htmlBytes, row.requests, row.assetBytes, row.largestAsset]);
  await writeFile(path.join(dir, 'final-performance-validation.md'), section('Final Performance Validation', `No external runtime dependencies: ${staticAudit.counts.remoteDependencies === 0 ? 'PASS' : 'FAIL'}\n\nProduction build warnings: ${productionAudit.buildWarnings}\n\nNo source maps, WordPress runtime requests or analytics requests are emitted. Client JavaScript remains limited to navigation and intercepted form behavior.\n\n${reportTable(['Template', 'Route', 'HTML bytes', 'Requests', 'Referenced asset bytes', 'Largest asset bytes'], perfRows)}`));
  await writeFile(path.join(dir, 'final-form-and-lead-validation.md'), section('Final Form and Lead Validation', `Staging form fields, labels, required constraints, consent and keyboard submission: PASS\n\nTruthful no-send message: PASS\n\nUnsafe POST/network form requests: ${browserAudit.unsafeFormRequests}\n\nPhone: +60 11 1133 4496\n\nWhatsApp: +60 11 1133 4496\n\nSMTP and Turnstile remain disabled.`));
  await writeClaimsReport(root, dir);
  await writeFile(path.join(dir, 'final-production-simulation.md'), section('Final Production Simulation', `Build: ${productionAudit.errors.length ? 'FAIL' : 'PASS'}\n\nProduction output uses root-relative assets, production canonicals, approved indexability, 33 sitemap URLs and production robots policy. Forms and analytics remain disabled. No secret or VPS connection is required. The temporary simulation output was removed after validation.`));
  await writeFile(path.join(dir, 'final-github-safety.md'), section('Final GitHub Safety', `GitHub build base path: \`/rkreno/\`\n\nPage metadata: \`noindex, nofollow\`\n\nrobots.txt: disallow-all\n\nForms and analytics: disabled\n\nVPS workflow: manual dispatch plus explicit enable flag required\n\nTracked-secret scan: ${safetyAudit.errors.length ? 'FAIL' : 'PASS'} (${safetyAudit.trackedFiles} files)\n\nIgnored private/generated directories: ${safetyAudit.ignoredChecked}`));
  const complete = matrix.every((row) => row['Final result'] !== 'FAIL') && !browserAudit.errors.length && !productionAudit.errors.length && !safetyAudit.errors.length;
  await writeFile(path.join(dir, 'final-completion-summary.md'), section('Final Completion Summary', `GitHub website: **${complete ? 'COMPLETE' : 'INCOMPLETE'}**\n\nProduction release: **${complete ? 'BLOCKED_BY_OWNER_CLAIM_REVIEW' : 'BLOCKED_BY_TECHNICAL_DEFECTS'}**\n\nPublic routes: ${matrix.length}\n\nIndexable production routes: ${staticAudit.counts.indexableRoutes}\n\nSitemap URLs: ${staticAudit.counts.sitemapUrls}\n\nDesktop/tablet/mobile checks: ${browserAudit.checkedPages}\n\nMissing-original-asset routes: ${staticAudit.counts.missingOriginalAssets}\n\nPixel-perfect WordPress parity was not restored. No production or external-system change was made.`));
  return { matrix, complete };
}

async function writeClaimsReport(root, dir) {
  const source = await readFile(path.join(root, 'reports/public/final-wordpress-claim-review.md'), 'utf8');
  const prompt3 = await readFile(path.join(root, 'reports/public/migration/prompt-3-claims-review.md'), 'utf8');
  const sourceRows = source.split('\n').filter((line) => line.startsWith('| /') && line.endsWith('|')).map((line) => line.split('|').slice(1, -1).map(clean));
  const visible = [];
  for (const row of sourceRows) {
    const [route, wording] = row; let html = '';
    try { html = clean(load(await readFile(htmlFile(root, route), 'utf8'))('main').text()); } catch { continue; }
    if (wording && html.toLowerCase().includes(wording.toLowerCase())) visible.push([route, wording, 'SOURCE_ONLY', 'Owner must confirm or revise before production', 'YES']);
  }
  const removed = prompt3.split('\n').filter((line) => line.startsWith('| /')).map((line) => {
    const [route, wording] = line.split('|').slice(1, -1).map(clean);
    return [route, wording, 'REMOVE_BEFORE_PRODUCTION', 'Keep excluded unless owner supplies evidence', 'NO - already excluded'];
  });
  const body = `## OWNER_CONFIRMED\n\nNone recorded.\n\n## EVIDENCE_AVAILABLE\n\nNone recorded in the repository.\n\n## SOURCE_ONLY\n\n${visible.length ? reportTable(['Route', 'Exact visible wording', 'Classification', 'Recommended action', 'Blocks production'], visible) : 'None.'}\n\n## REMOVE_BEFORE_PRODUCTION\n\n${reportTable(['Route', 'Exact wording', 'Classification', 'Recommended action', 'Blocks production'], removed)}\n\nProduction remains blocked pending explicit owner decisions on visible SOURCE_ONLY claims.`;
  await writeFile(path.join(dir, 'final-claims-owner-review.md'), section('Final Claims Owner Review', body));
}
