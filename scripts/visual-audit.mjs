import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const batch1Pages = [
  ['home', 'Homepage', '/'],
  ['services', 'Main services page', '/services/'],
  ['about', 'About page', '/about-us/'],
  ['contact', 'Contact page', '/contact-us/'],
  ['aircond-servicing', 'Aircond servicing page', '/servis-aircond-murah-kl/'],
  ['aircond-installation-kl', 'Aircond installation Kuala Lumpur page', '/aircond-installation-kl/'],
  ['aircond-installation-selangor', 'Aircond installation Selangor page', '/upah-pasang-aircond-selangor/'],
  ['aircond-price-guide', 'Aircond price guide', '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/'],
  ['renovation', 'Main renovation page', '/service/building-renovation/'],
  ['electrical-services', 'Electrical services page', '/electrical-services-selangor/'],
];
const batch2Pages = [
  ['renovation-kl', 'House renovation Kuala Lumpur', '/house-renovation-in-kuala-lumpur/'],
  ['renovation-selangor', 'House renovation Selangor', '/house-renovation-in-selangor/'],
  ['renovation-subang', 'Home renovation Subang Jaya', '/home-renovation-contractor-in-subang-jaya/'],
  ['office-kl', 'Office renovation Kuala Lumpur', '/office-renovation-in-kuala-lumpur/'],
  ['waterproofing', 'Waterproofing contractor Kuala Lumpur', '/waterproofing-contractor-kuala-lumpur/'],
  ['plaster-ceiling', 'Plaster ceiling contractor KL', '/plaster-ceiling-contractor-kl/'],
  ['faq', 'FAQ', '/faq/'],
  ['blog', 'Blog archive', '/blog/'],
  ['commercial-article', 'Commercial retail renovation article', '/commercial-retail-shop-renovation-in-kuala-lumpur/'],
  ['office-pj-article', 'Office renovation Petaling Jaya article', '/office-renovation-petaling-jaya-corporate-fit-out-experts/'],
  ['waterproofing-article', 'Waterproofing guide', '/waterproofing-contractor-kuala-lumpur-the-complete-guide-to-stopping-leaks-2026/'],
  ['plaster-article', 'Plaster ceiling guide', '/plaster-ceiling-contractor-kl-the-ultimate-design-pricing-guide-2026/'],
];
const batch3Pages = [
  ['aircond-installation-article', 'Aircond installation guide', '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/'],
  ['electrical-article', 'Electrical safety guide', '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/'],
  ['renovation-kl-article', 'Kuala Lumpur renovation guide', '/house-renovation-in-kuala-lumpur-the-ultimate-planning-cost-guide-2026/'],
  ['renovation-selangor-article', 'Selangor extension guide', '/house-renovation-in-selangor-the-ultimate-2026-guide-to-extending-your-home/'],
  ['office-kl-article', 'Office fit-out guide', '/office-renovation-in-kuala-lumpur-the-2026-corporate-guide-to-productivity/'],
  ['deep-cleaning-article', 'Deep cleaning guide', '/pakej-deep-cleaning-rumah-kl-termasuk-pre-hari-raya/'],
  ['pu-injection-article', 'PU injection guide', '/pu-injection-waterproofing-kl-how-to-fix-wall-cracks-permanently/'],
  ['aircond-servicing-article', 'Aircond servicing guide', '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/'],
  ['cleaning-article', 'Home cleaning guide', '/servis-cuci-rumah-kl-the-ultimate-2026-guide-to-a-spotless-home/'],
  ['cleaning-service', 'Home cleaning service', '/servis-cuci-rumah-kl/'],
  ['thank-you', 'Thank-you utility', '/thank-you/'],
];

const viewports = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

const args = process.argv.slice(2);
const label = args[0] || 'before';
const pages = label.startsWith('batch3') ? batch3Pages
  : label.startsWith('batch2') ? batch2Pages : batch1Pages;
const stagingBase = args[1] || 'https://firdosi.github.io/rkreno/';
const requestedPages = new Set((args[2] || '').split(',').filter(Boolean));
const requestedViewports = new Set((args[3] || '').split(',').filter(Boolean));
const selectedPages = requestedPages.size ? pages.filter(([id]) => requestedPages.has(id)) : pages;
const selectedViewports = requestedViewports.size
  ? Object.fromEntries(Object.entries(viewports).filter(([name]) => requestedViewports.has(name)))
  : viewports;
const outputRoot = path.resolve('.audit-cache', 'visual-comparison', label);
const productionBase = 'https://rkrenosolution.com/';

const urlFor = (base, route) =>
  new URL(route.replace(/^\/+/, ''), base.endsWith('/') ? base : `${base}/`).href;

