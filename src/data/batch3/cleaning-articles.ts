import type { BatchArticle } from '../batch2-articles';

export const cleaningArticles: Record<string, BatchArticle> = {
  '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/': {
    category: 'Home cleaning guide',
    title: 'Servis Cuci Rumah KL: Home Cleaning Planning Guide',
    summary: 'Prepare a clear home-cleaning scope around rooms, surfaces, access, property condition and the level of cleaning required.',
    image: '/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg',
    imageAlt: 'General kitchen cleaning service imagery',
    published: '2026-03-28', modified: '2026-03-28',
    sections: [
      { title: 'Choose the level of cleaning required', paragraphs: ['General cleaning focuses on routine accessible areas. Deep, move-in or move-out, and post-renovation cleaning involve different levels of dust, empty-space access and detailing. Confirm which type is supported for the property when enquiring.'] },
      { title: 'Create a room-by-room scope', paragraphs: ['List bedrooms, bathrooms, living areas, kitchen, accessible windows, cabinets and floors. Identify delicate materials, restricted areas and anything outside the expected scope.'], points: ['Property type and approximate area', 'Occupied, furnished or empty condition', 'Areas with renovation dust or heavy build-up', 'Parking, lift and access arrangements'] },
      { title: 'Set realistic expectations', paragraphs: ['Some marks, paint, cement residue or aged surfaces may not respond to normal cleaning and can be damaged by aggressive treatment. Cleaning should not be described as guaranteed stain removal, disinfection or a particular health outcome without evidence.'] },
      { title: 'Prepare for quotation and arrival', paragraphs: ['Clear photos or a site review help define the condition and required areas. The final quotation depends on size, condition, access, furnishing and the confirmed scope.'] },
    ],
    serviceHref: '/servis-cuci-rumah-kl/', serviceLabel: 'Home cleaning service in Kuala Lumpur',
    related: [{ href: '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/', label: 'Deep-cleaning enquiry guide' }, { href: '/services/', label: 'Browse all services' }, { href: '/contact-us/', label: 'Request a cleaning quotation' }],
  },
  '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/': {
    category: 'Deep cleaning guide',
    title: 'Pakej Deep Cleaning Rumah KL: Scope and Enquiry Guide',
    summary: 'Plan a one-off deep-cleaning enquiry for a Kuala Lumpur home, including current availability, property condition and quotation factors.',
    image: '/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg',
    imageAlt: 'General kitchen cleaning imagery, not a customer project',
    published: '2026-04-04', modified: '2026-05-21',
    sections: [
      { title: 'Confirm the current service scope', paragraphs: ['The retained URL refers to pre-Hari Raya cleaning, but seasonal package availability is not confirmed. Ask what cleaning options and dates are currently available rather than assuming a named festive package can be booked.'] },
      { title: 'Deep cleaning needs a defined checklist', paragraphs: ['Discuss accessible high surfaces, kitchen areas, bathrooms, windows, cabinets, floors and other requested areas. The property condition and whether it is furnished affect what can be completed.'], points: ['Share the property size and location', 'State whether it is occupied or empty', 'Identify post-renovation dust or unusual residue', 'Confirm exclusions and access limits'] },
      { title: 'Photography limitation', paragraphs: ['Seven production source images for this article are broken and were not present in the available backup. The general local cleaning image on this page is illustrative and does not show an RK Reno customer project. Verified project photography is still required.'] },
      { title: 'Availability and quotation are enquiry-based', paragraphs: ['Dates, staffing, equipment and the final quotation depend on the current schedule, property condition and agreed scope. No fixed duration, stain-removal result or seasonal availability should be assumed.'] },
    ],
    serviceHref: '/servis-cuci-rumah-kl/', serviceLabel: 'Home cleaning service in Kuala Lumpur',
    related: [{ href: '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/', label: 'Home cleaning planning guide' }, { href: '/contact-us/', label: 'Ask about current availability' }],
  },
};
