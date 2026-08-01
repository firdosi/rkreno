export type ArticleFamily = 'aircond' | 'renovation' | 'technical' | 'cleaning';

export interface ArticleRouteDesign {
  family: ArticleFamily;
  serviceHref: string;
  serviceLabel: string;
  related: string[];
}

export const articleRouteDesigns: Record<string, ArticleRouteDesign> = {
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/': {
    family: 'aircond', serviceHref: '/upah-pasang-aircond-selangor/', serviceLabel: 'Aircond installation in Selangor',
    related: ['/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/', '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/'],
  },
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/': {
    family: 'aircond', serviceHref: '/aircond-installation-kl/', serviceLabel: 'Aircond installation in Kuala Lumpur',
    related: ['/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/', '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/'],
  },
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/': {
    family: 'aircond', serviceHref: '/servis-aircond-murah-kl/', serviceLabel: 'Aircond servicing in Kuala Lumpur',
    related: ['/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/', '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/'],
  },
  '/commercial-retail-shop-renovation-in-kuala-lumpur/': {
    family: 'renovation', serviceHref: '/office-renovation-in-kuala-lumpur/', serviceLabel: 'Commercial renovation in Kuala Lumpur',
    related: ['/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/', '/office-renovation-petaling-jaya-corporate-fit-out-experts/'],
  },
  '/office-renovation-petaling-jaya-corporate-fit-out-experts/': {
    family: 'renovation', serviceHref: '/office-renovation-in-kuala-lumpur/', serviceLabel: 'Office renovation service',
    related: ['/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/', '/commercial-retail-shop-renovation-in-kuala-lumpur/'],
  },
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/': {
    family: 'renovation', serviceHref: '/house-renovation-in-kuala-lumpur/', serviceLabel: 'House renovation in Kuala Lumpur',
    related: ['/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/', '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/'],
  },
  '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/': {
    family: 'renovation', serviceHref: '/house-renovation-in-selangor/', serviceLabel: 'House renovation in Selangor',
    related: ['/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/', '/commercial-retail-shop-renovation-in-kuala-lumpur/'],
  },
  '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/': {
    family: 'renovation', serviceHref: '/office-renovation-in-kuala-lumpur/', serviceLabel: 'Office renovation in Kuala Lumpur',
    related: ['/office-renovation-petaling-jaya-corporate-fit-out-experts/', '/commercial-retail-shop-renovation-in-kuala-lumpur/'],
  },
  '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/': {
    family: 'technical', serviceHref: '/waterproofing-contractor-kuala-lumpur/', serviceLabel: 'Waterproofing inspection service',
    related: ['/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/', '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/'],
  },
  '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/': {
    family: 'technical', serviceHref: '/waterproofing-contractor-kuala-lumpur/', serviceLabel: 'PU injection and waterproofing',
    related: ['/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/', '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/'],
  },
  '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/': {
    family: 'technical', serviceHref: '/plaster-ceiling-contractor-kl/', serviceLabel: 'Plaster ceiling service',
    related: ['/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/', '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/'],
  },
  '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/': {
    family: 'technical', serviceHref: '/electrical-services-selangor/', serviceLabel: 'Electrical services in Selangor',
    related: ['/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/', '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/'],
  },
  '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/': {
    family: 'cleaning', serviceHref: '/servis-cuci-rumah-kl/', serviceLabel: 'House cleaning in Kuala Lumpur',
    related: ['/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/', '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/'],
  },
  '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/': {
    family: 'cleaning', serviceHref: '/servis-cuci-rumah-kl/', serviceLabel: 'House cleaning service',
    related: ['/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/', '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/'],
  },
};
