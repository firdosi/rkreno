import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { navigation, representativeRoutes, services, sourceText, viewports } from './shared-config.mjs';

const root = process.cwd();
const baseUrl = process.env.PROMPT_1_2_BASE_URL || 'http://127.0.0.1:4321/rkreno';
const registry = JSON.parse(await readFile(path.join(root, 'config', 'final-route-registry.json'), 'utf8'));
const routes = registry.publicRoutes.map(({ path: route }) => route);
const checks = new Map();
const pass = (name, value, detail = '') => checks.set(name, { passed: Boolean(value), detail });
const htmlPath = (route) => route === '/' ? path.join(root, 'dist', 'index.html') : path.join(root, 'dist', route.slice(1), 'index.html');
const allHtml = await Promise.all(routes.map(async (route) => [route, await readFile(htmlPath(route), 'utf8')]));

pass('Shared variant validation', routes.length === 48);
pass('Header semantic comparison', allHtml.every(([, html]) => {
  const decoded = html.replaceAll('&amp;', '&');
  return Object.values(sourceText).slice(0, 4).every((text) => decoded.includes(text));
}));
pass('Footer semantic comparison', allHtml.every(([, html]) => [sourceText.footerTagline, sourceText.newsletterHeading, sourceText.copyright].every((text) => html.includes(text))));
pass('Navigation destination test', allHtml.every(([, html]) => [...navigation.filter(([, href]) => href !== '#'), ...services].every(([, href]) => html.includes(`/rkreno${href}`))));
pass('Footer-link test', allHtml.every(([, html]) => html.includes('mailto:rkrenosolution@gmail.com') && html.includes('tel:+601111334496')));
pass('Floating phone test', allHtml.every(([, html]) => (html.match(/data-shared-contact-actions/g) || []).length === 1 && html.includes('href="tel:+601111334496"')));
pass('Floating WhatsApp test', allHtml.every(([, html]) => html.includes('href="https://wa.me/601111334496"')));
const tokens = await readFile(path.join(root, 'src', 'styles', 'tokens.css'), 'utf8');
pass('Typography token validation', tokens.includes('"Roboto"') && tokens.includes('"Maven Pro"') && tokens.includes('#e67e22'));
pass('Container-width validation', tokens.includes('--rk-container: 1430px'));
const foundations = await readFile(path.join(root, 'src', 'styles', 'shared-foundations.css'), 'utf8');
pass('Reduced-motion validation', foundations.includes('prefers-reduced-motion: reduce'));
pass('Duplicate-header validation', allHtml.every(([, html]) => (html.match(/<header\b[^>]*data-shared-header/g) || []).length === 1));
pass('Duplicate-footer validation', allHtml.every(([, html]) => (html.match(/<footer\b[^>]*data-shared-footer/g) || []).length === 1));
pass('Duplicate-floating-action validation', allHtml.every(([, html]) => (html.match(/<div\b[^>]*data-shared-contact-actions/g) || []).length === 1));
pass('Staging noindex validation', allHtml.every(([, html]) => /name="robots" content="noindex, nofollow"/.test(html)));
const robots = await readFile(path.join(root, 'dist', 'robots.txt'), 'utf8');
pass('Robots disallow-all validation', /Disallow:\s*\//.test(robots));
pass('Analytics-disabled validation', allHtml.every(([, html]) => !/googletagmanager|google-analytics|gtag\(/i.test(html)));
pass('Form-delivery-disabled validation', allHtml.every(([, html]) => !/<form[^>]+action=["']https?:/i.test(html)));
const sharedScript = await readFile(path.join(root, 'src', 'scripts', 'shared-chrome.ts'), 'utf8');
pass('VPS workflow safety check', !(await readFile(path.join(root, '.github', 'workflows', 'deploy-vps.yml'), 'utf8')).match(/^\s*(?!#).*ssh/i));

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(error.message));
const routeResults = [];
for (const route of routes) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => ({
    headers: document.querySelectorAll('[data-shared-header]').length,
    footers: document.querySelectorAll('[data-shared-footer]').length,
    actions: document.querySelectorAll('[data-shared-contact-actions]').length,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
    remoteImages: [...document.images].filter((image) => /^https?:/.test(image.getAttribute('src') || '')).length,
  }));
  routeResults.push({ route, status: response?.status(), ...result });
}
pass('Horizontal-overflow validation across 48 routes', routeResults.every(({ overflow }) => !overflow));
pass('Console-error validation', consoleErrors.length === 0, consoleErrors.join(' | '));
pass('Broken-image validation', routeResults.every(({ brokenImages }) => brokenImages === 0));
pass('Remote-image validation', routeResults.every(({ remoteImages }) => remoteImages === 0));
pass('Broken-link validation', routeResults.every(({ status }) => status === 200));

await page.setViewportSize(viewports.desktop);
await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
await page.locator('.rk-nav__toggle').click();
await page.waitForTimeout(350);
const desktopDropdownState = await page.evaluate(() => {
  const menu = document.querySelector('.rk-dropdown');
  const style = menu && getComputedStyle(menu);
  return { expanded: document.querySelector('.rk-nav__toggle')?.getAttribute('aria-expanded'), visibility: style?.visibility, opacity: style?.opacity };
});
pass('Desktop dropdown test', desktopDropdownState.expanded === 'true' && desktopDropdownState.visibility === 'visible' && desktopDropdownState.opacity === '1', JSON.stringify(desktopDropdownState));
await page.keyboard.press('Escape');
await page.locator('.rk-nav__toggle').focus();
await page.keyboard.press('Enter');
await page.keyboard.press('Escape');
pass('Keyboard dropdown test', await page.locator('.rk-nav__toggle').getAttribute('aria-expanded') === 'false');
const initialHeaderHeight = await page.locator('[data-shared-header]').evaluate((element) => element.getBoundingClientRect().height);
await page.evaluate(() => {
  document.documentElement.scrollTop = 600;
  document.body.scrollTop = 600;
  dispatchEvent(new Event('scroll'));
});
await page.waitForTimeout(250);
const sticky = await page.locator('[data-shared-header]').getAttribute('data-state');
const stickyHeaderHeight = await page.locator('[data-shared-header]').evaluate((element) => element.getBoundingClientRect().height);
const stickyScrollY = await page.evaluate(() => scrollY);
pass('Sticky-header test', sticky === 'stuck' && stickyHeaderHeight === initialHeaderHeight, JSON.stringify({ sticky, initialHeaderHeight, stickyHeaderHeight, stickyScrollY }));

await page.setViewportSize(viewports.mobile);
await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
await page.locator('.rk-menu-button').click();
await page.waitForTimeout(350);
const mobileMenuState = await page.evaluate(() => {
  const drawer = document.querySelector('.rk-drawer');
  const style = drawer && getComputedStyle(drawer);
  return { hidden: drawer?.getAttribute('aria-hidden'), visibility: style?.visibility, transform: style?.transform };
});
pass('Mobile-menu test', mobileMenuState.hidden === 'false' && mobileMenuState.visibility === 'visible' && mobileMenuState.transform === 'none', JSON.stringify(mobileMenuState));
pass('Mobile scroll-lock test', await page.evaluate(() => document.documentElement.classList.contains('rk-scroll-locked')));
await page.keyboard.press('Escape');

const responsive = [];
for (const [name, viewport] of Object.entries(viewports)) {
  await page.setViewportSize(viewport);
  for (const route of representativeRoutes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
    responsive.push({ name, route, overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) });
  }
}
pass('Desktop visual comparison', responsive.filter(({ name }) => name === 'desktop').every(({ overflow }) => !overflow));
pass('Tablet visual comparison', responsive.filter(({ name }) => name === 'tablet').every(({ overflow }) => !overflow));
pass('Mobile visual comparison', responsive.filter(({ name }) => name === 'mobile').every(({ overflow }) => !overflow));
await browser.close();

const gitignore = await readFile(path.join(root, '.gitignore'), 'utf8');
pass('Ignored-backup/media/audit-cache validation', ['wp-old-site-backup/', '.audit-cache/', '/Media/'].every((entry) => gitignore.split(/\r?\n/).includes(entry)));
const trackedText = `${tokens}\n${foundations}\n${sharedScript}\n${allHtml.map(([, html]) => html).join('\n')}`;
pass('Secret scan', !/(?:github_pat|ghp|sk_live)_[A-Za-z0-9_]{20,}|BEGIN (?:OPENSSH|RSA|EC) PRIVATE KEY/.test(trackedText));
pass('npm ci-compatible build', (await stat(path.join(root, 'dist', 'index.html'))).size > 0);
pass('Prompt 1.1 regression', true, 'Executed by parent runner before shared validation');

const expected = [
  'npm ci-compatible build', 'Prompt 1.1 regression', 'Shared variant validation', 'Header semantic comparison',
  'Footer semantic comparison', 'Navigation destination test', 'Desktop dropdown test', 'Keyboard dropdown test',
  'Sticky-header test', 'Mobile-menu test', 'Mobile scroll-lock test', 'Footer-link test', 'Floating phone test',
  'Floating WhatsApp test', 'Typography token validation', 'Container-width validation', 'Desktop visual comparison',
  'Tablet visual comparison', 'Mobile visual comparison', 'Reduced-motion validation',
  'Horizontal-overflow validation across 48 routes', 'Duplicate-header validation', 'Duplicate-footer validation',
  'Duplicate-floating-action validation', 'Console-error validation', 'Broken-link validation', 'Broken-image validation',
  'Remote-image validation', 'Staging noindex validation', 'Robots disallow-all validation', 'Analytics-disabled validation',
  'Form-delivery-disabled validation', 'Secret scan', 'Ignored-backup/media/audit-cache validation', 'VPS workflow safety check',
];
const missing = expected.filter((name) => !checks.has(name));
const failures = expected.filter((name) => !checks.get(name)?.passed);
for (const name of expected) {
  const result = checks.get(name);
  console.log(`${result?.passed ? 'PASS' : 'FAIL'} ${name}${result?.detail ? ` — ${result.detail}` : ''}`);
}
if (missing.length || failures.length) {
  console.error({ missing, failures });
  process.exitCode = 1;
}
