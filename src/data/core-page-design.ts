export const contactDetails = {
  phone: '+60 11 1133 4496',
  phoneHref: 'tel:+601111334496',
  whatsappHref: 'https://wa.me/601111334496',
  email: 'rkrenosolution@gmail.com',
  emailHref: 'mailto:rkrenosolution@gmail.com',
  address: '4-2, Jalan 3/50C, Setapak, 53000 Kuala Lumpur',
};

export const coreMedia = {
  contractor: '/assets/media/RK-Reno-Solution-contractor-reviewing-renovation-projec-1fc54dc9.jpg',
  planning: '/assets/media/Renovation-planning-and-project-drawings-1-ea76b170.jpg',
  planningWide: '/assets/media/Renovation-planning-and-project-drawings-6cfdb2fc.jpg',
  renovation: '/assets/media/Home-renovation-service-in-KL-422b205c.jpg',
  commercial: '/assets/media/Renovation-contractor-for-commercial-buildings-93583952.jpg',
  building: '/assets/media/Modern-building-renovation-and-property-improvement-b1ec6039.jpg',
  office: '/assets/media/Office-renovation-service-in-Selangor-7928d19d.jpg',
  aircond: '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
  aircondOutdoor: '/assets/media/owner/rk-reno-aircond-outdoor-condenser-720.webp',
  electrical: '/assets/media/Construction-workers-discussing-renovation-plans-092133b6.jpg',
  waterproofing: '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg',
  ceiling: '/assets/media/Plaster-ceiling-and-aircond-installation-dd789b38.jpg',
  cleaning: '/assets/media/servis-cuci-rumah-kl-2e2d046e.jpg',
  deepCleaning: '/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg',
  areas: '/assets/media/Service-areas-in-KL-and-Selangor-0f0a8548.jpg',
  faq: '/assets/media/faq1-7160bab8.webp',
};

export const homeModel = {
  introduction: 'RK Reno Solution helps homeowners and business owners improve their spaces with renovation, repair, installation, and maintenance services. From site inspection to project completion, we focus on clear communication, practical solutions, and quality finishing.',
  priorityRoutes: ['/aircond-installation-kl/', '/house-renovation-in-kuala-lumpur/', '/demolition-contractor-kl-selangor/'],
  serviceRoutes: [
    '/aircond-installation-kl/', '/house-renovation-in-kuala-lumpur/', '/office-renovation-in-kuala-lumpur/',
    '/electrical-services-selangor/', '/waterproofing-contractor-kuala-lumpur/',
    '/plaster-ceiling-contractor-kl/', '/servis-cuci-rumah-kl/',
  ],
  benefits: [
    ['Practical site advice', 'Renovation work starts with understanding the space, required work and site conditions.'],
    ['Careful workmanship', 'The team focuses on practical solutions, neat finishing and respect for the property.'],
    ['Clear communication', 'Project needs, quotation scope and the next steps are discussed before work begins.'],
  ],
  process: [
    ['01', 'Inquiry & consultation', 'Share the location, required service, photos and the outcome you need.'],
    ['02', 'Site check & quotation', 'The work area and site conditions are reviewed before the scope is confirmed.'],
    ['03', 'Planning & execution', 'The agreed work is organised around access, materials and the confirmed service scope.'],
    ['04', 'Completion & handover', 'Completed work is reviewed against the agreed scope before handover.'],
  ],
  closing: 'Whether you need home renovation, office renovation, waterproofing, plaster ceiling, aircond installation, or cleaning services, RK Reno Solution is ready to help. Contact us today and share your project details.',
};

export const serviceGroups = [
  { title: 'Aircond', routes: ['/aircond-installation-kl/', '/upah-pasang-aircond-selangor/', '/servis-aircond-murah-kl/'] },
  { title: 'Renovation', routes: ['/house-renovation-in-kuala-lumpur/', '/house-renovation-in-selangor/', '/home-renovation-contractor-in-subang-jaya/', '/office-renovation-in-kuala-lumpur/', '/service/building-renovation/'] },
  { title: 'Demolition', routes: ['/demolition-contractor-kl-selangor/'] },
  { title: 'Electrical', routes: ['/electrical-services-selangor/'] },
  { title: 'Waterproofing', routes: ['/waterproofing-contractor-kuala-lumpur/'] },
  { title: 'Plaster ceiling', routes: ['/plaster-ceiling-contractor-kl/'] },
  { title: 'Cleaning', routes: ['/servis-cuci-rumah-kl/'] },
];

