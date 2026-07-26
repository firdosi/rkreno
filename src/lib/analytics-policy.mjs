export const deniedConsent = Object.freeze({
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
});

export const grantedAnalyticsConsent = Object.freeze({
  ...deniedConsent,
  analytics_storage: 'granted',
});

const eventParameters = {
  page_view: new Set(['page_path']),
  click_phone: new Set(['page_path']),
  click_whatsapp: new Set(['page_path', 'placement']),
  click_email: new Set(['page_path']),
  enquiry_submit_attempt: new Set(['page_path']),
  enquiry_validation_error: new Set(['page_path', 'error_category']),
  generate_lead: new Set(['page_path']),
};

export function safeAnalyticsEvent(name, parameters = {}) {
  const allowed = eventParameters[name];
  if (!allowed) return null;
  const safe = {};
  for (const [key, value] of Object.entries(parameters)) {
    if (!allowed.has(key) || typeof value !== 'string' || value.length > 120) continue;
    if (/[\r\n\u0000]/.test(value) || /@|(?:\+?\d[\d\s().-]{6,})/.test(value)) continue;
    safe[key] = value;
  }
  return { name, parameters: safe };
}
