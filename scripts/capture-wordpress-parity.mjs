import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { finalReviewRoutes } from './lib/final-review-routes.mjs';

const viewports = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

const sources = {
  wordpress: 'https://rkrenosolution.com/',
  astro: 'https://firdosi.github.io/rkreno/',
};

const outputRoot = fileURLToPath(new URL('../.audit-cache/wordpress-parity/', import.meta.url));
const normalizeUrl = (base, route) => new URL(route.replace(/^\/+/, ''), base).href;
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function prepare(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(async () => {
    await document.fonts?.ready;
    const step = Math.max(500, innerHeight * 0.85);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    scrollTo(0, 0);
    await Promise.race([
      Promise.all([...document.images].map((image) => {
        if (image.complete) return undefined;
        return new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        });
      })),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  });
  await page.waitForTimeout(250);
}

async function inspect(page) {
  return page.evaluate(() => {
    const compact = (value) => value?.replace(/\s+/g, ' ').trim() || '';
    const meta = (selector, attr = 'content') =>
      document.querySelector(selector)?.getAttribute(attr) || '';
    const rect = (element) => {
      const value = element?.getBoundingClientRect();
      return value
        ? { x: Math.round(value.x), y: Math.round(value.y), width: Math.round(value.width), height: Math.round(value.height) }
        : null;
    };
    const styles = (element) => {
      if (!element) return null;
      const value = getComputedStyle(element);
      return {
        color: value.color,
        backgroundColor: value.backgroundColor,
        fontFamily: value.fontFamily,
        fontSize: value.fontSize,
        fontWeight: value.fontWeight,
        lineHeight: value.lineHeight,
        padding: value.padding,
      };
    };
    const headings = [...document.querySelectorAll('h1,h2,h3')].map((element) => ({
      level: element.tagName,
      text: compact(element.textContent),
      rect: rect(element),
    }));
    const sections = [...document.querySelectorAll('main section, main article > div, #pxl-main section, .elementor-section')]
      .filter((element) => rect(element)?.height > 20)
      .map((element, index) => ({
        index,
        id: element.id || '',
        classes: [...element.classList].slice(0, 6),
        heading: compact(element.querySelector('h1,h2,h3')?.textContent),
        textLength: compact(element.textContent).length,
        rect: rect(element),
        style: styles(element),
      }));
    const images = [...document.images].map((image) => ({
      src: image.currentSrc || image.src,
      alt: image.getAttribute('alt'),
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      rendered: rect(image),
      loaded: image.complete && image.naturalWidth > 0,
    }));
    const links = [...document.querySelectorAll('a[href]')].map((anchor) => ({
      text: compact(anchor.textContent),
      href: anchor.href,
    }));
    const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')].map((node) => {
      try {
        return JSON.parse(node.textContent);
      } catch {
        return 'INVALID_JSON';
      }
    });
    const header = document.querySelector('header, #pxl-header-elementor, #pxl-header-default');
    const footer = document.querySelector('footer, #pxl-footer-elementor, #colophon');
    const main = document.querySelector('main, #pxl-main');
    return {
      title: document.title,
      description: meta('meta[name="description"]'),
      canonical: meta('link[rel="canonical"]', 'href'),
      robots: meta('meta[name="robots"]'),
      ogTitle: meta('meta[property="og:title"]'),
      ogDescription: meta('meta[property="og:description"]'),
      ogImage: meta('meta[property="og:image"]'),
      bodyText: compact(main?.textContent),
      bodyTextLength: compact(main?.textContent).length,
      headings,
      sections,
      images,
      links,
      schemas,
      header: { rect: rect(header), text: compact(header?.textContent).slice(0, 1000), style: styles(header) },
      footer: { rect: rect(footer), text: compact(footer?.textContent).slice(0, 1000), style: styles(footer) },
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      pageHeight: document.documentElement.scrollHeight,
      missingAlt: images.filter((image) => image.alt === null || image.alt.trim() === '').length,
      brokenImages: images.filter((image) => !image.loaded).map((image) => image.src),
      internalLinks: links.filter((link) => {
        try {
          return new URL(link.href).origin === location.origin;
        } catch {
          return false;
        }
      }),
    };
  });
}

async function captureWorker(browser, phase, sourceName, base, viewportName, viewport, routes = finalReviewRoutes) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'en-MY',
  });
  const results = [];
  const folder = path.join(outputRoot, phase, sourceName, viewportName);
  await fs.mkdir(folder, { recursive: true });
  for (const route of routes) {
    const page = await context.newPage();
    const browserErrors = [];
    page.on('pageerror', (error) => browserErrors.push(`page: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`);
    });
    const url = normalizeUrl(base, route.route);
    let status = null;
    let navigationError = '';
    let dom = null;
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      status = response?.status() ?? null;
      await page.waitForTimeout(sourceName === 'wordpress' ? 1500 : 350);
      await prepare(page);
      dom = await inspect(page);
    } catch (error) {
      navigationError = error.message;
    }
    const screenshotPath = path.join(folder, `${route.id}.png`);
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
    } catch (error) {
      browserErrors.push(`screenshot: ${error.message}`);
    }
    results.push({
      ...route,
      phase,
      source: sourceName,
      viewport: viewportName,
      url,
      status,
      navigationError,
      browserErrors,
      screenshot: path.relative(outputRoot, screenshotPath).replaceAll('\\', '/'),
      dom,
    });
    await page.close();
  }
  await context.close();
  return results;
}

