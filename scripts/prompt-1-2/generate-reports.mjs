import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { evidenceDir, evidenceRoot, reportRoot, viewports, visualThreshold } from './shared-config.mjs';

const registry = JSON.parse(await readFile(path.join(process.cwd(), 'config', 'final-route-registry.json'), 'utf8'));
const promptOne = JSON.parse(await readFile(path.join(reportRoot, 'prompt-1-1-bidirectional-parity.json'), 'utf8'));
const fullPageStatus = new Map(promptOne.routes.map((record) => [record.route, record.status]));
const comparison = JSON.parse(await readFile(path.join(evidenceRoot, 'comparison-results.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(evidenceRoot, 'capture-manifest.json'), 'utf8'));
const records = comparison.records;
await mkdir(reportRoot, { recursive: true });
const readEvidence = async (target, viewport, route) =>
  JSON.parse(await readFile(path.join(evidenceDir(target, viewport, route), 'evidence.json'), 'utf8'));

const sourceEvidence = {};
for (const record of records) {
  sourceEvidence[record.route] = {};
  for (const viewport of Object.keys(viewports)) {
    sourceEvidence[record.route][viewport] = await readEvidence('source', viewport, record.route);
  }
}

const signatureGroups = (selector) => {
  const groups = new Map();
  for (const record of records) {
    const signatureValue = selector(sourceEvidence[record.route]);
    const signature = JSON.stringify(signatureValue);
    const existing = groups.get(signature) || { routes: [], structure: signatureValue };
    existing.routes.push(record.route);
    groups.set(signature, existing);
  }
  return [...groups.values()];
};
const headerGroups = signatureGroups((evidence) => ({
  topbar: evidence.desktop.inventory.topbarItems,
  primary: evidence.desktop.inventory.primaryMenu,
  dropdown: evidence.desktop.inventory.dropdownItems,
  cta: evidence.desktop.inventory.cta,
  mobile: evidence.mobile.inventory.mobileMenu,
  mobileSubmenu: evidence.mobile.inventory.mobileSubmenu,
}));
const footerGroups = signatureGroups((evidence) => evidence.desktop.inventory.footer);
const variants = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  captureSessionId: manifest.sessionId,
  inspectedMirroredRoutes: records.length,
  headerVariants: headerGroups.map((group, index) => ({
    variantId: `measured-header-${index + 1}`,
    routes: group.routes,
    sourceSelectors: ['header#pxl-header-elementor', '#pxl-header-mobile'],
    measuredStructure: group.structure,
    evidence: group.routes.map((route) => path.join(evidenceDir('source', 'desktop', route), 'evidence.json')),
  })),
  footerVariants: footerGroups.map((group, index) => ({
    variantId: `measured-footer-${index + 1}`,
    routes: group.routes,
    sourceSelectors: ['footer#pxl-footer-elementor'],
    measuredStructure: group.structure,
    evidence: group.routes.map((route) => path.join(evidenceDir('source', 'desktop', route), 'evidence.json')),
  })),
};
await writeFile(path.join(reportRoot, 'prompt-1-2-shared-variant-inventory.json'), `${JSON.stringify(variants, null, 2)}\n`);

const computedSource = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  captureSessionId: manifest.sessionId,
  method: 'Fresh Playwright getComputedStyle and bounding-box capture after fonts, images, CSS, JavaScript and transitions settled.',
  records: records.map((record) => ({
    route: record.route,
    viewports: Object.fromEntries(Object.keys(viewports).map((viewport) => [
      viewport,
      Object.fromEntries(record.computedStyles[viewport].records.map(({ component, source }) => [component, source])),
    ])),
  })),
};
await writeFile(path.join(reportRoot, 'prompt-1-2-computed-style-source.json'), `${JSON.stringify(computedSource, null, 2)}\n`);
const computedComparison = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  captureSessionId: manifest.sessionId,
  records: records.map((record) => ({
    route: record.route,
    viewports: record.computedStyles,
  })),
};
await writeFile(path.join(reportRoot, 'prompt-1-2-computed-style-comparison.json'), `${JSON.stringify(computedComparison, null, 2)}\n`);

