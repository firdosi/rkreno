import fs from 'node:fs';

const route = '/office-renovation-petaling-jaya-corporate-fit-out-experts/';
const sourceUrl = 'https://rkrenosolution.com/wp-content/uploads/2026/01/Office-renovation-petaling-jaya-corporate-fit-out-experts.jpeg?q=80&w=1000&auto=format&fit=crop';
const baseUrl = sourceUrl.split('?')[0];
const content = {
  route,
  hero: { eyebrow: 'Services › Commercial › Petaling Jaya', title: 'Office Renovation Petaling Jaya: Corporate Fit-Out Experts', metadata: ['By RK Reno Commercial Team', '7 Minute Read', 'Petaling Jaya, Selangor'] },
  introduction: [
    'Petaling Jaya is rapidly expanding as Selangor’s premier corporate hub. Your workspace is more than just desks and chairs; it is a critical tool for employee productivity and reflecting your brand identity to visiting clients.',
    'Finding a contractor that specializes in office renovation Petaling Jaya is vastly different from hiring a standard home renovator. Commercial fit-outs require strict adherence to fire safety regulations (Bomba), complex data cabling infrastructure, and the ability to work around the stringent operating hours set by high-rise building management.',
    'At RK Reno Solution, we deliver end-to-end corporate fit-outs and office reinstatement services across PJ. From the bustling tech hubs of Bandar Utama and Mutiara Damansara, to the established commercial centers in SS2 and Kelana Jaya, we build workspaces that inspire.'
  ],
  toc: [
    { href: '#demands', label: '1. The Unique Demands of PJ Office Fit-Outs' },
    { href: '#services', label: '2. Our Core Corporate Renovation Services' },
    { href: '#cost', label: '3. Estimated Office Renovation Cost Guide (2026)' },
    { href: '#process', label: '4. Our 4-Step Seamless Fit-Out Process' },
    { href: '#reinstatement', label: '5. Expert Office Reinstatement Works' }
  ],
  demands: { heading: '1. The Unique Demands of PJ Office Fit-Outs', intro: 'A commercial renovation must balance aesthetics with functional infrastructure. When executing an office renovation Petaling Jaya project, we handle several critical challenges that amateur contractors overlook:', items: [
    ['MBPJ Compliance', 'All major commercial structural changes, partitioning, and facade upgrades require permits from the Majlis Bandaraya Petaling Jaya (MBPJ) to avoid operational shutdowns.'],
    ['Building Management Rules', 'High-rise towers in PJ have strict rules regarding material loading bays, refundable deposit limits, and noisy work restrictions (hacking and drilling usually restricted to weekends or after 8:00 PM).'],
    ['M&E Precision', 'Modern offices rely heavily on seamless Mechanical and Electrical (M&E) systems, requiring flawless CAT6 data cabling, server room cooling, and adequate aircond installation.']
  ] },
  services: { heading: '2. Our Core Corporate Renovation Services', intro: 'We provide comprehensive solutions to transform empty, bare units into fully functional corporate environments:', panelTitle: 'Complete Office Fit-Out Solutions', items: [
    ['Glass & Gypsum Partitioning', 'We maximize your floor plan by installing sleek frameless glass panels for meeting rooms, and soundproof gypsum boards for manager cabins and pantries.'],
    ['Commercial Flooring', 'Installation of heavy-duty, anti-static office carpet tiles, durable vinyl plank flooring, or sleek epoxy coating for modern industrial-style offices.'],
    ['Data Cabling & Electrical', 'Structured network cabling for your workstations, secure server room setups, and energy-efficient LED lighting grid installations.'],
    ['Corporate Identity', "Custom reception counters, built-in pantry cabinets, and professional interior painting to match your brand's specific color palette."]
  ] },
  cta: { heading: 'Expanding Your Business in Petaling Jaya?', paragraph: 'Let us handle the heavy lifting. Get a transparent fit-out quotation and space planning consultation today.', label: 'Discuss Your Office Layout', href: 'https://wa.me/601111334496?text=Hi%20RK%20Reno%2C%20I%20need%20an%20office%20renovation%20quote%20for%20my%20unit%20in%20PJ.' },
  cost: { heading: '3. Estimated Office Renovation Cost Guide (2026)', intro: 'Budget forecasting is essential for any business expansion. Below is an estimated cost-per-square-foot guide for office renovation Petaling Jaya based on current 2026 material and labor rates:', headers: ['Fit-Out Category', 'Estimated Cost (RM)', 'What’s Included?'], rows: [
    ['Basic Refresh', 'RM 40 - RM 70 per sqft', 'Carpet installation, fresh interior repainting, and basic LED lighting updates.'],
    ['Standard Corporate Office', 'RM 80 - RM 130 per sqft', 'Gypsum board partitions, standard data/electrical cabling, pantry setup, AC installation, and carpets.'],
    ['Premium / Executive Fit-Out', 'RM 150 - RM 250+ per sqft', 'Frameless glass partitions, acoustic ceilings, custom reception desks, premium vinyl, and smart-office integration.'],
    ['End-of-Tenancy Reinstatement', 'RM 15 - RM 35 per sqft', 'Hacking partitions, removing old flooring, and restoring the unit to a bare condition.']
  ] },
  process: { heading: '4. Our 4-Step Seamless Fit-Out Process', intro: 'Time is money. A delayed renovation means delayed business operations. We utilize a strict workflow to guarantee on-time delivery:', items: [
    ['Space Planning & Survey', 'We measure your unit, map out the desired headcount, and create a functional layout that optimizes natural light and workflow.'],
    ['Transparent Quotation', 'We provide a highly detailed, itemized quote. No hidden fees. We also assist in preparing documents for your Building Management approval.'],
    ['Flexible Execution', 'Our dedicated commercial team handles the build. To prevent disruption to neighboring offices, we gladly accommodate night and weekend shifts for noisy hacking works.'],
    ['Cleaning & Handover', 'We perform a thorough post-renovation industrial clean. You receive the keys to an office that is immediately ready for your staff to move into.']
  ] },
  reinstatement: { heading: '5. Expert Office Reinstatement Works', intro: 'Are you relocating your headquarters or moving out of a rented unit? Most commercial tenancy agreements in PJ require you to restore the office back to its original "bare" condition before handing the keys back to the landlord.', calloutHeading: 'Hassle-Free Reinstatement', callout: 'We specialize in rapid office reinstatement. Our team will safely dismantle existing partitions, rip up old carpets, remove complex data cabling, and apply a fresh coat of white paint. We ensure you meet all landlord requirements to get your full tenancy deposit back.', closing: 'From designing a vibrant new workspace to reinstating your old one, RK Reno Solution is your trusted partner for all commercial property needs in Petaling Jaya. Contact us today to start your project.' },
  links: [
    { anchor: 'RK Reno Solution', sourceHref: '/about/', renderedHref: '/about-us/' },
    { anchor: 'aircond installation', sourceHref: '/upah-pasang-aircond-selangor/', renderedHref: '/upah-pasang-aircond-selangor/' },
    { anchor: 'interior painting', sourceHref: '/house-renovation-in-kuala-lumpur/', renderedHref: '/house-renovation-in-kuala-lumpur/' }
  ]
};

