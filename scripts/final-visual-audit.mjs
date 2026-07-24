import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { finalReviewRoutes } from './lib/final-review-routes.mjs';

const base = process.argv[2] || 'https://firdosi.github.io/rkreno/';
const outputRoot = path.resolve('.audit-cache', 'final-review');
const requestedViewports = new Set((process.argv[3] || '').split(',').filter(Boolean));
const viewports = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};
const forbiddenText = [
  /\bwoocommerce\b/i, /\badd to cart\b/i, /\blorem ipsum\b/i,
  /\bEcom Stadium\b/i, /\bVastcon\b/i, /\bVinceta\b/i,
];
const claimPatterns = [
  /\b\d[\d,]*\+?\s+(?:customers?|projects?|years?)\b/i,
  /\b(?:24\/7|emergency availability|certified workers?|licensed workers?)\b/i,
  /\b(?:guarantee[ds]?|warrant(?:y|ies)|number one|no\.?\s*1)\b/i,
  /\b(?:best|leading)\b/i,
  /\b(?:permanent(?:ly)?|permanent fix)\b/i,
  /\bRM\s?\d[\d,.]*(?:\s?[-–]\s?RM?\s?\d[\d,.]*)?/i,
];

function urlFor(route) {
  return new URL(route.replace(/^\/+/, ''), base.endsWith('/') ? base : `${base}/`).href;
}

async function inspect(page) {
  return page.evaluate(({ forbiddenSources, claimSources }) => {
    const text = (node) => node?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const allText = text(document.body);
    const headings = [...document.querySelectorAll('h1,h2,h3,h4')].map((node) => ({
      level: Number(node.tagName.slice(1)), text: text(node),
    }));
    const headingJumps = headings.slice(1).filter((heading, index) =>
      heading.level > headings[index].level + 1);
    const images = [...document.images].map((image) => ({
      src: image.currentSrc || image.src,
      alt: image.getAttribute('alt'),
      loaded: image.complete && image.naturalWidth > 0,
      width: image.naturalWidth,
      height: image.naturalHeight,
    }));
    const links = [...document.querySelectorAll('a[href]')].map((link) => ({
      href: link.href, raw: link.getAttribute('href'), text: text(link),
    }));
    const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')].map((node) => {
      try {
        return { valid: true, value: JSON.parse(node.textContent) };
      } catch {
        return { valid: false };
      }
    });
    const interactive = [...document.querySelectorAll('a,button,input,select,textarea,summary')]
      .filter(visible);
    const tinyTargets = interactive.filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width < 24 || rect.height < 24;
    }).length;
    return {
      title: document.title,
      robots: document.querySelector('meta[name="robots"]')?.content || '',
      canonical: document.querySelector('link[rel="canonical"]')?.href || '',
      h1: headings.filter(({ level }) => level === 1),
      headingJumps,
      header: Boolean(document.querySelector('header')),
      logo: Boolean(document.querySelector('header img[alt]')),
      navigation: Boolean(document.querySelector('header nav')),
      breadcrumbs: Boolean(document.querySelector('.breadcrumbs, nav[aria-label*="breadcrumb" i]')),
      hero: Boolean(document.querySelector('.page-hero, .batch-hero, .article-hero, .utility-page')),
      cards: document.querySelectorAll('.card, [class*="card"]').length,
      tables: document.querySelectorAll('table').length,
      accordions: document.querySelectorAll('details').length,
      ctas: document.querySelectorAll('a.button, button.button').length,
      telephoneLinks: links.filter(({ href }) => href.startsWith('tel:')).length,
      whatsappLinks: links.filter(({ href }) => /wa\.me|whatsapp/i.test(href)).length,
      forms: [...document.querySelectorAll('form')].map((form) => ({
        configured: form.dataset.configured || null,
        submitDisabled: form.querySelector('button[type="submit"]')?.disabled ?? null,
        consentRequired: form.querySelector('[name="privacy_consent"]')?.required ?? false,
      })),
      relatedServices: /related service|service options|service page/i.test(allText),
      relatedArticles: /related article|more guides|browse.*guide/i.test(allText),
      footer: Boolean(document.querySelector('footer')),
      images,
      brokenImages: images.filter(({ loaded }) => !loaded).map(({ src }) => src),
      missingAlt: images.filter(({ alt }) => alt === null || alt.trim() === '').map(({ src }) => src),
      remoteImages: images.filter(({ src }) => new URL(src).origin !== location.origin).map(({ src }) => src),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      rawWordPress: /wp-content|elementor-|wp-block-|woocommerce/i.test(document.body.innerHTML),
      forbiddenText: forbiddenSources.filter((source) => new RegExp(source, 'i').test(allText)),
      claimMatches: claimSources.filter((source) => new RegExp(source, 'i').test(allText)),
      schemaValid: schemas.length > 0 && schemas.every(({ valid }) => valid),
      schemas: schemas.map(({ value }) => value?.['@type']).filter(Boolean),
      tinyTargets,
      bodyTextLength: allText.length,
    };
  }, {
    forbiddenSources: forbiddenText.map(({ source }) => source),
    claimSources: claimPatterns.map(({ source }) => source),
  });
}

await fs.mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
let results = [];
const metricsPath = path.join(outputRoot, 'metrics.json');
if (requestedViewports.size) {
  try {
    const previous = JSON.parse(await fs.readFile(metricsPath, 'utf8'));
    results = previous.filter(({ viewport }) => !requestedViewports.has(viewport));
  } catch {
    // A filtered first run is valid; the metrics file will contain only that subset.
  }
}

try {
  for (const [viewport, dimensions] of Object.entries(viewports)
    .filter(([name]) => !requestedViewports.size || requestedViewports.has(name))) {
    const context = await browser.newContext({
      viewport: dimensions, colorScheme: 'light', locale: 'en-MY',
    });
    for (const route of finalReviewRoutes) {
      const page = await context.newPage();
      const errors = [];
      const remoteImageRequests = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('request', (request) => {
        if (request.resourceType() === 'image' && new URL(request.url()).origin !== new URL(base).origin) {
          remoteImageRequests.push(request.url());
        }
      });
      const response = await page.goto(urlFor(route.route), {
        waitUntil: 'networkidle', timeout: 45_000,
      });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(async () => {
        await document.fonts?.ready;
        for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(500, innerHeight * .8)) {
          scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        scrollTo(0, 0);
      });
      await page.waitForTimeout(150);
      const dom = await inspect(page);
      const folder = path.join(outputRoot, viewport);
      await fs.mkdir(folder, { recursive: true });
      const screenshot = path.join(folder, `${route.id}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      let mobileMenu = null;
      if (viewport === 'mobile') {
        const trigger = page.locator('[aria-label="Open navigation"]:visible, .mobile-menu > summary:visible').first();
        if (await trigger.count()) {
          await trigger.click();
          const links = await page.locator('.mobile-menu[open] a:visible, header nav a:visible').count();
          mobileMenu = { opened: true, links };
        } else {
          mobileMenu = { opened: false, links: 0 };
        }
      }
      results.push({
        ...route, viewport, status: response?.status() || null, finalUrl: page.url(),
        errors, remoteImageRequests: [...new Set(remoteImageRequests)], mobileMenu, screenshot, dom,
      });
      process.stdout.write(`${viewport.padEnd(7)} ${route.id} ${response?.status() || 'error'}\n`);
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  metricsPath,
  `${JSON.stringify(results, null, 2)}\n`,
);
console.log(`Saved ${results.length} final-review records to ${outputRoot}`);