const dimensions = [
  'headerSemantic', 'headerVisualDesktop', 'headerVisualTablet', 'headerVisualMobile',
  'headerInteraction', 'footerSemantic', 'footerVisualDesktop', 'footerVisualTablet',
  'footerVisualMobile', 'footerInteraction', 'floatingActions', 'globalTypography',
  'globalContainer', 'mobileMenu', 'stickyHeader',
];
const parityRecords = records.map((record) => ({
  route: record.route,
  sourceType: 'wordpress',
  fullPageStatus: fullPageStatus.get(record.route),
  evidence: record.evidence,
  ...Object.fromEntries(dimensions.map((dimension) => [dimension, {
    status: record[dimension].status,
    differences: record[dimension].differences,
    metrics: record[dimension].metrics,
  }])),
}));
const parity = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  captureSessionId: manifest.sessionId,
  visualThreshold,
  records: parityRecords,
};
await writeFile(path.join(reportRoot, 'prompt-1-2-shared-parity.json'), `${JSON.stringify(parity, null, 2)}\n`);
const csvColumns = ['route', 'fullPageStatus', ...dimensions];
const csv = [
  csvColumns.join(','),
  ...parityRecords.map((record) => csvColumns.map((column) => {
    const value = column === 'route' || column === 'fullPageStatus' ? record[column] : record[column].status;
    return `"${String(value).replaceAll('"', '""')}"`;
  }).join(',')),
].join('\n');
await writeFile(path.join(reportRoot, 'prompt-1-2-shared-parity.csv'), `${csv}\n`);

const visualColumns = [
  'route', 'viewport', 'state', 'sourcePath', 'stagingPath', 'differencePath',
  'sourceWidth', 'sourceHeight', 'stagingWidth', 'stagingHeight', 'dimensionsEqual',
  'changedPixels', 'totalPixels', 'changedPixelPercent', 'meanAbsoluteChannelDelta',
  'channelDeltaThreshold', 'allowedChangedPixelPercent', 'evidenceComplete',
];
const visualCsv = [
  visualColumns.join(','),
  ...comparison.visualMetrics.map((metric) => {
    const row = {
      ...metric,
      sourceWidth: metric.sourceDimensions?.width,
      sourceHeight: metric.sourceDimensions?.height,
      stagingWidth: metric.stagingDimensions?.width,
      stagingHeight: metric.stagingDimensions?.height,
    };
    return visualColumns.map((column) => `"${String(row[column] ?? '').replaceAll('"', '""')}"`).join(',');
  }),
].join('\n');
await writeFile(path.join(reportRoot, 'prompt-1-2-shared-visual-metrics.csv'), `${visualCsv}\n`);

const interactionComparison = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  captureSessionId: manifest.sessionId,
  records: records.map((record) => ({
    route: record.route,
    headerInteraction: record.headerInteraction,
    footerInteraction: record.footerInteraction,
    mobileMenu: record.mobileMenu,
    stickyHeader: record.stickyHeader,
    floatingActions: record.floatingActions,
  })),
};
await writeFile(path.join(reportRoot, 'prompt-1-2-shared-interaction-comparison.json'), `${JSON.stringify(interactionComparison, null, 2)}\n`);

const responsive = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  captureSessionId: manifest.sessionId,
  records: records.flatMap((record) => Object.keys(viewports).map((viewport) => ({
    route: record.route,
    viewport,
    sourceOverflow: sourceEvidence[record.route][viewport].page.scrollWidth > sourceEvidence[record.route][viewport].page.clientWidth,
    stagingOverflow: record.computedStyles[viewport].records.find(({ component }) => component === 'body')?.staging?.box?.width > viewports[viewport].width,
    headerVisualStatus: record[`headerVisual${viewport[0].toUpperCase()}${viewport.slice(1)}`].status,
    footerVisualStatus: record[`footerVisual${viewport[0].toUpperCase()}${viewport.slice(1)}`].status,
    visualMetrics: comparison.visualMetrics.filter((metric) => metric.route === record.route && metric.viewport === viewport),
  }))),
};
await writeFile(path.join(reportRoot, 'prompt-1-2-responsive-shared-validation.json'), `${JSON.stringify(responsive, null, 2)}\n`);

const firstDesktop = await readEvidence('source', 'desktop', records[0].route);
const firstStaging = JSON.parse(await readFile(path.join(evidenceDir('staging', 'desktop', records[0].route), 'evidence.json'), 'utf8'));
const rows = [['area', 'order', 'sourceLabel', 'sourceDestination', 'stagingLabel', 'stagingDestination']];
for (const [area, sourceItems, stagingItems] of [
  ['primary', firstDesktop.inventory.primaryMenu, firstStaging.inventory.primaryMenu],
  ['services', firstDesktop.inventory.dropdownItems, firstStaging.inventory.dropdownItems],
]) {
  const length = Math.max(sourceItems.length, stagingItems.length);
  for (let index = 0; index < length; index += 1) {
    rows.push([area, index + 1, sourceItems[index]?.label || '', sourceItems[index]?.href || '', stagingItems[index]?.label || '', stagingItems[index]?.href || '']);
  }
}
const navigationCsv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
await writeFile(path.join(reportRoot, 'prompt-1-2-navigation-map.csv'), `${navigationCsv}\n`);