const sourceLock = JSON.parse(fs.readFileSync('config/live-wordpress-content-seo-lock.json', 'utf8'));
const seo = structuredClone(sourceLock.records.find((record) => record.route === route).seo);
seo.author = 'raoisrar';
seo.productionRobots = 'max-image-preview:large';
seo.stagingRobots = 'noindex, nofollow, max-image-preview:large';

const claims = ['PJ premier corporate hub','RK end-to-end fit-outs','reinstatement across PJ','MBPJ permits requirement','permits prevent shutdowns','noisy work weekends/after 8PM','flawless CAT6','secure server rooms','soundproof gypsum','heavy-duty anti-static carpet','no hidden fees','assists management approval docs','accommodates night/weekend hacking','workflow guarantees on-time','industrial clean','immediately ready','ensures landlord requirements','ensures deposit returned','trusted partner','extensive MBPJ experience','ensures applications and deposits are processed smoothly'].map((claim) => ({ claim, status: 'SOURCE_ONLY' }));

const images = { transformedSourceUrl: sourceUrl, baseSourceUrl: baseUrl, originalFilename: 'Office-renovation-petaling-jaya-corporate-fit-out-experts.jpeg', images: [{ localPath: '/assets/media/office-renovation-petaling-jaya-illustration.svg', width: 1200, height: 760, format: 'svg', purposes: ['article','blog-card'], alt: 'Modern office renovation in Petaling Jaya showing glass partitions and carpet flooring', exactOriginal: false, fallback: true, fallbackReason: 'The supplied transformed and base WordPress media URLs returned HTML instead of the source JPEG; a local modern-office illustration is used without project attribution.' }], correctOriginalCount: 0, fallbackCount: 1 };
const risks = { route, faqPagePresent: true, visibleFaqPresent: false, exactQuestionCount: 4, status: 'SOURCE_ONLY', seoRisk: 'Hidden/non-visible FAQPage structured data requires owner verification before production indexing.', ownerVerificationRequired: true };

