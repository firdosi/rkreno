import { createServer } from 'node:http';
import formPolicy from '../../../config/form-policy.json' with { type: 'json' };
import { TestCaptureMailAdapter } from '../../../server/enquiry/mail.mjs';
import { MemoryRateLimiter } from '../../../server/enquiry/rate-limit.mjs';
import { createEnquiryHandler } from '../../../server/enquiry/service.mjs';
import { MockTurnstileValidator } from '../../../server/enquiry/turnstile.mjs';

export const fixedNow = Date.parse('2026-07-26T12:00:00.000Z');
export const validPayload = (overrides = {}) => ({
  name: 'Local Test User',
  phone: '+60 11 0000 0000',
  email: 'local@example.test',
  service: 'House Renovation',
  projectDetails: 'Test capture request for a kitchen renovation in Kuala Lumpur.',
  consent: true,
  pageUrl: '/contact-us/',
  startedAt: new Date(fixedNow - 5000).toISOString(),
  website: '',
  turnstileToken: 'valid-0',
  ...overrides,
});

export async function startHarness(options = {}) {
  const logs = [];
  const tokens = Object.fromEntries(Array.from({ length: 20 }, (_, index) => [
    `valid-${index}`, { ok: true, category: 'success' },
  ]));
  const config = {
    enabled: true,
    mode: 'local_test',
    origins: ['http://127.0.0.1:4173'],
    recipient: 'capture@example.test',
    sender: 'website@example.test',
    trustProxy: false,
    ...options.config,
  };
  const turnstile = options.turnstile || new MockTurnstileValidator(tokens);
  const rateLimiter = options.rateLimiter || new MemoryRateLimiter(
    { ...formPolicy.rateLimit, ...options.ratePolicy },
    () => fixedNow,
  );
  const mailer = options.mailer || new TestCaptureMailAdapter();
  const logger = { record: (record) => logs.push(record) };
  const handler = createEnquiryHandler({
    config, turnstile, rateLimiter, mailer, logger, clock: () => fixedNow,
  });
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  return {
    origin, mailer, logs,
    close: () => new Promise((resolve) => server.close(resolve)),
    request: (payload, init = {}) => fetch(`${origin}/api/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:4173' },
      body: JSON.stringify(payload),
      ...init,
    }),
  };
}
