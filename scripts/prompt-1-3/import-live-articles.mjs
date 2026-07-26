import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, extname, join, relative } from 'node:path';
import { load } from 'cheerio';
import sharp from 'sharp';

const root = process.cwd();
const outputFile = join(root, 'src', 'data', 'article-wordpress-content.json');
const rawDir = join(root, '.audit-cache', 'prompt-1-3', 'rest');
const mediaRoot = join(root, 'public', 'assets', 'media');
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
const retainedRoutes = new Set([
  '/', '/services/', '/about-us/', '/contact-us/', '/faq/', '/blog/',
  '/servis-aircond-murah-kl/', '/aircond-installation-kl/', '/upah-pasang-aircond-selangor/',
  '/service/building-renovation/', '/electrical-services-selangor/',
  '/house-renovation-in-kuala-lumpur/', '/house-renovation-in-selangor/',
  '/home-renovation-contractor-in-subang-jaya/', '/office-renovation-in-kuala-lumpur/',
  '/waterproofing-contractor-kuala-lumpur/', '/plaster-ceiling-contractor-kl/',
  '/servis-cuci-rumah-kl/', '/thank-you/',
  '/category/commercial/', '/category/hvac-guides/', '/category/maintenance/',
  '/category/renovation/', '/category/servis-pembersihan/', '/category/technical-guides/',
  '/tag/interior-finishing/', '/tag/office-fit-out/', '/tag/waterproofing/',
  ...routes,
]);
const fallbacks = {
  aircond: '/assets/media/owner/rk-reno-wall-mounted-aircond-unit-960.webp',
  servicing: '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
  electrical: '/assets/media/Construction-workers-discussing-renovation-plans-092133b6.jpg',
  renovation: '/assets/media/Home-renovation-service-in-KL-422b205c.jpg',
  commercial: '/assets/media/Renovation-contractor-for-commercial-buildings-93583952.jpg',
  office: '/assets/media/Office-renovation-service-in-Selangor-7928d19d.jpg',
  waterproofing: '/assets/media/Bathroom-waterproofing-service-in-KL-3293ca94.jpg',
  ceiling: '/assets/media/Plaster-ceiling-and-aircond-installation-dd789b38.jpg',
  cleaning: '/assets/media/servis-cuci-rumah-kl-2e2d046e.jpg',
};

const normalize = (value = '') => value.replace(/\s+/g, ' ').trim();
const unsafeClaim = /\b(?:warrant(?:y|ies)|guarantee(?:d|s)?|jaminan)\b/i;

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(target) : [target];
  }));
  return nested.flat();
}

function fallbackFor(route) {
  if (/servis-aircond/.test(route)) return fallbacks.servicing;
  if (/aircond/.test(route)) return fallbacks.aircond;
  if (/electrical/.test(route)) return fallbacks.electrical;
  if (/commercial-retail/.test(route)) return fallbacks.commercial;
  if (/office-renovation/.test(route)) return fallbacks.office;
  if (/waterproof|pu-injection/.test(route)) return fallbacks.waterproofing;
  if (/plaster-ceiling/.test(route)) return fallbacks.ceiling;
  if (/cleaning|cuci-rumah/.test(route)) return fallbacks.cleaning;
  return fallbacks.renovation;
}

function normalizeHref(href = '') {
  if (!href || href.startsWith('#')) return href;
  if (/^(?:tel:|mailto:|https:\/\/wa\.me\/)/i.test(href)) return href;
  try {
    const url = new URL(href, 'https://rkrenosolution.com/');
    if (url.origin !== 'https://rkrenosolution.com') return '';
    const mapped = url.pathname === '/about/' ? '/about-us/' : url.pathname;
    const route = mapped.endsWith('/') ? mapped : `${mapped}/`;
    return retainedRoutes.has(route) ? `${route}${url.hash}` : '';
  } catch {
    return '';
  }
}

await mkdir(rawDir, { recursive: true });
const localFiles = (await listFiles(mediaRoot)).filter((file) => /\.(?:avif|jpe?g|png|webp)$/i.test(file));
const localByName = new Map(localFiles.map((file) => [basename(file).toLowerCase(), file]));
const output = {};

