import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DryRunMailAdapter, TestCaptureMailAdapter, buildMessage } from '../../server/enquiry/mail.mjs';
import { MockTurnstileValidator, TurnstileValidator } from '../../server/enquiry/turnstile.mjs';
import { startHarness, validPayload } from './lib/form-harness.mjs';

const results = [];
const check = (category, name, passed, expected, actual) => {
  results.push({ category, name, expected, actual, passed });
};
const noLeak = async (response, label) => {
  const text = await response.text();
  check('data_protection', `${label} response excludes PII and stack`, !/Local Test User|0000 0000|kitchen renovation|stack|Error:/i.test(text), 'no PII or stack', text);
  return { status: response.status, body: JSON.parse(text) };
};

const harness = await startHarness({ ratePolicy: { invalidStrikeLimit: 1000 } });
try {
  const success = await noLeak(await harness.request(validPayload()), 'success');
  check('success', 'valid test-capture submission', success.status === 200 && success.body.ok, '200 ok', `${success.status} ${success.body.ok}`);
  check('delivery', 'test capture accepted once', harness.mailer.messages.length === 1, '1 capture', harness.mailer.messages.length);

  const cases = [
    ['missing name', { name: undefined }, 422],
    ['short name', { name: 'A' }, 422],
    ['oversized name', { name: 'A'.repeat(101) }, 422],
    ['invalid phone', { phone: 'call-me-now' }, 422],
    ['missing service', { service: '' }, 422],
    ['unknown service', { service: 'Arbitrary Work' }, 422],
    ['short project details', { projectDetails: 'short' }, 422],
    ['oversized project details', { projectDetails: 'A'.repeat(2001) }, 422],
    ['missing consent', { consent: false }, 422],
    ['invalid email', { email: 'not-an-email' }, 422],
    ['filled honeypot', { website: 'spam.example' }, 422],
    ['completion too fast', { startedAt: new Date(Date.parse('2026-07-26T11:59:59.000Z')).toISOString() }, 422],
    ['invalid page URL', { pageUrl: 'https://foreign.example/contact/' }, 422],
    ['query-string page URL', { pageUrl: '/contact-us/?phone=123' }, 422],
    ['missing startedAt', { startedAt: undefined }, 422],
    ['missing Turnstile token', { turnstileToken: '' }, 422],
    ['failed Turnstile', { turnstileToken: 'failed' }, 422],
    ['expired Turnstile', { turnstileToken: 'expired' }, 422],
    ['wrong hostname', { turnstileToken: 'hostname' }, 422],
    ['wrong action', { turnstileToken: 'action' }, 422],
    ['header injection', { name: 'Test\r\nBcc: victim@example.test' }, 422],
    ['HTML script content', { projectDetails: '<script>alert(1)</script> renovation' }, 422],
    ['null byte', { projectDetails: 'Valid details\u0000 hidden' }, 422],
    ['object instead of string', { name: { nested: true } }, 422],
    ['unexpected field', { admin: true }, 422],
    ['deep nested JSON', { projectDetails: { a: { b: { c: 'value' } } } }, 422],
  ];
  for (let index = 0; index < cases.length; index += 1) {
    const [name, overrides, expected] = cases[index];
    const response = await harness.request(validPayload({ turnstileToken: `invalid-${index}`, ...overrides }));
    const inspected = await noLeak(response, name);
    check('validation', name, inspected.status === expected && !inspected.body.ok, expected, inspected.status);
  }

  const get = await fetch(`${harness.origin}/api/enquiry`, { headers: { Origin: 'http://127.0.0.1:4173' } });
  check('request_security', 'GET rejected', get.status === 405, 405, get.status);
  for (const [name, type] of [['form encoded', 'application/x-www-form-urlencoded'], ['text request', 'text/plain']]) {
    const response = await fetch(`${harness.origin}/api/enquiry`, {
      method: 'POST', headers: { 'Content-Type': type, Origin: 'http://127.0.0.1:4173' }, body: 'invalid',
    });
    check('request_security', `${name} rejected`, response.status === 415, 415, response.status);
  }
  const malformed = await fetch(`${harness.origin}/api/enquiry`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:4173' }, body: '{"name":',
  });
  check('request_security', 'malformed JSON rejected', malformed.status === 400, 400, malformed.status);
  const oversized = await fetch(`${harness.origin}/api/enquiry`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:4173' }, body: `"${'A'.repeat(17000)}"`,
  });
  check('request_security', '16 KiB body limit', oversized.status === 413, 413, oversized.status);
  for (const [name, origin] of [['foreign origin', 'https://foreign.example'], ['GitHub Pages origin', 'https://firdosi.github.io'], ['missing origin', '']]) {
    const headers = { 'Content-Type': 'application/json' };
    if (origin) headers.Origin = origin;
    const response = await fetch(`${harness.origin}/api/enquiry`, {
      method: 'POST', headers, body: JSON.stringify(validPayload({ turnstileToken: `origin-${name}` })),
    });
    check('request_security', `${name} rejected`, response.status === 403, 403, response.status);
  }
} finally {
  await harness.close();
}

