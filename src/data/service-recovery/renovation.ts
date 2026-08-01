import { createModel, media, related, standardAreas, standardProcess } from './shared';

const homeTypes = [
  { title: 'Room refreshes', text: 'Painting, ceiling, flooring, lighting and selected repair work for one or more rooms.' },
  { title: 'Kitchen and bathroom work', text: 'Plan wet works, tiling, fittings, cabinets, plumbing and waterproofing as one coordinated scope.' },
  { title: 'Multi-trade renovation', text: 'Combine demolition, finishes, electrical and plumbing work under an itemised quotation.' },
];
const homeScope = [
  { title: 'Interior finishes', text: 'Wall preparation, painting, tiling, flooring, plaster ceiling and carpentry coordination.' },
  { title: 'Wet areas', text: 'Bathroom and kitchen scopes may include hacking, plumbing, waterproofing and replacement finishes.' },
  { title: 'Services', text: 'Selected wiring, lighting, aircond and plumbing changes are measured separately.' },
  { title: 'Preparation and disposal', text: 'Protection, demolition, debris handling and making good should be stated in the quotation.' },
];
const homeFactors = [
  { title: 'Property condition', text: 'Existing damage, concealed defects and previous alterations affect preparation work.' },
  { title: 'Quantities and materials', text: 'Room size, measured quantities, finish selections and fitting quality shape the budget.' },
  { title: 'Access and approvals', text: 'Condo rules, deposits, lift protection, work hours and structural approvals can affect planning.' },
  { title: 'Occupied or vacant', text: 'Protection, phasing, storage and cleaning differ when a property remains occupied.' },
];
const renovationProcess = standardProcess(['Define rooms and priorities', 'Inspect and measure', 'Confirm scope, cost and sequence', 'Renovate, check and hand over']);

const residential = (route: string, values: any) => createModel(route, 'renovation', {
  bodyImages: [{ src: media.planning, alt: 'Renovation planning drawings and measurements' }, { src: values.secondaryImage || media.contractor, alt: 'Renovation work scope under review' }],
  overview: values.overview,
  typesTitle: 'Renovation options', types: homeTypes,
  scopeTitle: 'Work that can form the renovation scope', scope: homeScope,
  quotationFactors: homeFactors,
  process: renovationProcess,
  areas: values.areas,
  related: related('houseKl', 'houseSelangor', 'office', 'demolition'),
  finalTitle: values.finalTitle,
  ...values,
});

