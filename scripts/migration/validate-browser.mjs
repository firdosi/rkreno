import { chromium } from 'playwright';

export async function validateBrowser(origin, routePaths) {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const viewports = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 900 },
    mobile: { width: 390, height: 844 },
  };
  try {
    for (const [viewportName, viewport] of Object.entries(viewports)) {
      const context = await browser.newContext({ viewport });
      await context.route('**/*', (route) => {
        const url = new URL(route.request().url());
        if (url.origin === origin) route.continue();
        else route.abort();
      });
      for (const routePath of routePaths) {
        const page = await context.newPage();
        const pageErrors = [];
        page.on('pageerror', (error) => pageErrors.push(`console: ${error.message}`));
        const response = await page.goto(`${origin}/rkreno${routePath}`, { waitUntil: 'domcontentloaded' });
        if (!response?.ok()) pageErrors.push(`HTTP ${response?.status() || 'none'}`);
        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src),
        }));
        if (result.overflow > 1) pageErrors.push(`horizontal overflow ${result.overflow}px`);
        if (result.brokenImages.length) pageErrors.push(`browser-broken images: ${result.brokenImages.join(', ')}`);
        errors.push(...pageErrors.map((error) => `${viewportName} ${routePath}: ${error}`));
        await page.close();
      }
      await context.close();
    }

    const context = await browser.newContext({ viewport: viewports.mobile });
    const page = await context.newPage();
    await page.goto(`${origin}/rkreno/`, { waitUntil: 'domcontentloaded' });
    await page.locator('.rk-menu-button').click();
    if (await page.locator('.rk-drawer').getAttribute('aria-hidden') !== 'false') errors.push('Mobile menu did not open.');
    await page.keyboard.press('Escape');
    if (await page.locator('.rk-drawer').getAttribute('aria-hidden') !== 'true') errors.push('Mobile menu did not close with Escape.');
    await context.close();

    const formContext = await browser.newContext({ viewport: viewports.mobile });
    const formPage = await formContext.newPage();
    let externalPost = false;
    formPage.on('request', (request) => { if (request.method() === 'POST') externalPost = true; });
    await formPage.goto(`${origin}/rkreno/contact-us/`, { waitUntil: 'domcontentloaded' });
    const form = formPage.locator('[data-enquiry-form], [data-core-enquiry-form]').first();
    if (await form.count()) {
      await form.locator('[name="name"]').fill('Migration Test');
      await form.locator('[name="phone"]').fill('+601111334496');
      await form.locator('[name="service"]').selectOption({ index: 1 });
      await form.locator('[name="projectDetails"]').fill('Staging migration validation only.');
      await form.locator('[name="consent"]').check();
      await form.locator('button[type="submit"]').click();
      const status = await form.locator('[data-form-status]').textContent();
      if (!/not sent/i.test(status || '')) errors.push('Staging form did not show the no-send message.');
      if (externalPost) errors.push('Staging form attempted a POST request.');
    } else errors.push('Contact form missing.');
    await formContext.close();
  } finally { await browser.close(); }
  return { errors, checkedPages: routePaths.length * 3, viewports: Object.keys(viewports) };
}
