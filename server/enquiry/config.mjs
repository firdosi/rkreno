import formPolicy from '../../config/form-policy.json' with { type: 'json' };

const modes = new Set(formPolicy.allowedModes);

export function loadFormConfig(environment = process.env) {
  const mode = modes.has(environment.FORM_ENVIRONMENT) ? environment.FORM_ENVIRONMENT : formPolicy.defaultMode;
  const enabled = environment.FORM_ENABLED === 'true' && mode !== 'disabled';
  const origins = String(environment.FORM_ALLOWED_ORIGINS || '')
    .split(',').map((value) => value.trim()).filter(Boolean);
  const config = {
    enabled,
    mode,
    origins,
    recipient: environment.FORM_RECIPIENT_EMAIL || '',
    sender: environment.FORM_SENDER_EMAIL || '',
    mailMode: environment.FORM_MAIL_MODE || 'dry_run',
    smtp: {
      host: environment.SMTP_HOST || '',
      port: Number(environment.SMTP_PORT || 0),
      secure: environment.SMTP_SECURE === 'true',
      username: environment.SMTP_USERNAME || '',
      password: environment.SMTP_PASSWORD || '',
    },
    turnstile: {
      secret: environment.TURNSTILE_SECRET_KEY || '',
      expectedHostname: environment.TURNSTILE_EXPECTED_HOSTNAME || '',
      expectedAction: environment.TURNSTILE_EXPECTED_ACTION || '',
    },
    trustProxy: environment.FORM_TRUST_PROXY === 'true',
    port: Number(environment.ENQUIRY_SERVICE_PORT || 4174),
    host: environment.ENQUIRY_SERVICE_HOST || '127.0.0.1',
  };
  const required = ['origins', 'recipient', 'sender'];
  if (mode !== 'local_test') required.push('turnstile');
  if (enabled && ['private_preview', 'production'].includes(mode)) required.push('smtp');
  const missing = required.filter((key) => {
    if (key === 'origins') return config.origins.length === 0;
    if (key === 'turnstile') return Object.values(config.turnstile).some((value) => !value);
    if (key === 'smtp') return config.mailMode !== 'smtp'
      || !config.smtp.host || !config.smtp.port || !config.smtp.username || !config.smtp.password;
    return !config[key];
  });
  if (enabled && missing.length) {
    return { ...config, enabled: false, configurationError: `Missing required groups: ${missing.join(', ')}` };
  }
  return config;
}
