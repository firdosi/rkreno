import { createModel, media, related, standardProcess } from './shared';

export const demolitionModel = createModel('/demolition-contractor-kl-selangor/', 'demolition', {
  eyebrow: 'Demolition & site preparation',
  title: 'Demolition Contractor KL & Selangor',
  lead: 'Discuss controlled interior removal, bathroom demolition, strip-out, debris handling and preparation before renovation in Kuala Lumpur and Selangor.',
  heroImage: media.commercial,
  heroAlt: 'Interior construction area relevant to controlled demolition and preparation',
  bodyImages: [{ src: media.contractor, alt: 'Workers reviewing plans before controlled site work' }, { src: media.planning, alt: 'Planning documents for demolition and renovation coordination' }],
  overview: [{ title: 'Interior and strip-out work', text: 'Remove selected non-structural finishes, fittings and tenant installations.' }, { title: 'Inspection before quotation', text: 'Confirm structure, services, access and retained areas before removal.' }, { title: 'Renovation preparation', text: 'Coordinate the handover condition for the next trade or renovation phase.' }],
  typesTitle: 'Controlled removal scopes',
  types: [{ title: 'Interior strip-out', text: 'Selected partitions, ceilings, flooring, cabinets and tenant fittings as agreed.' }, { title: 'Bathroom and kitchen removal', text: 'Hacking and removal around wet areas with service locations reviewed first.' }, { title: 'Office and retail reinstatement', text: 'Remove selected additions according to a landlord or handover checklist.' }, { title: 'Site preparation', text: 'Clear agreed materials and prepare accessible surfaces for following work.' }],
  scopeTitle: 'Safety, debris and retained property',
  scope: [{ title: 'Identify retained elements', text: 'Mark structure, services, finishes and equipment that must remain protected.' }, { title: 'Review concealed risks', text: 'Check available plans and inspect likely electrical, plumbing and structural interfaces.' }, { title: 'Plan debris handling', text: 'Agree loading routes, lift or stair access, sorting, transport and disposal responsibilities.' }, { title: 'Prepare for the next phase', text: 'Define whether making good, cleaning or temporary protection is required after removal.' }],
  quotationTitle: 'What affects demolition pricing',
  quotationFactors: [{ title: 'Material and quantity', text: 'Concrete, tile, board, cabinetry and mixed finishes require different labour and handling.' }, { title: 'Access and building rules', text: 'Approved work hours, lift booking, protection and loading routes affect delivery.' }, { title: 'Services and structure', text: 'Unknown wiring, plumbing or structural interfaces may require separate assessment.' }, { title: 'Disposal and making good', text: 'Transport, disposal, patching and preparation must be identified in the quote.' }],
  process: standardProcess(['Share the removal plan', 'Inspect structure, services and access', 'Confirm protection and disposal', 'Remove, clear and prepare']),
  areas: ['Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Subang Jaya', 'Puchong', 'Selangor'],
  related: related('houseKl', 'houseSelangor', 'office'),
  pricingNote: 'Demolition is quoted from the material, measured quantity, access, protection, debris route, disposal and required condition after removal.',
  faqs: [
    { question: 'Can you quote demolition work from photos?', answer: 'Photos help with an initial enquiry, but a site inspection may be required before quotation.' },
    { question: 'Do you remove structural walls?', answer: 'Structural or load-bearing changes require separate professional assessment and any necessary approvals.' },
    { question: 'Can demolition be combined with renovation work?', answer: 'The removal and preparation scope can be discussed as part of a wider renovation enquiry.' },
    { question: 'Which areas do you serve?', answer: 'Enquiries are accepted for Kuala Lumpur and Selangor, subject to location and scope.' },
  ],
  finalTitle: 'Plan demolition before renovation',
  finalText: 'Send photos, the property location, retained elements and the required handover condition for an initial review.',
});
