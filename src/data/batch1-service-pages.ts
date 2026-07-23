import type { BatchPage } from './batch1-pages';

const installImages = {
  main: '/assets/media/721430356-1623451745783563-6720154604310865920-n-b6c68602.jpg',
  prep: '/assets/media/721626720-1623451799116891-7023267947651638351-n-dfb212d1.jpg',
  vacuum: '/assets/media/723104253-1623451735783564-5450851965206368683-n-3d2cd57b.jpg',
};

const installationSections = [
  { title: 'What the installation can involve', items: [
    { title: 'Indoor and outdoor units', text: 'Positioning is reviewed for airflow, drainage, access and the available mounting area.' },
    { title: 'Copper piping and drainage', text: 'The route and required length depend on the property layout and installation position.' },
    { title: 'Electrical connection', text: 'Power requirements and the available point must be checked for the selected unit and site.' },
  ] },
  { title: 'Information needed for a quote', text: 'Share the property type, location, aircond horsepower, unit condition, preferred positions and clear photos of the indoor and outdoor areas. Additional materials or difficult access can affect the final scope and price.' },
];

export const batch1ServicePages: Record<string, BatchPage> = {
  '/aircond-installation-kl/': {
    eyebrow: 'Aircond Services · Kuala Lumpur',
    title: 'Aircond Installation KL',
    summary: 'Installation for wall-mounted aircond units in Kuala Lumpur homes, condominiums, offices and shops, with the scope confirmed from the unit and site requirements.',
    image: installImages.main,
    imageAlt: 'RK Reno technician carrying out aircond installation in Kuala Lumpur',
    introTitle: 'Plan the installation for the actual site',
    intro: 'The correct scope depends on unit capacity, piping distance, drainage, electrical supply, wall conditions and access. Send the details for an initial review before scheduling.',
    sections: installationSections,
    faqs: [
      { question: 'Is the advertised base price always the final price?', answer: 'No. A base rate can cover a standard scope, while extra piping, wiring, brackets, access or site work may change the total. Confirm the written scope before work starts.' },
      { question: 'Can an existing aircond be relocated?', answer: 'Relocation can be discussed after the unit condition, removal site and new installation position are reviewed.' },
    ],
    cta: 'Need aircond installation in KL?',
    ctaText: 'Send photos of both installation areas, the unit horsepower and your Kuala Lumpur location.',
  },
  '/upah-pasang-aircond-selangor/': {
    eyebrow: 'Servis Pemasangan · Selangor',
    title: 'Upah Pasang Aircond Selangor',
    summary: 'Servis pemasangan aircond untuk rumah, pejabat dan kedai di Selangor, berdasarkan kapasiti unit, jarak paip, saliran, bekalan elektrik dan keadaan tapak.',
    image: installImages.main,
    imageAlt: 'Juruteknik RK Reno menjalankan pemasangan aircond di Selangor',
    introTitle: 'Skop pemasangan bergantung pada tapak',
    intro: 'Lokasi unit indoor dan outdoor, panjang paip, laluan saliran serta akses perlu disemak supaya pemasangan boleh dirancang dengan betul.',
    sections: [
      { title: 'Perkara dalam semakan pemasangan', items: [
        { title: 'Kedudukan unit', text: 'Semakan ruang, aliran udara, saliran dan akses penyelenggaraan.' },
        { title: 'Paip dan pendawaian', text: 'Keperluan bahan bergantung pada jarak dan laluan antara unit.' },
        { title: 'Keadaan tapak', text: 'Dinding, ketinggian, akses luar dan peraturan bangunan boleh mempengaruhi skop.' },
      ] },
      { title: 'Maklumat untuk sebut harga', text: 'Hantar lokasi, jenis premis, horsepower aircond, gambar kawasan indoor dan outdoor serta maklumat sama ada unit baharu atau unit pindah.' },
    ],
    cta: 'Perlukan pemasangan di Selangor?',
    ctaText: 'Hantar butiran unit dan gambar tapak untuk semakan awal.',
  },
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/': {
    eyebrow: 'Panduan Harga Aircond · 2026',
    title: 'Upah Pasang Aircond Selangor: Panduan Harga & Pemasangan',
    summary: 'Panduan untuk memahami komponen harga pemasangan aircond di Selangor sebelum meminta sebut harga bagi rumah, pejabat atau kedai.',
    image: installImages.vacuum,
    imageAlt: 'Proses vacuum pump semasa pemasangan aircond',
    introTitle: 'Bandingkan skop, bukan angka sahaja',
    intro: 'Harga pemasangan berubah mengikut kapasiti unit, panjang paip, pendawaian, bracket, saliran, akses dan kerja tambahan. Minta pecahan skop supaya tawaran lebih mudah dibandingkan.',
    sections: [
      { title: 'Faktor yang mempengaruhi harga', items: [
        { title: 'Kapasiti aircond', text: 'Keperluan bahan dan pemasangan berbeza mengikut horsepower dan jenis unit.' },
        { title: 'Panjang laluan', text: 'Paip tembaga, kabel dan paip saliran tambahan biasanya dinilai mengikut keperluan tapak.' },
        { title: 'Akses dan kerja tambahan', text: 'Ketinggian, drilling, bracket, trunking, removal unit lama dan akses sukar boleh menambah skop.' },
      ] },
      { title: 'Senarai semak sebelum menerima sebut harga', items: [
        { title: 'Skop standard', text: 'Semak bahan, panjang asas dan kerja yang termasuk.' },
        { title: 'Kadar tambahan', text: 'Minta kadar untuk paip, kabel, bracket dan kerja lain yang mungkin diperlukan.' },
        { title: 'Pengesahan tapak', text: 'Pastikan sebarang andaian harga disahkan berdasarkan gambar atau pemeriksaan tapak.' },
      ] },
    ],
    faqs: [
      { question: 'Mengapa harga akhir berbeza daripada harga asas?', answer: 'Harga asas biasanya merujuk kepada skop standard. Keperluan bahan, akses dan kerja sebenar di tapak menentukan jumlah akhir.' },
      { question: 'Apakah gambar yang perlu dihantar?', answer: 'Hantar gambar kawasan unit indoor, laluan paip yang dicadangkan, kawasan unit outdoor dan sebarang halangan atau akses tinggi.' },
    ],
    cta: 'Mahu semakan harga yang lebih tepat?',
    ctaText: 'Hantar spesifikasi unit dan gambar tapak supaya skop boleh dibincangkan.',
  },
  '/electrical-services-selangor/': {
    eyebrow: 'Electrical Services · Selangor',
    title: 'Electrical Services Selangor',
    summary: 'Electrical inspection, troubleshooting, wiring and fitting work for homes, offices and commercial properties in Selangor and Kuala Lumpur.',
    image: '/assets/media/Construction-workers-discussing-renovation-plans-092133b6.jpg',
    imageAlt: 'Property work being reviewed before electrical service',
    introTitle: 'Start with the fault or required load',
    intro: 'Electrical work should be based on the actual circuit, equipment and site condition. Describe the problem clearly and avoid using damaged fittings or repeatedly resetting a tripping circuit before it is checked.',
    sections: [
      { title: 'Electrical work to discuss', items: [
        { title: 'Fault finding', text: 'Checks for tripping, intermittent supply, faulty points and other reported electrical problems.' },
        { title: 'Wiring and points', text: 'New or replacement wiring, sockets, switches, lighting points and related fittings.' },
        { title: 'Distribution-board work', text: 'Inspection and upgrade requirements can be reviewed based on the existing board and property load.' },
      ] },
      { title: 'Important safety information', text: 'Switch off the affected circuit when it is safe to do so and seek urgent help if there is smoke, burning smell, exposed live wiring or heat damage. Regulated work must be handled by an appropriately qualified person; credential details should be confirmed for the specific scope.' },
    ],
    faqs: [
      { question: 'What details help with an initial review?', answer: 'Provide the property location, symptoms, when the issue started, affected circuits or appliances, and clear photos of the board or fitting if safe.' },
      { question: 'Can a quotation be confirmed without inspection?', answer: 'Simple fitting work may be easier to estimate from clear details. Faults, concealed wiring and load changes commonly require an on-site check.' },
    ],
    cta: 'Need an electrical issue assessed?',
    ctaText: 'Share the symptoms, location and safe-to-take photos for an initial discussion.',
  },
};
