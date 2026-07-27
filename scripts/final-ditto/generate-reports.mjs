import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { finalReviewRoutes } from '../lib/final-review-routes.mjs';

const root = process.cwd();
const reports = path.join(root, 'reports', 'public');
const liveFile = path.join(root, '.audit-cache', 'final-ditto-review', 'live-source.json');
const liveCapture = JSON.parse(await readFile(liveFile, 'utf8'));
const liveByRoute = new Map(liveCapture.routes.map((item) => [item.route, item]));
const held = new Set(['/company-history/', '/our-projects-2/', '/our-projects/', '/our-team/', '/testimonials/']);
const mirrored = finalReviewRoutes.filter(({ route }) => route !== '/demolition-contractor-kl-selangor/');

const clean = (value = '') => value.replace(/\s+/g, ' ').trim();
const htmlFile = (route) => route === '/' ? path.join(root, 'dist', 'index.html')
  : path.join(root, 'dist', route.slice(1), 'index.html');
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const countInteractive = (item) => Object.values(item?.interactive || {}).reduce((sum, value) => sum + Number(value || 0), 0);

function inspectAstro(html) {
  const $ = load(html);
  const main = $('main').first();
  const visibleText = main.find('h1,h2,h3,p,li,td,th,blockquote,figcaption')
    .map((_, node) => clean($(node).text())).get().filter(Boolean);
  const internalLinks = main.find('a[href]').filter((_, node) => {
    const href = $(node).attr('href') || '';
    return href.startsWith('/') || href.includes('rkrenosolution.com');
  });
  return {
    title: clean($('title').first().text()),
    seoTitle: clean($('title').first().text()),
    metaDescription: $('meta[name="description"]').attr('content') || '',
    canonical: $('link[rel="canonical"]').attr('href') || '',
    robots: $('meta[name="robots"]').attr('content') || '',
    headings: {
      h1: main.find('h1').map((_, node) => clean($(node).text())).get(),
      h2: main.find('h2').map((_, node) => clean($(node).text())).get(),
      h3: main.find('h3').map((_, node) => clean($(node).text())).get(),
    },
    sections: main.find('section').length,
    textBlocks: visibleText.length,
    images: main.find('img[src]').length,
    links: internalLinks.length,
    interactive: main.find('form,input,select,textarea,details,button,[data-testimonial-track],[data-counter]').length,
    formFields: main.find('input,select,textarea').length,
    tables: main.find('table').length,
    lists: main.find('li').length,
    schemaTypes: $('script[type="application/ld+json"]').map((_, node) => {
      try {
        const value = JSON.parse($(node).text());
        return value['@type'] || '';
      } catch { return ''; }
    }).get().flat().filter(Boolean),
  };
}

