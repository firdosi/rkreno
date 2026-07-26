import { createServer } from 'node:http';
import formPolicy from '../../config/form-policy.json' with { type: 'json' };
import { loadFormConfig } from './config.mjs';
import { createOperationalLogger } from './logger.mjs';
import { DryRunMailAdapter, SmtpMailAdapter, TestCaptureMailAdapter } from './mail.mjs';
import { MemoryRateLimiter } from './rate-limit.mjs';
import { createEnquiryHandler } from './service.mjs';
import { MockTurnstileValidator, TurnstileValidator } from './turnstile.mjs';

const config = loadFormConfig();
const rateLimiter = new MemoryRateLimiter(formPolicy.rateLimit);
const logger = createOperationalLogger();
let turnstile;
let mailer;

if (config.mode === 'local_test') {
  turnstile = new MockTurnstileValidator({
    'test-success': { ok: true, category: 'success' },
    'test-expired': { ok: false, category: 'expired' },
    'test-hostname': { ok: false, category: 'hostname' },
    'test-action': { ok: false, category: 'action' },
    'test-timeout': { ok: false, category: 'timeout' },
  });
  mailer = new TestCaptureMailAdapter();
} else {
  turnstile = new TurnstileValidator({ ...config.turnstile, fetch: globalThis.fetch });
  if (config.mailMode === 'smtp') {
    const nodemailer = (await import('nodemailer')).default;
    mailer = new SmtpMailAdapter(nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.username, pass: config.smtp.password },
      disableFileAccess: true,
      disableUrlAccess: true,
    }));
  } else {
    mailer = new DryRunMailAdapter();
  }
}

const handler = createEnquiryHandler({ config, turnstile, rateLimiter, mailer, logger });
const server = createServer(handler);
server.listen(config.port, config.host, () => {
  console.log(JSON.stringify({
    ready: true, service: 'enquiry', mode: config.mode, enabled: config.enabled,
    origin: `http://${config.host}:${config.port}`,
    ...(config.configurationError ? { configurationError: config.configurationError } : {}),
  }));
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
