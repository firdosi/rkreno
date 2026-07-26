export interface PriceCard {
  title: string;
  price: string;
  note?: string;
  items?: string[];
}

export interface PriceTable {
  title: string;
  intro: string;
  headers: string[];
  rows: string[][];
  footnote?: string;
}

const renovationPrices = (refreshLabel: string): PriceCard[] => [
  { title: 'Painting', price: 'From RM400', note: 'Per room for a basic repaint', items: ['Price depends on room size', 'Wall repair may cost extra', 'Paint quality affects the total'] },
  { title: 'Tile Installation Labour', price: 'From RM6/sq ft', note: 'Basic labour estimate', items: ['Tiles and adhesive may be separate', 'Hacking and floor levelling cost extra', 'Large-format or complex tiles cost more'] },
  { title: 'Bathroom Refresh', price: 'From RM3,000', note: 'Limited refresh, not a full rebuild', items: ['Suitable for selected fittings or repairs', 'Full hacking and waterproofing cost more', 'Final price depends on bathroom size'] },
  { title: 'Basic Bathroom Renovation', price: 'From RM6,000', note: 'Entry-level full scope', items: ['Depends on tiles and sanitary fittings', 'Plumbing changes may increase cost', 'Waterproofing scope must be confirmed'] },
  { title: refreshLabel, price: 'From RM8,000', note: 'Limited cosmetic improvement', items: ['May include paint and minor repairs', refreshLabel.includes('Condo') ? 'Not a complete-unit renovation' : 'Not a full-house rebuild', 'Scope depends on property size'] },
  { title: 'Basic Kitchen Renovation', price: 'From RM15,000', note: 'Entry-level kitchen scope', items: ['Cabinet length affects the price', 'Countertop and appliances may be separate', 'Hacking and plumbing can add cost'] },
];

export const priceCardsByRoute: Record<string, PriceCard[]> = {
  '/aircond-installation-kl/': [
    { title: '1.0HP & 1.5HP Wall-Mounted', price: 'RM220', note: 'Base installation price', items: ['5 feet of copper pipe included', '5 feet of wiring included', 'Basic drainage connection', 'Vacuum and basic testing'] },
    { title: '2.0HP & 2.5HP Wall-Mounted', price: 'RM280', note: 'Base installation price', items: ['5 feet of copper pipe included', '5 feet of wiring included', 'Basic drainage connection', 'Vacuum and basic testing'] },
  ],
  '/upah-pasang-aircond-selangor/': [
    { title: '1.0HP & 1.5HP Wall-Mounted', price: 'RM220', note: 'Harga pemasangan asas', items: ['Termasuk 5 kaki copper pipe', 'Termasuk 5 kaki wiring', 'Drainage connection asas', 'Vacuum dan testing asas'] },
    { title: '2.0HP & 2.5HP Wall-Mounted', price: 'RM280', note: 'Harga pemasangan asas', items: ['Termasuk 5 kaki copper pipe', 'Termasuk 5 kaki wiring', 'Drainage connection asas', 'Vacuum dan testing asas'] },
  ],
  '/house-renovation-in-kuala-lumpur/': renovationPrices('Basic Condo Refresh'),
  '/house-renovation-in-selangor/': renovationPrices('Basic Home Refresh'),
  '/office-renovation-in-kuala-lumpur/': [
    { title: 'Light Office Refresh', price: 'From RM30/sq ft', note: 'Limited cosmetic improvement', items: ['May include selected painting or flooring', 'Uses much of the existing layout', 'Repairs and M&E changes may cost extra'] },
    { title: 'Basic Office Fit-Out', price: 'From RM50/sq ft', note: 'Entry-level fit-out planning rate', items: ['Depends on partitions, ceiling and flooring', 'Furniture and equipment may be separate', 'Electrical, data and aircond scope must be measured'] },
    { title: 'Office Reinstatement', price: 'From RM20/sq ft', note: 'Basic restoration planning rate', items: ['Depends on the lease and handover checklist', 'Hacking and disposal affect the rate', 'Landlord inspection corrections may be separate'] },
  ],
};

export const priceTablesByRoute: Record<string, PriceTable> = {
  '/servis-aircond-murah-kl/': {
    title: 'Senarai Harga Servis Aircond Murah KL (2026)',
    intro: 'Anggaran untuk unit wall-mounted 1.0HP–2.5HP di Kuala Lumpur. Skop dan keadaan unit menentukan harga akhir.',
    headers: ['Jenis Servis Aircond', 'Anggaran Harga (RM)'],
    rows: [
      ['Normal Service (Cuci Biasa) — penapis, cover luar dan blower', 'RM 60 – RM 80'],
      ['Chemical Wash (Overhaul) — cucian mendalam', 'RM 120 – RM 150'],
      ['Top Up Gas (R32 / R410A)', 'RM 50 – RM 120, bergantung pada bacaan PSI'],
      ['Pemeriksaan & Troubleshooting', 'RM 50 – RM 80 caj pemeriksaan'],
    ],
  },
  '/home-renovation-contractor-in-subang-jaya/': {
    title: 'Estimated Renovation Costs in Subang Jaya',
    intro: 'Every home is unique. These currently published figures are general estimates and require a confirmed site scope.',
    headers: ['Type of Renovation Service', 'Estimated Cost (RM)'],
    rows: [
      ['Living Room Makeover — ceiling, downlights and repainting', 'RM 4,000 – RM 12,000'],
      ['Kitchen Extension — hacking, tiling, piping and cabinets', 'RM 15,000 – RM 35,000+'],
      ['Bathroom Remodeling — tiles, waterproofing and sanitary ware', 'RM 6,000 – RM 15,000'],
    ],
  },
  '/waterproofing-contractor-kuala-lumpur/': {
    title: 'Estimated Waterproofing Costs in KL (2026)',
    intro: 'Costs depend on the leak severity, location, access and confirmed treatment.',
    headers: ['Type of Waterproofing Service', 'Estimated Cost (RM)'],
    rows: [
      ['PU Injection Grouting — active concrete cracks', 'RM 150 – RM 300 per point'],
      ['No-Hack Bathroom Waterproofing', 'RM 800 – RM 1,500 per room'],
      ['Torch-On Membrane (Roofs)', 'RM 15 – RM 25 per sq ft'],
    ],
  },
  '/plaster-ceiling-contractor-kl/': {
    title: 'Estimated Plaster Ceiling Costs in Kuala Lumpur (2026)',
    intro: 'Published estimates vary by design complexity, measurements, access and the confirmed finishing scope.',
    headers: ['Ceiling Design / Service', 'Estimated Price', 'Measurement Unit'],
    rows: [
      ['Standard Flat Plaster Ceiling', 'RM 3.50 – RM 6.00', 'Per square foot'],
      ['L-Box Design (Cove Lighting)', 'RM 15.00 – RM 25.00', 'Per foot run'],
      ['Light Trough / Pelmet', 'RM 18.00 – RM 28.00', 'Per foot run'],
      ['Cornice Molding Installation', 'RM 5.00 – RM 12.00', 'Per foot run'],
      ['Manhole / Access Panel', 'RM 80 – RM 150', 'Per unit'],
    ],
  },
};

export const pricingSectionPattern = /prices?$|harga upah|minimum starting prices/i;
