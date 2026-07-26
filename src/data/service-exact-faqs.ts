export interface ServiceFaq {
  question: string;
  answer: string;
}

export const serviceFaqsByRoute: Record<string, ServiceFaq[]> = {
  '/aircond-installation-kl/': [
    { question: 'How much is installation for a 1.0HP or 1.5HP wall-mounted aircond?', answer: 'The published base price is RM220, including 5 feet of copper pipe, 5 feet of wiring, a basic drainage connection, vacuum and basic testing.' },
    { question: 'How much is installation for a 2.0HP or 2.5HP wall-mounted aircond?', answer: 'The published base price is RM280 with the same standard 5-foot pipe and wiring inclusion. Site conditions and extra materials can change the total.' },
    { question: 'What if I need longer piping or wiring?', answer: 'Additional copper pipe, insulation, wiring, trunking or drainage beyond the included length is charged according to the confirmed site requirement.' },
    { question: 'Can you install an aircond that I bought myself?', answer: 'Yes. Send the unit type, horsepower, indoor and outdoor locations, and site photos through WhatsApp so the installation scope can be checked.' },
    { question: 'Is removal of the old aircond included?', answer: 'No. Dismantling, disposal, relocation and making good are separate unless they are specifically included in the quotation.' },
    { question: 'Is a site visit required before installation?', answer: 'Many standard installations can first be estimated from clear photos and measurements. A site visit may be requested where access, routing or electrical capacity is uncertain.' },
    { question: 'Do you install aircond units in offices and shops?', answer: 'Yes, subject to the unit type, access, building rules, electrical supply and the confirmed installation scope.' },
  ],
  '/upah-pasang-aircond-selangor/': [
    { question: 'Berapa upah pasang aircond 1.0HP atau 1.5HP?', answer: 'Harga asas yang diterbitkan ialah RM220, termasuk 5 kaki copper pipe, 5 kaki wiring, sambungan drainage asas, vacuum dan testing asas.' },
    { question: 'Berapa upah pasang aircond 2.0HP atau 2.5HP?', answer: 'Harga asas yang diterbitkan ialah RM280 dengan 5 kaki paip dan wiring standard. Keadaan tapak dan bahan tambahan boleh mengubah jumlah akhir.' },
    { question: 'Bagaimana jika paip atau wiring perlu lebih panjang?', answer: 'Copper pipe, insulation, wiring, trunking atau drainage tambahan melebihi panjang yang termasuk akan dicaj mengikut keperluan tapak yang disahkan.' },
    { question: 'Boleh pasang aircond yang saya beli sendiri?', answer: 'Boleh. Hantar jenis unit, horsepower, lokasi indoor dan outdoor serta gambar tapak melalui WhatsApp untuk semakan skop.' },
    { question: 'Adakah buka aircond lama termasuk?', answer: 'Tidak. Kerja dismantle, disposal, relocation dan kemasan semula adalah berasingan kecuali dinyatakan dalam quotation.' },
    { question: 'Perlu site visit sebelum pemasangan?', answer: 'Banyak pemasangan standard boleh dianggarkan dahulu melalui gambar dan ukuran yang jelas. Site visit mungkin diperlukan jika akses, laluan paip atau kapasiti elektrik tidak pasti.' },
    { question: 'Boleh pasang aircond untuk pejabat dan kedai?', answer: 'Boleh, tertakluk pada jenis unit, akses, peraturan bangunan, bekalan elektrik dan skop pemasangan yang disahkan.' },
  ],
  '/servis-aircond-murah-kl/': [
    { question: 'Berapa harga purata servis aircond murah KL?', answer: 'Harga bermula RM 60 hingga RM 80 untuk cucian biasa bagi unit 1.0HP. Harga chemical wash dan top-up gas bergantung pada saiz HP dan tahap kekurangan gas.' },
    { question: 'Kenapa aircond saya keluar air menitik di dalam bilik?', answer: 'Masalah ini selalunya berkaitan saluran paip pembuangan atau takung air yang tersumbat dengan habuk dan lendir. Keadaan unit perlu diperiksa untuk menentukan cucian atau pembaikan yang sesuai.' },
    { question: 'Adakah RK Reno cover kawasan selain Kuala Lumpur?', answer: 'Kawasan yang dinyatakan pada WordPress termasuk pusat Kuala Lumpur, Wangsa Maju, Bangsar, Setiawangsa, Petaling Jaya, Shah Alam dan Subang Jaya. Sahkan ketersediaan lokasi melalui WhatsApp.' },
    { question: 'Berapa kerap saya perlu panggil orang servis aircond?', answer: 'WordPress mencadangkan cucian biasa setiap 3 hingga 4 bulan untuk penggunaan rumah biasa dan lebih kerap bagi unit yang beroperasi lama atau di lokasi berhabuk.' },
  ],
  '/electrical-services-selangor/': [
    { question: 'How much does it cost to rewire a house in Selangor?', answer: 'The published page says a standard single-storey terrace-house rewiring may start from RM 3,000, depending on property size and the number of points. A site-specific itemised quote is required.' },
    { question: 'My power keeps tripping. What should I do?', answer: 'Frequent tripping may indicate an overloaded circuit, faulty appliance or damaged wiring. Stop using damaged fittings and arrange inspection; do not repeatedly reset a circuit where there is heat, smoke or a burning smell.' },
    { question: 'Do you provide 3-Phase wiring upgrades?', answer: 'The published page lists 3-phase upgrade enquiries and related internal wiring changes. The exact regulated scope and responsible qualified person must be confirmed for the project.' },
  ],
  '/house-renovation-in-kuala-lumpur/': [
    { question: 'Does RK Reno accept small renovation jobs in KL?', answer: 'Yes. Customers can request smaller scopes such as painting, tile repair, bathroom improvement, wall repair or selected maintenance work. Availability and minimum charges depend on location and job size.' },
    { question: 'Do condo renovations require management approval?', answer: 'Many condos require renovation forms, contractor registration, deposits, lift protection and compliance with approved working hours. Customers should confirm the building rules before work begins.' },
    { question: 'Do structural changes require approval?', answer: 'Some extensions, structural changes and major alterations may require drawings or approval from the relevant authority. Requirements depend on the property and work scope.' },
    { question: 'Can I get an initial estimate without a site visit?', answer: 'An initial estimate may be possible using clear photos, videos, measurements, location and a detailed work list. A site review may still be required before confirming the final quotation.' },
    { question: 'What should be included in the quotation?', answer: 'The quotation should identify the work scope, materials, quantities, exclusions, disposal, payment stages, repair responsibilities and possible additional charges.' },
  ],
  '/house-renovation-in-selangor/': [
    { question: 'Does RK Reno accept small renovation jobs?', answer: 'Yes. Customers can request smaller scopes such as painting, tile repair, bathroom improvement, wall repair or selected wet works. Availability and minimum charges depend on the location and job size.' },
    { question: 'Do renovation works require council or building approval?', answer: 'Some structural changes, extensions and building alterations may require local-authority approval. Condos may also require JMB or management approval, deposits and approved working hours. Requirements should be checked before work begins.' },
    { question: 'Can I get an estimate without a site visit?', answer: 'An initial estimate may be possible when you send clear photos, videos, measurements, location and the required work. A site review may still be needed before confirming the final scope and price.' },
    { question: 'What should be included in a renovation quotation?', answer: 'The quotation should clearly list the work scope, materials, quantities, exclusions, payment stages, disposal, repair responsibilities and any possible additional charges.' },
  ],
  '/home-renovation-contractor-in-subang-jaya/': [
    { question: 'Do I need MBSJ council approval for my renovation?', answer: 'Structural changes may require drawings or council approval. Confirm the exact requirements with MBSJ or the relevant professional before work begins.' },
    { question: 'How long does a standard kitchen extension take?', answer: 'The WordPress page gives 3 to 5 weeks as an indicative period, while noting that weather, approvals and custom cabinetry can change the schedule.' },
    { question: 'Do you renovate high-rise condos in USJ?', answer: 'Condo renovation enquiries can be reviewed subject to management rules, deposits, access and approved working hours.' },
  ],
  '/office-renovation-in-kuala-lumpur/': [
    { question: 'Can RK Reno handle a small office refresh?', answer: 'Small offices may request selected painting, flooring, lighting or partition work. Availability and minimum charges depend on the building location and actual scope.' },
    { question: 'What should I send for an initial quote?', answer: 'Send the building name, location, floor area, floor plan, existing photos, required rooms, workstations, services and expected budget range.' },
    { question: 'Does an office renovation require management approval?', answer: 'Many commercial buildings require renovation applications, deposits, contractor information, access arrangements and compliance with approved working hours. Confirm the specific building rules before work starts.' },
    { question: 'Can work be done outside normal office hours?', answer: 'The possible work schedule depends on the building’s approved hours, the type of work and team availability. Do not assume night or weekend work is allowed until management approval is confirmed.' },
    { question: 'What is included in office reinstatement?', answer: 'The scope may include removing partitions, flooring, ceiling items, wiring or tenant fixtures and repairing or repainting retained surfaces. The landlord’s handover checklist should define the final scope.' },
    { question: 'How should I compare office renovation quotations?', answer: 'Compare the same layout, quantities, material specifications, electrical and data scope, disposal, protection, exclusions and payment stages. A lower total may exclude important work.' },
  ],
  '/waterproofing-contractor-kuala-lumpur/': [
    { question: 'How much does PU Injection cost in KL?', answer: 'The published estimate is RM 150 to RM 300 per point. The number of points and suitability of the method require inspection.' },
    { question: 'Can you fix a bathroom leak without hacking my tiles?', answer: 'A no-hack treatment may be considered for suitable conditions, but the leak source, tile joints, drainage and substrate must be inspected before a method is recommended.' },
  ],
  '/plaster-ceiling-contractor-kl/': [
    { question: 'How much does a plaster ceiling cost in KL?', answer: 'The published basic flat-ceiling estimate is RM 3.50 to RM 6.00 per square foot. L-boxes and light troughs are measured per foot run.' },
    { question: 'Do you install the wiring and downlights as well?', answer: 'The ceiling scope can include cut-out coordination, while electrical wiring and light installation must be separately measured and confirmed.' },
    { question: 'Is plaster ceiling durable against water leaks?', answer: 'Standard gypsum board is not waterproof and can sag under continuous leakage. Repair the water source first and discuss suitable board material for wet or leak-prone areas.' },
    { question: 'How much will the new ceiling lower my room height?', answer: 'The published page describes a typical minimum drop of 4 to 6 inches for framing, downlights and wiring, subject to site measurement.' },
    { question: 'Is the installation process very dusty?', answer: 'Sanding stopping compound creates fine dust. Furniture and finishes should be protected, and cleaning responsibilities should be agreed before work.' },
  ],
  '/servis-cuci-rumah-kl/': [
    { question: 'Berapa harga Servis Cuci Rumah KL?', answer: 'Harga bergantung pada saiz rumah dan jenis cucian. WordPress menyatakan anggaran RM 300 hingga RM 400 untuk move-in deep cleaning sebuah apartmen 1000 kaki persegi.' },
    { question: 'Adakah anda bawa peralatan mencuci sendiri?', answer: 'Halaman WordPress menyatakan peralatan dibawa untuk pakej deep cleaning dan post-renovation. Sahkan senarai peralatan dan bahan dalam quotation.' },
    { question: 'Berapa lama masa diambil untuk mencuci rumah?', answer: 'Halaman WordPress menyatakan sesi deep cleaning biasanya 4 hingga 6 jam dengan pasukan 2 hingga 3 orang, bergantung pada keadaan rumah dan skop.' },
    { question: 'Adakah anda cuci tingkap luar high-rise?', answer: 'Atas sebab keselamatan, hanya bahagian yang boleh dicapai dengan selamat boleh dipertimbangkan. Kerja luar bangunan tinggi tidak termasuk tanpa akses dan kaedah yang sesuai.' },
  ],
};
