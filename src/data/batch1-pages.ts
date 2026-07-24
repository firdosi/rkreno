export interface BatchSection {
  title: string;
  text?: string;
  items?: { title: string; text: string; href?: string }[];
}

export interface BatchPage {
  eyebrow: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  imageSrcSet?: { src: string; width: number }[];
  imageWidth?: number;
  imageHeight?: number;
  imageCaption?: string;
  introTitle: string;
  intro: string;
  sections: BatchSection[];
  faqs?: { question: string; answer: string }[];
  cta: string;
  ctaText: string;
}

const serviceItems = [
  { title: 'Building renovation', text: 'Practical planning and coordinated improvement work for homes, offices and commercial spaces.', href: '/service/building-renovation/' },
  { title: 'Aircond installation', text: 'Site-aware installation for homes, offices and shops in Kuala Lumpur and Selangor.', href: '/aircond-installation-kl/' },
  { title: 'Aircond servicing', text: 'Inspection, cleaning and troubleshooting for aircond units that are warm, leaking or overdue for maintenance.', href: '/servis-aircond-murah-kl/' },
  { title: 'Electrical work', text: 'Wiring, fault checks, fittings and distribution-board work planned around the property’s needs.', href: '/electrical-services-selangor/' },
  { title: 'Waterproofing', text: 'Assessment and repair options for roof, wall, bathroom and balcony leakage.', href: '/waterproofing-contractor-kuala-lumpur/' },
  { title: 'Plaster ceiling', text: 'Ceiling installation and repair with options for lighting features and access requirements.', href: '/plaster-ceiling-contractor-kl/' },
];

