const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const integer = (name, fallback) => {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const list = (name) =>
  required(name).split(',').map((value) => value.trim()).filter(Boolean);

export function loadConfig() {
  const smtpPort = integer('SMTP_PORT', 587);
  return {
    host: process.env.FORM_API_HOST || '127.0.0.1',
    port: integer('FORM_API_PORT', 8787),
    allowedOrigins: list('ALLOWED_ORIGINS'),
    allowedTurnstileHostnames: list('TURNSTILE_EXPECTED_HOSTNAMES'),
    enquiryTo: required('ENQUIRY_TO_EMAIL'),
    enquiryFrom: required('ENQUIRY_FROM_EMAIL'),
    smtp: {
      host: required('SMTP_HOST'),
      port: smtpPort,
      secure: process.env.SMTP_SECURE === 'true' || smtpPort === 465,
      user: required('SMTP_USER'),
      pass: required('SMTP_PASS'),
    },
    turnstileSecret: required('TURNSTILE_SECRET_KEY'),
    rateLimit: {
      maxRequests: integer('RATE_LIMIT_MAX_REQUESTS', 5),
      windowMs: integer('RATE_LIMIT_WINDOW_SECONDS', 900) * 1000,
    },
  };
}
