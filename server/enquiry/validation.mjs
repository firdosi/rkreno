import formPolicy from '../../config/form-policy.json' with { type: 'json' };
import contentLock from '../../config/approved-route-content-lock.json' with { type: 'json' };
import { allowedFields } from './constants.mjs';

const approvedPaths = new Set(Object.keys(contentLock.routes));
const controls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const headerBreak = /[\r\n]/;
const phonePattern = /^\+?[\d\s().-]{7,30}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanString(value, minimum, maximum, errors, field, options = {}) {
  if (typeof value !== 'string') {
    errors[field] = 'invalid';
    return '';
  }
  const clean = value.trim();
  if (clean.length < minimum || clean.length > maximum || controls.test(clean)
    || (options.noHeaderBreak && headerBreak.test(clean))) errors[field] = 'invalid';
  return clean;
}

function approvedPage(value, errors) {
  if (typeof value !== 'string' || value.length > 500 || controls.test(value)) {
    errors.pageUrl = 'invalid';
    return '';
  }
  try {
    const parsed = new URL(value, 'https://rkrenosolution.com');
    if (parsed.search || parsed.hash || !approvedPaths.has(parsed.pathname)
      || (parsed.origin !== 'https://rkrenosolution.com' && parsed.origin !== 'http://127.0.0.1:4173')) {
      errors.pageUrl = 'invalid';
    }
    return parsed.pathname;
  } catch {
    errors.pageUrl = 'invalid';
    return '';
  }
}

export function validateSubmission(input, now = Date.now()) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || Object.getPrototypeOf(input) !== Object.prototype) return { ok: false, errors: { request: 'invalid' } };
  for (const key of Object.keys(input)) if (!allowedFields.has(key)) errors.request = 'unknown_field';

  const name = cleanString(input.name, 2, 100, errors, 'name', { noHeaderBreak: true });
  const phone = cleanString(input.phone, 7, 30, errors, 'phone', { noHeaderBreak: true });
  if (phone && !phonePattern.test(phone)) errors.phone = 'invalid';
  const email = input.email == null || input.email === ''
    ? ''
    : cleanString(input.email, 3, 254, errors, 'email', { noHeaderBreak: true }).toLowerCase();
  if (email && !emailPattern.test(email)) errors.email = 'invalid';
  const service = cleanString(input.service, 1, 100, errors, 'service', { noHeaderBreak: true });
  if (!formPolicy.approvedServices.includes(service)) errors.service = 'invalid';
  const projectDetails = cleanString(input.projectDetails, 10, 2000, errors, 'projectDetails');
  if (/<\s*script\b|javascript\s*:/i.test(projectDetails)) errors.projectDetails = 'suspicious';
  if (input.consent !== true) errors.consent = 'required';
  const pagePath = approvedPage(input.pageUrl, errors);
  const startedAt = Date.parse(input.startedAt);
  if (typeof input.startedAt !== 'string' || !Number.isFinite(startedAt) || startedAt > now
    || now - startedAt < formPolicy.minimumCompletionSeconds * 1000
    || now - startedAt > 24 * 60 * 60 * 1000) errors.startedAt = 'invalid';
  if (typeof input.website !== 'string' || input.website !== '') errors.website = 'spam';
  if (input.turnstileToken != null && typeof input.turnstileToken !== 'string') errors.turnstileToken = 'invalid';

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: { name, phone, email, service, projectDetails, consent: true, pageUrl: pagePath, startedAt },
  };
}
