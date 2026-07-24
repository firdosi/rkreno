export const allowedActions = [
  'KEEP_AND_REDESIGN',
  'KEEP_CONTENT_PAGE',
  'MERGE_AND_301_REDIRECT',
  'REMOVE_AND_410',
  'KEEP_NOINDEX_TEMPORARILY',
  'OWNER_DECISION_REQUIRED',
  'EXISTING_404_REPAIR',
  'EXISTING_404_LEAVE_GONE',
  'KEEP_NOINDEX_NATIVE',
  'MERGE_AND_301_LATER',
  'REMOVE_AND_410_LATER',
];

export const knownMissingImages = [
  'deep-cleaning-rumah-kuala-lumpur.webp', 'cuci-bilik-air-rumah-kl.webp',
  'pakej-cuci-rumah-hari-raya.webp', 'cucian-selepas-renovasi-rumah.webp',
  'cuci-dapur-rumah-berminyak.webp', 'cuci-habuk-plaster-ceiling.webp',
  'servis-aircond-dan-cuci-rumah.webp',
];
export const backupAvailableImages = new Set([
  'Modern-construction-and-renovation-services-background.jpeg',
  'Luxurious_modern_white_building_202605211647-1.jpeg',
  'service-single-video1.webp', 'service4.webp', 'service1.webp', 'service3.webp',
  'pagtitle1.webp', 'home7-img8.webp', 'home7-img1.webp', 'home1-step1.webp',
  'home1-img02.webp', 'home1-img03.webp', 'home1-img01.webp',
]);

export const exactDuplicateTargets = new Map([
  ['/category/interior-design/', '/category/interior-design/'],
  ['/tag/ceiling-works/', '/category/interior-design/'],
  ['/category/servis-pembersihan/', '/category/servis-pembersihan/'],
  ['/tag/kuala-lumpur/', '/category/servis-pembersihan/'],
  ['/category/technical-guides/', '/category/technical-guides/'],
  ['/tag/wiring/', '/category/technical-guides/'],
  ['/home-10-one-page/', 'none — both proposed 410'],
  ['/home-10/', 'none — both proposed 410'],
  ['/home-5-one-page/', 'none — both proposed 410'],
  ['/home-5/', 'none — both proposed 410'],
  ['/home-8-onepage/', 'none — both proposed 410'],
  ['/home-8/', 'none — both proposed 410'],
  ['/home-9-one-page/', 'none — both proposed 410'],
  ['/home-9/', 'none — both proposed 410'],
]);

export const claimDefinitions = [
  ['Customer count', /\b(?:1,?250|1,?000)\+\s+(?:(?:happy|trusted)\s+)?(?:customers?|clients?)\b/i],
  ['Project count', /\b(?:500|1,000|1000|2,000|2000|5,000|5000)\+\s+(?:wiring\s+projects|local\s+projects|ceilings\s+installed|rumah\s+dicuci|leaks\s+fixed)\b/i],
  ['Emergency availability', /\b24\/7\s+(?:emergency\s+help|emergency\s+service|support)\b/i],
  ['Safety claim', /\b100%\s+safety\s+compliant\b/i],
  ['Rating claim', /\b4\.9\/5\s+(?:client|google|service)?\s*rating\b/i],
  ['Certification claim', /\b(?:certified|licensed)\s+(?:electrician|wireman)\b/i],
  ['Experience claim', /\b(?:over\s+)?\d+\+?\s+(?:years?|yrs?)\s+(?:of\s+)?experience\b/i],
  ['Guarantee or warranty', /\b(?:100%\s+)?(?:satisfaction|dry|safety|commercial|flawless\s+finishing)?\s*(?:guarantee|guaranteed|warranty)\b/i],
  ['Named testimonial/team member', /(?:Vincent\s+(?:P\.|Pham)|Sophia\s+Martinez|Emily\s+Chen|Michelangelo\s+V\.|Sarah\s+T\.|Henry\s+S\.|John\s+S\.|Peter\s+C\.|Mark\s+P\.|Joseph\s+S\.|Deron\s+Brown)/i],
  ['Named demo project', /\b(?:The\s+Ivey\s+School\s+of\s+Business|Axis\s+Industrial\s+Park|Oakwood\s+Residence|Skyline\s+Hub|Ecom\s+Stadium|Vemus\s+Building|St\s+John\s+Building)\b/i],
  ['Company-history claim', /\b1995\s+The\s+Beginning\s+of\s+a\s+Dream\b/i],
];

