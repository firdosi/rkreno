export interface MediaDimensions {
  width: number;
  height: number;
}

const dimensions: Record<string, MediaDimensions> = {
  'RK-Reno-Solutions-Logo-942f64bb.png': { width: 1575, height: 483 },
  'Bathroom-waterproofing-service-in-KL-3293ca94.jpg': { width: 896, height: 1200 },
  'Office-renovation-service-in-Selangor-7928d19d.jpg': { width: 896, height: 1200 },
  'detailed-kitchen-cleaning-kl-67669628.jpg': { width: 1600, height: 900 },
  'servis-cuci-rumah-kl-2e2d046e.jpg': { width: 1600, height: 900 },
  'Home-renovation-service-in-KL-422b205c.jpg': { width: 896, height: 1200 },
  'rk-reno-aircond-outdoor-condenser-720.webp': { width: 720, height: 960 },
  'rk-reno-aircond-unit-trunking-960.webp': { width: 960, height: 720 },
  'rk-reno-wall-mounted-aircond-unit-960.webp': { width: 960, height: 720 },
  'Renovation-contractor-for-commercial-buildings-93583952.jpg': { width: 1376, height: 768 },
  'Renovation-planning-and-project-drawings-1-ea76b170.jpg': { width: 1200, height: 896 },
  'Renovation-planning-and-project-drawings-6cfdb2fc.jpg': { width: 1200, height: 896 },
  'Modern-building-renovation-and-property-improvement-b1ec6039.jpg': { width: 1200, height: 896 },
  'Plaster-ceiling-and-aircond-installation-dd789b38.jpg': { width: 896, height: 1200 },
  'RK-Reno-Solution-contractor-reviewing-renovation-projec-1fc54dc9.jpg': { width: 896, height: 1200 },
  'Construction-workers-discussing-renovation-plans-092133b6.jpg': { width: 1200, height: 896 },
  'avartar1-90x90-68065c41.webp': { width: 90, height: 90 },
  'home7-img7-f8f5cbc2.webp': { width: 441, height: 546 },
};

export function getMediaDimensions(path: string): MediaDimensions | undefined {
  return dimensions[path.split('/').pop() || ''];
}

export function addIntrinsicImageDimensions(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const source = tag.match(/\bsrc=(["'])(.*?)\1/i)?.[2];
    const size = source ? getMediaDimensions(source) : undefined;
    if (!size) return tag;

    let result = tag;
    if (!/\bwidth\s*=/i.test(result)) {
      result = result.replace(/<img\b/i, `<img width="${size.width}"`);
    }
    if (!/\bheight\s*=/i.test(result)) {
      result = result.replace(/<img\b/i, `<img height="${size.height}"`);
    }
    return result;
  });
}