for (const route of routes) {
  const slug = route.split('/').filter(Boolean).pop();
  const endpoint = `https://rkrenosolution.com/wp-json/wp/v2/posts?slug=${slug}&_fields=id,slug,date,modified,title,content`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`${route}: REST response ${response.status}`);
  const posts = await response.json();
  if (posts.length !== 1) throw new Error(`${route}: expected one WordPress post, found ${posts.length}`);
  const post = posts[0];
  await writeFile(join(rawDir, `${slug}.json`), `${JSON.stringify(post, null, 2)}\n`);

  const source = load(post.content.rendered, { decodeEntities: false });
  const widget = source('.elementor-widget-html').first();
  const fragment = widget.length ? widget.html() : source.root().html();
  const $ = load(`<div id="article-import-root">${fragment}</div>`, { decodeEntities: false });
  const rootNode = $('#article-import-root');
  const sourceHeadings = rootNode.find('h1,h2,h3,h4').length;
  const sourceTables = rootNode.find('table').length;
  const sourceFaqs = rootNode.find('details').length
    || rootNode.find('[class*="faq-item"], [class*="accordion-item"]').length;
  const removedClaims = [];

  rootNode.find('script,noscript,iframe,form,link').remove();
  rootNode.find('p').each((_, paragraph) => {
    const html = $(paragraph).html() || '';
    $(paragraph).html(html
      .replace(
        /We utilize a strict, fast-track workflow to guarantee your store opens on schedule:/i,
        'We use a structured, fast-track workflow around the agreed opening schedule:',
      )
      .replace(
        /We utilize a strict workflow to guarantee on-time delivery:/i,
        'We use a structured workflow around the agreed programme:',
      ));
  });
  rootNode.find('style').each((_, style) => {
    const clean = ($(style).html() || '')
      .replace(/@import[^;]+;/gi, '')
      .replace(/url\(\s*(['"]?)https?:\/\/[^)]+\)/gi, 'none')
      .replace(/url\(\s*(['"]?)\/wp-content\/[^)]+\)/gi, 'none');
    $(style).html(clean);
  });
  rootNode.find('p,li,[class*="alert"],[class*="guarantee"],[class*="warranty"]').each((_, element) => {
    const text = normalize($(element).text());
    if (!unsafeClaim.test(text)) return;
    removedClaims.push(text);
    const parentCallout = $(element).closest('[class*="alert"],[class*="guarantee"],[class*="warranty"]');
    if (parentCallout.length) parentCallout.remove();
    else $(element).remove();
  });
  rootNode.find('h1').each((_, heading) => {
    $(heading).replaceWith(`<h2 class="article-source-title">${$(heading).html() || normalize($(heading).text())}</h2>`);
  });
  rootNode.find('a').each((_, anchor) => {
    const href = normalizeHref($(anchor).attr('href'));
    if (!href) $(anchor).replaceWith($(anchor).html() || $(anchor).text());
    else $(anchor).attr('href', href).removeAttr('target').removeAttr('rel');
  });

  const substitutions = [];
  const restoredImages = [];
  const images = rootNode.find('img').toArray();
  for (let index = 0; index < images.length; index += 1) {
    const image = $(images[index]);
    const sourceUrl = image.attr('src') || image.attr('data-src') || '';
    let sourceName = '';
    try {
      sourceName = decodeURIComponent(basename(new URL(sourceUrl, 'https://rkrenosolution.com/').pathname));
    } catch {
      sourceName = basename(sourceUrl.split('?')[0]);
    }
    let localFile = localByName.get(sourceName.toLowerCase());
    if (!localFile) {
      const fallback = fallbackFor(route);
      localFile = join(root, 'public', fallback.replace(/^\//, ''));
      substitutions.push({ source: sourceUrl, local: fallback });
    }
    const local = `/${relative(join(root, 'public'), localFile).replaceAll('\\', '/')}`;
    const metadata = await sharp(localFile).metadata();
    image.attr({
      src: local,
      alt: normalize(image.attr('alt')) || `Illustration for ${normalize(post.title.rendered)}`,
      width: String(metadata.width || 960),
      height: String(metadata.height || 640),
      decoding: 'async',
      loading: index === 0 ? 'eager' : 'lazy',
    }).removeAttr('srcset sizes data-src data-lazy-src');
    if (index === 0) image.attr('fetchpriority', 'high');
    restoredImages.push(local);
  }

  rootNode.find('[style]').each((_, element) => {
    const clean = ($(element).attr('style') || '').replace(/url\([^)]*\)/gi, '');
    if (clean) $(element).attr('style', clean);
    else $(element).removeAttr('style');
  });
  const faqs = [];
  rootNode.find('details').each((_, detail) => {
    const question = normalize($(detail).find('summary').first().text());
    const answer = normalize($(detail).clone().find('summary').remove().end().text());
    if (question && answer) faqs.push({ question, answer });
  });
  if (!faqs.length) {
    rootNode.find('.rk-faq-item, [class*="accordion-item"]').each((_, item) => {
      const question = normalize($(item).find('h3,h4,[class*="question"],[class*="title"]').first().text());
      const answer = normalize($(item).find('p,[class*="answer"],[class*="content"]').first().text());
      if (question && answer) faqs.push({ question, answer });
    });
  }
  const html = rootNode.html().trim();
  const astro = load(`<main>${html}</main>`, { decodeEntities: false });
  output[route] = {
    sourceId: post.id,
    sourceTitle: normalize(post.title.rendered),
    published: post.date,
    modified: post.modified,
    html,
    faqs,
    counts: {
      sourceHeadings,
      astroHeadings: astro('h2,h3,h4').length,
      sourceTables,
      astroTables: astro('table').length,
      sourceFaqs,
      astroFaqs: astro('details').length || astro('[class*="faq-item"], [class*="accordion-item"]').length,
    },
    restoredImages: [...new Set(restoredImages)],
    substitutions,
    removedClaims: [...new Set(removedClaims)],
  };
}

await writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Imported complete rendered WordPress content for ${Object.keys(output).length} retained articles.`);
