import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  evidenceDir, evidenceRoot, slugFor, statesForViewport, viewports,
} from './shared-config.mjs';
import { compareFooterSemantic, compareHeaderSemantic } from './semantic-comparison.mjs';
import {
  compareDesktopInteraction, compareFloatingActions, compareFooterInteraction,
  compareMobileInteraction, compareStickyInteraction,
} from './interaction-comparison.mjs';
import { compareStyles } from './style-comparison.mjs';
import { compareImages } from './visual-comparison.mjs';
import { statusFromDifferences } from './result-status.mjs';

const registry = JSON.parse(await readFile(path.join(process.cwd(), 'config', 'final-route-registry.json'), 'utf8'));
const routes = registry.publicRoutes.filter(({ mirrored }) => mirrored).map(({ path: route }) => route);
const readEvidence = async (target, viewport, route) =>
  JSON.parse(await readFile(path.join(evidenceDir(target, viewport, route), 'evidence.json'), 'utf8'));
const results = [];
const visualMetrics = [];

for (const route of routes) {
  const evidence = {};
  for (const viewport of Object.keys(viewports)) {
    evidence[viewport] = {
      source: await readEvidence('source', viewport, route),
      staging: await readEvidence('staging', viewport, route),
    };
  }
  const headerSemantic = compareHeaderSemantic({
    sourceDesktop: evidence.desktop.source,
    stagingDesktop: evidence.desktop.staging,
    sourceMobile: evidence.mobile.source,
    stagingMobile: evidence.mobile.staging,
  });
  const footerSemantic = compareFooterSemantic(evidence.desktop);
  const headerInteraction = compareDesktopInteraction(evidence.desktop.source, evidence.desktop.staging);
  const footerInteraction = compareFooterInteraction(evidence.desktop.source, evidence.desktop.staging);
  const mobileMenu = compareMobileInteraction(evidence.mobile.source, evidence.mobile.staging);
  const floatingActions = compareFloatingActions(evidence.mobile.source, evidence.mobile.staging);
  const stickyByViewport = {};
  const headerVisualByViewport = {};
  const footerVisualByViewport = {};
  const styleByViewport = {};
  for (const viewport of Object.keys(viewports)) {
    stickyByViewport[viewport] = compareStickyInteraction(evidence[viewport].source, evidence[viewport].staging);
    const stateResults = [];
    for (const state of statesForViewport[viewport]) {
      const sourcePath = path.join(evidenceDir('source', viewport, route), `${state}.png`);
      const stagingPath = path.join(evidenceDir('staging', viewport, route), `${state}.png`);
      const differencePath = path.join(evidenceRoot, 'differences', viewport, slugFor(route), `${state}.png`);
      const metric = await compareImages({ sourcePath, stagingPath, differencePath });
      const record = { route, viewport, state, sourcePath, stagingPath, ...metric };
      visualMetrics.push(record);
      stateResults.push(record);
    }
    const headerStates = stateResults.filter(({ state }) => state.startsWith('header-') || state.includes('menu') || state === 'dropdown-open');
    const footerStates = stateResults.filter(({ state }) => state === 'footer');
    const headerDifferences = headerStates.flatMap((item) => item.differences.map((kind) => ({ state: item.state, kind })));
    const footerDifferences = footerStates.flatMap((item) => item.differences.map((kind) => ({ state: item.state, kind })));
    headerVisualByViewport[viewport] = {
      status: statusFromDifferences(headerDifferences),
      differences: headerDifferences,
      metrics: headerStates,
    };
    footerVisualByViewport[viewport] = {
      status: statusFromDifferences(footerDifferences),
      differences: footerDifferences,
      metrics: footerStates,
    };
    styleByViewport[viewport] = compareStyles(
      evidence[viewport].source,
      evidence[viewport].staging,
      ['body', 'topbar', 'header', 'logo', 'navigation', 'dropdown', 'cta', 'mobileHeader', 'drawer', 'h1', 'h2', 'paragraph', 'button', 'footer', 'footerHeading', 'footerLink', 'newsletter', 'floatingControl'],
    );
  }
  const stickyDifferences = Object.values(stickyByViewport).flatMap(({ differences }) => differences);
  const typography = compareStyles(evidence.desktop.source, evidence.desktop.staging, ['body', 'h1', 'h2', 'paragraph', 'button']);
  const container = compareStyles(evidence.desktop.source, evidence.desktop.staging, ['header', 'navigation', 'footer']);
  results.push({
    route,
    capturedSessionId: evidence.desktop.source.sessionId,
    evidence: Object.fromEntries(Object.keys(viewports).map((viewport) => [viewport, {
      source: path.join(evidenceDir('source', viewport, route), 'evidence.json'),
      staging: path.join(evidenceDir('staging', viewport, route), 'evidence.json'),
      differences: path.join(evidenceRoot, 'differences', viewport, slugFor(route)),
    }])),
    headerSemantic,
    headerVisualDesktop: headerVisualByViewport.desktop,
    headerVisualTablet: headerVisualByViewport.tablet,
    headerVisualMobile: headerVisualByViewport.mobile,
    headerInteraction,
    footerSemantic,
    footerVisualDesktop: footerVisualByViewport.desktop,
    footerVisualTablet: footerVisualByViewport.tablet,
    footerVisualMobile: footerVisualByViewport.mobile,
    footerInteraction,
    floatingActions,
    globalTypography: typography,
    globalContainer: container,
    mobileMenu,
    stickyHeader: { status: statusFromDifferences(stickyDifferences), differences: stickyDifferences, viewports: stickyByViewport },
    computedStyles: styleByViewport,
  });
}

await mkdir(evidenceRoot, { recursive: true });
await writeFile(path.join(evidenceRoot, 'comparison-results.json'), `${JSON.stringify({
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  records: results,
  visualMetrics,
}, null, 2)}\n`);
console.log(`Compared ${results.length} mirrored routes with ${visualMetrics.length} visual state metrics.`);