async function collectDom(page) {
  return page.evaluate(() => {
    const one = (selector) => document.querySelector(selector);
    const text = (element) => element?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const rect = (element) => {
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return {
        x: Math.round(value.x),
        y: Math.round(value.y),
        width: Math.round(value.width),
        height: Math.round(value.height),
      };
    };
    const style = (element) => {
      if (!element) return null;
      const value = getComputedStyle(element);
      return {
        color: value.color,
        backgroundColor: value.backgroundColor,
        backgroundImage: value.backgroundImage,
        fontFamily: value.fontFamily,
        fontSize: value.fontSize,
        fontWeight: value.fontWeight,
        lineHeight: value.lineHeight,
        padding: value.padding,
        margin: value.margin,
      };
    };
    const metadata = (selector, attribute = 'content') =>
      one(selector)?.getAttribute(attribute) || null;
    const schema = [...document.querySelectorAll('script[type="application/ld+json"]')].map((node) => {
      try {
        const value = JSON.parse(node.textContent);
        return value['@type'] || value['@graph']?.map((item) => item['@type']).filter(Boolean) || 'unknown';
      } catch {
        return 'invalid';
      }
    });
    const images = [...document.images].map((image) => ({
      src: image.currentSrc || image.src,
      alt: image.getAttribute('alt'),
      width: image.naturalWidth,
      height: image.naturalHeight,
      rendered: rect(image),
      loaded: image.complete && image.naturalWidth > 0,
    }));
    const links = [...document.querySelectorAll('a[href]')].map((anchor) => ({
      text: text(anchor),
      href: anchor.href,
      raw: anchor.getAttribute('href'),
    }));
    const headings = [...document.querySelectorAll('h1,h2,h3')].map((heading) => ({
      level: heading.tagName,
      text: text(heading),
      rect: rect(heading),
      style: style(heading),
    }));
    const repeatedHeadings = Object.entries(
      headings.reduce((counts, heading) => {
        const key = heading.text.toLowerCase();
        if (key) counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {}),
    ).filter(([, count]) => count > 1);
    const header = one('header, #masthead, .site-header');
    const logo = one('header img, #masthead img, .site-logo img, .custom-logo');
    const hero = one(
      'main > section:first-of-type, .elementor-top-section:first-of-type, .page-hero, .hero, [class*="hero"]',
    );
    const footer = one('footer, #colophon, .site-footer');
    const pageTitle = one('#pxl-page-title-default, .page-hero');
    const whatsapp = links.filter((link) => /wa\.me|whatsapp/i.test(`${link.href} ${link.text}`));

    return {
      title: document.title,
      description: metadata('meta[name="description"]'),
      canonical: metadata('link[rel="canonical"]', 'href'),
      robots: metadata('meta[name="robots"]'),
      schema,
      lang: document.documentElement.lang,
      h1: headings.filter((heading) => heading.level === 'H1'),
      headings,
      repeatedHeadings,
      header: { rect: rect(header), style: style(header), text: text(header) },
      logo: logo
        ? { src: logo.currentSrc || logo.src, alt: logo.getAttribute('alt'), rect: rect(logo) }
        : null,
      hero: { rect: rect(hero), style: style(hero), text: text(hero).slice(0, 500) },
      footer: { rect: rect(footer), style: style(footer), text: text(footer).slice(0, 500) },
      pageTitle: { rect: rect(pageTitle), style: style(pageTitle), text: text(pageTitle).slice(0, 500) },
      whatsapp,
      images,
      missingAlt: images.filter((image) => image.alt === null || image.alt.trim() === '').length,
      brokenImages: images.filter((image) => !image.loaded).map((image) => image.src),
      internalLinks: links.filter((link) => {
        try {
          return new URL(link.href).origin === location.origin;
        } catch {
          return false;
        }
      }),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyTextLength: text(document.body).length,
    };
  });
}

async function preparePage(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(async () => {
    await document.fonts?.ready;
    const step = Math.max(400, innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
}

await fs.mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const [viewportName, viewport] of Object.entries(selectedViewports)) {
    const sources = label.startsWith('batch3')
      ? [['staging', stagingBase]]
      : [['production', productionBase], ['staging', stagingBase]];
    for (const [source, base] of sources) {
      const folder = path.join(outputRoot, source, viewportName);
      await fs.mkdir(folder, { recursive: true });
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        colorScheme: 'light',
        locale: 'en-MY',
      });

      for (const [id, name, route] of selectedPages) {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(`console: ${message.text()}`);
        });
        const url = source === 'production' ? urlFor(base, route) : urlFor(base, route);
        let status = null;
        let navigationError = null;
        try {
          const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
          status = response?.status() ?? null;
          await preparePage(page);
        } catch (error) {
          navigationError = error.message;
        }
        const dom = navigationError ? null : await collectDom(page);
        const screenshot = path.join(folder, `${id}.png`);
        await page.screenshot({ path: screenshot, fullPage: true });
        let mobileMenu = null;
        if (viewportName === 'mobile' && id === pages[0][0] && !navigationError) {
          const menuTrigger = page.locator(
            '.mobile-menu > summary:visible, .pxl-nav-mobile-button:visible, button[aria-label*="menu" i]:visible, [class*="mobile"][class*="menu"] button:visible',
          ).first();
          if (await menuTrigger.count()) {
            await menuTrigger.click();
            await page.waitForTimeout(250);
            const visibleLinks = await page.locator(
              '.mobile-menu[open] nav a:visible, .pxl-header-menu:visible a:visible, [class*="mobile-menu"]:visible a:visible',
            ).count();
            mobileMenu = { opened: true, visibleLinks };
            await page.screenshot({
              path: path.join(folder, `${id}-menu-open.png`),
              fullPage: false,
            });
          } else {
            mobileMenu = { opened: false, visibleLinks: 0 };
          }
        }
        results.push({
          id,
          name,
          route,
          source,
          viewport: viewportName,
          requestedUrl: url,
          finalUrl: page.url(),
          status,
          navigationError,
          errors,
          screenshot,
          mobileMenu,
          dom,
        });
        process.stdout.write(`${source.padEnd(10)} ${viewportName.padEnd(7)} ${id} (${status ?? 'error'})\n`);
        await page.close();
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}

await fs.writeFile(path.join(outputRoot, 'metrics.json'), `${JSON.stringify(results, null, 2)}\n`);
console.log(`Saved ${results.length} screenshots and DOM records to ${outputRoot}`);
