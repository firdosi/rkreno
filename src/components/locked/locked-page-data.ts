import { createSourceMediaResolver } from '../../lib/source-content';

const routeMediaFallback: Record<string, string> = {
  '/aircond-installation-kl/': '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
  '/upah-pasang-aircond-selangor/': '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/': '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
  '/servis-aircond-murah-kl/': '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/': '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
  '/electrical-services-selangor/': '/assets/media/Construction-workers-discussing-renovation-plans-092133b6.jpg',
  '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/': '/assets/media/Construction-workers-discussing-renovation-plans-092133b6.jpg',
  '/house-renovation-in-kuala-lumpur/': '/assets/media/Home-renovation-service-in-KL-422b205c.jpg',
  '/house-renovation-in-selangor/': '/assets/media/Modern-building-renovation-and-property-improvement-b1ec6039.jpg',
  '/home-renovation-contractor-in-subang-jaya/': '/assets/media/Home-renovation-service-in-KL-422b205c.jpg',
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/': '/assets/media/Home-renovation-service-in-KL-422b205c.jpg',
  '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/': '/assets/media/Modern-building-renovation-and-property-improvement-b1ec6039.jpg',
  '/office-renovation-in-kuala-lumpur/': '/assets/media/Office-renovation-service-in-Selangor-7928d19d.jpg',
  '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/': '/assets/media/Office-renovation-service-in-Selangor-7928d19d.jpg',
  '/office-renovation-petaling-jaya-corporate-fit-out-experts/': '/assets/media/Office-renovation-service-in-Selangor-7928d19d.jpg',
  '/waterproofing-contractor-kuala-lumpur/': '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg',
  '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/': '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg',
  '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/': '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg',
  '/plaster-ceiling-contractor-kl/': '/assets/media/Plaster-ceiling-and-aircond-installation-dd789b38.jpg',
  '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/': '/assets/media/Plaster-ceiling-and-aircond-installation-dd789b38.jpg',
};

function mediaResolver(page: any) {
  const baseResolve = createSourceMediaResolver(page.images || []);
  const fallback = routeMediaFallback[page.path];
  return (source = '') => {
    const resolved = baseResolve(source);
    return fallback && resolved === '/assets/media/detailed-kitchen-cleaning-kl-67669628.jpg' && !/clean|cuci/i.test(page.path)
      ? fallback : resolved;
  };
}

export const ARTICLE_ROUTES = new Set([
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/',
  '/commercial-retail-shop-renovation-in-kuala-lumpur/',
  '/office-renovation-petaling-jaya-corporate-fit-out-experts/',
  '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/',
  '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/',
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/',
  '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/',
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/',
  '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/',
  '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/',
  '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/',
  '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/',
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/',
  '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/',
]);

export const SERVICE_ROUTES = new Set([
  '/servis-aircond-murah-kl/', '/aircond-installation-kl/', '/upah-pasang-aircond-selangor/',
  '/service/building-renovation/', '/electrical-services-selangor/',
  '/house-renovation-in-kuala-lumpur/', '/house-renovation-in-selangor/',
  '/home-renovation-contractor-in-subang-jaya/', '/office-renovation-in-kuala-lumpur/',
  '/waterproofing-contractor-kuala-lumpur/', '/plaster-ceiling-contractor-kl/',
  '/servis-cuci-rumah-kl/', '/demolition-contractor-kl-selangor/',
]);

export function prepareLockedPage(record: any, page: any, featuredImage = '', featuredAlt = '') {
  const blocks = record.content.orderedBlocks || [];
  const heroIndex = blocks.findIndex((block: any) => block.type === 'heading' && block.level === 1);
  const leadIndex = blocks.findIndex((block: any) => block.type === 'p' && block.text);
  const body = blocks.filter((_: any, index: number) => index !== heroIndex && index !== leadIndex);
  const resolveMedia = mediaResolver(page);
  const sourceHeroBlock = body.find((block: any) => block.type === 'image' && !/gravatar/i.test(block.src));
  const heroImage = sourceHeroBlock ? resolveMedia(sourceHeroBlock.src) : featuredImage;
  const heroAlt = sourceHeroBlock?.alt || featuredAlt || '';
  const contentBody = sourceHeroBlock ? body.filter((block: any) => block !== sourceHeroBlock) : body;
  const sections: any[] = [];
  let current = { blocks: [] as any[] };
  for (const block of contentBody) {
    if (block.type === 'heading' && block.level <= 3 && current.blocks.length) {
      sections.push(current);
      current = { blocks: [] };
    }
    current.blocks.push(block);
  }
  if (current.blocks.length) sections.push(current);
  const toc = contentBody.filter((block: any) => block.type === 'heading' && block.text && block.level <= 2)
    .map((block: any, index: number) => ({ ...block, id: `source-section-${index + 1}` }));
  const published = record.content.dates?.[0] || page.published || '';
  const dateLabel = published ? new Date(published).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : '';
  return {
    heroTitle: record.content.h1 || record.seo.title,
    lead: leadIndex >= 0 ? blocks[leadIndex].text : record.seo.description,
    heroImage, heroAlt, contentBody, sections, toc, resolveMedia, published, dateLabel,
  };
}

export function cardFromRecord(record: any, pageByRoute: Map<string, any>) {
  const page = pageByRoute.get(record.route);
  const content = record.content || {};
  const paragraph = content.orderedBlocks?.find((block: any) => block.type === 'p')?.text || record.seo?.description || page?.description || '';
  const imageBlock = content.orderedBlocks?.find((block: any) => block.type === 'image' && !/gravatar/i.test(block.src));
  const image = imageBlock && page ? mediaResolver(page)(imageBlock.src) : '';
  return {
    route: record.route, title: content.h1 || record.seo?.title || page?.h1 || page?.title || '',
    description: paragraph, image, alt: imageBlock?.alt || '',
    date: content.dates?.[0] || '', category: content.categories?.[0] || '',
  };
}
