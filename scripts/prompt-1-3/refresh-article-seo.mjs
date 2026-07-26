import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const file = join(root, 'src', 'data', 'site-pages.json');
const routes = [
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/',
  '/commercial-retail-shop-renovation-in-kuala-lumpur/',
  '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/',
  '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/',
  '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/',
  '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/',
  '/office-renovation-petaling-jaya-corporate-fit-out-experts/',
  '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/',
  '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/',
  '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/',
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/',
  '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/',
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/',
  '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/',
];
const pages = JSON.parse(await readFile(file, 'utf8'));

for (const route of routes) {
  const page = pages.find((item) => item.path === route);
  if (!page) throw new Error(`${route}: route not found in site-pages.json`);
  const response = await fetch(`https://rkrenosolution.com${route}`);
  if (!response.ok) throw new Error(`${route}: live response ${response.status}`);
  const $ = load(await response.text());
  const title = $('title').first().text().trim();
  const description = $('meta[name="description"]').attr('content')?.trim();
  const canonical = $('link[rel="canonical"]').attr('href')?.trim();
  const h1 = $('h1').first().text().replace(/\s+/g, ' ').trim();
  if (!title || !description || !canonical || !h1) throw new Error(`${route}: incomplete live SEO fields`);
  Object.assign(page, { title, description, canonical, h1 });
}

await writeFile(file, `${JSON.stringify(pages, null, 2)}\n`);
console.log(`Refreshed exact live title, description, canonical and H1 for ${routes.length} retained articles.`);