fs.writeFileSync('config/office-renovation-petaling-jaya-content.json', `${JSON.stringify(content, null, 2)}\n`);
fs.writeFileSync('config/office-renovation-petaling-jaya-seo.json', `${JSON.stringify(seo, null, 2)}\n`);
fs.writeFileSync('config/office-renovation-petaling-jaya-images.json', `${JSON.stringify(images, null, 2)}\n`);
fs.writeFileSync('config/office-renovation-petaling-jaya-claims.json', `${JSON.stringify({ route, status: 'SOURCE_ONLY', claims }, null, 2)}\n`);
fs.writeFileSync('config/office-renovation-petaling-jaya-schema-risks.json', `${JSON.stringify(risks, null, 2)}\n`);

const blogRoutes = [
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/', '/commercial-retail-shop-renovation-in-kuala-lumpur/', route,
  '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/', '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/',
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/', '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/',
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/', '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/',
  '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/', '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/',
  '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/', '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/',
  '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/'
];
const cardImages = {
  [route]: images.images[0].localPath,
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/': '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
  '/commercial-retail-shop-renovation-in-kuala-lumpur/': '/assets/media/Renovation-contractor-for-commercial-buildings-93583952.jpg',
  '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/': '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg',
  '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/': '/assets/media/Plaster-ceiling-and-aircond-installation-dd789b38.jpg',
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/': '/assets/media/owner/rk-reno-aircond-outdoor-condenser-720.webp',
  '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/': '/assets/media/Construction-workers-discussing-renovation-plans-092133b6.jpg',
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/': '/assets/media/Home-renovation-service-in-KL-422b205c.jpg',
  '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/': '/assets/media/Modern-building-renovation-and-property-improvement-b1ec6039.jpg',
  '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/': '/assets/media/Renovation-planning-and-project-drawings-6cfdb2fc.jpg',
  '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/': '/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg',
  '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/': '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg',
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/': '/assets/media/owner/rk-reno-wall-mounted-aircond-unit-960.webp',
  '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/': '/assets/media/servis-cuci-rumah-kl-2e2d046e.jpg'
};
const categoryFor = (postRoute) => postRoute.includes('aircond') ? 'Aircond' : postRoute.includes('cuci') || postRoute.includes('cleaning') ? 'Cleaning' : postRoute.includes('waterproofing') ? 'Waterproofing' : postRoute.includes('electrical') ? 'Electrical' : postRoute.includes('ceiling') ? 'Interior finishing' : postRoute.includes('office') || postRoute.includes('commercial') ? 'Commercial' : 'Renovation';
const posts = blogRoutes.map((postRoute) => {
  const record = sourceLock.records.find((item) => item.route === postRoute);
  const firstParagraph = record.content.orderedBlocks.find((block) => block.type === 'p' && block.text)?.text || record.seo.description;
  return { route: postRoute, title: record.content.h1 || record.seo.title, category: categoryFor(postRoute), published: record.content.dates[0], imagePath: cardImages[postRoute], imageAlt: postRoute === route ? images.images[0].alt : `${record.content.h1 || record.seo.title} guide image`, excerpt: firstParagraph, excerptSource: 'live-wordpress-content-seo-lock', expectedHttpStatus: 200 };
}).sort((a, b) => b.published.localeCompare(a.published)).map((post, index) => ({ ...post, cardPosition: index + 1 }));
fs.writeFileSync('config/blog-post-index.json', `${JSON.stringify({ schemaVersion: 1, source: 'authoritative WordPress article route inventory', expectedPostCount: posts.length, posts }, null, 2)}\n`);
