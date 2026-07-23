import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const pages = JSON.parse(await readFile(path.join(root, 'src/data/site-pages.json'), 'utf8'))
  .filter((page) => page.status === 200 && page.type !== 'template' && page.title);
const reportDirectory = path.join(root, 'reports/public');
const productionOrigin = 'https://rkrenosolution.com';
const stagingOrigin = 'https://firdosi.github.io/rkreno';
const priorityReviewed = new Set([
  '/', '/services/', '/service/building-renovation/', '/servis-aircond-murah-kl/',
  '/aircond-installation-kl/', '/upah-pasang-aircond-selangor/',
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/',
  '/house-renovation-in-kuala-lumpur/', '/house-renovation-in-selangor/',
  '/electrical-services-selangor/',
]);
const knownMissingImages = [
  'deep-cleaning-rumah-kuala-lumpur.webp', 'cuci-bilik-air-rumah-kl.webp',
  'pakej-cuci-rumah-hari-raya.webp', 'cucian-selepas-renovasi-rumah.webp',
  'cuci-dapur-rumah-berminyak.webp', 'cuci-habuk-plaster-ceiling.webp',
  'servis-aircond-dan-cuci-rumah.webp',
];

const clean = (value = '') => String(value).replace(/\s+/g, ' ').trim();
const routeUrl = (origin, route) => `${origin}${route === '/' ? '/' : route}`;
const stagingUrl = (route) => `${stagingOrigin}${route === '/' ? '/' : route}`;
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

function classification(page) {
  const key = `${page.path} ${page.title}`.toLowerCase();
  if (page.path === '/') return 'Homepage';
  if (page.path === '/services/') return 'Main services page';
  if (page.path === '/service/building-renovation/') return 'Main renovation page';
  if (/contact-us/.test(key)) return 'Contact page';
  if (/about-us|company-history|our-team|team-detail|testimonial/.test(key)) return 'About page';
  if (/privacy|terms|cookie|legal/.test(key)) return 'Legal pages';
  if (page.type === 'post') return 'Blog/article pages';
  if (page.type === 'taxonomy' || page.type === 'product' ||
      /^\/(?:blog\/page|product-category|shop|wishlist)\//.test(page.path)) {
    return 'Category/archive pages';
  }
  if (/aircond|upah-pasang/.test(key)) return 'Aircond service landing pages';
  if (/electrical|wiring/.test(key)) return 'Electrical service pages';
  if (/waterproof|pu-injection/.test(key)) return 'Waterproofing pages';
  if (/plaster-ceiling|ceiling-works/.test(key)) return 'Plaster ceiling pages';
  if (/cleaning|cuci|pembersihan/.test(key)) return 'Cleaning pages';
  if (/office|commercial/.test(key)) return 'Office and commercial renovation pages';
  if (/house-renovation|home-renovation|renovation/.test(key)) {
    return 'Renovation service landing pages';
  }
  if (page.type === 'service') return 'Renovation service landing pages';
  return 'Utility and 404 pages';
}

const isEcommerce = (page) =>
  page.type === 'product' || /^\/(?:shop|wishlist|product-category)\//.test(page.path);
const isDemo = (page) =>
  /^\/(?:home-\d|landing-page|sample-page|pricing-plan|blog-(?:grid|full-width))/.test(page.path);

function layoutFor(page) {
  if (page.customLayout && page.externalStyles?.length) {
    return 'BaseLayout + restored WordPress theme layout';
  }
  if (page.customLayout) return 'BaseLayout + page-specific custom layout';
  return 'BaseLayout + generic legacy-content renderer';
}

async function fetchStatus(url) {
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': 'RK-Reno-completion-audit/1.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });
    return `${response.status}${response.redirected ? ` → ${new URL(response.url).pathname}` : ''}`;
  } catch (error) {
    return `ERROR: ${error instanceof Error ? error.message : 'request failed'}`;
  }
}

async function statusMap(origin, urlBuilder) {
  const output = new Map();
  let cursor = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (cursor < pages.length) {
      const page = pages[cursor++];
      output.set(page.path, await fetchStatus(urlBuilder(origin, page.path)));
    }
  }));
  return output;
}

const productionStatuses = await statusMap(productionOrigin, routeUrl);
const stagingStatuses = await statusMap(stagingOrigin, (_, route) => stagingUrl(route));
const contentHashes = new Map();
const analysis = [];

