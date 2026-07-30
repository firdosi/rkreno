import { normalizeDestination, styleProperties } from './shared-config.mjs';

const extractionFunction = ({ target, properties }) => {
  const visible = (element) => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
  };
  const text = (element) => (element?.textContent || '').replace(/\s+/g, ' ').trim();
  const box = (element) => {
    if (!element) return null;
    const value = element.getBoundingClientRect();
    return { x: value.x, y: value.y, width: value.width, height: value.height };
  };
  const link = (element) => ({ label: text(element), href: element?.getAttribute('href') || null });
  const style = (element) => {
    if (!element) return null;
    const computed = getComputedStyle(element);
    return Object.fromEntries(properties.map((property) => [property, computed[property]]));
  };
  const links = (selector, root = document) => [...root.querySelectorAll(selector)].filter(visible).map(link);
  const source = target === 'source';
  const header = source ? document.querySelector('header#pxl-header-elementor') : document.querySelector('[data-shared-header]');
  const footer = source ? document.querySelector('footer#pxl-footer-elementor') : document.querySelector('[data-shared-footer]');
  const mobileDrawer = source ? document.querySelector('.pxl-header-menu') : document.querySelector('.rk-drawer');
  const topbar = source ? document.querySelector('.elementor-element-47be13c') : document.querySelector('.rk-topbar');
  const logo = source
    ? (document.querySelector('#pxl-header-elementor .pxl-logo img') || document.querySelector('#pxl-header-mobile img'))
    : document.querySelector('.rk-brand img');
  const primaryElements = source
    ? [...document.querySelectorAll('#menu-menu-main > li > a')]
    : [...document.querySelectorAll('.rk-nav > .rk-nav__link, .rk-nav__services > .rk-nav__toggle')];
  const dropdownElements = source
    ? [...document.querySelectorAll('#menu-menu-main > li:nth-child(2) .sub-menu > li > a')]
    : [...document.querySelectorAll('.rk-dropdown > li > a')];
  const mobilePrimary = source
    ? [...document.querySelectorAll('#menu-menu-main-2 > li > a')]
    : [...document.querySelectorAll('.rk-mobile-nav > li > a, .rk-mobile-nav > li > .rk-mobile-nav__row > a')];
  const mobileSubmenu = source
    ? [...document.querySelectorAll('#menu-menu-main-2 > li:nth-child(2) .sub-menu > li > a')]
    : [...document.querySelectorAll('.rk-mobile-submenu > li > a')];
  const cta = source
    ? [...header.querySelectorAll('a')].find((item) => /get a quote/i.test(text(item)))
    : header.querySelector('.rk-header-cta');
  const topbarItems = topbar ? [
    ...[...topbar.querySelectorAll('p')].filter(visible).slice(0, 1).map((item) => ({ kind: 'text', label: text(item), href: null })),
    ...[...topbar.querySelectorAll('a')].filter(visible).map((item) => ({ kind: 'link', ...link(item) })),
  ] : [];
  const footerHeadings = footer ? [...footer.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map(text) : [];
  const footerLinks = footer ? [...footer.querySelectorAll('a')].filter(visible).map(link) : [];
  const footerLogo = source
    ? ([...footer?.querySelectorAll('img') || []].find((image) => /rk-reno-solutions-logo/i.test(image.getAttribute('src') || '')) || footer?.querySelector('img'))
    : footer?.querySelector('.rk-footer__brand img');
  const newsletter = footer?.querySelector('form');
  const fixedActions = [...document.querySelectorAll('a[href^="tel:"],a[href*="wa.me"],a[href*="whatsapp"]')]
    .filter((element) => {
      if (!visible(element)) return false;
      const position = getComputedStyle(element).position;
      return position === 'fixed' || element.closest('[data-shared-contact-actions]');
    }).map((element) => ({ ...link(element), box: box(element), position: getComputedStyle(element).position }));
  const components = {
    body: document.body,
    topbar,
    header,
    logo,
    navigation: source ? document.querySelector('#menu-menu-main') : document.querySelector('.rk-nav'),
    dropdown: source ? document.querySelector('#menu-menu-main .sub-menu') : document.querySelector('.rk-dropdown'),
    cta,
    mobileHeader: source ? document.querySelector('#pxl-header-mobile') : document.querySelector('.rk-mobilebar'),
    drawer: mobileDrawer,
    h1: document.querySelector('main h1'),
    h2: document.querySelector('main h2'),
    paragraph: document.querySelector('main p'),
    button: document.querySelector('main a[class*="btn"],main a[class*="button"],main button'),
    footer,
    footerHeading: footer?.querySelector('h2,h3,h4'),
    footerLink: footer?.querySelector('a'),
    newsletter,
    floatingControl: fixedActions.length ? document.querySelector('a[href^="tel:"],a[href*="wa.me"]') : null,
  };
  return {
    inventory: {
      topbarItems,
      logo: { src: logo?.getAttribute('src') || null, alt: logo?.getAttribute('alt') || '', box: box(logo) },
      primaryMenu: primaryElements.map((element) => ({ label: text(element), href: element.tagName === 'BUTTON' ? '#' : element.getAttribute('href') })),
      dropdownLabel: primaryElements.find((element) => /services/i.test(text(element))) ? 'Services' : null,
      dropdownItems: dropdownElements.map(link),
      cta: cta ? link(cta) : null,
      mobileMenu: mobilePrimary.map(link),
      mobileSubmenu: mobileSubmenu.map(link),
      mobileContactActions: mobileDrawer ? links('a[href^="tel:"],a[href*="wa.me"]', mobileDrawer) : [],
      visibleNavLandmarks: [...document.querySelectorAll('nav')].filter(visible).length,
      footer: {
        logo: { src: footerLogo?.getAttribute('src') || null, alt: footerLogo?.getAttribute('alt') || '', box: box(footerLogo) },
        description: text(source ? footer?.querySelector('h2,h3,h4') : footer?.querySelector('.rk-footer__brand h2')),
        headings: footerHeadings,
        links: footerLinks,
        addressText: text(source
          ? [...footer?.querySelectorAll('h3,h4') || []].find((item) => /company address/i.test(text(item)))?.closest('.e-con')
          : footer?.querySelector('.rk-footer__address')),
        newsletter: newsletter ? {
          heading: text(newsletter.closest('div')?.querySelector('h2,h3,h4')),
          fields: [...newsletter.querySelectorAll('input,select,textarea')].map((field) => ({ type: field.type || field.tagName.toLowerCase(), name: field.name || '', placeholder: field.placeholder || '' })),
          button: text(newsletter.querySelector('button,input[type="submit"]')),
          action: newsletter.getAttribute('action') || '',
        } : null,
        copyright: text([...footer?.querySelectorAll('p') || []].find((item) => /copyright/i.test(text(item)))),
      },
      floatingActions: fixedActions,
    },
    styles: Object.fromEntries(Object.entries(components).map(([name, element]) => [name, { computed: style(element), box: box(element), selectorFound: Boolean(element) }])),
    page: { url: location.href, title: document.title, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth },
  };
};

export const extractEvidence = async (page, target) => {
  const raw = await page.evaluate(extractionFunction, { target, properties: styleProperties });
  const normalizeLabel = (value) => (value || '')
    .replace(/^[^\p{L}\p{N}+]+/u, '')
    .replace(/[^\p{L}\p{N})]+$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizeLink = (item) => item ? {
    ...item,
    label: normalizeLabel(item.label),
    href: normalizeDestination(item.href, target),
  } : item;
  const inventory = raw.inventory;
  inventory.topbarItems = inventory.topbarItems.map(normalizeLink);
  inventory.primaryMenu = inventory.primaryMenu.map(normalizeLink);
  inventory.dropdownItems = inventory.dropdownItems.map(normalizeLink);
  inventory.cta = normalizeLink(inventory.cta);
  inventory.mobileMenu = inventory.mobileMenu.map(normalizeLink);
  inventory.mobileSubmenu = inventory.mobileSubmenu.map(normalizeLink);
  inventory.mobileContactActions = inventory.mobileContactActions.map(normalizeLink);
  inventory.footer.links = inventory.footer.links.map(normalizeLink);
  inventory.floatingActions = inventory.floatingActions.map(normalizeLink);
  return raw;
};
