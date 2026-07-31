import { chromium } from 'playwright';

const viewports = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

const inspectPage = () => {
  const visible = (element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
  };
  const clipped = (element) => {
    const box = element.getBoundingClientRect();
    return visible(element) && (box.left < -1 || box.right > innerWidth + 1);
  };
  const important = [...document.querySelectorAll('header,main,footer,h1')];
  const controls = [...document.querySelectorAll('button,input,select,textarea')].filter((element) => visible(element) && !element.closest('[aria-hidden="true"]'));
  const tables = [...document.querySelectorAll('table')].filter(visible);
  const fixed = [...document.querySelectorAll('a,button')].filter((element) => visible(element) && getComputedStyle(element).position === 'fixed');
  const submit = [...document.querySelectorAll('button[type="submit"]')].filter(visible);
  const overlaps = [];
  for (const action of fixed) for (const button of submit) {
    const a = action.getBoundingClientRect(); const b = button.getBoundingClientRect();
    if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) overlaps.push(action.getAttribute('aria-label') || action.textContent?.trim());
  }
  const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
  return {
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
    zeroWidthImportant: important.filter((element) => element.getBoundingClientRect().width === 0).map((element) => element.tagName),
    clippedControls: controls.filter(clipped).map((element) => element.outerHTML.slice(0, 100)),
    wideTables: tables.filter((table) => {
      if (table.getBoundingClientRect().width <= table.parentElement.getBoundingClientRect().width + 1) return false;
      let parent = table.parentElement;
      while (parent && parent !== document.body) {
        if (['auto', 'scroll'].includes(getComputedStyle(parent).overflowX)) return false;
        parent = parent.parentElement;
      }
      return true;
    }).length,
    h1Clipped: [...document.querySelectorAll('h1')].some((element) => clipped(element) || element.scrollWidth > element.clientWidth + 1),
    overlaps,
    duplicateIds: ids.length - new Set(ids).size,
    missingLabels: [...document.querySelectorAll('input:not([type="hidden"]),select,textarea')].filter((field) => {
      if (field.closest('[aria-hidden="true"]')) return false;
      if (field.closest('label')) return false;
      return !field.id || !document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
    }).map((field) => field.getAttribute('name')),
  };
};

export async function auditBrowser(origin, routes) {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const results = new Map(routes.map((route) => [route, {}]));
  let consoleErrors = 0;
  let externalRequests = 0;
  try {
    for (const [viewportName, viewport] of Object.entries(viewports)) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      await context.route('**/*', (requestRoute) => {
        const url = new URL(requestRoute.request().url());
        if (url.origin === origin) requestRoute.continue();
        else { externalRequests += 1; requestRoute.abort(); }
      });
      for (const route of routes) {
        const page = await context.newPage();
        const pageErrors = [];
        page.on('pageerror', (error) => { pageErrors.push(`page error: ${error.message}`); consoleErrors += 1; });
        page.on('console', (message) => {
          if (message.type() === 'error' && !/ERR_FAILED/.test(message.text())) { pageErrors.push(`console error: ${message.text()}`); consoleErrors += 1; }
        });
        const response = await page.goto(`${origin}/rkreno${route}`, { waitUntil: 'load' });
        if (!response?.ok()) pageErrors.push(`HTTP ${response?.status() || 'none'}`);
        const check = await page.evaluate(inspectPage);
        if (check.overflow > 1) pageErrors.push(`horizontal overflow ${check.overflow}px`);
        if (check.brokenImages.length) pageErrors.push(`broken images ${check.brokenImages.join(', ')}`);
        if (check.zeroWidthImportant.length) pageErrors.push(`zero-width ${check.zeroWidthImportant.join(', ')}`);
        if (check.clippedControls.length) pageErrors.push(`clipped controls ${check.clippedControls.length}`);
        if (check.wideTables) pageErrors.push(`tables wider than containers ${check.wideTables}`);
        if (check.h1Clipped) pageErrors.push('H1 clipped');
        if (check.overlaps.length) pageErrors.push(`fixed controls overlap form submit: ${check.overlaps.join(', ')}`);
        if (check.duplicateIds) pageErrors.push(`duplicate IDs ${check.duplicateIds}`);
        if (check.missingLabels.length) pageErrors.push(`unlabelled fields ${check.missingLabels.join(', ')}`);
        results.get(route)[viewportName] = { result: pageErrors.length ? 'FAIL' : 'PASS', errors: pageErrors };
        errors.push(...pageErrors.map((error) => `${viewportName} ${route}: ${error}`));
        await page.close();
      }
      await context.close();
    }

    const context = await browser.newContext({ viewport: viewports.mobile });
    const page = await context.newPage();
    await page.goto(`${origin}/rkreno/`, { waitUntil: 'load' });
    const menu = page.locator('.rk-menu-button');
    await menu.click();
    if (await page.locator('.rk-drawer').getAttribute('aria-hidden') !== 'false') errors.push('Mobile drawer did not open.');
    if (!(await page.evaluate(() => document.documentElement.classList.contains('rk-scroll-locked')))) errors.push('Mobile drawer did not lock body scroll.');
    const submenu = page.locator('.rk-submenu-button');
    await submenu.click();
    if (await submenu.getAttribute('aria-expanded') !== 'true') errors.push('Mobile submenu did not open.');
    await page.keyboard.press('Escape');
    if (await page.locator('.rk-drawer').getAttribute('aria-hidden') !== 'true') errors.push('Escape did not close mobile drawer.');
    await menu.click();
    await page.locator('.rk-drawer-backdrop').click({ position: { x: 2, y: 2 } });
    if (await page.locator('.rk-drawer').getAttribute('aria-hidden') !== 'true') errors.push('Overlay did not close mobile drawer.');
    await context.close();

    const desktopContext = await browser.newContext({ viewport: viewports.desktop });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`${origin}/rkreno/`, { waitUntil: 'load' });
    const desktopToggle = desktopPage.locator('.rk-nav__toggle');
    await desktopToggle.click();
    if (await desktopToggle.getAttribute('aria-expanded') !== 'true') errors.push('Desktop service dropdown did not open.');
    await desktopPage.keyboard.press('Escape');
    if (await desktopToggle.getAttribute('aria-expanded') !== 'false') errors.push('Escape did not close desktop service dropdown.');
    await desktopContext.close();

    const formContext = await browser.newContext({ viewport: viewports.mobile });
    const formPage = await formContext.newPage();
    let postRequests = 0;
    formPage.on('request', (request) => { if (request.method() === 'POST') postRequests += 1; });
    await formPage.goto(`${origin}/rkreno/contact-us/`, { waitUntil: 'load' });
    const form = formPage.locator('[data-enquiry-form], [data-core-enquiry-form]').first();
    await form.locator('[name="name"]').fill('Final staging test');
    await form.locator('[name="phone"]').fill('+601111334496');
    await form.locator('[name="service"]').selectOption({ index: 1 });
    await form.locator('[name="projectDetails"]').fill('Final staging validation only.');
    await form.locator('[name="consent"]').check();
    await form.locator('button[type="submit"]').press('Enter');
    const status = await form.locator('[data-form-status]').textContent();
    if (!/not sent|preview only/i.test(status || '')) errors.push('Form lacks truthful no-send confirmation.');
    if (postRequests) errors.push(`Form made ${postRequests} POST request(s).`);
    await formContext.close();
    return { errors, results: Object.fromEntries(results), checkedPages: routes.length * 3, consoleErrors, externalRequests, unsafeFormRequests: postRequests, viewports };
  } finally { await browser.close(); }
}