const valuablePattern = /aircond|house-renovation|home-renovation-contractor|office-renovation|commercial-retail|electrical-services|waterproofing|pu-injection|plaster-ceiling|servis-cuci|pakej-deep-cleaning/i;
const demoPath = /^\/(?:home-\d|landing-page|pricing-plan|sample-page|blog-(?:grid|full-width))/;
const ecommercePath = /^\/(?:product|product-category|shop|wishlist|cart|checkout|my-account)\//;
const ownerRoutes = new Set([
  '/company-history/', '/our-team/', '/testimonials/', '/our-projects/', '/our-projects-2/',
]);
const removeUtility = new Set(['/career/', '/team-detail/', '/feedback-error/']);
const genericServices = new Set([
  '/service/architecture-design/', '/service/building-construction/',
  '/service/flooring-roofing/', '/service/general-contracting/', '/service/repair-expand/',
]);
const archiveMerges = new Map([
  ['/tag/ceiling-works/', '/category/interior-design/'],
  ['/tag/kuala-lumpur/', '/category/servis-pembersihan/'],
  ['/tag/wiring/', '/category/technical-guides/'],
]);

export function demoIndicators(text, route) {
  const values = [];
  const indicators = [
    ['Vastcon', /\bVastcon\b/i], ['Vinceta', /\bVinceta\b/i],
    ['Vincent Pham/P.', /Vincent\s+(?:Pham|P\.)/i],
    ['Ivey School demo', /\bIvey\s+School\s+of\s+Business\b/i],
    ['Alten/ECOM demo', /\b(?:Alten|ECOM\s+GROUP|Ecomposer\.com)\b/i],
    ['PCL/EllisDon demo', /\b(?:PCL|EllisDon)\b/i],
    ['Lorem ipsum', /\blorem\s+ipsum\b/i],
    ['Theme refund copy', /refund.+theme.+defective/i],
    ['Demo route name', demoPath],
  ];
  for (const [label, pattern] of indicators) {
    if (label === 'Demo route name' ? pattern.test(route) : pattern.test(text)) values.push(label);
  }
  return values;
}

