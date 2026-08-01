import { priceCardsByRoute, priceTablesByRoute } from '../service-exact-pricing';
import { serviceFaqsByRoute } from '../service-exact-faqs';
import { serviceExactConfig } from '../service-exact-config';
import type { RelatedService, ServiceFamily, ServiceItem, ServiceRecoveryModel } from './types';

export const media = {
  aircond: '/assets/media/721430356-1623451745783563-6720154604310865920-n-b6c68602.jpg',
  aircondUnit: '/assets/media/owner/rk-reno-wall-mounted-aircond-unit-960.webp',
  aircondCondenser: '/assets/media/owner/rk-reno-aircond-outdoor-condenser-720.webp',
  planning: '/assets/media/Renovation-planning-and-project-drawings-6cfdb2fc.jpg',
  home: '/assets/media/Home-renovation-service-in-KL-422b205c.jpg',
  building: '/assets/media/Modern-building-renovation-and-property-improvement-b1ec6039.jpg',
  office: '/assets/media/Office-renovation-service-in-Selangor-7928d19d.jpg',
  commercial: '/assets/media/Renovation-contractor-for-commercial-buildings-93583952.jpg',
  contractor: '/assets/media/Construction-workers-discussing-renovation-plans-092133b6.jpg',
  waterproofing: '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg',
  ceiling: '/assets/media/Plaster-ceiling-and-aircond-installation-dd789b38.jpg',
  cleaning: '/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg',
};

export const standardAreas = ['Kuala Lumpur', 'Setapak', 'Wangsa Maju', 'Cheras', 'Bangsar', 'Kepong', 'Petaling Jaya', 'Shah Alam', 'Subang Jaya'];

export const standardProcess = (labels: string[] = ['Share the requirement', 'Review the site', 'Confirm the quotation', 'Complete the agreed work']): ServiceItem[] => labels.map((title, index) => ({
  title,
  text: [
    'Send the property location, photos, measurements and the outcome you need.',
    'Access, existing conditions, material routes and any building rules are checked.',
    'Review inclusions, exclusions, quantities, additional rates and the planned sequence.',
    'The team carries out the confirmed scope, checks the result and discusses any follow-up work.',
  ][index],
}));

const relatedCatalog: Record<string, RelatedService> = {
  service: { href: '/servis-aircond-murah-kl/', title: 'Aircond servicing KL', text: 'Cleaning, chemical wash, gas and troubleshooting options.', image: media.aircondUnit },
  installKl: { href: '/aircond-installation-kl/', title: 'Aircond installation KL', text: 'Wall-mounted installation with clear base-price inclusions.', image: media.aircond },
  installSelangor: { href: '/upah-pasang-aircond-selangor/', title: 'Aircond installation Selangor', text: 'Installation for homes, offices and shops across Selangor.', image: media.aircondCondenser },
  houseKl: { href: '/house-renovation-in-kuala-lumpur/', title: 'House renovation Kuala Lumpur', text: 'Room upgrades and multi-trade residential renovation.', image: media.home },
  houseSelangor: { href: '/house-renovation-in-selangor/', title: 'House renovation Selangor', text: 'Repairs, refreshes and wider home renovation scopes.', image: media.building },
  office: { href: '/office-renovation-in-kuala-lumpur/', title: 'Office renovation Kuala Lumpur', text: 'Office refresh, fit-out and reinstatement planning.', image: media.office },
  electrical: { href: '/electrical-services-selangor/', title: 'Electrical services', text: 'Inspection, wiring, fittings and troubleshooting enquiries.', image: media.contractor },
  waterproofing: { href: '/waterproofing-contractor-kuala-lumpur/', title: 'Waterproofing', text: 'Leak symptoms, inspection and site-matched repair methods.', image: media.waterproofing },
  ceiling: { href: '/plaster-ceiling-contractor-kl/', title: 'Plaster ceiling', text: 'Flat ceilings, L-boxes, cornices and repair planning.', image: media.ceiling },
  demolition: { href: '/demolition-contractor-kl-selangor/', title: 'Demolition and preparation', text: 'Controlled strip-out, debris handling and preparation.', image: media.commercial },
};

export const related = (...keys: string[]) => keys.map((key) => relatedCatalog[key]);

export function createModel(route: string, family: ServiceFamily, values: Partial<ServiceRecoveryModel>): ServiceRecoveryModel {
  const exact = serviceExactConfig[route];
  return {
    route,
    family,
    eyebrow: values.eyebrow || 'Property service',
    title: values.title || exact?.heroTitle || '',
    lead: values.lead || exact?.lead || '',
    heroImage: values.heroImage || exact?.image || media.contractor,
    heroAlt: values.heroAlt || exact?.imageAlt || '',
    bodyImages: values.bodyImages || [],
    overview: values.overview || [],
    typesTitle: values.typesTitle || 'Service options',
    types: values.types || [],
    scopeTitle: values.scopeTitle || 'What the scope can include',
    scope: values.scope || [],
    quotationTitle: values.quotationTitle || 'What affects the quotation',
    quotationFactors: values.quotationFactors || [],
    process: values.process || standardProcess(),
    areas: values.areas || standardAreas,
    related: values.related || [],
    pricingCards: priceCardsByRoute[route],
    pricingTable: priceTablesByRoute[route],
    pricingNote: values.pricingNote || 'Final pricing depends on the confirmed site condition, quantities, materials, access and agreed work scope.',
    faqs: serviceFaqsByRoute[route] || [],
    finalTitle: values.finalTitle || 'Request a service quotation',
    finalText: values.finalText || 'Share the location, photos and required work so RK Reno can review the scope with you.',
    ...values,
  } as ServiceRecoveryModel;
}
