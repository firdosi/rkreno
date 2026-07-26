import { deniedConsent, grantedAnalyticsConsent, safeAnalyticsEvent } from '../lib/analytics-policy.mjs';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __rkAnalyticsLoaded?: boolean;
  }
}

const preferenceKey = 'rkreno_analytics_consent';
const analyticsCookies = /^_ga(?:_|$)|^_gid$|^_gat/;

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function (...values: unknown[]) { window.dataLayer?.push(values); };
  window.gtag(...args);
}

function removeAnalyticsCookies() {
  for (const item of document.cookie.split(';')) {
    const name = item.split('=')[0]?.trim();
    if (name && analyticsCookies.test(name)) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${location.hostname}; SameSite=Lax`;
    }
  }
}

function loadAnalytics(measurementId: string) {
  if (window.__rkAnalyticsLoaded) return;
  window.__rkAnalyticsLoaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.append(script);
  gtag('js', new Date());
  gtag('config', measurementId, { send_page_view: false, allow_google_signals: false });
  sendEvent('page_view', { page_path: location.pathname });
}

function sendEvent(name: string, parameters: Record<string, string> = {}) {
  if (localStorage.getItem(preferenceKey) !== 'granted' || !window.__rkAnalyticsLoaded) return false;
  const event = safeAnalyticsEvent(name, parameters);
  if (!event) return false;
  gtag('event', event.name, event.parameters);
  return true;
}

export function bootConsentAnalytics(options: {
  measurementId: string;
  approvedHostnames: string[];
  testMode?: boolean;
}) {
  const banner = document.querySelector<HTMLElement>('[data-consent-banner]');
  const settings = document.querySelector<HTMLButtonElement>('[data-consent-settings]');
  if (!banner || !settings) return;
  gtag('consent', 'default', deniedConsent);
  if (!options.testMode && !options.approvedHostnames.includes(location.hostname)) {
    banner.remove();
    settings.remove();
    return;
  }
  const saved = localStorage.getItem(preferenceKey);
  banner.hidden = saved === 'granted' || saved === 'denied';
  if (saved === 'granted') {
    gtag('consent', 'update', grantedAnalyticsConsent);
    loadAnalytics(options.measurementId);
  }
  const choose = (value: 'granted' | 'denied') => {
    localStorage.setItem(preferenceKey, value);
    gtag('consent', 'update', value === 'granted' ? grantedAnalyticsConsent : deniedConsent);
    banner.hidden = true;
    if (value === 'granted') loadAnalytics(options.measurementId);
    else removeAnalyticsCookies();
  };
  banner.querySelector('[data-consent-essential]')?.addEventListener('click', () => choose('denied'));
  banner.querySelector('[data-consent-allow]')?.addEventListener('click', () => choose('granted'));
  settings.addEventListener('click', () => { banner.hidden = false; banner.focus(); });

  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest('a[href]') as HTMLAnchorElement | null;
    if (!link) return;
    const common = { page_path: location.pathname };
    if (link.protocol === 'tel:') sendEvent('click_phone', common);
    else if (/wa\.me|whatsapp/i.test(link.href)) {
      sendEvent('click_whatsapp', { ...common, placement: link.dataset.track || 'link' });
    } else if (link.protocol === 'mailto:') sendEvent('click_email', common);
  });
  document.addEventListener('rkreno:analytics', ((event: CustomEvent) => {
    sendEvent(event.detail?.name, event.detail?.parameters || {});
  }) as EventListener);
  document.addEventListener('rkreno:lead-accepted', ((event: CustomEvent) => {
    const reference = String(event.detail?.requestId || '');
    if (!/^rk_[a-f0-9]{16}$/.test(reference)) return;
    const key = `rkreno_lead_sent:${reference}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    sendEvent('generate_lead', { page_path: location.pathname });
  }) as EventListener);
}
