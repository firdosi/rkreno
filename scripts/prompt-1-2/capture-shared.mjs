import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { representativeRoutes, viewports } from './shared-config.mjs';

const root = process.cwd();
const baseUrl = process.env.PROMPT_1_2_BASE_URL || 'http://127.0.0.1:4321/rkreno';
const raw = path.join(root, '.audit-cache', 'prompt-1-2');
const visuals = path.join(root, 'reports', 'public', 'visuals', 'prompt-1-2');
const quickOnly = process.argv.includes('--quick-only');
await mkdir(raw, { recursive: true });
await mkdir(visuals, { recursive: true });
const slug = (route) => route === '/' ? 'home' : route.slice(1, -1).replaceAll('/', '__');
const browser = await chromium.launch();
const page = await browser.newPage();

for (const [name, viewport] of Object.entries(viewports)) {
  if (quickOnly) break;
  await page.setViewportSize(viewport);
  for (const route of representativeRoutes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    await page.locator('[data-shared-header]').screenshot({ path: path.join(raw, `${name}-${slug(route)}-header-initial.png`) });
    const footerCaptureStyle = await page.addStyleTag({ content: '.rk-header,.rk-contact-actions,.skip-link{display:none!important}' });
    await page.locator('[data-shared-footer]').screenshot({ path: path.join(raw, `${name}-${slug(route)}-footer.png`) });
    await footerCaptureStyle.evaluate((element) => element.remove());
    await page.evaluate(() => scrollTo(0, 700));
    await page.waitForTimeout(100);
    await page.locator('[data-shared-header]').screenshot({ path: path.join(raw, `${name}-${slug(route)}-header-scrolled.png`) });
    if (name === 'desktop') {
      await page.evaluate(() => scrollTo(0, 0));
      await page.locator('.rk-nav__toggle').click();
      await page.waitForTimeout(350);
      await page.locator('[data-shared-header]').screenshot({ path: path.join(raw, `${name}-${slug(route)}-dropdown-open.png`) });
    } else {
      await page.evaluate(() => scrollTo(0, 0));
      await page.locator('.rk-menu-button').click();
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(raw, `${name}-${slug(route)}-menu-open.png`) });
      await page.keyboard.press('Escape');
    }
  }
}

if (quickOnly) {
  await page.setViewportSize(viewports.desktop);
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.locator('[data-shared-header]').screenshot({ path: path.join(raw, 'desktop-home-header-initial.png') });
  let style = await page.addStyleTag({ content: '.rk-header,.rk-contact-actions,.skip-link{display:none!important}' });
  await page.locator('[data-shared-footer]').screenshot({ path: path.join(raw, 'desktop-home-footer.png') });
  await style.evaluate((element) => element.remove());
  await page.setViewportSize(viewports.mobile);
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.locator('.rk-menu-button').click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(raw, 'mobile-home-menu-open.png') });
  await page.keyboard.press('Escape');
  style = await page.addStyleTag({ content: '.rk-header,.rk-contact-actions,.skip-link{display:none!important}' });
  await page.locator('[data-shared-footer]').screenshot({ path: path.join(raw, 'mobile-home-footer.png') });
  await style.evaluate((element) => element.remove());
}

const liveDesktop = await browser.newPage({ viewport: viewports.desktop });
await liveDesktop.goto('https://rkrenosolution.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await liveDesktop.locator('header').screenshot({ path: path.join(raw, 'source-desktop-header.png') });
await liveDesktop.addStyleTag({ content: 'header,.pxl-scroll-top{display:none!important}footer{position:static!important;z-index:1!important}' });
await liveDesktop.locator('footer').screenshot({ path: path.join(raw, 'source-desktop-footer.png') });
await liveDesktop.close();

const live = await browser.newPage({ viewport: viewports.mobile });
await live.goto('https://rkrenosolution.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
const sourceMenu = live.locator('#pxl-nav-mobile');
if (await sourceMenu.count() === 1) await sourceMenu.click();
await live.waitForTimeout(500);
await live.screenshot({ path: path.join(raw, 'source-mobile-menu-open.png') });
await live.keyboard.press('Escape');
await live.addStyleTag({ content: 'header,.pxl-scroll-top{display:none!important}footer{position:static!important;z-index:1!important}' });
await live.locator('footer').screenshot({ path: path.join(raw, 'source-mobile-footer.png') });
await live.close();
await browser.close();

const sourceDesktop = path.join(raw, 'source-desktop-header.png');
const sourceDesktopFooter = path.join(raw, 'source-desktop-footer.png');
const sourceMobileFooter = path.join(raw, 'source-mobile-footer.png');
const localDesktopHeader = path.join(raw, 'desktop-home-header-initial.png');
const localDesktopFooter = path.join(raw, 'desktop-home-footer.png');
const localMobileMenu = path.join(raw, 'mobile-home-menu-open.png');
const localMobileFooter = path.join(raw, 'mobile-home-footer.png');

const sideBySide = async ({ left, right, leftCrop, rightCrop, output, width }) => {
  const l = await sharp(left).extract(leftCrop).resize({ width, height: leftCrop.height, fit: 'fill' }).png().toBuffer();
  const r = await sharp(right).extract(rightCrop).resize({ width, height: rightCrop.height, fit: 'fill' }).png().toBuffer();
  const height = Math.max(leftCrop.height, rightCrop.height);
  await sharp({ create: { width: width * 2, height, channels: 4, background: '#ffffff' } })
    .composite([{ input: l, left: 0, top: 0 }, { input: r, left: width, top: 0 }]).png().toFile(output);
};
const desktopSourceMeta = await sharp(sourceDesktopFooter).metadata();
const mobileSourceMeta = await sharp(sourceMobileFooter).metadata();
const desktopFooterMeta = await sharp(localDesktopFooter).metadata();
const mobileFooterMeta = await sharp(localMobileFooter).metadata();
await sideBySide({ left: sourceDesktop, right: localDesktopHeader, leftCrop: { left: 0, top: 0, width: 1440, height: 187 }, rightCrop: { left: 0, top: 0, width: 1440, height: 187 }, output: path.join(visuals, 'header-desktop-side-by-side.png'), width: 720 });
await sideBySide({ left: path.join(raw, 'source-mobile-menu-open.png'), right: localMobileMenu, leftCrop: { left: 0, top: 0, width: 390, height: 844 }, rightCrop: { left: 0, top: 0, width: 390, height: 844 }, output: path.join(visuals, 'header-mobile-menu-side-by-side.png'), width: 390 });
await sideBySide({ left: sourceDesktopFooter, right: localDesktopFooter, leftCrop: { left: 0, top: 0, width: desktopSourceMeta.width, height: Math.min(397, desktopSourceMeta.height) }, rightCrop: { left: 0, top: 0, width: desktopFooterMeta.width, height: Math.min(397, desktopFooterMeta.height) }, output: path.join(visuals, 'footer-desktop-side-by-side.png'), width: 720 });
await sideBySide({ left: sourceMobileFooter, right: localMobileFooter, leftCrop: { left: 0, top: 0, width: mobileSourceMeta.width, height: Math.min(844, mobileSourceMeta.height) }, rightCrop: { left: 0, top: 0, width: mobileFooterMeta.width, height: Math.min(844, mobileFooterMeta.height) }, output: path.join(visuals, 'footer-mobile-side-by-side.png'), width: 390 });
