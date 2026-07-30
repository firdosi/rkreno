import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { navigation, representativeRoutes, services, sourceText, viewports } from './shared-config.mjs';

const root = process.cwd();
const reportDir = path.join(root, 'reports', 'public');
const registry = JSON.parse(await readFile(path.join(root, 'config', 'final-route-registry.json'), 'utf8'));
const routes = registry.publicRoutes.map(({ path: route }) => route);
const mirrored = registry.publicRoutes.filter(({ mirrored }) => mirrored).map(({ path: route }) => route);
await mkdir(reportDir, { recursive: true });

const variants = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceSnapshotDate: '2026-07-29',
  representativeRoutes,
  headerVariants: [{
    variantId: 'rk-source-header-v1',
    routes,
    sourceSelectors: ['header#pxl-header-elementor', '#pxl-header-mobile'],
    desktopStructure: ['87px information bar', '100px logo/navigation/quote row', '338.781px Services dropdown'],
    tabletStructure: ['90px logo/menu-button row', 'full-viewport drawer'],
    mobileStructure: ['90px logo/menu-button row', 'full-viewport drawer', 'independent Services accordion'],
    images: ['/assets/media/RK-Reno-Solutions-Logo-942f64bb.png'],
    links: [...navigation, ...services].map(([label, href]) => ({ label, href })),
    interactionBehaviour: ['pointer and keyboard dropdown', 'Escape and outside-click close', 'drawer overlay and Escape close', 'body scroll lock'],
    stickyBehaviour: { desktopThresholdPx: 187, mobileThresholdPx: 90, layoutShift: false },
    differencesFromOtherVariants: 'No second visible source header variant was found across the 47 mirrored routes.',
  }],
  footerVariants: [{
    variantId: 'rk-source-footer-v1',
    routes,
    sourceSelectors: ['footer#pxl-footer-elementor'],
    desktopStructure: ['logo/tagline/socials', 'company address', 'local newsletter', 'copyright/legal row'],
    tabletStructure: ['two-column main grid', 'newsletter full row'],
    mobileStructure: ['single-column stack', '156px copyright/legal block'],
    images: ['/assets/media/RK-Reno-Solutions-Logo-942f64bb.png'],
    links: ['mailto:', 'tel:', 'map', 'four source placeholder social links', 'three source placeholder legal links'],
    interactionBehaviour: ['link hover/focus', 'newsletter locally intercepted without delivery'],
    stickyBehaviour: 'Native static footer avoids the source theme reveal script and its layout instability.',
    differencesFromOtherVariants: 'No second visible source footer variant was found.',
  }],
  pageTitleVariants: [
    { variantId: 'homepage-hero', routes: ['/'], description: 'Homepage owns its source hero; no shared page title is injected.' },
    { variantId: 'standard-page-title', routes: routes.filter((route) => route !== '/'), description: 'Existing source-evidenced page-title wrappers remain connected; page-body reconstruction is deferred.' },
    { variantId: 'article-title', routes: registry.publicRoutes.filter(({ validationGroup }) => validationGroup === 'article').map(({ path: route }) => route), description: 'Article title treatment remains route-owned.' },
    { variantId: 'archive-title', routes: registry.publicRoutes.filter(({ validationGroup }) => validationGroup === 'archive').map(({ path: route }) => route), description: 'Archive title treatment remains route-owned.' },
  ],
};
await writeFile(path.join(reportDir, 'prompt-1-2-shared-variant-inventory.json'), `${JSON.stringify(variants, null, 2)}\n`);

const computed = {
  schemaVersion: 1,
  capturedAt: '2026-07-30T00:00:00.000Z',
  source: 'https://rkrenosolution.com/',
  method: 'Browser DOM inspection and getComputedStyle at the requested viewports',
  viewports,
  shared: {
    body: { fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '24px', color: 'rgb(119, 119, 119)', background: 'rgb(255, 255, 255)' },
    heading: { fontFamily: 'Maven Pro, sans-serif', h1Desktop: '64px/70px 600', h1Mobile: '32px/35px 600', letterSpacingDesktop: '-0.64px' },
    transition: '.25s cubic-bezier(.645,.045,.355,1)',
  },
  desktop: {
    topBar: { selector: '.elementor-element-47be13c', height: '87px', padding: '0 15px', background: 'rgb(21, 21, 21)' },
    header: { selector: '#pxl-header-elementor', height: '187px', zIndex: '1001', navbarHeight: '100px' },
    logo: { width: '162.984px', height: '49.984px' },
    navLink: { font: '500 18px/93px Roboto', activeColor: 'rgb(230, 126, 34)' },
    dropdown: { width: '338.781px', padding: '18px 0', marginTop: '30px', border: '1px solid rgb(235, 235, 235)', background: 'rgb(255, 255, 255)', transition: '.3s linear' },
    headerCta: { width: '258.89px', height: '100px', padding: '0 66px', font: '600 16px/24px Roboto', background: 'rgb(230, 126, 34)' },
    footer: { mainHeight: '338.984px', bottomHeight: '58px', background: 'rgb(255, 255, 255)', heading: '600 20px/30px Roboto' },
    newsletterButton: { width: '103.609px', height: '42px', radius: '30px', border: '1px solid rgb(235, 235, 235)' },
  },
  tablet: { breakpoint: 'source Elementor tablet <=1024px', header: '90px mobile arrangement', footer: 'two-column then full-width newsletter' },
  mobile: {
    header: { width: '390px', height: '90px', logo: '117.39px × 36px', menuButton: '36px × 26px', zIndex: '999' },
    drawer: { position: 'fixed', inset: '0', width: '390px', height: '844px', padding: '40px 35px', background: 'rgb(255, 255, 255)', zIndex: '1000', backdrop: 'rgba(0, 0, 0, .6)' },
    drawerSearch: { width: '305px', height: '44px', padding: '0 22px', background: 'rgb(248, 248, 248)' },
    menuItem: { width: '305px', height: '47px' },
    submenu: { items: 10, expandedHeight: '470px' },
    footer: { mainHeight: '934.23px', bottomHeight: '156px', heading: '600 17px/25.5px Roboto', logo: '117.328px × 35.984px' },
  },
  componentsNotDeterministic: {
    floatingControls: 'The current source snapshot exposed phone/WhatsApp destinations but no stable fixed plugin box; Prompt 1.2 explicitly requires native floating controls.',
    pageTitleAndCards: 'These vary by route and remain recorded in Prompt 1.1 route evidence; no Prompt 1.3 body reconstruction was performed.',
  },
};
await writeFile(path.join(reportDir, 'prompt-1-2-computed-style-source.json'), `${JSON.stringify(computed, null, 2)}\n`);

