import assert from 'node:assert/strict';
import test from 'node:test';
import { RateLimiter } from './rate-limiter.mjs';
import { isHoneypotTriggered, validateEnquiry } from './validation.mjs';

const validInput = {
  name: 'RK Customer',
  phone: '+60 12 345 6789',
  email: 'customer@example.com',
  service: 'Renovation',
  message: 'Please contact me about a house renovation.',
  page_url: 'https://rkrenosolution.com/',
  privacy_consent: 'yes',
  'cf-turnstile-response': 'test-token',
  company_website: '',
};

test('accepts a valid enquiry', () => {
  const now = Date.now();
  const result = validateEnquiry({ ...validInput, form_started_at: now - 5000 }, now);
  assert.equal(result.valid, true);
});

test('rejects invalid data and submissions that are too fast', () => {
  const now = Date.now();
  const result = validateEnquiry({
    ...validInput,
    phone: 'abc',
    message: 'short',
    form_started_at: now,
  }, now);
  assert.equal(result.valid, false);
  assert.ok(result.errors.phone);
  assert.ok(result.errors.message);
  assert.ok(result.errors.formTiming);
});

test('detects the honeypot', () => {
  assert.equal(isHoneypotTriggered({ company_website: 'https://spam.example' }), true);
});

test('limits repeated requests within the configured window', () => {
  const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });
  assert.equal(limiter.consume('127.0.0.1', 1000).allowed, true);
  assert.equal(limiter.consume('127.0.0.1', 1100).allowed, true);
  assert.equal(limiter.consume('127.0.0.1', 1200).allowed, false);
  assert.equal(limiter.consume('127.0.0.1', 2100).allowed, true);
});
