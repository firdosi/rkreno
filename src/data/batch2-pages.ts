import type { BatchPage } from './batch1-pages';

const contactLinks = [
  { title: 'Main renovation service', text: 'See the overall renovation approach and related work.', href: '/service/building-renovation/' },
  { title: 'Electrical services', text: 'Coordinate electrical checks and new points with the renovation scope.', href: '/electrical-services-selangor/' },
  { title: 'Request a site discussion', text: 'Send the property location, photos and intended work.', href: '/contact-us/' },
];

export const batch2Pages: Record<string, BatchPage> = {
  '/house-renovation-in-kuala-lumpur/': {
    eyebrow: 'Renovation · Kuala Lumpur', title: 'House Renovation in Kuala Lumpur',
    summary: 'Plan painting, tiling, kitchen, bathroom, ceiling, electrical and repair work around the condition and requirements of your Kuala Lumpur property.',
    image: '/assets/media/Home-renovation-service-in-KL-422b205c.jpg', imageAlt: 'General house renovation service imagery in Kuala Lumpur',
    introTitle: 'A renovation scope shaped around the property',
    intro: 'Condominiums, terrace houses and older homes have different access, management and existing-condition requirements. A site review helps define priorities and sequencing.',
    sections: [
      { title: 'Work to include in the plan', items: [
        { title: 'Interior updates', text: 'Painting, tiling, partitions, ceilings and room improvements.' },
        { title: 'Kitchen and bathroom', text: 'Layout, finishes, waterproofing and service coordination based on site conditions.' },
        { title: 'Repairs and services', text: 'Leak repairs, electrical work and related improvements identified during inspection.' },
      ] },
      { title: 'Planning and related services', items: contactLinks },
      { title: 'Kuala Lumpur service considerations', text: 'Share the property type, area, access rules and renovation objectives. Condominium or managed-building requirements should be confirmed with the relevant management before work is scheduled.' },
    ],
    faqs: [{ question: 'Can renovation cost be confirmed from photos?', answer: 'Photos support an initial discussion, but measurements, materials, access and existing conditions usually require a site review before a quotation is confirmed.' }],
    cta: 'Planning a Kuala Lumpur renovation?', ctaText: 'Send the property area, photos and the rooms or work you want included.',
  },
  '/house-renovation-in-selangor/': {
    eyebrow: 'Renovation · Selangor', title: 'House Renovation in Selangor',
    summary: 'Renovation planning for houses and residential properties across Selangor, from targeted repairs and room updates to coordinated multi-trade work.',
    image: '/assets/media/Modern-building-renovation-and-property-improvement-b1ec6039.jpg', imageAlt: 'General residential renovation and property improvement imagery',
    introTitle: 'Prioritise condition, function and sequence',
    intro: 'The useful starting point is a clear list of problems and intended changes. Site access, occupied areas, wet works and electrical or ceiling coordination can then be planned together.',
    sections: [
      { title: 'Common renovation requirements', items: [
        { title: 'Finishes and rooms', text: 'Painting, flooring, tiling and improvements to living or working areas.' },
        { title: 'Wet areas', text: 'Bathroom, kitchen and leakage work assessed before finishes are selected.' },
        { title: 'Coordinated trades', text: 'Ceiling, electrical, aircond and repair work sequenced around the agreed scope.' },
      ] },
      { title: 'Related services and next steps', items: contactLinks },
      { title: 'Areas across Selangor', text: 'Provide the town or neighbourhood with your enquiry so travel, access and site-inspection arrangements can be discussed naturally.' },
    ],
    faqs: [{ question: 'Do small renovation jobs require a site visit?', answer: 'Some work can be discussed from clear photos and measurements. Work involving concealed conditions, leakage, several trades or detailed measurement usually benefits from inspection.' }],
    cta: 'Discuss your Selangor property', ctaText: 'Share the location, property type and renovation priorities.',
  },
  '/home-renovation-contractor-in-subang-jaya/': {
    eyebrow: 'Renovation · Subang Jaya', title: 'Home Renovation Contractor in Subang Jaya',
    summary: 'Practical renovation, repair and improvement planning for homes in Subang Jaya, with the final scope based on the property and requested work.',
    image: '/assets/media/Renovation-planning-and-project-drawings-6cfdb2fc.jpg', imageAlt: 'General renovation planning imagery for a residential project',
    introTitle: 'Start with the home, not a generic package',
    intro: 'Existing layouts, access and property condition vary. Describe the outcome you want and arrange inspection where measurements or concealed conditions affect the work.',
    sections: [
      { title: 'Services to coordinate', items: [
        { title: 'Rooms and finishes', text: 'Painting, tiling, ceilings and practical layout improvements.' },
        { title: 'Kitchen and bathrooms', text: 'Wet-area, finish and service coordination based on the existing space.' },
        { title: 'Property repairs', text: 'Leakage, electrical and damaged-area work included where relevant.' },
      ] },
      { title: 'Useful internal resources', items: [
        ...contactLinks,
        { title: 'Waterproofing services', text: 'Review leakage and wet-area inspection options.', href: '/waterproofing-contractor-kuala-lumpur/' },
      ] },
    ],
    cta: 'Renovating in Subang Jaya?', ctaText: 'Send the property location, photos and a practical list of the changes needed.',
  },
  '/office-renovation-in-kuala-lumpur/': {
    eyebrow: 'Office Fit-Out · Kuala Lumpur', title: 'Office Renovation in Kuala Lumpur',
    summary: 'Plan office partitions, flooring, ceilings, electrical points, data requirements and reinstatement around the premises and business needs.',
    image: '/assets/media/Office-renovation-service-in-Selangor-7928d19d.jpg', imageAlt: 'General office renovation and fit-out service imagery',
    introTitle: 'Coordinate the workspace as one scope',
    intro: 'A useful office plan considers how people use the space, landlord or management requirements, services, access and handover expectations before finishes are ordered.',
    sections: [
      { title: 'Office fit-out elements', items: [
        { title: 'Layout and partitions', text: 'Work areas, meeting spaces, circulation and practical partition requirements.' },
        { title: 'Services and ceilings', text: 'Lighting, electrical points, data routes, aircond interfaces and ceiling coordination.' },
        { title: 'Finishes and handover', text: 'Flooring, painting, defects, cleaning and reinstatement items agreed for the premises.' },
      ] },
      { title: 'Before the site inspection', text: 'Prepare the floor plan if available, building rules, required work areas, operating constraints and preferred handover condition. Final timing and price depend on the confirmed scope.' },
    ],
    cta: 'Planning an office fit-out?', ctaText: 'Arrange a discussion and site inspection for the Kuala Lumpur premises.',
  },
  '/waterproofing-contractor-kuala-lumpur/': {
    eyebrow: 'Leak Inspection · Kuala Lumpur', title: 'Waterproofing Contractor Kuala Lumpur',
    summary: 'Arrange inspection for roof, bathroom, balcony, wall and concrete leakage before selecting a repair or waterproofing method.',
    image: '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg', imageAlt: 'General bathroom waterproofing service imagery in Kuala Lumpur',
    introTitle: 'Find the likely water path first',
    intro: 'A stain does not always identify the entry point. Inspection considers moisture pattern, joints, surfaces, drainage and surrounding construction before a repair scope is proposed.',
    sections: [
      { title: 'Areas and methods to assess', items: [
        { title: 'Roof and external areas', text: 'Membranes, joints, drainage and exposed surfaces reviewed for likely entry points.' },
        { title: 'Bathrooms and balconies', text: 'Wet areas, floor traps, joints and finishes assessed before repair work.' },
        { title: 'Walls and concrete', text: 'Cracks, seepage and possible PU-injection work considered only after the condition is inspected.' },
      ] },
      { title: 'Read the waterproofing guide', items: [
        { title: 'Leak inspection guide', text: 'Understand warning signs, inspection and quotation factors.', href: '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/' },
        { title: 'Request inspection', text: 'Send leak photos, the property location and when the problem appears.', href: '/contact-us/' },
      ] },
    ],
    faqs: [{ question: 'Can the repair scope be confirmed from a photo?', answer: 'No. Photos help locate visible symptoms, but the likely source and suitable treatment require site-based assessment.' }],
    cta: 'Need a leak inspected?', ctaText: 'Send clear photos and arrange an inspection before requesting a final quotation.',
  },
  '/plaster-ceiling-contractor-kl/': {
    eyebrow: 'Ceiling Services · Kuala Lumpur', title: 'Plaster Ceiling Contractor KL',
    summary: 'Plaster ceiling installation and repair for homes and offices, coordinated with lighting, aircond access and site measurements.',
    image: '/assets/media/Plaster-ceiling-and-aircond-installation-dd789b38.jpg', imageAlt: 'General plaster ceiling and aircond coordination imagery',
    introTitle: 'Measure and coordinate before installation',
    intro: 'Ceiling type, height, access panels, lighting positions, services and existing damage affect the practical scope. Site measurement is needed for detailed planning.',
    sections: [
      { title: 'Ceiling work to discuss', items: [
        { title: 'Flat and feature ceilings', text: 'Simple levels, light troughs and other details selected for the room and budget.' },
        { title: 'Repairs', text: 'Damaged, stained or opened ceiling areas reviewed with the underlying cause.' },
        { title: 'Lighting and access', text: 'Downlights, aircond interfaces and access panels coordinated before closing the ceiling.' },
      ] },
      { title: 'Design and pricing guide', items: [
        { title: 'Read the plaster ceiling guide', text: 'Review ceiling choices, measurements and quotation factors.', href: '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/' },
        { title: 'Arrange measurement', text: 'Send room details and arrange a site measurement.', href: '/contact-us/' },
      ] },
    ],
    cta: 'Planning ceiling work?', ctaText: 'Share the room type, approximate dimensions and lighting requirements.',
  },
};
