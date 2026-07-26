import { randomBytes } from 'node:crypto';
import formPolicy from '../../config/form-policy.json' with { type: 'json' };
import { jsonResponse, responseMessages } from './constants.mjs';
import { validateSubmission } from './validation.mjs';
import { buildMessage } from './mail.mjs';

function requestId() {
  return `rk_${randomBytes(8).toString('hex')}`;
}

function remoteAddress(request, trustProxy) {
  if (trustProxy) {
    const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (forwarded) return forwarded;
  }
  return request.socket?.remoteAddress || 'unknown';
}

async function readJson(request, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) {
      const error = new Error('too large');
      error.code = 'BODY_TOO_LARGE';
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('malformed json');
    error.code = 'MALFORMED_JSON';
    throw error;
  }
}

export function createEnquiryHandler({ config, turnstile, rateLimiter, mailer, logger, clock = Date.now }) {
  return async (request, response) => {
    const started = clock();
    const id = requestId();
    const result = {
      requestId: id, timestamp: new Date(started).toISOString(), environment: config.mode,
      resultCode: 'UNKNOWN', turnstileResult: 'not_run', rateLimitResult: 'not_run', mailResult: 'not_run',
    };
    const finish = (status, code, message, extra = {}) => {
      result.resultCode = code;
      result.durationMs = Math.max(0, clock() - started);
      logger.record(result);
      jsonResponse(response, status, { ok: status === 200, ...(status === 200 ? { requestId: id } : { code, message }), ...extra });
    };
    try {
      if (request.url !== '/api/enquiry') return finish(404, 'NOT_FOUND', 'Not found.');
      if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return finish(405, 'METHOD_NOT_ALLOWED', 'Use POST for this endpoint.');
      }
      if (!config.enabled) return finish(503, 'FORM_DISABLED', responseMessages.unavailable);
      if (String(request.headers['content-type'] || '').toLowerCase() !== 'application/json') {
        return finish(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send JSON only.');
      }
      const origin = String(request.headers.origin || '');
      if (!origin || !config.origins.includes(origin) || /firdosi\.github\.io/i.test(origin)) {
        return finish(403, 'ORIGIN_REJECTED', 'This submission origin is not allowed.');
      }
      const rate = rateLimiter.inspect(remoteAddress(request, config.trustProxy));
      result.rateLimitResult = rate.allowed ? 'allowed' : 'limited';
      if (!rate.allowed) return finish(429, 'RATE_LIMITED', responseMessages.retry);
      let input;
      try {
        input = await readJson(request, formPolicy.bodyLimitBytes);
      } catch (error) {
        rateLimiter.recordInvalid(rate.key);
        return finish(error.code === 'BODY_TOO_LARGE' ? 413 : 400,
          error.code || 'MALFORMED_JSON',
          error.code === 'BODY_TOO_LARGE' ? 'The request is too large.' : 'The request body is invalid.');
      }
      const validation = validateSubmission(input, clock());
      if (!validation.ok) {
        rateLimiter.recordInvalid(rate.key);
        return finish(422, 'VALIDATION_ERROR', responseMessages.validation, {
          fields: Object.keys(validation.errors).filter((field) => field !== 'website'),
        });
      }
      result.service = validation.value.service;
      const turnstileResult = await turnstile.validate(input.turnstileToken, remoteAddress(request, config.trustProxy));
      result.turnstileResult = turnstileResult.category;
      if (!turnstileResult.ok) {
        rateLimiter.recordInvalid(rate.key);
        const temporary = ['timeout', 'unavailable'].includes(turnstileResult.category);
        return finish(temporary ? 503 : 422, 'SECURITY_CHECK_FAILED',
          temporary ? responseMessages.retry : 'Please complete the security check and try again.');
      }
      const message = buildMessage(validation.value, id, new Date(clock()).toISOString(), config);
      let delivery;
      try {
        delivery = await mailer.deliver(message);
      } catch {
        delivery = { accepted: false, category: 'exception' };
      }
      result.mailResult = delivery.category;
      if (!delivery.accepted) return finish(503, 'DELIVERY_FAILED', responseMessages.unavailable);
      rateLimiter.recordAccepted(rate.key);
      return finish(200, 'ACCEPTED', '');
    } catch {
      return finish(500, 'INTERNAL_ERROR', responseMessages.unavailable);
    }
  };
}
