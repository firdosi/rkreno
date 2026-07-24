export interface ArticleSection {
  title: string;
  paragraphs: string[];
  subheading?: string;
  points?: string[];
  table?: { headers: string[]; rows: string[][] };
}
export interface BatchArticle {
  category: string; title: string; summary: string; image: string; imageAlt: string;
  imageSrcSet?: { src: string; width: number }[];
  imageWidth?: number; imageHeight?: number; imageCaption?: string;
  published: string; modified: string; sections: ArticleSection[];
  serviceHref: string; serviceLabel: string;
  related?: { href: string; label: string }[];
}

export const batch2Articles: Record<string, BatchArticle> = {
  '/commercial-retail-shop-renovation-in-kuala-lumpur/': {
    category: 'Commercial renovation', title: 'Commercial Retail Shop Renovation in Kuala Lumpur',
    summary: 'A practical guide to planning retail layout, services, finishes, access and handover for a Kuala Lumpur shop renovation.',
    image: '/assets/media/Renovation-contractor-for-commercial-buildings-93583952.jpg', imageAlt: 'General commercial renovation planning imagery', published: '2026-04-04', modified: '2026-04-04',
    sections: [
      { title: 'Begin with the retail operation', paragraphs: ['Document customer flow, display needs, storage, service counters and staff areas before finalising the layout. Building rules and available services can constrain the plan.'] },
      { title: 'Coordinate the fit-out', paragraphs: ['Partitions, ceilings, lighting, sockets, data, aircond interfaces, flooring and signage should be reviewed together.'], points: ['Confirm landlord or management requirements', 'Record existing defects and services', 'Agree access, protection and handover expectations'] },
      { title: 'Prepare for quotation', paragraphs: ['Provide the unit location, floor plan where available, intended use, photos, required finishes and preferred timeframe. A site inspection helps replace assumptions with a defined scope.'] },
    ], serviceHref: '/office-renovation-in-kuala-lumpur/', serviceLabel: 'Office and commercial renovation',
  },
  '/office-renovation-petaling-jaya-corporate-fit-out-experts/': {
    category: 'Office renovation', title: 'Office Renovation Petaling Jaya: Corporate Fit-Out Planning',
    summary: 'Plan a Petaling Jaya office fit-out around layout, services, building requirements, access and the agreed handover condition.',
    image: '/assets/media/Office-renovation-service-in-Selangor-7928d19d.jpg', imageAlt: 'General office fit-out service imagery', published: '2026-04-04', modified: '2026-04-04',
    sections: [
      { title: 'Translate work needs into a layout', paragraphs: ['List teams, meeting requirements, shared spaces, storage and visitor movement. Use that information to review partitions and furniture zones without making unsupported productivity claims.'] },
      { title: 'Services and finishes', paragraphs: ['Coordinate electrical points, lighting, data routes, ceiling access, aircond interfaces, flooring and painting before work is sequenced.'], points: ['Check building fit-out rules', 'Identify work that affects occupied areas', 'Define reinstatement and defect responsibilities'] },
      { title: 'Site inspection and handover', paragraphs: ['Inspect the premises, record the existing condition and confirm the scope before quotation. Handover timing depends on approvals, access, materials and the agreed work.'] },
    ], serviceHref: '/office-renovation-in-kuala-lumpur/', serviceLabel: 'Office renovation service',
  },
  '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/': {
    category: 'Waterproofing guide', title: 'Waterproofing Contractor Kuala Lumpur: Leak Inspection Guide (2026)',
    summary: 'Understand common leakage signs, inspection areas and quotation factors without assuming a permanent result before the source is assessed.',
    image: '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg', imageAlt: 'General waterproofing inspection imagery', published: '2026-03-28', modified: '2026-03-28',
    sections: [
      { title: 'Visible damage is a clue, not always the source', paragraphs: ['Peeling paint, stains, damp smells and mould show where moisture appears. Water may travel from a roof, joint, pipe, wet area or neighbouring surface.'] },
      { title: 'What an inspection considers', paragraphs: ['The review may include rainfall pattern, drainage, seals, cracks, wet areas and surrounding construction.'], points: ['Photograph when the leak appears', 'Note whether it follows rain or water use', 'Avoid covering the area before inspection'] },
      { title: 'Choosing a repair scope', paragraphs: ['Membrane, sealing, wet-area repair or PU injection may be discussed depending on the identified condition. A quotation should state assumptions, preparation and included areas.'] },
    ], serviceHref: '/waterproofing-contractor-kuala-lumpur/', serviceLabel: 'Waterproofing inspection service',
  },
  '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/': {
    category: 'Plaster ceiling guide', title: 'Plaster Ceiling Contractor KL: Design & Quotation Guide (2026)',
    summary: 'Review ceiling types, lighting coordination, repair considerations and the site information needed for a useful quotation.',
    image: '/assets/media/Plaster-ceiling-and-aircond-installation-dd789b38.jpg', imageAlt: 'General plaster ceiling installation imagery', published: '2026-03-28', modified: '2026-03-28',
    sections: [
      { title: 'Select a ceiling approach for the room', paragraphs: ['Flat ceilings provide a simple finish. Dropped levels, light troughs and cornices add detail but require more coordination and measurement.'] },
      { title: 'Coordinate what sits above and through the ceiling', paragraphs: ['Lighting, wiring, aircond services, access panels, curtains and maintenance access should be positioned before the ceiling is closed.'], points: ['Mark fitting locations', 'Confirm ceiling height', 'Keep access to serviceable equipment'] },
      { title: 'What affects a quotation', paragraphs: ['Area, levels, details, repair preparation, access, lighting cut-outs and finish requirements affect the scope. Fixed prices should not be assumed without measurement.'] },
    ], serviceHref: '/plaster-ceiling-contractor-kl/', serviceLabel: 'Plaster ceiling service',
  },
};

export const retainedArticles = [
  ['/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/', 'Aircond Installation KL Guide', 'Aircond'],
  ['/commercial-retail-shop-renovation-in-kuala-lumpur/', 'Commercial Retail Shop Renovation in Kuala Lumpur', 'Commercial'],
  ['/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/', 'Electrical Services Selangor Safety & Pricing Guide', 'Electrical'],
  ['/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/', 'House Renovation Cost Kuala Lumpur Guide', 'Renovation'],
  ['/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/', 'House Renovation in Selangor Guide', 'Renovation'],
  ['/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/', 'Office Renovation in Kuala Lumpur Guide', 'Commercial'],
  ['/office-renovation-petaling-jaya-corporate-fit-out-experts/', 'Office Renovation Petaling Jaya Fit-Out Planning', 'Commercial'],
  ['/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/', 'Pakej Deep Cleaning Rumah KL', 'Cleaning'],
  ['/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/', 'Plaster Ceiling Design & Quotation Guide', 'Ceiling'],
  ['/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/', 'PU Injection Waterproofing KL Guide', 'Waterproofing'],
  ['/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/', 'Servis Aircond Murah KL Guide', 'Aircond'],
  ['/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/', 'Servis Cuci Rumah KL Guide', 'Cleaning'],
  ['/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/', 'Upah Pasang Aircond Selangor Guide', 'Aircond'],
  ['/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/', 'Waterproofing and Leak Inspection Guide', 'Waterproofing'],
] as const;
