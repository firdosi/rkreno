export interface ServiceHeroFact {
  value: string;
  label: string;
}

export interface ServiceExactConfig {
  variant: 'detailed' | 'legacy' | 'building';
  heroTitle: string;
  lead: string;
  image: string;
  imageAlt: string;
  chips?: string[];
  facts?: ServiceHeroFact[];
  primaryLabel?: string;
  secondaryLabel?: string;
  skipPatterns?: RegExp[];
}

export const serviceExactRoutes = [
  '/servis-aircond-murah-kl/',
  '/aircond-installation-kl/',
  '/upah-pasang-aircond-selangor/',
  '/service/building-renovation/',
  '/electrical-services-selangor/',
  '/house-renovation-in-kuala-lumpur/',
  '/house-renovation-in-selangor/',
  '/home-renovation-contractor-in-subang-jaya/',
  '/office-renovation-in-kuala-lumpur/',
  '/waterproofing-contractor-kuala-lumpur/',
  '/plaster-ceiling-contractor-kl/',
  '/servis-cuci-rumah-kl/',
] as const;

export const serviceExactConfig: Record<string, ServiceExactConfig> = {
  '/servis-aircond-murah-kl/': {
    variant: 'legacy',
    heroTitle: 'Pakar Servis Aircond Murah KL',
    lead: 'Aircond kurang sejuk atau bocor air? RK Reno Solution menawarkan Servis Aircond Murah KL yang pantas dan berkualiti. Kami pakar cucian kimia (chemical wash), tambah gas, dan baik pulih untuk rumah dan pejabat anda.',
    image: '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
    imageAlt: 'Owner-supplied wall-mounted aircond unit with service access',
    chips: ['Harga Bajet', 'Pantas', 'Dipercayai'],
    primaryLabel: 'WhatsApp Sekarang',
    secondaryLabel: 'Email Sebut Harga',
    facts: [{ value: 'RM 60+', label: 'Harga Bermula' }],
    skipPatterns: [/waranti servis/i, /ujian, pembersihan akhir & waranti/i, /jaminan mutu kerja/i],
  },
  '/aircond-installation-kl/': {
    variant: 'detailed',
    heroTitle: 'Professional Aircond Installation KL for Homes, Condos, Offices & Shops',
    lead: 'Wall-mounted aircond installation in Kuala Lumpur for new units, replacements and relocation. Base installation starts from RM220 and includes 5 feet of copper pipe plus 5 feet of wiring.',
    image: '/assets/media/721430356-1623451745783563-6720154604310865920-n-b6c68602.jpg',
    imageAlt: 'RK Reno technician carrying out aircond installation in Kuala Lumpur',
    chips: ['1.0HP & 1.5HP: RM220', '2.0HP & 2.5HP: RM280'],
    secondaryLabel: 'View Installation Prices',
    facts: [
      { value: 'From RM220', label: 'Base wall-mounted installation' },
      { value: '5 feet + 5 feet', label: 'Copper pipe and wiring included' },
      { value: 'Residential & commercial', label: 'Homes, condos, offices and shops' },
      { value: 'Kuala Lumpur', label: 'Check your exact area through WhatsApp' },
    ],
  },
  '/upah-pasang-aircond-selangor/': {
    variant: 'detailed',
    heroTitle: 'Upah Pasang Aircond Selangor untuk Rumah, Pejabat & Kedai',
    lead: 'Servis pemasangan aircond wall-mounted untuk unit baru, penggantian unit lama dan pemasangan semula. Harga asas bermula RM220, termasuk 5 kaki copper pipe dan 5 kaki wiring.',
    image: '/assets/media/721430356-1623451745783563-6720154604310865920-n-b6c68602.jpg',
    imageAlt: 'Juruteknik RK Reno menjalankan pemasangan aircond di Selangor',
    chips: ['1.0HP & 1.5HP: RM220', '2.0HP & 2.5HP: RM280'],
    primaryLabel: 'WhatsApp untuk Quotation',
    secondaryLabel: 'Semak Harga Pemasangan',
    facts: [
      { value: 'Dari RM220', label: 'Harga pemasangan asas' },
      { value: '5 kaki + 5 kaki', label: 'Copper pipe dan wiring termasuk' },
      { value: 'Rumah, pejabat & kedai', label: 'Untuk kediaman dan komersial' },
      { value: 'Selangor & Lembah Klang', label: 'Semak kawasan melalui WhatsApp' },
    ],
  },
  '/service/building-renovation/': {
    variant: 'building',
    heroTitle: 'Building Renovation',
    lead: 'Our expertise combines visionary design with practical execution, ensuring functional, beautiful spaces that meet the demands of modern life and exceed expectations.',
    image: '/assets/media/service1-875x1001-6a2b0a4a.webp',
    imageAlt: 'Neutral construction and building-renovation service image',
    skipPatterns: [/professionally qualified/i, /frequently asked questions/i, /need any helps/i],
  },
  '/electrical-services-selangor/': {
    variant: 'legacy',
    heroTitle: 'Electrical Services Selangor',
    lead: 'Powering your property safely. RK Reno Solution provides electrical services for homes and offices, including rewiring, troubleshooting and 3-phase upgrade enquiries.',
    image: '/assets/media/Construction-workers-discussing-renovation-plans-092133b6.jpg',
    imageAlt: 'Property work being reviewed before electrical service',
    chips: ['Inspection', 'Wiring', 'Troubleshooting'],
    facts: [
      { value: 'Site review', label: 'Inspection before quotation' },
      { value: 'Clear scope', label: 'Work agreed before starting' },
      { value: 'Homes & offices', label: 'Property-based electrical work' },
      { value: 'KL & Selangor', label: 'Confirm the exact service area' },
    ],
    skipPatterns: [/certified workmanship/i, /safety first guarantee/i, /emergency service/i, /strictly adhere/i, /SIRIM/i],
  },
  '/house-renovation-in-kuala-lumpur/': {
    variant: 'detailed',
    heroTitle: 'House Renovation Contractor in Kuala Lumpur for Condos, Apartments & Landed Homes',
    lead: 'Renovation services for Kuala Lumpur properties, including painting, tiling, kitchens, bathrooms, wet works, electrical upgrades and selected repairs. Start with a smaller scope or combine several trades into a wider renovation.',
    image: '/assets/media/Home-renovation-service-in-KL-422b205c.jpg',
    imageAlt: 'House renovation and living-area improvement example in Kuala Lumpur',
    chips: ['Painting from RM400 per room*', 'Bathroom refresh from RM3,000*', 'Basic condo refresh from RM8,000*'],
    facts: [
      { value: 'Small to full scope', label: 'Repairs, room upgrades and larger projects' },
      { value: 'KL property types', label: 'Condos, apartments and landed homes' },
      { value: 'Multiple trades', label: 'Painting, tiling, plumbing and electrical' },
      { value: 'Kuala Lumpur', label: 'Check your area through WhatsApp' },
    ],
  },
  '/house-renovation-in-selangor/': {
    variant: 'detailed',
    heroTitle: 'House Renovation Contractor in Selangor for Small Upgrades & Full Projects',
    lead: 'Renovation services for terrace houses, condos, apartments, offices and shops. Start with a small repair or refresh, then expand the scope according to your property, priorities and budget.',
    image: '/assets/media/Modern-building-renovation-and-property-improvement-b1ec6039.jpg',
    imageAlt: 'House renovation and interior improvement example in Selangor',
    chips: ['Painting from RM400 per room*', 'Bathroom refresh from RM3,000*', 'Basic home refresh from RM8,000*'],
    facts: [
      { value: 'Small to full scope', label: 'Repairs, refreshes and larger renovations' },
      { value: 'Clear work scope', label: 'Review inclusions before work begins' },
      { value: 'Multiple trades', label: 'Tiling, painting, electrical and plumbing' },
      { value: 'Selangor coverage', label: 'Check availability through WhatsApp' },
    ],
  },
  '/home-renovation-contractor-in-subang-jaya/': {
    variant: 'legacy',
    heroTitle: 'Home Renovation Contractor in Subang Jaya',
    lead: 'Transform your space with RK Reno Solution. Discuss the property, renovation priorities, pricing scope and any management or local-authority requirements before work begins.',
    image: '/assets/media/Renovation-planning-and-project-drawings-6cfdb2fc.jpg',
    imageAlt: 'Neutral renovation planning image for a Subang Jaya home',
    chips: ['Local Planning', 'Itemised Scope', 'Site Review'],
    facts: [
      { value: 'Subang Jaya', label: 'Local renovation planning' },
      { value: 'Clear scope', label: 'Room and work requirements' },
      { value: 'Site review', label: 'Access and condition checks' },
      { value: 'Itemised quote', label: 'Confirm inclusions and exclusions' },
    ],
    skipPatterns: [/guarantee perfection/i, /fast response/i],
  },
  '/office-renovation-in-kuala-lumpur/': {
    variant: 'detailed',
    heroTitle: 'Office Renovation Contractor in Kuala Lumpur for Small Offices, Corporate Fit-Outs & Reinstatement',
    lead: 'Renovation and fit-out services for offices, shop offices and commercial workspaces. Plan partitions, ceilings, flooring, painting, electrical points, data cabling, aircond coordination and reinstatement under one clear work scope.',
    image: '/assets/media/Office-renovation-service-in-Selangor-7928d19d.jpg',
    imageAlt: 'Modern office renovation with open-plan layout and partitions',
    chips: ['Light refresh from RM30/sq ft*', 'Basic fit-out from RM50/sq ft*', 'Reinstatement from RM20/sq ft*'],
    facts: [
      { value: 'Refresh to full fit-out', label: 'Choose a limited or wider work scope' },
      { value: 'Multiple trades', label: 'Partitions, flooring, wiring and finishes' },
      { value: 'Reinstatement', label: 'Restore rented units to agreed condition' },
      { value: 'Kuala Lumpur', label: 'Confirm exact location through WhatsApp' },
    ],
  },
  '/waterproofing-contractor-kuala-lumpur/': {
    variant: 'legacy',
    heroTitle: 'Waterproofing Contractor Kuala Lumpur',
    lead: 'Arrange inspection for roof, bathroom, balcony, wall and concrete leakage before selecting a repair or waterproofing method.',
    image: '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg',
    imageAlt: 'Bathroom waterproofing service image in Kuala Lumpur',
    chips: ['Leak Inspection', 'Method Review', 'Site-Based Scope'],
    facts: [
      { value: 'Inspection', label: 'Identify the likely water path' },
      { value: 'Method review', label: 'Match repair to site conditions' },
      { value: 'Clear limits', label: 'Explain access and repair scope' },
      { value: 'Kuala Lumpur', label: 'Confirm location through WhatsApp' },
    ],
    skipPatterns: [/warranty/i, /guarantee/i, /permanent/i, /fix the leak perfectly/i, /official warranty certificate/i],
  },
  '/plaster-ceiling-contractor-kl/': {
    variant: 'legacy',
    heroTitle: 'Expert Plaster Ceiling Contractor KL',
    lead: 'RK Reno Solution provides plaster ceiling installation and repair planning for L-box designs, cornices, light troughs, homes and offices.',
    image: '/assets/media/Plaster-ceiling-and-aircond-installation-dd789b38.jpg',
    imageAlt: 'Plaster ceiling and aircond coordination image',
    chips: ['Aesthetic', 'Modern', 'Measured Scope'],
    facts: [
      { value: 'Measured scope', label: 'Confirm ceiling dimensions' },
      { value: 'Design options', label: 'L-box, cornice and light trough' },
      { value: 'Coordination', label: 'Plan lighting and aircond openings' },
      { value: 'Kuala Lumpur', label: 'Check the exact work location' },
    ],
    skipPatterns: [/flawless finishing guarantee/i, /perfectly smooth, crack-free/i],
  },
  '/servis-cuci-rumah-kl/': {
    variant: 'legacy',
    heroTitle: 'Pakar Servis Cuci Rumah KL',
    lead: 'RK Reno Solution menyediakan Servis Cuci Rumah KL termasuk move-in cleaning, post-renovation cleaning dan spring cleaning mengikut skop yang dipersetujui.',
    image: '/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg',
    imageAlt: 'Detailed kitchen cleaning service in Kuala Lumpur',
    chips: ['Bersih', 'Skop Jelas', 'Kuala Lumpur'],
    facts: [
      { value: 'Skop jelas', label: 'Kerja dipersetujui lebih awal' },
      { value: 'Deep cleaning', label: 'Mengikut keadaan rumah' },
      { value: 'Post-renovation', label: 'Pembersihan selepas kerja ubah suai' },
      { value: 'Kuala Lumpur', label: 'Semak lokasi melalui WhatsApp' },
    ],
  },
};
