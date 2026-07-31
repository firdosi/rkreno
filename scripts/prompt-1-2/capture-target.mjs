import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { evidenceDir, sourceOrigin, stagingBase } from './shared-config.mjs';
import {
  captureElement, captureFloatingRegion, captureIsolatedFooter, captureUnion,
} from './capture-geometry.mjs';
import { extractEvidence } from './evidence-extractors.mjs';

const selectors = {
  source: {
    header: 'header#pxl-header-elementor',
    footer: 'footer#pxl-footer-elementor',
    desktopToggle: '#menu-menu-main > li:nth-child(2) > a',
    dropdown: '#menu-menu-main > li:nth-child(2) .sub-menu',
    mobileToggle: '#pxl-nav-mobile',
    drawer: '.pxl-header-menu',
    close: '.pxl-menu-close',
    submenuToggle: '#menu-menu-main-2 > li:nth-child(2) .pxl-menu-toggle',
    overlay: '.pxl-header-menu-backdrop',
    topbar: '.elementor-element-47be13c, .elementor-element-364a77d',
    logo: '.pxl-header-elementor-sticky .pxl-logo img, .pxl-header-mobile-fixed .pxl-logo img, #pxl-header-mobile img, #pxl-header-elementor .pxl-logo img',
    stickyDesktop: '.pxl-header-elementor-sticky',
    stickyMobile: '.pxl-header-mobile-fixed',
    stickyActivation: '.pxl-header-elementor-sticky',
  },
  staging: {
    header: '[data-shared-header]',
    footer: '[data-shared-footer]',
    desktopToggle: '.rk-nav__toggle',
    dropdown: '.rk-dropdown',
    mobileToggle: '.rk-menu-button',
    drawer: '.rk-drawer',
    close: '.rk-drawer__close',
    submenuToggle: '.rk-submenu-button',
    overlay: '.rk-drawer-backdrop',
    topbar: '.rk-topbar',
    logo: '.rk-mobilebar__brand img, .rk-brand img',
    stickyDesktop: '.rk-header__desktop',
    stickyMobile: '.rk-mobilebar',
    stickyActivation: '[data-shared-header]',
  },
};

const waitReady = async (page) => {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async () => {
    await document.fonts.ready;
    const pendingImages = [...document.images]
      .filter((image) => !image.loading || image.loading !== 'lazy')
      .map((image) => image.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        }));
    await Promise.race([
      Promise.all(pendingImages),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  });
  await page.waitForTimeout(650);
};

const elementState = async (page, selector) => page.locator(selector).evaluateAll((elements) => {
  const element = elements.find((candidate) => {
    const style = getComputedStyle(candidate);
    const box = candidate.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0
      && box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth;
  }) || elements[0];
  if (!element) return null;
  const style = getComputedStyle(element);
  const box = element.getBoundingClientRect();
  return {
    box: { x: box.x, y: box.y, width: box.width, height: box.height },
    display: style.display,
    visibility: style.visibility,
    opacity: style.opacity,
    position: style.position,
    transform: style.transform,
    transition: style.transition,
    backgroundColor: style.backgroundColor,
    boxShadow: style.boxShadow,
  };
});

const measureStickyThreshold = async (page, selector) => {
  await page.evaluate(() => {
    document.documentElement.dataset.auditScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
  });
  const positions = [0, 1, 10, 25, 50, 100, 150, 200, 300, 400, 500, 700];
  const samples = [];
  for (const position of positions) {
    await page.evaluate((nextY) => scrollTo(0, nextY), position);
    await page.waitForTimeout(80);
    samples.push(await page.locator(selector).first().evaluate((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return {
        scrollY,
        className: element.className,
        position: style.position,
        top: box.top,
        height: box.height,
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
      };
    }));
  }
  const first = samples[0];
  const changed = samples.find((sample) => sample.scrollY > 0 && (
    sample.className !== first.className
    || sample.backgroundColor !== first.backgroundColor
    || sample.boxShadow !== first.boxShadow
  ));
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = document.documentElement.dataset.auditScrollBehavior || '';
    delete document.documentElement.dataset.auditScrollBehavior;
  });
  return { threshold: changed?.scrollY ?? null, samples };
};

