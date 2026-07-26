import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { deniedConsent, grantedAnalyticsConsent, safeAnalyticsEvent } from '../../src/lib/analytics-policy.mjs';

const base = process.env.CONSENT_TEST_ORIGIN || 'http://127.0.0.1:4173';
const results = [];
const check = (name, passed, expected, actual) => results.push({ name, passed, expected, actual });
const browser = await chromium.launch({ headless: true });

async function contextWithCollector() {
  const context = await browser.newContext();
  const requests = [];
  await context.route(/(googletagmanager\.com|google-analytics\.com)/, async (route) => {
    requests.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
  });
  return { context, requests };
}

try {
  check('default consent values', JSON.stringify(deniedConsent) === JSON.stringify({
    analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  }), 'all denied', JSON.stringify(deniedConsent));
  check('accepted consent keeps advertising denied',
    grantedAnalyticsConsent.analytics_storage === 'granted'
      && ['ad_storage', 'ad_user_data', 'ad_personalization'].every((key) => grantedAnalyticsConsent[key] === 'denied'),
    'analytics granted; ads denied', JSON.stringify(grantedAnalyticsConsent));

  const first = await contextWithCollector();
  const page = await first.context.newPage();
  await page.goto(`${base}/contact-us/`);
  check('no Google request before consent', first.requests.length === 0, 0, first.requests.length);
  check('no analytics cookie before consent', !(await page.context().cookies()).some((cookie) => /^_ga/.test(cookie.name)), 'none', 'inspected');
  const beforeLayer = await page.evaluate(() => window.dataLayer || []);
  check('default command precedes measurement', JSON.stringify(beforeLayer).includes('consent') && JSON.stringify(beforeLayer).includes('denied'), 'denied consent command', JSON.stringify(beforeLayer));
  await page.click('[data-consent-allow]');
  await page.waitForTimeout(100);
  const acceptedLayer = await page.evaluate(() => window.dataLayer || []);
  const pageViews = acceptedLayer.filter((item) => Array.isArray(item) && item[0] === 'event' && item[1] === 'page_view');
  check('analytics loader eligible after acceptance', first.requests.filter((url) => url.includes('gtag/js')).length === 1, 1, first.requests.length);
  check('one page_view after acceptance', pageViews.length === 1, 1, pageViews.length);
  check('preference persisted', await page.evaluate(() => localStorage.getItem('rkreno_analytics_consent')) === 'granted', 'granted', await page.evaluate(() => localStorage.getItem('rkreno_analytics_consent')));
  check('advertising remains denied after acceptance', JSON.stringify(acceptedLayer).includes('ad_storage') && !JSON.stringify(acceptedLayer).includes('ad_storage\":\"granted'), 'denied', 'inspected');

  await page.evaluate(() => { document.cookie = '_ga=local-test; Path=/'; });
  const eventsBeforeRevoke = acceptedLayer.length;
  await page.click('[data-consent-settings]');
  await page.click('[data-consent-essential]');
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rkreno:analytics', {
    detail: { name: 'click_phone', parameters: { page_path: location.pathname } },
  })));
  const revokedLayer = await page.evaluate(() => window.dataLayer || []);
  check('revocation updates consent denied', JSON.stringify(revokedLayer.slice(eventsBeforeRevoke)).includes('denied'), 'denied update', 'inspected');
  check('revocation blocks new analytics events', !revokedLayer.slice(eventsBeforeRevoke).some((item) => Array.isArray(item) && item[0] === 'event'), 'no events', 'inspected');
  check('revocation removes analytics cookies', !(await page.context().cookies()).some((cookie) => /^_ga/.test(cookie.name)), 'removed', 'inspected');
  await first.context.close();

  const rejected = await contextWithCollector();
  const rejectedPage = await rejected.context.newPage();
  await rejectedPage.goto(`${base}/`);
  await rejectedPage.click('[data-consent-essential]');
  check('rejection prevents loader', rejected.requests.length === 0, 0, rejected.requests.length);
  check('rejection preference persists', await rejectedPage.evaluate(() => localStorage.getItem('rkreno_analytics_consent')) === 'denied', 'denied', 'denied');
  await rejected.context.close();

  const lead = await contextWithCollector();
  const leadPage = await lead.context.newPage();
  await leadPage.goto(`${base}/contact-us/`);
  await leadPage.click('[data-consent-allow]');
  await leadPage.evaluate(() => {
    document.dispatchEvent(new CustomEvent('rkreno:analytics', { detail: { name: 'enquiry_submit_attempt', parameters: { page_path: location.pathname } } }));
    document.dispatchEvent(new CustomEvent('rkreno:analytics', { detail: { name: 'enquiry_validation_error', parameters: { page_path: location.pathname, error_category: 'validation' } } }));
    document.dispatchEvent(new CustomEvent('rkreno:lead-accepted', { detail: { requestId: 'invalid' } }));
  });
  let leadLayer = await leadPage.evaluate(() => window.dataLayer || []);
  check('submit and failures do not generate lead', !leadLayer.some((item) => Array.isArray(item) && item[1] === 'generate_lead'), 'zero leads', 'zero');
  await leadPage.evaluate(() => {
    const event = new CustomEvent('rkreno:lead-accepted', { detail: { requestId: 'rk_1234567890abcdef' } });
    document.dispatchEvent(event);
    document.dispatchEvent(event);
  });
  leadLayer = await leadPage.evaluate(() => window.dataLayer || []);
  const leads = leadLayer.filter((item) => Array.isArray(item) && item[1] === 'generate_lead');
  check('confirmed acceptance generates exactly one lead', leads.length === 1, 1, leads.length);
  check('lead event contains no PII', !JSON.stringify(leads).match(/@|phone|email|message|service|1234567890abcdef/i), 'no PII', JSON.stringify(leads));
  await lead.context.close();

  const direct = await contextWithCollector();
  const directPage = await direct.context.newPage();
  await directPage.addInitScript(() => localStorage.setItem('rkreno_analytics_consent', 'granted'));
  await directPage.goto(`${base}/thank-you/`);
  await directPage.reload();
  const directLayer = await directPage.evaluate(() => window.dataLayer || []);
  check('direct thank-you and refresh fire no lead', !directLayer.some((item) => Array.isArray(item) && item[1] === 'generate_lead'), 'zero leads', 'zero');
  await direct.context.close();

  check('PII-like event parameter rejected', safeAnalyticsEvent('click_phone', {
    page_path: '/contact-us/', extra: 'person@example.test',
  })?.parameters.extra === undefined, 'removed', 'removed');
} finally {
  await browser.close();
}

const output = {
  total: results.length,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  results,
};
await mkdir(resolve('.audit-cache', 'prompt-3-2'), { recursive: true });
await writeFile(resolve('.audit-cache', 'prompt-3-2', 'consent-analytics.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ total: output.total, passed: output.passed, failed: output.failed }, null, 2));
if (output.failed) {
  console.error(results.filter((item) => !item.passed));
  process.exit(1);
}