export const serviceMediaByRoute: Record<string, string> = {
  '/aircond-installation-kl/': coreMedia.aircond,
  '/upah-pasang-aircond-selangor/': coreMedia.aircondOutdoor,
  '/servis-aircond-murah-kl/': '/assets/media/owner/rk-reno-aircond-unit-trunking-960.webp',
  '/house-renovation-in-kuala-lumpur/': coreMedia.renovation,
  '/house-renovation-in-selangor/': coreMedia.building,
  '/home-renovation-contractor-in-subang-jaya/': coreMedia.planning,
  '/office-renovation-in-kuala-lumpur/': coreMedia.office,
  '/service/building-renovation/': coreMedia.commercial,
  '/demolition-contractor-kl-selangor/': coreMedia.commercial,
  '/electrical-services-selangor/': coreMedia.electrical,
  '/waterproofing-contractor-kuala-lumpur/': coreMedia.waterproofing,
  '/plaster-ceiling-contractor-kl/': coreMedia.ceiling,
  '/servis-cuci-rumah-kl/': coreMedia.cleaning,
};

export const aboutModel = {
  introduction: 'RK Reno Solution is a Kuala Lumpur based renovation and service team helping homeowners and business owners improve their spaces with practical, reliable, and clean workmanship.',
  mission: 'Our mission is to make renovation, repair, and installation work simple for customers by offering clear guidance, proper site checking, and dependable service from start to finish.',
  values: 'We believe in honest communication, careful workmanship, practical solutions, and respect for every customer’s time, budget, and property.',
  approach: 'Renovation work affects your comfort, budget, and property value. That is why our team takes time to understand your needs, check the site properly, and suggest practical solutions before starting the work.',
  expertise: [
    ['Home renovation', 'Practical improvement work for homes, including coordinated repair and finishing scopes.', '/house-renovation-in-kuala-lumpur/'],
    ['Office renovation', 'Property improvements and fit-out enquiries for working and commercial environments.', '/office-renovation-in-kuala-lumpur/'],
    ['Waterproofing', 'Site-led assessment and repair options for leakage and waterproofing concerns.', '/waterproofing-contractor-kuala-lumpur/'],
    ['Ceiling & aircond', 'Plaster ceiling and aircond installation services planned around the existing space.', '/plaster-ceiling-contractor-kl/'],
  ],
  coverage: 'RK Reno Solution provides renovation, repair, waterproofing, plaster ceiling, aircond installation, and cleaning services across Kuala Lumpur, Selangor, and nearby locations. Contact us to check service availability for your area.',
};

export const faqGroups = [
  {
    topic: 'Planning and design',
    items: [
      ['How long does a typical construction project take?', 'Project timing depends on the size, complexity, access, materials and confirmed work scope. The expected sequence and timing should be discussed during planning and quotation.'],
      ['Do you provide custom designs?', 'Share the intended use, preferred look, measurements and budget. RK Reno can review the requested renovation scope and explain what design or specialist input may be needed.'],
      ['Are your projects eco-friendly?', 'Material choices and energy-efficient options can be discussed when they suit the project requirements, availability and approved budget.'],
    ],
  },
  {
    topic: 'Quotation and project requirements',
    items: [
      ['What’s included in your pricing plans?', 'The written quotation should identify the agreed work, materials, quantities, exclusions and any site-dependent additional costs.'],
      ['Do you handle permits and regulations?', 'Approval requirements depend on the property and work scope. Local-authority, building-management and specialist requirements should be confirmed before affected work begins.'],
      ['What warranty do you offer on your projects?', 'Any applicable workmanship or product warranty should be confirmed in writing for the specific work and materials. No general warranty period is assumed.'],
    ],
  },
];

export const blogMediaByRoute: Record<string, string> = {
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/': coreMedia.aircond,
  '/commercial-retail-shop-renovation-in-kuala-lumpur/': coreMedia.commercial,
  '/office-renovation-petaling-jaya-corporate-fit-out-experts/': coreMedia.office,
  '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/': coreMedia.waterproofing,
  '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/': coreMedia.ceiling,
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/': coreMedia.aircondOutdoor,
  '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/': coreMedia.electrical,
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/': coreMedia.renovation,
  '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/': coreMedia.building,
  '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/': coreMedia.planningWide,
  '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/': coreMedia.deepCleaning,
  '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/': coreMedia.waterproofing,
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/': '/assets/media/owner/rk-reno-wall-mounted-aircond-unit-960.webp',
  '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/': coreMedia.cleaning,
};

export const relatedServiceLinks = [
  ['/services/', 'View all services'], ['/house-renovation-in-kuala-lumpur/', 'House renovation'],
  ['/aircond-installation-kl/', 'Aircond installation'], ['/waterproofing-contractor-kuala-lumpur/', 'Waterproofing'],
];
