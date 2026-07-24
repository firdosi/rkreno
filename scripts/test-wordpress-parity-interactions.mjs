import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

export async function testParityInteractions(base = 'http://127.0.0.1:4321/') {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const checks = [];
  const record = (name, passed, detail = '') => checks.push({ name, passed, detail });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });

    const menu = page.locator('.mobile-menu');
    record('mobile navigation is visible', await menu.isVisible());
    await menu.locator('summary').click();
    record('mobile navigation opens', await menu.evaluate((node) => node.open));
    record('mobile navigation exposes retained links', await menu.locator('a[href="/services/"]').first().isVisible());

    await page.keyboard.press('Home');
    await page.keyboard.press('Tab');
    record('keyboard focus is visible', await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return false;
      const style = getComputedStyle(element);
      return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
    }));

    const call = page.locator('a[href^="tel:+601111334496"]').first();
    const whatsapp = page.locator('a[href^="https://wa.me/601111334496"]').first();
    record('telephone action uses published number', await call.count() === 1);
    record('WhatsApp action uses published number', await whatsapp.count() === 1);

    await page.goto(new URL('faq/', base).href, { waitUntil: 'networkidle' });
    const faq = page.locator('main details').first();
    record('FAQ accordion exists', await faq.count() === 1);
    await faq.locator('summary').click();
    record('FAQ accordion opens', await faq.evaluate((node) => node.open));

    await page.goto(new URL('contact-us/', base).href, { waitUntil: 'networkidle' });
    const form = page.locator('form[data-enquiry-form]');
    record('staging enquiry form is present', await form.count() === 1);
    record('staging enquiry form is unconfigured', await form.getAttribute('data-configured') === 'false');
    record('staging submit remains disabled', await form.locator('button[type="submit"]').isDisabled());
    record('mobile layout has no horizontal overflow', await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ));
    await context.close();
  } finally {
    await browser.close();
  }

  const failures = checks.filter(({ passed }) => !passed);
  const reportDir = path.join(root, 'reports', 'public');
  await fs.mkdir(reportDir, { recursive: true });
  const markdown = `# WordPress Parity Interaction Check

- Checks: **${checks.length}**
- Passed: **${checks.length - failures.length}**
- Failed: **${failures.length}**
- Viewport: **390 × 844**

${checks.map(({ name, passed, detail }) =>
    `- ${passed ? 'PASS' : 'FAIL'} — ${name}${detail ? `: ${detail}` : ''}`).join('\n')}
`;
  await fs.writeFile(path.join(reportDir, 'wordpress-parity-interactions.md'), markdown);
  return { checks: checks.length, passed: checks.length - failures.length, failures };
}
