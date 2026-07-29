import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { builtHtmlPath, loadRegistry, root, routeSlug } from './lib/route-registry.mjs';

const registry = await loadRegistry();
const cache = path.join(root, '.audit-cache', 'prompt-1-1', 'source-interactions');
const reports = path.join(root, 'reports', 'public');
const selectors = {
  stickyHeader: 'header[class*="sticky"],.sticky-header,[data-sticky-header]',
  desktopDropdown: 'header .sub-menu,header [class*="dropdown"]',
  mobileMenu: '[class*="mobile-menu"],[data-mobile-menu],.exact-mobile-menu',
  carousel: '.swiper,.slick-slider,[data-carousel],[data-testimonial-track],[data-held-testimonial-carousel]',
  slider: '[class*="slider"],[data-slider]',
  previousControl: '.swiper-button-prev,.slick-prev,[data-prev],[data-testimonial-prev],[data-held-prev]',
  nextControl: '.swiper-button-next,.slick-next,[data-next],[data-testimonial-next],[data-held-next]',
  dotNavigation: '.swiper-pagination,.slick-dots,[data-dots]',
  counters: '[data-counter],[class*="counter"]',
  accordions: 'details,[class*="accordion"]',
  tabs: '[role="tab"],[data-tab]',
  projectFilter: '[data-project-filter],[class*="project-filter"]',
  forms: 'form',
  stickySidebar: 'aside[class*="sticky"],[data-sticky-sidebar]',
  floatingPhone: 'a[href^="tel:"]',
  floatingWhatsApp: 'a[href*="wa.me"],a[href*="whatsapp"]',
};
const behavioralFields = {
  autoplay: 'NOT_TESTED',
  transitionDuration: 'NOT_TESTED',
  mobileBehaviour: 'NOT_TESTED',
  reducedMotionBehaviour: 'NOT_TESTED',
  hoverAnimation: 'NOT_TESTED',
  entranceAnimation: 'NOT_TESTED',
  formBehaviour: 'NOT_TESTED',
};

const astroInventory = (html) => {
  const $ = load(html);
  return Object.fromEntries(Object.entries(selectors)
    .map(([name, selector]) => [name, $(selector).length]));
};

const routes = [];
for (const route of registry.publicRoutes) {
  const astro = astroInventory(await readFile(builtHtmlPath(route.path), 'utf8'));
  let source = null;
  if (route.mirrored) {
    source = JSON.parse(await readFile(path.join(cache, `${routeSlug(route.path)}.json`), 'utf8'));
  }
  routes.push({
    route: route.path,
    sourceType: route.sourceType,
    wordpress: source,
    astro,
    behavior: behavioralFields,
  });
}
await mkdir(reports, { recursive: true });
await writeFile(path.join(reports, 'prompt-1-1-interaction-inventory.json'),
  `${JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), routes }, null, 2)}\n`);
