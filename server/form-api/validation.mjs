const services = new Set([
  'Renovation',
  'Waterproofing',
  'Plaster ceiling',
  'Aircond service',
  'Electrical work',
  'Cleaning',
  'Other',
]);

const clean = (value, max) =>
  String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export function validateEnquiry(input, now = Date.now()) {
  const data = {
    name: clean(input.name, 100),
    phone: clean(input.phone, 30),
    email: clean(input.email, 254).toLowerCase(),
    service: clean(input.service, 40),
    message: clean(input.message, 2000),
    pageUrl: clean(input.page_url, 500),
    turnstileToken: clean(input['cf-turnstile-response'], 2048),
    honeypot: clean(input.company_website, 200),
    privacyConsent: clean(input.privacy_consent, 10),
    startedAt: Number(input.form_started_at),
  };
  const errors = {};

  if (data.name.length < 2) errors.name = 'Enter your full name.';
  if (!/^[+\d][\d\s()+.-]{6,29}$/.test(data.phone)) errors.phone = 'Enter a valid phone number.';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!services.has(data.service)) errors.service = 'Choose a valid service.';
  if (data.message.length < 10) errors.message = 'Add at least 10 characters about your project.';
  if (data.privacyConsent !== 'yes') errors.privacyConsent = 'Consent is required.';
  if (!data.turnstileToken) errors.turnstile = 'Complete the security check.';
  if (!Number.isFinite(data.startedAt) || now - data.startedAt < 2500 || now - data.startedAt > 7_200_000) {
    errors.formTiming = 'Refresh the page and try again.';
  }

  return { data, errors, valid: Object.keys(errors).length === 0 };
}

export function isHoneypotTriggered(input) {
  return clean(input.company_website, 200).length > 0;
}
