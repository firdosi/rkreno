import type { BatchArticle } from '../batch2-articles';

const planningSections: BatchArticle['sections'] = [
  { title: 'Begin with inspection and scope definition', paragraphs: ['Record the existing condition, intended changes, occupied areas, access rules and known defects. Separate essential repairs from optional finishes so the quotation can describe a clear scope.'] },
  { title: 'Coordinate layout, materials and services', paragraphs: ['Review room use, storage, circulation and fixed elements before selecting finishes. Electrical points, lighting, aircond interfaces, ceiling access, waterproofing and plumbing should be coordinated before walls, ceilings and floors are closed.'], points: ['Confirm dimensions and layout decisions', 'Select materials appropriate to the area', 'Identify wet work and concealed services', 'Record building-management or access requirements'] },
  { title: 'Sequence the work', paragraphs: ['Preparation and demolition, concealed services, wet work, ceilings, flooring, joinery, painting and final fixtures need a practical order. The exact sequence changes with the site and agreed scope.'] },
  { title: 'Understand quotation and handover factors', paragraphs: ['Property condition, measurements, access, selected materials, protection, disposal and coordination across trades affect a quotation. Handover should include a walkthrough of the agreed work and a record of items requiring attention. Timing depends on the confirmed work, access, approvals and material availability.'] },
];

export const renovationArticles: Record<string, BatchArticle> = {
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/': {
    category: 'Kuala Lumpur renovation guide',
    title: 'House Renovation in Kuala Lumpur: Planning and Quotation Guide',
    summary: 'Plan a Kuala Lumpur house renovation around inspection, layout, coordinated trades, materials, sequencing and a site-based quotation.',
    image: '/assets/media/Home-renovation-service-in-KL-422b205c.jpg',
    imageAlt: 'General house renovation service imagery in Kuala Lumpur',
    published: '2026-03-28', modified: '2026-07-18',
    sections: planningSections,
    serviceHref: '/house-renovation-in-kuala-lumpur/', serviceLabel: 'House renovation in Kuala Lumpur',
    related: [{ href: '/service/building-renovation/', label: 'Main renovation service' }, { href: '/contact-us/', label: 'Discuss a renovation scope' }],
  },
  '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/': {
    category: 'Selangor renovation guide',
    title: 'House Renovation in Selangor: Home Extension Planning Guide',
    summary: 'Review site conditions, layout, structural questions, services and quotation factors before planning a home extension in Selangor.',
    image: '/assets/media/Modern-building-renovation-and-property-improvement-b1ec6039.jpg',
    imageAlt: 'General residential renovation and property improvement imagery',
    published: '2026-03-28', modified: '2026-03-28',
    sections: [
      ...planningSections.slice(0, 2),
      { title: 'Treat extension work as site-dependent', paragraphs: ['An extension may affect structure, roof drainage, boundaries, foundations and existing services. Suitability and any authority or management requirements must be checked for the specific property by the appropriate parties; they should not be assumed from a generic guide.'] },
      ...planningSections.slice(2),
    ],
    serviceHref: '/house-renovation-in-selangor/', serviceLabel: 'House renovation in Selangor',
    related: [{ href: '/service/building-renovation/', label: 'Main renovation service' }, { href: '/contact-us/', label: 'Arrange a site discussion' }],
  },
  '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/': {
    category: 'Office renovation guide',
    title: 'Office Renovation in Kuala Lumpur: Fit-Out Planning Guide',
    summary: 'Plan an office fit-out around space requirements, building rules, coordinated services, work sequencing and handover.',
    image: '/assets/media/Office-renovation-service-in-Selangor-7928d19d.jpg',
    imageAlt: 'General office renovation and fit-out service imagery',
    published: '2026-03-28', modified: '2026-03-28',
    sections: [
      { title: 'Translate operational needs into a layout', paragraphs: ['Document team areas, meeting rooms, storage, visitor movement, shared facilities and furniture assumptions. The plan should fit the premises and agreed operational needs without promising a particular productivity result.'] },
      { title: 'Confirm premises and building requirements', paragraphs: ['Record the existing condition, access hours, lift protection, loading, noise restrictions, fire or building interfaces and reinstatement expectations. The property owner or management remains the source for applicable approvals and rules.'] },
      { title: 'Coordinate the fit-out', paragraphs: ['Partitions, electrical points, lighting, data routes, aircond interfaces, ceilings, flooring, painting and waterproofing where relevant should be reviewed as one scope.'], points: ['Resolve service routes before closing ceilings or partitions', 'Confirm material samples and finish boundaries', 'Plan work around occupied areas where applicable'] },
      { title: 'Quotation, sequence and handover', paragraphs: ['Area, existing condition, access, building rules, services, materials and the agreed handover condition affect the quotation. Work sequencing and timing should be confirmed only after the scope and dependencies are known.'] },
    ],
    serviceHref: '/office-renovation-in-kuala-lumpur/', serviceLabel: 'Office renovation in Kuala Lumpur',
    related: [{ href: '/service/building-renovation/', label: 'Main renovation service' }, { href: '/contact-us/', label: 'Discuss the office premises' }],
  },
};