export function foreignIndicators(text) {
  const indicators = [
    ['Sydney', /\bSydney\b/i], ['Melbourne', /\bMelbourne\b/i],
    ['Australia/NSW', /\b(?:Australia|NSW)\b/i], ['Bay Area', /\bBay\s+Area\b/i],
    ['New York', /\bNew\s+York\b/i],
    ['foreign dollar budget', /\$\s*\d+(?:\.\d+)?\s*(?:million|m)\b/i],
    ['foreign phone/email', /\(02\)\s*3434\s*5632|contact@vastcon\.com/i],
  ];
  return indicators.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

export function dispositionFor(context) {
  const { route, page, completionStatus, source } = context;
  if (source === 'production-404') {
    if (route.includes('services/%20https:')) {
      return result('EXISTING_404_REPAIR', '/about-us/',
        'Repair the malformed About link and redirect only this malformed URL.');
    }
    return result('EXISTING_404_LEAVE_GONE', '',
      route.startsWith('/portfolio/')
        ? 'Remove remaining internal references; the portfolio destination is unverified theme-demo content.'
        : 'Unrelated legacy software article has no intent-matched RK Reno replacement.');
  }
  if (route === '/about/') {
    return result('MERGE_AND_301_REDIRECT', '/about-us/',
      'Legacy alias has a direct equivalent canonical About page.');
  }
  if (route === '/home-2/' || route === '/wp-content/uploads/2025/01/home.svg') {
    return result('REMOVE_AND_410', '',
      'Theme-demo alias/asset is not a public RK Reno content page.');
  }
  if (source === 'WordPress-export') {
    return result('REMOVE_AND_410', '',
      'Published WooCommerce utility exists in the export but has no supported RK Reno sales function.');
  }
  if (ecommercePath.test(route)) {
    return result('REMOVE_AND_410', '',
      'Imported WooCommerce content; no evidence RK Reno sells these products online.');
  }
  if (demoPath.test(route)) {
    return result('REMOVE_AND_410', '',
      'Imported theme demonstration route; do not redesign or redirect it to the homepage.');
  }
  if (page?.type === 'portfolio') {
    return result('REMOVE_AND_410', '',
      'Repeated Ivey/Vastcon/Vincent demo copy does not establish RK Reno project ownership.');
  }
  if (removeUtility.has(route)) {
    return result('REMOVE_AND_410', '',
      'Imported or obsolete utility content has no verified business purpose.');
  }
  if (ownerRoutes.has(route)) {
    return result('OWNER_DECISION_REQUIRED', '',
      'Identity, history, testimonials, or project claims require owner-supplied authentic content.');
  }
  if (route === '/thank-you/') {
    return result('KEEP_NOINDEX_TEMPORARILY', '',
      'Useful form-flow utility; keep out of search results.');
  }
  if (/^\/blog\/page\/\d+\//.test(route)) {
    return result('MERGE_AND_301_REDIRECT', '/blog/',
      'Pagination should consolidate into the redesigned blog/archive experience.');
  }
  if (/^\/service-category\//.test(route) || genericServices.has(route)) {
    return result('MERGE_AND_301_REDIRECT', '/services/',
      'Imported theme taxonomy/service intent is adequately served by the main Services page.');
  }
  if (archiveMerges.has(route)) {
    return result('MERGE_AND_301_REDIRECT', archiveMerges.get(route),
      'Exact duplicate thin archive; consolidate on the stronger category route.');
  }
  if (page?.type === 'taxonomy') {
    return result('KEEP_NOINDEX_TEMPORARILY', '',
      'Thin archive may aid navigation but needs article-count and taxonomy strategy review.');
  }
  if (route === '/' || ['/about-us/', '/contact-us/', '/services/', '/faq/',
    '/service/building-renovation/', '/blog/'].includes(route) || valuablePattern.test(route)) {
    if (completionStatus === 'TECHNICALLY COMPLETE') {
      return result('KEEP_CONTENT_PAGE', '',
        'Genuine priority content is retained; owner approval and shared-system review remain.');
    }
    return result('KEEP_AND_REDESIGN', '',
      'Route has clear RK Reno business or search intent and should retain its approved content.');
  }
  return result('OWNER_DECISION_REQUIRED', '',
    'No clear evidence supports removal or public indexing without owner direction.');
}

function result(action, destination, reason) {
  return { action, destination, reason };
}

export function recommendedIndex(action) {
  if (['KEEP_AND_REDESIGN', 'KEEP_CONTENT_PAGE'].includes(action)) return 'index,follow';
  if (['KEEP_NOINDEX_TEMPORARILY', 'KEEP_NOINDEX_NATIVE', 'OWNER_DECISION_REQUIRED'].includes(action)) return 'noindex,follow';
  if (['MERGE_AND_301_REDIRECT', 'MERGE_AND_301_LATER', 'EXISTING_404_REPAIR'].includes(action)) return '301 redirect';
  if (action === 'REMOVE_AND_410_LATER') return 'gone (410)';
  if (action === 'EXISTING_404_LEAVE_GONE') return 'remain 404';
  return 'gone (410)';
}

export const routeTests = { demoPath, ecommercePath, valuablePattern };