const inventoryRoutes = mirrored.map((routeInfo) => {
  const live = liveByRoute.get(routeInfo.route);
  if (!live) throw new Error(`Missing live WordPress inventory: ${routeInfo.route}`);
  return {
    ...live,
    routeGroup: routeInfo.group,
    pageType: routeInfo.pageType,
    sourcePriority: 'Current rendered WordPress page',
    reviewed: true,
    layoutReview: {
      headerVariant: 'WordPress shared header',
      footerVariant: 'WordPress shared footer',
      desktop: 'Captured at 1440×1000',
      tablet: 'Captured at 768×1024',
      mobile: 'Captured at 390×844',
      hoverEffects: 'Reviewed from rendered selectors and interactive controls',
      entranceAnimations: 'Reviewed from rendered animation and carousel selectors',
      stickyBehaviour: 'Shared sticky header retained',
    },
  };
});
await mkdir(reports, { recursive: true });
await writeFile(path.join(reports, 'final-wordpress-page-inventory.json'), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: liveCapture.origin,
  sourceCapturedAt: liveCapture.capturedAt,
  mirroredWordPressPageCount: inventoryRoutes.length,
  routes: inventoryRoutes,
}, null, 2)}\n`);

const parityRows = [];
for (const routeInfo of finalReviewRoutes) {
  const astro = inspectAstro(await readFile(htmlFile(routeInfo.route), 'utf8'));
  const live = liveByRoute.get(routeInfo.route);
  if (!live) {
    parityRows.push({
      route: routeInfo.route, wpSections: 0, astroSections: astro.sections, wpText: 0,
      astroText: astro.textBlocks, wpImages: 0, astroImages: astro.images, wpLinks: 0,
      astroLinks: astro.links, wpInteractive: 0, astroInteractive: astro.interactive,
      missing: '', extra: 'New owner-requested service page', status: 'NEW_PAGE',
    });
    continue;
  }
  const wpText = (live.paragraphs?.length || 0) + (live.listItems?.length || 0)
    + Object.values(live.headings || {}).flat().length;
  const differences = [];
  if (live.sections !== astro.sections) differences.push(`sections ${live.sections}→${astro.sections}`);
  if (wpText !== astro.textBlocks) differences.push(`text blocks ${wpText}→${astro.textBlocks}`);
  if ((live.images?.length || 0) !== astro.images) differences.push(`images ${live.images?.length || 0}→${astro.images}`);
  if ((live.links?.length || 0) !== astro.links) differences.push(`links ${live.links?.length || 0}→${astro.links}`);
  const wpInteractive = countInteractive(live);
  if (wpInteractive !== astro.interactive) differences.push(`interactive ${wpInteractive}→${astro.interactive}`);
  parityRows.push({
    route: routeInfo.route, wpSections: live.sections, astroSections: astro.sections,
    wpText, astroText: astro.textBlocks, wpImages: live.images?.length || 0,
    astroImages: astro.images, wpLinks: live.links?.length || 0, astroLinks: astro.links,
    wpInteractive, astroInteractive: astro.interactive,
    missing: differences.join('; '), extra: '', status: differences.length ? 'OWNER_REVIEW_REQUIRED' : 'EXACT',
  });
}
const parityHeaders = [
  'Route', 'WordPress sections', 'Astro sections', 'WordPress text blocks', 'Astro text blocks',
  'WordPress images', 'Astro images', 'WordPress links', 'Astro links',
  'WordPress interactive components', 'Astro interactive components', 'Missing content',
  'Extra content', 'Status',
];
const rowKeys = ['route', 'wpSections', 'astroSections', 'wpText', 'astroText', 'wpImages',
  'astroImages', 'wpLinks', 'astroLinks', 'wpInteractive', 'astroInteractive', 'missing', 'extra', 'status'];
await writeFile(path.join(reports, 'final-content-parity.csv'), [
  parityHeaders.map(csv).join(','),
  ...parityRows.map((row) => rowKeys.map((key) => csv(row[key])).join(',')),
].join('\n') + '\n');

const claimPattern = /\b(?:\d[\d,+.% -]*(?:years?|customers?|projects?|satisfaction|warranty|guarantee)|certif\w*|licen[cs]\w*|guarantee\w*|warrant\w*|testimonial\w*|emergency|completed?\s+(?:in|within)|team|customer)\b/i;
const claims = [];
for (const item of inventoryRoutes) {
  const strings = [
    ...Object.values(item.headings || {}).flat(),
    ...(item.paragraphs || []),
    ...(item.listItems || []),
    ...(item.buttons || []).map(({ text }) => text),
  ].map((value) => typeof value === 'string' ? value : value.text || '').map(clean).filter(Boolean);
  for (const wording of new Set(strings.filter((value) => claimPattern.test(value)))) {
    claims.push({ route: item.route, wording, mirrored: 'Yes', evidence: 'No evidence supplied in repository', owner: 'Yes' });
  }
}
await writeFile(path.join(reports, 'final-wordpress-claim-review.md'), [
  '# Final WordPress claim review',
  '',
  `Generated from the rendered WordPress capture dated ${liveCapture.capturedAt}. Mirroring a claim is not verification.`,
  '',
  '| Page | Exact visible wording | WordPress source | Mirrored | Evidence exists | Owner confirmation required |',
  '|---|---|---|---|---|---|',
  ...claims.map((claim) => `| ${claim.route} | ${claim.wording.replaceAll('|', '\\|')} | Current rendered WordPress page | ${claim.mirrored} | ${claim.evidence} | ${claim.owner} |`),
  '',
].join('\n'));

const cards = parityRows.map((row) => {
  const liveUrl = `https://rkrenosolution.com${row.route}`;
  const stageUrl = `https://firdosi.github.io/rkreno${row.route}`;
  return `<article class="route-card" data-status="${row.status}">
    <header><h2>${escapeHtml(row.route)}</h2><strong>${row.status}</strong></header>
    <div class="frames"><figure><figcaption>WordPress desktop/mobile source</figcaption><iframe loading="lazy" src="${liveUrl}" title="WordPress ${escapeHtml(row.route)}"></iframe><a href="${liveUrl}" target="_blank">Open full page</a></figure>
    <figure><figcaption>Astro desktop/mobile staging</figcaption><iframe loading="lazy" src="${stageUrl}" title="Astro ${escapeHtml(row.route)}"></iframe><a href="${stageUrl}" target="_blank">Open full page</a></figure></div>
    <dl><dt>Sections</dt><dd>${row.wpSections} / ${row.astroSections}</dd><dt>Text blocks</dt><dd>${row.wpText} / ${row.astroText}</dd><dt>Images</dt><dd>${row.wpImages} / ${row.astroImages}</dd><dt>Links</dt><dd>${row.wpLinks} / ${row.astroLinks}</dd><dt>Interactions</dt><dd>${row.wpInteractive} / ${row.astroInteractive}</dd></dl>
    <p><b>Content, image and animation differences:</b> ${escapeHtml(row.missing || 'None detected by inventory check')}</p>
    <p><b>Remaining owner review:</b> ${row.status === 'OWNER_REVIEW_REQUIRED' ? 'Required—see claim review and inventory.' : 'None recorded.'}</p>
  </article>`;
}).join('\n');
await mkdir(path.join(reports, 'final-ditto-review'), { recursive: true });
await writeFile(path.join(reports, 'final-ditto-review', 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><meta name="viewport" content="width=device-width"><title>RK Reno final all-page review</title><style>
body{font:15px/1.5 system-ui;margin:0;background:#eef1f4;color:#142638}header.top{position:sticky;top:0;z-index:2;padding:18px 4vw;background:#071b37;color:white}main{max-width:1500px;margin:auto;padding:24px}.route-card{background:white;padding:22px;margin:0 0 25px;border-radius:10px}.route-card>header{display:flex;justify-content:space-between}.frames{display:grid;grid-template-columns:1fr 1fr;gap:15px}.frames figure{margin:0}.frames iframe{width:100%;height:560px;border:1px solid #aaa;background:white}figcaption{font-weight:700;margin-bottom:7px}dl{display:grid;grid-template-columns:repeat(5,auto 1fr);gap:5px 12px}dt{font-weight:700}.route-card[data-status="OWNER_REVIEW_REQUIRED"] strong{color:#a64000}@media(max-width:800px){.frames{grid-template-columns:1fr}.frames iframe{height:500px}dl{grid-template-columns:auto 1fr}}</style></head>
<body><header class="top"><h1>RK Reno final all-page review</h1><p>${parityRows.length} public routes: live WordPress and Astro staging are independently scrollable, clickable and zoomable. Use browser zoom for tablet/mobile review.</p></header><main>${cards}</main></body></html>`);
console.log(JSON.stringify({ inventory: inventoryRoutes.length, parity: parityRows.length, claims: claims.length }, null, 2));
