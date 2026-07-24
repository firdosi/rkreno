export const finalReviewRoutes = [
  ['home', '/', 'utility', 'Homepage', 'Native Batch1Page Astro component'],
  ['services', '/services/', 'service', 'Service index', 'Native Batch1Page Astro component'],
  ['about', '/about-us/', 'utility', 'About page', 'Native Batch1Page Astro component'],
  ['contact', '/contact-us/', 'utility', 'Contact page', 'Native Batch1Page Astro component + ContactForm'],
  ['aircond-servicing', '/servis-aircond-murah-kl/', 'service', 'Service landing page', 'Native Batch1Page Astro component'],
  ['aircond-installation-kl', '/aircond-installation-kl/', 'service', 'Service landing page', 'Native Batch1Page Astro component'],
  ['aircond-installation-selangor', '/upah-pasang-aircond-selangor/', 'service', 'Service landing page', 'Native Batch1Page Astro component'],
  ['aircond-price-guide', '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/', 'article', 'Article', 'Native reusable article template'],
  ['renovation', '/service/building-renovation/', 'service', 'Service landing page', 'Native Batch1Page Astro component'],
  ['electrical-services', '/electrical-services-selangor/', 'service', 'Service landing page', 'Native Batch1Page Astro component'],
  ['renovation-kl', '/house-renovation-in-kuala-lumpur/', 'service', 'Service landing page', 'Native Batch1Page Astro component'],
  ['renovation-selangor', '/house-renovation-in-selangor/', 'service', 'Service landing page', 'Native Batch1Page Astro component'],
  ['renovation-subang', '/home-renovation-contractor-in-subang-jaya/', 'service', 'Service landing page', 'Native Batch1Page Astro component'],
  ['office-kl', '/office-renovation-in-kuala-lumpur/', 'service', 'Service landing page', 'Native Batch1Page Astro component'],
  ['waterproofing', '/waterproofing-contractor-kuala-lumpur/', 'service', 'Service landing page', 'Native Batch1Page Astro component'],
  ['plaster-ceiling', '/plaster-ceiling-contractor-kl/', 'service', 'Service landing page', 'Native Batch1Page Astro component'],
  ['faq', '/faq/', 'utility', 'FAQ page', 'Native FAQ template'],
  ['blog', '/blog/', 'utility', 'Blog archive', 'Native blog archive template'],
  ['commercial-article', '/commercial-retail-shop-renovation-in-kuala-lumpur/', 'article', 'Article', 'Native reusable article template'],
  ['office-pj-article', '/office-renovation-petaling-jaya-corporate-fit-out-experts/', 'article', 'Article', 'Native reusable article template'],
  ['waterproofing-article', '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/', 'article', 'Article', 'Native reusable article template'],
  ['plaster-article', '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/', 'article', 'Article', 'Native reusable article template'],
  ['aircond-installation-article', '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/', 'article', 'Article', 'Native reusable article template'],
  ['electrical-article', '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/', 'article', 'Article', 'Native reusable article template'],
  ['renovation-kl-article', '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/', 'article', 'Article', 'Native reusable article template'],
  ['renovation-selangor-article', '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/', 'article', 'Article', 'Native reusable article template'],
  ['office-kl-article', '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/', 'article', 'Article', 'Native reusable article template'],
  ['deep-cleaning-article', '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/', 'article', 'Article', 'Native reusable article template'],
  ['pu-injection-article', '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/', 'article', 'Article', 'Native reusable article template'],
  ['aircond-servicing-article', '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/', 'article', 'Article', 'Native reusable article template'],
  ['cleaning-article', '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/', 'article', 'Article', 'Native reusable article template'],
  ['cleaning-service', '/servis-cuci-rumah-kl/', 'service', 'Service landing page', 'Native Batch1Page Astro component'],
  ['thank-you', '/thank-you/', 'utility', 'Thank-you utility', 'Native ThankYouPage Astro component'],
  ['commercial-archive', '/category/commercial/', 'archive', 'Taxonomy archive', 'Native taxonomy archive template'],
  ['hvac-archive', '/category/hvac-guides/', 'archive', 'Taxonomy archive', 'Native taxonomy archive template'],
  ['maintenance-archive', '/category/maintenance/', 'archive', 'Taxonomy archive', 'Native taxonomy archive template'],
  ['renovation-archive', '/category/renovation/', 'archive', 'Taxonomy archive', 'Native taxonomy archive template'],
  ['cleaning-archive', '/category/servis-pembersihan/', 'archive', 'Taxonomy archive', 'Native taxonomy archive template'],
  ['technical-archive', '/category/technical-guides/', 'archive', 'Taxonomy archive', 'Native taxonomy archive template'],
  ['finishing-archive', '/tag/interior-finishing/', 'archive', 'Taxonomy archive', 'Native taxonomy archive template'],
  ['office-archive', '/tag/office-fit-out/', 'archive', 'Taxonomy archive', 'Native taxonomy archive template'],
  ['waterproofing-archive', '/tag/waterproofing/', 'archive', 'Taxonomy archive', 'Native taxonomy archive template'],
].map(([id, route, group, pageType, template]) => ({ id, route, group, pageType, template }));

export const taxonomyRoutes = new Set(
  finalReviewRoutes.filter(({ group }) => group === 'archive').map(({ route }) => route),
);

export const photoSubjects = {
  aircond: 'Aircond installation and servicing',
  electrical: 'Electrical inspection and installation work',
  renovation: 'House renovation and before-and-after projects',
  office: 'Office renovation and fit-out work',
  waterproofing: 'Waterproofing inspection and repair',
  plaster: 'Plaster ceiling installation and repair',
  cleaning: 'Cleaning work and before-and-after results',
  general: 'Team or worksite images',
};

export function photoSubjectFor(route) {
  if (/aircond|pasang-aircond/.test(route)) return photoSubjects.aircond;
  if (/electrical/.test(route)) return photoSubjects.electrical;
  if (/office|commercial/.test(route)) return photoSubjects.office;
  if (/waterproof|pu-injection/.test(route)) return photoSubjects.waterproofing;
  if (/plaster|interior-finishing/.test(route)) return photoSubjects.plaster;
  if (/clean|cuci|pembersihan/.test(route)) return photoSubjects.cleaning;
  if (/renovation/.test(route)) return photoSubjects.renovation;
  return photoSubjects.general;
}
