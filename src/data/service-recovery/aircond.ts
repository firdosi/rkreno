import { createModel, media, related, standardAreas, standardProcess } from './shared';

const installationTypes = [
  { title: 'New wall-mounted unit', text: 'Position the indoor and outdoor units around airflow, drainage, access and available wall space.' },
  { title: 'Replace an old unit', text: 'Remove the existing unit and confirm what piping, wiring, brackets or finishes can be retained.' },
  { title: 'Relocation', text: 'Dismantle and reinstall a suitable unit after reviewing its condition and both locations.' },
];
const installationScope = [
  { title: 'Copper pipe and insulation', text: 'The base package includes 5 feet; additional routing is measured for the actual site.' },
  { title: 'Wiring and drainage', text: 'Five feet of wiring and a basic drainage connection are included in the published base package.' },
  { title: 'Vacuum and testing', text: 'The connected system is vacuumed and given basic operational testing after installation.' },
  { title: 'Quoted separately', text: 'Extra pipe, wiring, trunking, brackets, difficult access, dismantling, disposal and making good are additional.' },
];
const installationFactors = [
  { title: 'Horsepower and unit type', text: 'Capacity and equipment type determine the base labour and material requirements.' },
  { title: 'Route length', text: 'Longer pipe, cable and drainage routes add measured materials and work.' },
  { title: 'Access and mounting', text: 'Height, outdoor-unit access, drilling, brackets and building restrictions can change the scope.' },
];

export const aircondModels = {
  '/servis-aircond-murah-kl/': createModel('/servis-aircond-murah-kl/', 'aircond', {
    eyebrow: 'Aircond servicing',
    bodyImages: [{ src: media.aircondUnit, alt: 'Wall-mounted aircond unit prepared for servicing' }, { src: media.aircondCondenser, alt: 'Outdoor condenser relevant to aircond diagnosis' }],
    overview: [{ title: 'From RM60', text: 'Published normal-service estimate for a wall-mounted unit.' }, { title: '1.0HP–2.5HP', text: 'Pricing guide applies to common wall-mounted capacities.' }, { title: 'KL coverage', text: 'Servicing enquiries across major Kuala Lumpur areas.' }],
    typesTitle: 'Servicing and repair options',
    types: [{ title: 'Normal service', text: 'Routine filter, cover and blower cleaning for dust and airflow.' }, { title: 'Chemical wash', text: 'Deeper cleaning for heavy dirt, odour or blocked drainage symptoms.' }, { title: 'Gas and diagnosis', text: 'Pressure checks, top-up discussion and troubleshooting for reported faults.' }, { title: 'Office service', text: 'Discuss wall units, cassette systems and recurring commercial requirements.' }],
    scopeTitle: 'What happens during a service',
    scope: [{ title: 'Describe the symptoms', text: 'Share whether the unit is not cold, leaking, noisy or showing an error.' }, { title: 'Protect and clean', text: 'Nearby surfaces are protected before the agreed cleaning scope.' }, { title: 'Check operation', text: 'Drainage, airflow and relevant outdoor-unit readings are reviewed.' }, { title: 'Confirm extra work', text: 'Gas, parts and repairs are discussed separately when inspection finds a need.' }],
    quotationFactors: [{ title: 'Service type', text: 'Normal cleaning, chemical wash and troubleshooting have different scopes.' }, { title: 'Unit and condition', text: 'Horsepower, unit type, dirt level and fault symptoms affect the work.' }, { title: 'Access and quantity', text: 'Number of units and indoor/outdoor access influence scheduling and price.' }],
    process: standardProcess(['Share the aircond problem', 'Diagnose the unit', 'Confirm service and extras', 'Clean, test and hand over']),
    areas: ['Setapak', 'Wangsa Maju', 'Cheras', 'Bangsar', 'Kepong', 'Bukit Bintang', 'Kuala Lumpur'],
    related: related('installKl', 'installSelangor', 'electrical'),
    finalTitle: 'Book aircond servicing in Kuala Lumpur',
  }),
  '/aircond-installation-kl/': createModel('/aircond-installation-kl/', 'aircond', {
    eyebrow: 'Aircond installation',
    bodyImages: [{ src: media.aircondUnit, alt: 'Wall-mounted aircond unit for installation planning' }, { src: media.aircondCondenser, alt: 'Outdoor condenser and installation access example' }],
    overview: [{ title: 'From RM220', text: 'Published base installation for 1.0HP and 1.5HP wall-mounted units.' }, { title: '5 ft + 5 ft included', text: 'Copper pipe and wiring included in the standard base scope.' }, { title: 'Homes and workplaces', text: 'Installation for rooms, condos, offices and shops.' }],
    types: installationTypes,
    scope: installationScope,
    quotationFactors: installationFactors,
    process: standardProcess(['Review both unit positions', 'Confirm routing and price', 'Install and connect', 'Vacuum and test']),
    areas: ['Kuala Lumpur', 'Setapak', 'Wangsa Maju', 'Cheras', 'Bangsar', 'Kepong', 'Mont Kiara'],
    related: related('installSelangor', 'service', 'electrical'),
    finalTitle: 'Get an aircond installation quote in KL',
  }),
  '/upah-pasang-aircond-selangor/': createModel('/upah-pasang-aircond-selangor/', 'aircond', {
    eyebrow: 'Aircond installation Selangor',
    bodyImages: [{ src: media.aircondCondenser, alt: 'Outdoor aircond unit for Selangor installation planning' }, { src: media.aircondUnit, alt: 'Wall-mounted indoor aircond unit' }],
    overview: [{ title: 'Dari RM220', text: 'Harga asas diterbitkan untuk unit wall-mounted 1.0HP dan 1.5HP.' }, { title: '5 kaki + 5 kaki', text: 'Copper pipe dan wiring termasuk dalam skop asas.' }, { title: 'Rumah, pejabat, kedai', text: 'Skop untuk kediaman dan premis komersial.' }],
    typesTitle: 'Jenis pemasangan', types: installationTypes,
    scopeTitle: 'Apa yang termasuk dan berasingan', scope: installationScope,
    quotationTitle: 'Faktor sebut harga', quotationFactors: installationFactors,
    process: standardProcess(['Semak kedudukan unit', 'Sahkan laluan dan harga', 'Pasang dan sambung', 'Vacuum dan test']),
    areas: [...standardAreas, 'Puchong', 'Klang'],
    related: related('installKl', 'service', 'electrical'),
    finalTitle: 'Minta quotation pemasangan di Selangor',
  }),
};
