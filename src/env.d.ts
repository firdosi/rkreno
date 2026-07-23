/// <reference types="astro/client" />

interface Window {
  dataLayer: Array<Record<string, unknown> | IArguments>;
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
  turnstile?: {
    reset: (widget?: string | HTMLElement) => void;
  };
}