export const renovationModels = {
  '/service/building-renovation/': createModel('/service/building-renovation/', 'renovation', {
    eyebrow: 'Building renovation', title: 'Building Renovation',
    lead: 'Plan residential or commercial building improvement around the actual property condition, required spaces, access and agreed construction scope.',
    heroImage: media.commercial, heroAlt: 'Commercial building renovation and fit-out work',
    bodyImages: [{ src: media.planning, alt: 'Plans and measurements used to organise renovation work' }, { src: media.contractor, alt: 'Construction team reviewing a building work scope' }],
    overview: [{ title: 'Residential and commercial', text: 'Building improvement enquiries for different property uses.' }, { title: 'Measured scope', text: 'Define rooms, quantities, services and finishes before pricing.' }, { title: 'Planned sequence', text: 'Coordinate preparation, trade work and finishing.' }],
    typesTitle: 'Building improvement scopes',
    types: [{ title: 'Interior renovation', text: 'Reconfigure or refresh rooms, finishes and selected services.' }, { title: 'Repair and expansion', text: 'Discuss repairs or additional space subject to assessment and approvals.' }, { title: 'Commercial fit-out', text: 'Plan partitions, ceilings, flooring and building services for the intended use.' }],
    scope: homeScope,
    quotationFactors: homeFactors,
    process: renovationProcess,
    related: related('houseKl', 'office', 'demolition'),
    pricingNote: 'Building-renovation pricing requires drawings or measurements, material choices, access conditions and an agreed work schedule.',
    faqs: [],
    finalTitle: 'Discuss a building renovation scope',
  }),
  '/house-renovation-in-kuala-lumpur/': residential('/house-renovation-in-kuala-lumpur/', {
    eyebrow: 'House renovation', secondaryImage: media.home,
    overview: [{ title: 'From RM400', text: 'Published starting guidance for a basic room repaint.' }, { title: 'From RM3,000', text: 'Published limited bathroom-refresh guidance.' }, { title: 'Condos to landed homes', text: 'Small repairs through wider multi-trade scopes.' }],
    areas: ['Kuala Lumpur', 'Setapak', 'Wangsa Maju', 'Cheras', 'Bangsar', 'Kepong', 'Mont Kiara'],
    finalTitle: 'Plan a house renovation in Kuala Lumpur',
  }),
  '/house-renovation-in-selangor/': residential('/house-renovation-in-selangor/', {
    eyebrow: 'House renovation Selangor', heroImage: media.building, heroAlt: 'Residential renovation and property improvement in Selangor', secondaryImage: media.home,
    overview: [{ title: 'Small to full scope', text: 'Repairs, room refreshes and wider renovation projects.' }, { title: 'Multiple property types', text: 'Terrace houses, condos, apartments and selected commercial spaces.' }, { title: 'Itemised planning', text: 'Separate measured trades, materials, exclusions and additional work.' }],
    areas: ['Petaling Jaya', 'Shah Alam', 'Subang Jaya', 'Puchong', 'Klang', 'Ampang', 'Selangor'],
    finalTitle: 'Plan a house renovation in Selangor',
  }),
  '/home-renovation-contractor-in-subang-jaya/': residential('/home-renovation-contractor-in-subang-jaya/', {
    eyebrow: 'Subang Jaya renovation', heroImage: media.planning, heroAlt: 'Planning and measurement for a Subang Jaya home renovation', secondaryImage: media.building,
    overview: [{ title: 'Subang Jaya focus', text: 'Renovation enquiries for homes and condos around Subang Jaya and USJ.' }, { title: 'RM4,000–RM12,000', text: 'Published living-room makeover estimate, subject to confirmed scope.' }, { title: 'Approval-aware', text: 'Discuss MBSJ, management and structural requirements where applicable.' }],
    areas: ['Subang Jaya', 'USJ', 'SS12–SS19', 'Putra Heights', 'Bandar Sunway', 'Selangor'],
    finalTitle: 'Request a Subang Jaya renovation review',
  }),
  '/office-renovation-in-kuala-lumpur/': createModel('/office-renovation-in-kuala-lumpur/', 'renovation', {
    eyebrow: 'Office renovation', bodyImages: [{ src: media.planning, alt: 'Office renovation plans and measurements' }, { src: media.commercial, alt: 'Commercial renovation and fit-out preparation' }],
    overview: [{ title: 'From RM30/sq ft', text: 'Published planning guidance for a light office refresh.' }, { title: 'Fit-out and reinstatement', text: 'New layouts, upgrades and landlord handover work.' }, { title: 'Building-rule planning', text: 'Access, deposits, delivery routes and approved work hours matter.' }],
    typesTitle: 'Office scopes by business need',
    types: [{ title: 'Small office refresh', text: 'Selected paint, flooring, lighting or partition repair while retaining most of the layout.' }, { title: 'New office fit-out', text: 'Plan reception, rooms, workstations, pantry, electrical, data, lighting and finishes.' }, { title: 'Occupied upgrade', text: 'Phase work and protection around business operations and approved hours.' }, { title: 'Reinstatement', text: 'Remove tenant additions and restore the unit to an agreed handover checklist.' }],
    scopeTitle: 'Fit-out work that can be coordinated',
    scope: [{ title: 'Partitions and ceilings', text: 'Gypsum, aluminium or glass partitions with selected ceiling and lighting preparation.' }, { title: 'Flooring and finishes', text: 'Carpet tile, vinyl, SPC, painting and repair work according to use and condition.' }, { title: 'Electrical and data', text: 'Power, lighting circuits, data routes and workstation-service coordination.' }, { title: 'Handover work', text: 'Protection, removals, disposal, testing, touch-ups and landlord corrections as quoted.' }],
    quotationFactors: [{ title: 'Floor area and layout', text: 'Measured spaces, room count and workstation requirements drive quantities.' }, { title: 'Existing services', text: 'Electrical, data, aircond, fire and ceiling conditions influence coordination.' }, { title: 'Material specification', text: 'Partition, flooring, lighting and finish selections change the rate.' }, { title: 'Building controls', text: 'Applications, deposits, loading access, noise rules and work hours affect delivery.' }],
    process: standardProcess(['Share the plan and requirements', 'Review site and building rules', 'Confirm scope and quotation', 'Fit out, test and hand over']),
    areas: ['Kuala Lumpur City Centre', 'Bangsar', 'Mont Kiara', 'Damansara', 'Setapak', 'Cheras'],
    related: related('houseKl', 'electrical', 'ceiling', 'demolition'),
    finalTitle: 'Request an office renovation quotation',
  }),
};
