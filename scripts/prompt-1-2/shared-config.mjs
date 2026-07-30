import path from 'node:path';

export const root = process.cwd();
export const evidenceRoot = path.join(root, '.audit-cache', 'prompt-1-2');
export const reportRoot = path.join(root, 'reports', 'public');
export const sourceOrigin = 'https://rkrenosolution.com';
export const stagingBase = process.env.PROMPT_1_2_BASE_URL || 'http://127.0.0.1:4321';

export const viewports = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

export const visualThreshold = {
  channelDelta: 24,
  changedPixelPercent: 0.5,
  boundingBoxPixels: 1,
  rationale: 'A uniform 0.5% changed-pixel ceiling with RGB channel delta >24 permits only browser font antialiasing; dimension and component-box differences still fail independently.',
};

export const statesForViewport = {
  desktop: ['header-initial', 'header-sticky', 'dropdown-open', 'footer', 'floating-actions'],
  tablet: ['header-initial', 'header-sticky', 'menu-open', 'submenu-open', 'footer', 'floating-actions'],
  mobile: ['header-initial', 'header-sticky', 'menu-open', 'submenu-open', 'footer', 'floating-actions'],
};

export const representativeRoutes = [
  '/', '/services/', '/about-us/', '/contact-us/', '/aircond-installation-kl/',
  '/house-renovation-in-kuala-lumpur/',
  '/commercial-retail-shop-renovation-in-kuala-lumpur/',
  '/category/renovation/', '/our-projects/', '/testimonials/',
  '/demolition-contractor-kl-selangor/',
];

export const styleProperties = [
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
  'textTransform', 'color', 'backgroundColor', 'borderTopWidth',
  'borderTopStyle', 'borderTopColor', 'borderRadius', 'boxShadow', 'width',
  'maxWidth', 'height', 'padding', 'margin', 'gap', 'alignItems', 'position',
  'top', 'right', 'bottom', 'left', 'zIndex', 'transition', 'transform',
];

export const slugFor = (route) => route === '/'
  ? 'home'
  : route.slice(1).replace(/\/$/, '').replaceAll('/', '__');

export const evidenceDir = (target, viewport, route) =>
  path.join(evidenceRoot, target, viewport, slugFor(route));

export const normalizeDestination = (value, target = 'source') => {
  if (!value) return null;
  if (value === '#') return '#';
  if (/^(?:tel|mailto):/i.test(value)) return value.toLowerCase();
  try {
    const url = new URL(value, target === 'source' ? sourceOrigin : stagingBase);
    if (target === 'staging' && url.pathname.startsWith('/rkreno/')) {
      return `${url.pathname.slice('/rkreno'.length)}${url.search}${url.hash}`;
    }
    if (url.origin === sourceOrigin || url.origin === new URL(stagingBase).origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    return url.href;
  } catch {
    return value;
  }
};
