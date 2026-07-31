import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { captureTarget } from './capture-target.mjs';
import { evidenceRoot, statesForViewport, viewports } from './shared-config.mjs';

const registry = JSON.parse(await readFile(path.join(process.cwd(), 'config', 'final-route-registry.json'), 'utf8'));
const routes = registry.publicRoutes.filter(({ mirrored }) => mirrored).map(({ path: route }) => route);
const sessionId = `prompt-1-2-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const manifest = {
  schemaVersion: 2,
  sessionId,
  startedAt: new Date().toISOString(),
  routes,
  viewports,
  expectedEvidencePairs: routes.length * Object.keys(viewports).length,
  expectedScreenshotPairs: routes.length
    * Object.values(statesForViewport).reduce((total, states) => total + states.length, 0),
  completed: [],
  screenshots: [],
  failures: [],
};
await mkdir(evidenceRoot, { recursive: true });
await writeFile(path.join(evidenceRoot, 'capture-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const browser = await chromium.launch();
const sourceContext = await browser.newContext();
const stagingContext = await browser.newContext();
const workerCount = 2;
const workers = await Promise.all(Array.from({ length: workerCount }, async () => ({
  sourcePage: await sourceContext.newPage(),
  stagingPage: await stagingContext.newPage(),
})));

for (const [viewportName, viewport] of Object.entries(viewports)) {
  await Promise.all(workers.flatMap(({ sourcePage, stagingPage }) => [
    sourcePage.setViewportSize(viewport),
    stagingPage.setViewportSize(viewport),
  ]));
  let nextRouteIndex = 0;
  await Promise.all(workers.map(async ({ sourcePage, stagingPage }) => {
    while (nextRouteIndex < routes.length) {
      const route = routes[nextRouteIndex];
      nextRouteIndex += 1;
      try {
        const [source, staging] = await Promise.all([
          captureTarget({ page: sourcePage, target: 'source', route, viewportName, sessionId }),
          captureTarget({ page: stagingPage, target: 'staging', route, viewportName, sessionId }),
        ]);
        manifest.completed.push({
          route,
          viewport: viewportName,
          sourceCapturedAt: source.capturedAt,
          stagingCapturedAt: staging.capturedAt,
        });
        const stateCaptures = (evidence) => ({
          'header-initial': evidence.captures.headerInitial,
          'header-sticky': evidence.interaction.sticky.capture,
          'dropdown-open': evidence.interaction.dropdown?.capture,
          'menu-open': evidence.interaction.mobileMenu?.menuCapture,
          'submenu-open': evidence.interaction.mobileMenu?.submenuCapture,
          footer: evidence.captures.footer,
          'floating-actions': evidence.captures.floatingActions,
        });
        const sourceCaptures = stateCaptures(source);
        const stagingCaptures = stateCaptures(staging);
        for (const state of Object.keys(sourceCaptures)) {
          if (!sourceCaptures[state] && !stagingCaptures[state]) continue;
          manifest.screenshots.push({
            route,
            viewport: viewportName,
            state,
            source: sourceCaptures[state] || null,
            staging: stagingCaptures[state] || null,
            differenceScreenshot: path.join(
              evidenceRoot, 'differences', viewportName,
              route === '/' ? 'home' : route.slice(1, -1).replaceAll('/', '__'),
              `${state}.png`,
            ),
          });
        }
        console.log(`CAPTURED ${viewportName} ${route}`);
      } catch (error) {
        manifest.failures.push({ route, viewport: viewportName, message: error.message });
        console.error(`CAPTURE FAILED ${viewportName} ${route}: ${error.message}`);
      }
      await writeFile(path.join(evidenceRoot, 'capture-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    }
  }));
}

await browser.close();
manifest.finishedAt = new Date().toISOString();
manifest.passed = manifest.failures.length === 0 && manifest.completed.length === manifest.expectedEvidencePairs;
await writeFile(path.join(evidenceRoot, 'capture-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
if (!manifest.passed) process.exitCode = 1;