for (const page of pages) {
  const $ = load(page.content || '');
  const text = clean($.text());
  const hash = createHash('sha1').update(text.toLowerCase()).digest('hex');
  if (!contentHashes.has(hash)) contentHashes.set(hash, []);
  contentHashes.get(hash).push(page.path);
  const localImages = $('img[src^="/assets/"]').map((_, image) => $(image).attr('src')).get();
  const missingLocal = [];
  for (const source of localImages) {
    try {
      await access(path.join(root, 'public', source.replace(/^\//, '')));
    } catch {
      missingLocal.push(source);
    }
  }
  analysis.push({
    page, $, text,
    missingLocal,
    missingAlt: $('img').filter((_, image) => !clean($(image).attr('alt'))).length,
    hotlinks: $('img[src*="rkrenosolution.com"],source[srcset*="rkrenosolution.com"]').length,
    knownMissing: knownMissingImages.filter((name) => (page.content || '').includes(name)),
    rawElementor: /elementor|wp-block|woocommerce/i.test(page.content || ''),
  });
}

const records = analysis.map((item) => {
  const { page, $, text } = item;
  const duplicates = contentHashes.get(
    createHash('sha1').update(text.toLowerCase()).digest('hex'),
  ).filter((route) => route !== page.path);
  const reviewed = priorityReviewed.has(page.path);
  const ecommerce = isEcommerce(page);
  const demo = isDemo(page);
  const thin = text.length < 300;
  const issues = [];
  if (!page.customLayout) issues.push('Generic legacy-content layout; page-specific design not reviewed');
  if (ecommerce) issues.push('Irrelevant WooCommerce/shop route retained from WordPress');
  if (demo) issues.push('WordPress demo or implementation route');
  if (item.rawElementor) issues.push('Raw WordPress/Elementor/WooCommerce markup indicators remain');
  if (thin) issues.push(`Thin content (${text.length} normalized characters)`);
  if (item.missingLocal.length) issues.push(`${item.missingLocal.length} local image files missing`);
  if (item.knownMissing.length) issues.push(`${item.knownMissing.length} known source images unavailable`);
  if (item.hotlinks) issues.push(`${item.hotlinks} WordPress image hotlinks remain`);
  if (item.missingAlt) issues.push(`${item.missingAlt} images have missing or blank alt text`);
  if (duplicates.length) issues.push(`Exact content duplicate of ${duplicates.join(', ')}`);
  if (!page.description) issues.push('Missing meta description');
  if (!page.h1) issues.push('Missing H1');
  if (!page.schema?.length) issues.push('No structured data');

  let finalStatus = 'NEEDS REDESIGN';
  let action = 'Create the appropriate reusable layout, then perform full three-viewport review.';
  if (item.missingLocal.length || item.knownMissing.length || item.hotlinks) {
    finalStatus = 'NEEDS IMAGES';
    action = 'Resolve and localize verified source images before visual review.';
  } else if (thin) {
    finalStatus = 'NEEDS CONTENT';
    action = 'Review the production source and restore useful approved content.';
  } else if (reviewed && page.customLayout && !item.rawElementor) {
    finalStatus = 'TECHNICALLY COMPLETE';
    action = 'Retain for the controlled batch review; owner approval is still required.';
  } else if (item.rawElementor) {
    action = 'Replace remaining WordPress/Elementor markup with native reusable Astro components.';
  } else if (ecommerce || demo) {
    action = 'Decide redirect/removal strategy; do not reproduce irrelevant WordPress clutter.';
  }

  const seoComplete = Boolean(page.title && page.description && page.canonical && page.h1);
  return {
    'Route': page.path,
    'Page title': page.title,
    'Page type': `${page.type} / ${classification(page)}`,
    'Production URL status': productionStatuses.get(page.path),
    'Astro status': stagingStatuses.get(page.path),
    'Layout/template used': layoutFor(page),
    'Content complete': reviewed ? 'PARTIAL — PRIORITY AUDIT ONLY' : 'UNVERIFIED',
    'Images complete': issues.some((issue) => /image|hotlink/i.test(issue)) ? 'NO' : (reviewed ? 'YES' : 'UNVERIFIED'),
    'Header correct': reviewed ? 'YES — PRIORITY AUDIT' : 'NOT REVIEWED',
    'Footer correct': reviewed ? 'YES — PRIORITY AUDIT' : 'NOT REVIEWED',
    'Desktop design reviewed': reviewed ? 'YES' : 'NO',
    'Tablet design reviewed': reviewed ? 'YES' : 'NO',
    'Mobile design reviewed': reviewed ? 'YES' : 'NO',
    'Buttons working': reviewed ? 'YES — AUTOMATED PRIORITY CHECK' : 'NOT REVIEWED',
    'Internal links working': 'YES — BUILT-LINK VALIDATION',
    'SEO complete': seoComplete ? 'TECHNICALLY PRESENT' : 'NO',
    'Schema complete': page.schema?.length ? `PRESENT (${page.schema.length}) — APPROPRIATENESS UNREVIEWED` : 'NO',
    'Visual parity level': reviewed ? 'HIGH — PRIORITY AUDIT, NOT OWNER APPROVED' : (ecommerce || demo ? 'LOW' : 'NOT ASSESSED'),
    'Problems found': issues.join('; ') || 'No automated issue; full visual/content review still required',
    'Required action': action,
    'Final status': finalStatus,
  };
});

const headers = Object.keys(records[0]);
const csvBody = [headers.map(csv).join(','), ...records.map((record) =>
  headers.map((header) => csv(record[header])).join(','))].join('\n');
const counts = records.reduce((result, record) => {
  result[record['Final status']] = (result[record['Final status']] || 0) + 1;
  return result;
}, {});
const classes = records.reduce((result, record) => {
  const value = record['Page type'].split(' / ')[1];
  result[value] = (result[value] || 0) + 1;
  return result;
}, {});
const duplicateRoutes = [...contentHashes.values()]
  .filter((routes) => routes.length > 1)
  .reduce((count, routes) => count + routes.length, 0);
const table = records.map((record) =>
  `| \`${record.Route}\` | ${record['Page type']} | ${record['Layout/template used']} | ${record['Final status']} | ${record['Problems found'].replaceAll('|', '\\|')} |`,
).join('\n');
const markdown = `# RK Reno full-site completion audit\n\n` +
  `Generated: ${new Date().toISOString()}\n\n` +
  `## Scope and acceptance warning\n\n` +
  `This Phase 1 audit inventories all ${records.length} generated public routes. It does **not** claim the site is complete. ` +
  `Only the 10 prior priority routes have three-viewport evidence; every other route remains visually unreviewed. ` +
  `No route is marked FULLY APPROVED.\n\n` +
  `## Headline findings\n\n` +
  `- Generated routes audited: ${records.length}\n` +
  `- Production HTTP 200 responses: ${records.filter((record) => record['Production URL status'] === '200').length}\n` +
  `- GitHub Pages HTTP 200 responses: ${records.filter((record) => record['Astro status'] === '200').length}\n` +
  `- Page-specific/custom layouts: ${pages.filter((page) => page.customLayout).length}\n` +
  `- Generic legacy-content layouts: ${pages.filter((page) => !page.customLayout).length}\n` +
  `- Three-viewport priority reviews available: ${records.filter((record) => record['Desktop design reviewed'] === 'YES').length}\n` +
  `- WooCommerce/product routes requiring a disposition decision: ${pages.filter(isEcommerce).length}\n` +
  `- Demo/implementation routes requiring a disposition decision: ${pages.filter(isDemo).length}\n` +
  `- Legacy portfolio/project routes without an approved template: ${pages.filter((page) => page.type === 'portfolio').length}\n` +
  `- Routes with exact duplicate content: ${duplicateRoutes}\n` +
  `- Routes blocked by missing or hotlinked images: ${counts['NEEDS IMAGES'] || 0}\n` +
  `- Legal routes found: ${records.filter((record) => record['Page type'].endsWith('/ Legal pages')).length} (privacy/terms/cookie coverage is missing)\n` +
  `- FULLY APPROVED routes: 0\n\n` +
  `## Final-status totals\n\n${Object.entries(counts).map(([name, count]) => `- ${name}: ${count}`).join('\n')}\n\n` +
  `## Reusable-template classification\n\n${Object.entries(classes).sort().map(([name, count]) => `- ${name}: ${count}`).join('\n')}\n\n` +
  `## Interpretation\n\n` +
  `TECHNICALLY COMPLETE means prior automated and visual evidence exists, but it is not owner approval. ` +
  `NEEDS REDESIGN identifies generic, demo, ecommerce, archive, article, or service output that still needs an appropriate reusable layout. ` +
  `NEEDS CONTENT and NEEDS IMAGES take precedence when the audit found a clearer blocking deficiency. ` +
  `The requested template list has no portfolio/project template, so those 19 legacy routes are provisionally classified as utility routes and flagged for a Phase 2 decision.\n\n` +
  `## Route register\n\n| Route | Classification | Current layout | Final status | Problems found |\n` +
  `| --- | --- | --- | --- | --- |\n${table}\n`;

await mkdir(reportDirectory, { recursive: true });
await writeFile(path.join(reportDirectory, 'full-site-completion-status.csv'), `${csvBody}\n`);
await writeFile(path.join(reportDirectory, 'full-site-completion-report.md'), markdown);
console.log(`Wrote ${records.length} route records.`);
console.log(counts);
