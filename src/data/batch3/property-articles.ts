import type { BatchArticle } from '../batch2-articles';

export const propertyArticles: Record<string, BatchArticle> = {
  '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/': {
    category: 'Electrical safety guide',
    title: 'Electrical Services Selangor: Safety and Quotation Guide',
    summary: 'Recognise electrical warning signs and prepare for inspection of wiring, sockets, lighting, fans, distribution boards or supply changes.',
    image: '/assets/media/Renovation-planning-and-project-drawings-6cfdb2fc.jpg',
    imageAlt: 'General property service planning imagery for electrical work',
    published: '2026-03-28', modified: '2026-03-28',
    sections: [
      { title: 'Warning signs need professional inspection', paragraphs: ['Repeated tripping, heat or discolouration at outlets, burning smells, sparking, buzzing or intermittent power can indicate an electrical fault. Switch off affected equipment when safe to do so and arrange inspection; do not open wiring, sockets or the distribution board yourself.'] },
      { title: 'Common work to define', paragraphs: ['The scope may involve fault finding, rewiring, additional sockets, lighting, fans, distribution-board work or coordination with renovation. Existing circuits and the intended load need to be checked before additions are confirmed.'], points: ['List rooms and affected points', 'Note when faults occur', 'Share photos without removing covers', 'Identify new appliances or equipment loads'] },
      { title: 'Distribution boards and supply changes', paragraphs: ['Protective devices and distribution-board condition require competent assessment. A phase or supply upgrade is not a generic solution; it depends on present supply, calculated demand and the applicable utility or regulatory process.'] },
      { title: 'What affects the quotation', paragraphs: ['Access, cable routes, concealed or surface installation, number of points, equipment, testing and making-good work affect the scope. Pricing should follow inspection and a defined specification rather than unsupported standard figures.'] },
    ],
    serviceHref: '/electrical-services-selangor/', serviceLabel: 'Electrical services in Selangor',
    related: [{ href: '/service/building-renovation/', label: 'Renovation coordination' }, { href: '/contact-us/', label: 'Request an electrical inspection' }],
  },
  '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/': {
    category: 'Waterproofing guide',
    title: 'PU Injection Waterproofing KL: Crack and Leak Repair Guide',
    summary: 'Understand when PU injection may be considered and why the crack, water source, structure and site condition must be inspected first.',
    image: '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg',
    imageAlt: 'General waterproofing inspection and repair imagery',
    published: '2026-04-04', modified: '2026-04-04',
    sections: [
      { title: 'PU injection is one possible leak-repair method', paragraphs: ['Polyurethane material may be injected into a suitable crack or joint to react with moisture and restrict a water path. It is a site-dependent treatment, not a universal answer for every wall stain or crack.'] },
      { title: 'Inspection comes before recommendation', paragraphs: ['The visible damp area may not be the entry point. The review should consider crack width and movement, water source, rainfall or usage pattern, surrounding construction and whether the condition may be structural.'], points: ['Record when water appears', 'Photograph the area before covering it', 'Check nearby roofs, wet areas, pipes and joints', 'Refer possible structural movement for appropriate assessment'] },
      { title: 'When another repair may be needed', paragraphs: ['Membrane repair, joint sealing, drainage correction, plumbing repair or other waterproofing work may be more relevant depending on the source. PU injection should not be presented as a structural repair or guaranteed permanent result.'] },
      { title: 'Confirm the repair scope on site', paragraphs: ['Access, substrate condition, crack pattern, water pressure and preparation affect suitability and quotation. Ask for the proposed treatment area, preparation and limitations to be recorded.'] },
    ],
    serviceHref: '/waterproofing-contractor-kuala-lumpur/', serviceLabel: 'Waterproofing inspection service',
    related: [{ href: '/service/building-renovation/', label: 'Main renovation service' }, { href: '/contact-us/', label: 'Arrange a leak inspection' }],
  },
};