export async function captureParity(phase = 'before') {
  if (!['before', 'after'].includes(phase)) throw new Error(`Unsupported capture phase: ${phase}`);
  await fs.mkdir(path.join(outputRoot, phase), { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const workers = [];
    for (const [sourceName, base] of Object.entries(sources)) {
      for (const [viewportName, viewport] of Object.entries(viewports)) {
        workers.push(captureWorker(browser, phase, sourceName, base, viewportName, viewport));
      }
    }
    const captures = (await Promise.all(workers)).flat();
    const manifest = {
      phase,
      capturedAt: new Date().toISOString(),
      retainedRouteCount: finalReviewRoutes.length,
      expectedCaptureCount: finalReviewRoutes.length * Object.keys(sources).length * Object.keys(viewports).length,
      captures,
    };
    const serialized = JSON.stringify(manifest, null, 2);
    await fs.writeFile(path.join(outputRoot, phase, 'manifest.json'), serialized);
    await fs.writeFile(path.join(outputRoot, phase, 'manifest.sha256'), `${digest(serialized)}  manifest.json\n`);
    return {
      phase,
      captures: captures.length,
      failures: captures.filter(({ status, navigationError }) => status !== 200 || navigationError).length,
      output: path.join(outputRoot, phase),
    };
  } finally {
    await browser.close();
  }
}

export async function captureParityBatch(
  phase = 'before',
  start = 0,
  count = 7,
  astroBase = sources.astro,
  sourceMode = 'both',
) {
  if (!['before', 'after'].includes(phase)) throw new Error(`Unsupported capture phase: ${phase}`);
  const routes = finalReviewRoutes.slice(start, start + count);
  await fs.mkdir(path.join(outputRoot, phase, 'chunks'), { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const workers = [];
    const selectedSources = sourceMode === 'astro'
      ? { astro: astroBase }
      : { ...sources, astro: astroBase };
    for (const [sourceName, base] of Object.entries(selectedSources)) {
      for (const [viewportName, viewport] of Object.entries(viewports)) {
        workers.push(captureWorker(browser, phase, sourceName, base, viewportName, viewport, routes));
      }
    }
    const captures = (await Promise.all(workers)).flat();
    const serialized = JSON.stringify(captures, null, 2);
    const chunkName = `${String(start).padStart(2, '0')}-${String(start + routes.length - 1).padStart(2, '0')}.json`;
    await fs.writeFile(path.join(outputRoot, phase, 'chunks', chunkName), serialized);
    return {
      phase,
      routes: routes.length,
      captures: captures.length,
      failures: captures.filter(({ status, navigationError }) => status !== 200 || navigationError).length,
      chunk: chunkName,
    };
  } finally {
    await browser.close();
  }
}

export async function finalizeParityCapture(phase = 'before', sourceMode = 'both') {
  const chunkFolder = path.join(outputRoot, phase, 'chunks');
  const chunkFiles = (await fs.readdir(chunkFolder)).filter((file) => file.endsWith('.json')).sort();
  const captureMap = new Map();
  for (const file of chunkFiles) {
    for (const capture of JSON.parse(await fs.readFile(path.join(chunkFolder, file), 'utf8'))) {
      if (sourceMode === 'astro' && capture.source !== 'astro') continue;
      captureMap.set(`${capture.route}|${capture.source}|${capture.viewport}`, capture);
    }
  }
  const captures = [...captureMap.values()];
  const manifest = {
    phase,
    capturedAt: new Date().toISOString(),
    retainedRouteCount: finalReviewRoutes.length,
    expectedCaptureCount: finalReviewRoutes.length
      * (sourceMode === 'astro' ? 1 : Object.keys(sources).length)
      * Object.keys(viewports).length,
    captures,
  };
  const serialized = JSON.stringify(manifest, null, 2);
  await fs.writeFile(path.join(outputRoot, phase, 'manifest.json'), serialized);
  await fs.writeFile(path.join(outputRoot, phase, 'manifest.sha256'), `${digest(serialized)}  manifest.json\n`);
  return {
    phase,
    captures: captures.length,
    failures: captures.filter(({ status, navigationError }) => status !== 200 || navigationError).length,
    complete: captures.length === manifest.expectedCaptureCount,
  };
}
