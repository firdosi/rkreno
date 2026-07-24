import type { BatchArticle } from '../batch2-articles';

export const aircondArticles: Record<string, BatchArticle> = {
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/': {
    category: 'Aircond installation guide',
    title: 'Aircond Installation KL: Planning Guide for 2026',
    summary: 'Plan aircond capacity, unit type, piping, drainage, vacuuming and testing around the room and actual installation route.',
    image: '/assets/media/Plaster-ceiling-and-aircond-installation-dd789b38.jpg',
    imageAlt: 'General aircond installation and ceiling coordination imagery',
    published: '2026-03-28', modified: '2026-03-28',
    sections: [
      {
        title: 'Size the unit for the actual heat load',
        paragraphs: ['Floor area is only a starting point. Sun exposure, ceiling height, glazing, occupancy and heat-producing equipment also affect the capacity discussion. A site review is more reliable than choosing horsepower from room size alone.'],
        subheading: 'Questions to settle before choosing a unit',
        points: ['Room dimensions and ceiling height', 'Hours of use and usual occupancy', 'Afternoon sun and large windows', 'A practical indoor and outdoor unit position'],
      },
      {
        title: 'Compare inverter and non-inverter choices',
        paragraphs: ['Inverter units vary compressor output as demand changes, while non-inverter units cycle on and off. The suitable choice depends on usage pattern, room conditions, available electrical supply and the selected model. Manufacturer specifications should guide the final comparison.'],
      },
      {
        title: 'Plan piping, drainage and electrical coordination',
        paragraphs: ['The route for insulated copper piping, condensate drainage and wiring should be agreed before drilling. Drainage needs a practical fall, and concealed routes may involve ceiling, wall or access work.'],
        table: {
          headers: ['Installation item', 'What to confirm'],
          rows: [
            ['Copper piping', 'Route, length, insulation and access'],
            ['Condensate drain', 'Discharge point, fall and leak testing'],
            ['Electrical supply', 'Suitable point and coordination with electrical work'],
            ['Outdoor unit', 'Stable location, airflow and maintenance access'],
          ],
        },
      },
      {
        title: 'Vacuuming, commissioning and quotation',
        paragraphs: ['After connections are completed, the system should be prepared and tested in line with the equipment requirements. The installation team should check operation, drainage and visible connections before handover. Final cost depends on capacity, piping length, access, brackets, electrical work, wall or ceiling conditions and the confirmed scope.'],
      },
    ],
    serviceHref: '/aircond-installation-kl/', serviceLabel: 'Aircond installation in Kuala Lumpur',
    related: [
      { href: '/upah-pasang-aircond-selangor/', label: 'Aircond installation in Selangor' },
      { href: '/servis-aircond-murah-kl/', label: 'Aircond servicing' },
      { href: '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/', label: 'Aircond installation quotation guide' },
      { href: '/contact-us/', label: 'Discuss the installation site' },
    ],
  },
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/': {
    category: 'Aircond maintenance guide',
    title: 'Servis Aircond KL: Maintenance and Troubleshooting Guide',
    summary: 'Understand routine aircond cleaning, common warning signs and when uncertain cooling or leakage problems need inspection.',
    image: '/assets/media/Plaster-ceiling-and-aircond-installation-dd789b38.jpg',
    imageAlt: 'General aircond servicing and ceiling access imagery',
    published: '2026-03-28', modified: '2026-03-28',
    sections: [
      { title: 'What routine servicing can address', paragraphs: ['Routine work may include checking and cleaning accessible filters, covers, coils and drainage components, followed by an operating check. The exact scope should match the unit condition and service requested.'], points: ['Reduced airflow from accumulated dirt', 'Odour or visible dirt around accessible parts', 'Drainage issues that require inspection', 'Maintenance before heavy-use periods'] },
      { title: 'Cooling problems have more than one cause', paragraphs: ['Warm air or slow cooling may relate to airflow, settings, room heat load, electrical faults, refrigerant issues or equipment condition. Cleaning alone cannot be assumed to solve every problem.'] },
      { title: 'Safe troubleshooting for occupants', paragraphs: ['Check the remote settings, clean only user-serviceable filters according to the manufacturer instructions, and confirm doors and windows are closed. Do not open electrical compartments or handle refrigerant. Arrange inspection when tripping, burning smells, unusual noise or persistent leakage occurs.'] },
      { title: 'Prepare for a useful service visit', paragraphs: ['Share the unit type, approximate age, symptoms, when the problem occurs and clear photos. Access, unit condition, service scope and any repair work affect the final quotation.'] },
    ],
    serviceHref: '/servis-aircond-murah-kl/', serviceLabel: 'Aircond servicing in Kuala Lumpur',
    related: [
      { href: '/aircond-installation-kl/', label: 'Aircond installation service' },
      { href: '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/', label: 'Aircond installation planning guide' },
      { href: '/contact-us/', label: 'Request an inspection' },
    ],
  },
};