const captureInteractions = async (page, target, viewportName, outputDir) => {
  const use = selectors[target];
  const desktop = viewportName === 'desktop';
  const stickySelector = desktop ? use.stickyDesktop : use.stickyMobile;
  const contentRoot = await page.locator('main').count() ? 'main' : 'body';
  const contentBox = () => page.evaluate(() => {
    const element = document.querySelector('main') || document.body;
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  });
  const isViewportVisible = async (selector) => {
    const locator = page.locator(selector).first();
    if (await locator.count() === 0) return false;
    return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden'
      && box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight;
    });
  };
  const values = { viewport: viewportName, target, measuredAt: new Date().toISOString() };
  const mainBoxBefore = await contentBox();
  values.initial = {
    header: await elementState(page, use.header),
    logo: await elementState(page, use.logo),
    topbarVisible: desktop ? await isViewportVisible(use.topbar) : false,
  };
  if (desktop) {
    const toggle = page.locator(use.desktopToggle).first();
    const openByHover = async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await page.mouse.move(0, 0);
        await toggle.hover();
        await page.waitForTimeout(400);
        if (await page.locator(use.dropdown).first().isVisible()) return true;
      }
      return false;
    };
    values.dropdown = {
      hoverOpen: await openByHover(),
      hoverState: await elementState(page, use.dropdown),
      itemCount: await page.locator(`${use.dropdown} a`).count(),
    };
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    values.dropdown.escapeClosed = !(await page.locator(use.dropdown).first().isVisible());
    await toggle.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
    values.dropdown.keyboardOpen = await page.locator(use.dropdown).first().isVisible();
    await page.keyboard.press('Escape');
    if (target === 'staging') {
      await toggle.click();
      await page.waitForTimeout(350);
      values.dropdown.clickOpen = await page.locator(use.dropdown).first().isVisible();
      await page.locator(contentRoot).first().click({ position: { x: 2, y: 2 } });
      await page.waitForTimeout(100);
      values.dropdown.outsideClickClosed = !(await page.locator(use.dropdown).first().isVisible());
    } else {
      values.dropdown.clickOpen = null;
      values.dropdown.outsideClickClosed = null;
    }
    await openByHover();
    values.dropdown.capture = await captureUnion(
      page,
      [use.desktopToggle, use.dropdown],
      path.join(outputDir, 'dropdown-open.png'),
      1,
    );
    await page.locator(contentRoot).first().hover({ position: { x: 2, y: 2 } });
  } else {
    const toggle = page.locator(use.mobileToggle).first();
    await toggle.click();
    await page.waitForTimeout(450);
    values.mobileMenu = {
      open: await page.locator(use.drawer).first().isVisible(),
      drawer: await elementState(page, use.drawer),
      overlay: await elementState(page, use.overlay),
      bodyOverflow: await page.evaluate(() => ({
        html: getComputedStyle(document.documentElement).overflow,
        body: getComputedStyle(document.body).overflow,
      })),
      focusTarget: await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName),
    };
    values.mobileMenu.menuCapture = await captureElement(
      page,
      use.drawer,
      path.join(outputDir, 'menu-open.png'),
    );
    const submenu = page.locator(use.submenuToggle).first();
    if (await submenu.count() === 1) {
      await submenu.click();
      await page.waitForTimeout(450);
      values.mobileMenu.submenuExpanded = await submenu.getAttribute('aria-expanded');
      values.mobileMenu.submenuItemCount = target === 'source'
        ? await page.locator('#menu-menu-main-2 > li:nth-child(2) .sub-menu > li > a').count()
        : await page.locator('.rk-mobile-submenu > li > a').count();
      values.mobileMenu.submenuCapture = await captureElement(
        page,
        use.drawer,
        path.join(outputDir, 'submenu-open.png'),
      );
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(450);
    values.mobileMenu.escapeClosed = !(await page.locator(use.drawer).first().isVisible());
    if (!values.mobileMenu.escapeClosed) {
      await page.locator(use.close).first().click();
      await page.waitForTimeout(450);
    }
  }
  values.stickyThreshold = await measureStickyThreshold(page, use.stickyActivation);
  await page.evaluate(() => {
    document.documentElement.dataset.auditStickyScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
  });
  await page.evaluate(() => scrollTo(0, 700));
  await page.waitForTimeout(200);
  await page.evaluate(() => scrollTo(0, 650));
  await page.waitForTimeout(650);
  const measuredScrollY = await page.evaluate(() => scrollY);
  const mainBoxAfter = await contentBox();
  values.sticky = {
    scrollY: measuredScrollY,
    header: await elementState(page, stickySelector),
    logo: await elementState(page, use.logo),
    topbarVisible: desktop ? await isViewportVisible(use.topbar) : false,
    mainLayoutShift: mainBoxBefore && mainBoxAfter ? (mainBoxAfter.y - mainBoxBefore.y) + measuredScrollY : null,
  };
  values.sticky.capture = await captureElement(
    page,
    stickySelector,
    path.join(outputDir, 'header-sticky.png'),
  );
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => scrollY < 1, { timeout: 3000 }).catch(() => {});
  values.returnToTop = {
    scrollY: await page.evaluate(() => scrollY),
    header: await elementState(page, use.header),
  };
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = document.documentElement.dataset.auditStickyScrollBehavior || '';
    delete document.documentElement.dataset.auditStickyScrollBehavior;
  });
  return values;
};

export const captureTarget = async ({ page, target, route, viewportName, sessionId }) => {
  const trace = (phase) => {
    if (process.env.PROMPT_1_2_TRACE === 'true') console.log(`TRACE ${target} ${viewportName} ${route} ${phase}`);
  };
  const outputDir = evidenceDir(target, viewportName, route);
  await mkdir(outputDir, { recursive: true });
  const origin = target === 'source' ? sourceOrigin : stagingBase;
  const response = await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitReady(page);
  trace('ready');
  if (target === 'source') {
    await page.addStyleTag({ content: '#wpadminbar,.pxl-cursor,.pxl-scroll-top{display:none!important}' });
  }
  const extracted = await extractEvidence(page, target);
  trace('extracted');
  const interaction = await captureInteractions(page, target, viewportName, outputDir);
  trace('interactions');
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(250);
  const use = selectors[target];
  const captures = {
    headerInitial: await captureElement(page, use.header, path.join(outputDir, 'header-initial.png')),
  };
  trace('header');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(600);
  captures.footer = await captureIsolatedFooter(
    page,
    use.footer,
    path.join(outputDir, 'footer.png'),
  );
  trace('footer');
  captures.floatingActions = await captureFloatingRegion(
    page,
    path.join(outputDir, 'floating-actions.png'),
  );
  const evidence = {
    schemaVersion: 2,
    sessionId,
    capturedAt: new Date().toISOString(),
    target,
    route,
    viewport: viewportName,
    url: page.url(),
    httpStatus: response?.status() || null,
    inventory: extracted.inventory,
    computedStyles: extracted.styles,
    page: extracted.page,
    interaction,
    captures,
  };
  await writeFile(path.join(outputDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  trace('written');
  return evidence;
};