export const batch1Pages: Record<string, BatchPage> = {
  '/': {
    eyebrow: 'Renovation · Repair · Installation',
    title: 'Reliable Renovation Services in KL & Selangor',
    summary: 'RK Reno Solution helps homeowners and businesses plan renovation, aircond, electrical, waterproofing and related property work with clear communication from the first site discussion.',
    image: '/assets/media/RK-Reno-Solution-contractor-reviewing-renovation-projec-1fc54dc9.jpg',
    imageAlt: 'RK Reno Solution contractor reviewing a renovation project',
    introTitle: 'One team for practical property improvements',
    intro: 'Tell us what needs attention and where the property is located. We will discuss the scope, arrange a site check when needed and explain the suitable next step before work begins.',
    sections: [
      { title: 'Services for homes and workplaces', items: serviceItems },
      { title: 'A straightforward way to get started', items: [
        { title: '1. Share the requirement', text: 'Send photos, measurements and a short description by WhatsApp or through the enquiry form.' },
        { title: '2. Review the site', text: 'For work that needs an on-site assessment, arrange a suitable time for the team to inspect the space.' },
        { title: '3. Confirm the scope', text: 'Review the proposed work and quotation before scheduling begins.' },
      ] },
      { title: 'Serving Kuala Lumpur and Selangor', text: 'Our service pages explain the work available across Kuala Lumpur and Selangor, including location-specific renovation and installation guidance.' },
    ],
    cta: 'Planning work for your property?',
    ctaText: 'Share the location and a few details. RK Reno Solution will help you identify the right service.',
  },
  '/services/': {
    eyebrow: 'RK Reno Solution',
    title: 'Renovation & Property Services',
    summary: 'Explore renovation, repair, installation and maintenance services for residential and commercial properties in Kuala Lumpur and Selangor.',
    image: '/assets/media/Renovation-contractor-for-commercial-buildings-93583952.jpg',
    imageAlt: 'Renovation contractor reviewing a commercial building',
    introTitle: 'Property work starts with the right scope',
    intro: 'Different properties need different solutions. We begin by understanding the problem, the site conditions and the result you want, then guide you to the relevant service.',
    sections: [
      { title: 'Our core services', items: serviceItems },
      { title: 'What to include in your enquiry', items: [
        { title: 'Property details', text: 'Tell us whether the work is for a house, condominium, office, shop or another type of space.' },
        { title: 'Location and timing', text: 'Include the area and your preferred timeframe so scheduling can be discussed.' },
        { title: 'Photos and measurements', text: 'Clear photos and approximate dimensions help with the initial review.' },
      ] },
    ],
    cta: 'Not sure which service fits?',
    ctaText: 'Send the property details and we will point you to the most relevant next step.',
  },
  '/about-us/': {
    eyebrow: 'About RK Reno Solution',
    title: 'Practical Help for Better Spaces',
    summary: 'RK Reno Solution is a Kuala Lumpur–based renovation and property-service business supporting homeowners and business owners across KL and Selangor.',
    image: '/assets/media/Renovation-planning-and-project-drawings-6cfdb2fc.jpg',
    imageAlt: 'Renovation plans being reviewed for a property project',
    introTitle: 'Who we are',
    intro: 'We focus on practical site assessment, clear service discussions and coordinated workmanship. Our aim is to make property improvement easier to understand from enquiry through completion.',
    sections: [
      { title: 'How we approach the work', items: [
        { title: 'Understand the space', text: 'We review the property, the issue and the intended use before recommending a scope.' },
        { title: 'Explain the next step', text: 'Customers receive clear guidance on the service, site information and decisions needed.' },
        { title: 'Coordinate carefully', text: 'Renovation, installation and repair work is planned around access, sequence and the agreed requirements.' },
      ] },
      { title: 'Service coverage', text: 'RK Reno Solution serves customers in Kuala Lumpur and Selangor with renovation, aircond, electrical, waterproofing, plaster ceiling, cleaning and related property services.' },
    ],
    cta: 'Let’s discuss your space',
    ctaText: 'Contact RK Reno Solution with your location, property type and the work you are considering.',
  },
  '/contact-us/': {
    eyebrow: 'Contact RK Reno Solution',
    title: 'Tell Us About Your Property',
    summary: 'Send the property location, service required and a short description. Photos and approximate measurements can help us understand the enquiry.',
    image: '/assets/media/ct-08-a16e9952.webp',
    imageAlt: 'Customer service contact illustration',
    introTitle: 'Contact details',
    intro: 'RK Reno Solution can be reached by phone, WhatsApp, email or the enquiry form. The business address is 4-2, Jalan 3/50C, Setapak, 53000 Kuala Lumpur.',
    sections: [
      { title: 'Choose a contact method', items: [
        { title: 'Call', text: '+60 11 1133 4496' },
        { title: 'WhatsApp', text: 'Send a message, property location and useful site photos to +60 11 1133 4496.' },
        { title: 'Email', text: 'rkrenosolution@gmail.com' },
      ] },
      { title: 'What to send', text: 'Include the property type and location, the work required, your preferred timing and any photos or measurements available. Do not send passwords, payment-card details or other sensitive information.' },
    ],
    cta: 'Ready to send the details?',
    ctaText: 'Complete the enquiry form below. On staging, the interface is available for testing but final server submission activates with production deployment.',
  },
  '/service/building-renovation/': {
    eyebrow: 'Renovation Services',
    title: 'Building Renovation',
    summary: 'Improve an existing residential or commercial space with a renovation scope shaped around its condition, function and intended use.',
    image: '/assets/media/Modern-building-renovation-and-property-improvement-b1ec6039.jpg',
    imageAlt: 'Modern building renovation and property improvement',
    introTitle: 'Plan the work around the building',
    intro: 'A useful renovation plan considers the current layout, existing defects, access, services and finishes. RK Reno Solution can review the space and coordinate the relevant work.',
    sections: [
      { title: 'Renovation work we can discuss', items: [
        { title: 'Homes and apartments', text: 'Internal improvements, room updates, ceiling, electrical and related repair work.' },
        { title: 'Offices and shops', text: 'Practical fit-out and improvement work planned for business use and site access.' },
        { title: 'Repairs and upgrades', text: 'Targeted work for worn finishes, leakage, damaged areas and property systems.' },
      ] },
      { title: 'Before requesting a quotation', text: 'Prepare the property location, photos, approximate measurements, preferred finishes and any building-management requirements. A site visit may be needed before the scope can be confirmed.' },
    ],
    cta: 'Start with a site discussion',
    ctaText: 'Share what you want to change and the property location to arrange the next step.',
  },
  '/servis-aircond-murah-kl/': {
    eyebrow: 'Servis Aircond Kuala Lumpur',
    title: 'Servis Aircond Murah KL',
    summary: 'Aircond kurang sejuk, berbau atau bocor air? Dapatkan pemeriksaan, pembersihan dan cadangan servis untuk rumah atau pejabat di Kuala Lumpur.',
    image: '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
    imageAlt: 'Imej pemilik bagi unit aircond pada dinding dan ruang akses servis',
    imageSrcSet: [
      { src: '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-480.webp', width: 480 },
      { src: '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp', width: 960 },
    ],
    imageWidth: 960,
    imageHeight: 720,
    imageCaption: 'Unit aircond dan ruang akses servis; lokasi dan butiran projek tidak diterbitkan.',
    introTitle: 'Servis mengikut keadaan unit',
    intro: 'Masalah aircond boleh berpunca daripada penapis kotor, saliran tersumbat, komponen atau tahap gas. Pemeriksaan awal membantu menentukan kerja yang sesuai.',
    sections: [
      { title: 'Perkhidmatan yang boleh dibincangkan', items: [
        { title: 'Pembersihan biasa', text: 'Pembersihan penapis, bahagian unit yang boleh dicapai dan pemeriksaan aliran air.' },
        { title: 'Chemical wash', text: 'Pembersihan lebih menyeluruh apabila keadaan unit memerlukannya.' },
        { title: 'Pemeriksaan masalah', text: 'Semakan untuk aircond kurang sejuk, bocor, bising atau tidak berfungsi dengan betul.' },
      ] },
      { title: 'Sebelum membuat tempahan', text: 'Berikan lokasi, jenis premis, bilangan unit, kapasiti aircond dan gambar unit jika ada. Harga akhir bergantung pada keadaan dan kerja sebenar.' },
    ],
    faqs: [
      { question: 'Bila aircond perlu diservis?', answer: 'Jadual bergantung pada penggunaan, persekitaran dan keadaan unit. Servis wajar dipertimbangkan apabila prestasi menurun, terdapat kebocoran atau bau.' },
      { question: 'Adakah harga boleh disahkan melalui gambar?', answer: 'Gambar membantu semakan awal, tetapi keadaan sebenar unit mungkin perlu diperiksa sebelum kerja dan harga akhir disahkan.' },
    ],
    cta: 'Aircond perlukan pemeriksaan?',
    ctaText: 'Hantar lokasi, bilangan unit dan gambar melalui WhatsApp untuk semakan awal.',
  },
};
