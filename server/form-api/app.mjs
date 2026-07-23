import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { loadConfig } from './config.mjs';
import { createMailer } from './mailer.mjs';
import { RateLimiter } from './rate-limiter.mjs';
import { verifyTurnstile } from './turnstile.mjs';
import { isHoneypotTriggered, validateEnquiry } from './validation.mjs';

const config = loadConfig();
const mailer = createMailer(config);
const limiter = new RateLimiter(config.rateLimit);
const maxBodyBytes = 16 * 1024;

const sendJson = (response, status, body, extraHeaders = {}) => {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  response.end(JSON.stringify(body));
};

const clientIp = (request) =>
  String(request.headers['x-real-ip'] || request.socket.remoteAddress || '').slice(0, 64);

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error('body-too-large');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  const contentType = request.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw || '{}');
    } catch {
      throw new Error('invalid-json');
    }
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  throw new Error('unsupported-content-type');
}

const server = createServer(async (request, response) => {
  const requestId = randomUUID();
  const url = new URL(request.url || '/', 'http://localhost');
  if (request.method === 'GET' && url.pathname === '/health') {
    return sendJson(response, 200, { ok: true });
  }
  if (request.method !== 'POST' || url.pathname !== '/api/enquiry') {
    return sendJson(response, 404, { message: 'Not found.' });
  }

  const origin = request.headers.origin || '';
  if (!config.allowedOrigins.includes(origin)) {
    return sendJson(response, 403, { message: 'Request origin is not allowed.' });
  }

  const ip = clientIp(request);
  const rate = limiter.consume(ip);
  if (!rate.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
    return sendJson(
      response,
      429,
      { message: 'Too many enquiries. Please wait before trying again.' },
      { 'Retry-After': String(retryAfter) },
    );
  }

  try {
    const input = await readBody(request);
    if (isHoneypotTriggered(input)) {
      return sendJson(response, 200, { message: 'Thank you. Your enquiry has been received.' });
    }
    const validation = validateEnquiry(input);
    if (!validation.valid) {
      return sendJson(response, 422, {
        message: 'Please check the highlighted information and try again.',
        errors: validation.errors,
      });
    }

    const challenge = await verifyTurnstile({
      secret: config.turnstileSecret,
      token: validation.data.turnstileToken,
      ip,
      allowedHostnames: config.allowedTurnstileHostnames,
    });
    if (!challenge.success) {
      console.warn(JSON.stringify({ event: 'turnstile_rejected', requestId, reason: challenge.reason }));
      return sendJson(response, 400, {
        message: 'The security check expired or failed. Please try again.',
      });
    }

    await mailer.sendEnquiry(validation.data, requestId);
    console.info(JSON.stringify({ event: 'enquiry_sent', requestId }));
    return sendJson(response, 200, {
      message: 'Thank you. Your enquiry has been sent to RK Reno Solution.',
      requestId,
    });
  } catch (error) {
    const type = error instanceof Error ? error.message : 'unknown-error';
    const clientError = ['body-too-large', 'invalid-json', 'unsupported-content-type'].includes(type);
    console.error(JSON.stringify({ event: 'enquiry_error', requestId, type }));
    return sendJson(response, clientError ? 400 : 500, {
      message: clientError
        ? 'The submitted form could not be read.'
        : 'We could not send your enquiry. Please use WhatsApp or call us.',
      requestId,
    });
  }
});

server.requestTimeout = 15_000;
server.headersTimeout = 10_000;
server.listen(config.port, config.host, () => {
  console.info(JSON.stringify({ event: 'form_api_started', host: config.host, port: config.port }));
});