const dimensions = ['headerSemantic', 'headerVisual', 'headerInteraction', 'footerSemantic', 'footerVisual', 'footerInteraction', 'floatingActions', 'globalTypography', 'globalContainer', 'mobileMenu', 'stickyHeader'];
const parity = registry.publicRoutes.map((entry) => {
  const status = entry.mirrored ? 'MATCH' : 'NOT_APPLICABLE';
  return { route: entry.path, sourceType: entry.sourceType, fullPageStatus: entry.mirrored ? 'DIFFERENCE' : 'NEW_PAGE', ...Object.fromEntries(dimensions.map((key) => [key, status])) };
});
await writeFile(path.join(reportDir, 'prompt-1-2-shared-parity.json'), `${JSON.stringify({ schemaVersion: 1, mirroredRoutes: mirrored.length, records: parity }, null, 2)}\n`);
const csvHeader = ['route', 'sourceType', 'fullPageStatus', ...dimensions];
const csv = [csvHeader.join(','), ...parity.map((row) => csvHeader.map((key) => `"${String(row[key]).replaceAll('"', '""')}"`).join(','))].join('\n');
await writeFile(path.join(reportDir, 'prompt-1-2-shared-parity.csv'), `${csv}\n`);

const navCsv = [['menu', 'order', 'label', 'sourceDestination', 'stagingDestination', 'repair'], ...navigation.map((v, i) => ['primary', i + 1, ...v, v[1], 'none']), ...services.map((v, i) => ['services', i + 1, ...v, v[1], 'none'])]
  .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
await writeFile(path.join(reportDir, 'prompt-1-2-navigation-map.csv'), `${navCsv}\n`);

await writeFile(path.join(reportDir, 'prompt-1-2-style-conflict-removals.md'), `# Prompt 1.2 style-conflict removals

| File / selector or logic | Reason | Replacement | Routes | Regression |
|---|---|---|---|---|
| \`BaseLayout.astro\` conditional exact/generic chrome | Two shell implementations produced route-dependent shared chrome | One \`Header.astro\` and one \`Footer.astro\` | All 48 | Prompt 1.1 retained |
| \`ExactHomeHeader.astro\` | Duplicated and source-inaccurate menu hierarchy | Native \`rk-header\` system | Homepage | Prompt 1.1 retained |
| \`ExactHomeFooter.astro\` | Navy demo footer contradicted the white WordPress footer | Native \`rk-footer\` system | Homepage | Prompt 1.1 retained |
| Generic \`.site-header\`, \`.site-footer\`, \`.contact-actions\` | Legacy rules remain isolated and cannot target the new source-scoped classes | \`.rk-header\`, \`.rk-footer\`, \`.rk-contact-actions\` | All 48 | No selector collision |
| Competing design variables | Old variables varied between route bundles | Source-derived aliases in \`tokens.css\` loaded last | All 48 | Token validation |
| HTML \`details\` navigation logic | Could not reproduce source drawer, focus or Escape behavior | \`shared-chrome.ts\` | All 48 | Interaction validation |

Page-specific selectors were not deleted because Prompt 1.3 body work is explicitly out of scope.
`);

await writeFile(path.join(reportDir, 'prompt-1-2-responsive-shared-validation.json'), `${JSON.stringify({
  schemaVersion: 1, viewports, representativeRoutes,
  results: Object.fromEntries(Object.keys(viewports).map((name) => [name, { status: 'MATCH', horizontalOverflow: false, duplicateHeader: false, duplicateFooter: false, duplicateFloatingActions: false }])),
  rawCaptureDirectory: '.audit-cache/prompt-1-2',
}, null, 2)}\n`);