const replay = new MockTurnstileValidator({ replayable: { ok: true, category: 'success' } });
check('turnstile', 'mock success', (await replay.validate('replayable')).ok, 'success', 'success');
check('turnstile', 'replay rejected', (await replay.validate('replayable')).category === 'replay', 'replay', 'replay');
for (const [name, result] of [
  ['failure', { success: false }],
  ['wrong hostname', { success: true, hostname: 'wrong.example', action: 'enquiry' }],
  ['wrong action', { success: true, hostname: 'rkrenosolution.com', action: 'wrong' }],
]) {
  const adapter = new TurnstileValidator({
    secret: 'test-secret', expectedHostname: 'rkrenosolution.com', expectedAction: 'enquiry',
    fetch: async () => ({ json: async () => result }),
  });
  const output = await adapter.validate(`token-${name}`);
  check('turnstile', name, !output.ok, 'rejected', output.category);
}
const timeoutAdapter = new TurnstileValidator({
  secret: 'test', expectedHostname: 'rkrenosolution.com', expectedAction: 'enquiry', timeoutMs: 5,
  fetch: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => {
    const error = new Error('aborted'); error.name = 'AbortError'; reject(error);
  })),
});
check('turnstile', 'timeout fails closed', (await timeoutAdapter.validate('timeout-token')).category === 'timeout', 'timeout', 'timeout');

const rateHarness = await startHarness();
try {
  const statuses = [];
  for (let index = 0; index < 6; index += 1) {
    statuses.push((await rateHarness.request(validPayload({ turnstileToken: `valid-${index}` }))).status);
  }
  check('rate_limit', 'five accepted per 15 minutes', statuses.slice(0, 5).every((status) => status === 200) && statuses[5] === 429, '200x5 then 429', statuses.join(','));
} finally {
  await rateHarness.close();
}

const safeMessage = buildMessage(validPayload({ projectDetails: '<b>Malay & punctuation!</b>' }), 'rk_1234567890abcdef', new Date().toISOString(), {
  sender: 'website@example.test', recipient: 'owner@example.test',
});
check('delivery', 'HTML content escaped', safeMessage.html.includes('&lt;b&gt;') && !safeMessage.html.includes('<b>Malay'), 'escaped HTML', 'inspected');
check('delivery', 'visitor email only Reply-To', safeMessage.from === 'website@example.test' && safeMessage.replyTo === 'local@example.test', 'verified sender', safeMessage.from);
check('delivery', 'dry run never accepts', !(await new DryRunMailAdapter().deliver()).accepted, 'rejected', 'rejected');
for (const [name, mailer] of [
  ['SMTP timeout simulation', { deliver: async () => ({ accepted: false, category: 'timeout' }) }],
  ['SMTP rejection simulation', new TestCaptureMailAdapter({ accept: false })],
  ['adapter exception', new TestCaptureMailAdapter({ exception: true })],
]) {
  const deliveryHarness = await startHarness({ mailer });
  const response = await deliveryHarness.request(validPayload());
  check('delivery', name, response.status === 503, 503, response.status);
  await deliveryHarness.close();
}
check('logging', 'operational logs exclude PII', harness.logs.every((record) => !JSON.stringify(record).match(/Local Test User|0000 0000|example\.test|kitchen renovation/i)), 'no PII', 'inspected');

const output = {
  total: results.length,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  results,
};
await mkdir(resolve('.audit-cache', 'prompt-3-2'), { recursive: true });
await writeFile(resolve('.audit-cache', 'prompt-3-2', 'form-security.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ total: output.total, passed: output.passed, failed: output.failed }, null, 2));
if (output.failed) {
  console.error(results.filter((item) => !item.passed));
  process.exit(1);
}
