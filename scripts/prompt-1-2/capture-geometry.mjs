import sharp from 'sharp';
import { rename, unlink } from 'node:fs/promises';

const roundRect = (box) => box ? {
  x: Math.max(0, Math.floor(box.x)),
  y: Math.max(0, Math.floor(box.y)),
  width: Math.max(1, Math.ceil(box.width)),
  height: Math.max(1, Math.ceil(box.height)),
} : null;

const visibleElement = async (locator) => locator.evaluateAll((elements) => {
  const index = elements.findIndex((candidate) => {
    const style = getComputedStyle(candidate);
    const box = candidate.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden'
      && Number(style.opacity) > 0 && box.width > 0 && box.height > 0;
  });
  if (index < 0) return null;
  const element = elements[index];
  const box = element.getBoundingClientRect();
  return { index, box: { x: box.x, y: box.y, width: box.width, height: box.height } };
});

const captureRecord = async (page, output, selector, rectangle, captured, extra = {}) => ({
  captured,
  path: output,
  targetSelector: selector,
  boundingRectangle: rectangle,
  scrollPosition: await page.evaluate(() => ({ x: scrollX, y: scrollY })),
  capturedAt: new Date().toISOString(),
  ...extra,
});

const normalizeScreenshotBounds = async (output, box) => {
  const metadata = await sharp(output).metadata();
  let image = sharp(output);
  const normalizedWidth = Math.min(metadata.width, box.width);
  const normalizedHeight = Math.min(metadata.height, box.height);
  if (metadata.width > box.width || metadata.height > box.height) {
    image = image.extract({
      left: 0,
      top: 0,
      width: normalizedWidth,
      height: normalizedHeight,
    });
  }
  if (normalizedWidth < box.width || normalizedHeight < box.height) {
    image = image.extend({
      right: box.width - normalizedWidth,
      bottom: box.height - normalizedHeight,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    });
  }
  const temporary = `${output}.normalized.png`;
  await image.png().toFile(temporary);
  await unlink(output);
  await rename(temporary, output);
};

export const captureElement = async (page, selector, output, screenshotOptions = {}) => {
  const locator = page.locator(selector);
  const match = await visibleElement(locator);
  const box = roundRect(match?.box);
  if (!box) return captureRecord(page, output, selector, null, false);
  await locator.nth(match.index).screenshot({
    path: output,
    animations: 'disabled',
    ...screenshotOptions,
  });
  await normalizeScreenshotBounds(output, box);
  return captureRecord(page, output, selector, box, true);
};

export const captureIsolatedFooter = async (page, selector, output) => {
  const snapshot = await page.evaluate((footerSelector) => {
    const footer = document.querySelector(footerSelector);
    const hidden = [...document.querySelectorAll(
      'header, .skip-link, .staging-banner, .pxl-scroll-top, [data-shared-contact-actions]',
    )];
    const records = hidden.map((element) => ({
      element,
      style: element.getAttribute('style'),
    }));
    let footerBranch = footer;
    while (footerBranch?.parentElement) {
      for (const sibling of footerBranch.parentElement.children) {
        if (sibling === footerBranch || /^(SCRIPT|STYLE|LINK)$/.test(sibling.tagName)) continue;
        if (!records.some(({ element }) => element === sibling)) {
          records.push({ element: sibling, style: sibling.getAttribute('style') });
        }
      }
      footerBranch = footerBranch.parentElement;
      if (footerBranch === document.body) break;
    }
    const sourceFooterChildren = [...footer?.querySelectorAll(
      '.footer-elementor-inner > .elementor > *',
    ) || []];
    const sourceFooterMain = sourceFooterChildren.find(
      (element) => /company address/i.test(element.textContent || ''),
    );
    const sourceFooterKeep = new Set([
      sourceFooterMain,
      sourceFooterMain?.previousElementSibling,
      sourceFooterChildren.find((element) => /copyright/i.test(element.textContent || '')),
    ].filter(Boolean));
    const sourceFooterSections = sourceFooterChildren.filter(
      (element) => !sourceFooterKeep.has(element),
    );
    for (const element of sourceFooterSections) {
      records.push({ element, style: element.getAttribute('style') });
      element.style.setProperty('display', 'none', 'important');
    }
    for (const { element } of records) element.style.setProperty('visibility', 'hidden', 'important');
    if (footer) {
      records.push({ element: footer, style: footer.getAttribute('style') });
      footer.style.setProperty('position', 'absolute', 'important');
      footer.style.setProperty('top', '0', 'important');
      footer.style.setProperty('right', '0', 'important');
      footer.style.setProperty('bottom', 'auto', 'important');
      footer.style.setProperty('left', '0', 'important');
      footer.style.setProperty('width', '100%', 'important');
      footer.style.setProperty('margin', '0', 'important');
      footer.style.setProperty('transform', 'none', 'important');
      footer.style.setProperty('z-index', '0', 'important');

      const settleStyle = document.createElement('style');
      settleStyle.dataset.prompt12FooterSettle = '';
      settleStyle.textContent = `${footerSelector}, ${footerSelector} * {
        animation: none !important;
        transition: none !important;
      }`;
      document.head.append(settleStyle);
    }
    window.__prompt12FooterIsolation = records;
    return Boolean(footer);
  }, selector);
  if (!snapshot) return captureRecord(page, output, selector, null, false);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(
    () => requestAnimationFrame(resolve),
  )));
  const record = await captureElement(page, selector, output, {
    animations: 'disabled',
  });
  await page.evaluate(() => {
    for (const { element, style } of window.__prompt12FooterIsolation || []) {
      if (style === null) element.removeAttribute('style');
      else element.setAttribute('style', style);
    }
    document.querySelector('[data-prompt12-footer-settle]')?.remove();
    delete window.__prompt12FooterIsolation;
  });
  return { ...record, isolatedFromPageBody: true };
};

export const captureUnion = async (page, selectors, output, padding = 0) => {
  const boxes = (await Promise.all(selectors.map(async (selector) => ({
    selector,
    match: await visibleElement(page.locator(selector)),
  })))).filter(({ match }) => match).map(({ selector, match }) => ({ selector, box: match.box }));
  if (!boxes.length) return captureRecord(page, output, selectors.join(', '), null, false);
  const left = Math.min(...boxes.map(({ box }) => box.x));
  const top = Math.min(...boxes.map(({ box }) => box.y));
  const right = Math.max(...boxes.map(({ box }) => box.x + box.width));
  const bottom = Math.max(...boxes.map(({ box }) => box.y + box.height));
  const rectangle = roundRect({
    x: left - padding,
    y: top - padding,
    width: right - left + (padding * 2),
    height: bottom - top + (padding * 2),
  });
  await page.screenshot({ path: output, clip: rectangle, animations: 'disabled' });
  return captureRecord(page, output, selectors.join(', '), rectangle, true, {
    includedSelectors: boxes.map(({ selector }) => selector),
  });
};

export const captureFloatingRegion = async (page, output) => {
  const result = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll(
      'a[href^="tel:"], a[href*="wa.me"], a[href*="whatsapp"]',
    )].filter((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return (style.position === 'fixed' || element.closest('[data-shared-contact-actions]'))
        && style.display !== 'none' && style.visibility !== 'hidden'
        && Number(style.opacity) > 0 && box.width > 0 && box.height > 0;
    });
    if (!candidates.length) return null;
    const boxes = candidates.map((element) => element.getBoundingClientRect());
    const left = Math.min(...boxes.map((box) => box.left));
    const top = Math.min(...boxes.map((box) => box.top));
    const right = Math.max(...boxes.map((box) => box.right));
    const bottom = Math.max(...boxes.map((box) => box.bottom));
    return {
      x: Math.max(0, left - 12),
      y: Math.max(0, top - 12),
      width: Math.min(innerWidth, right + 12) - Math.max(0, left - 12),
      height: Math.min(innerHeight, bottom + 12) - Math.max(0, top - 12),
      count: candidates.length,
    };
  });
  if (!result) {
    await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    }).png().toFile(output);
    return captureRecord(page, output, 'fixed tel/WhatsApp controls', null, true, {
      applicable: false,
      controlCount: 0,
    });
  }
  const rectangle = roundRect(result);
  await page.screenshot({ path: output, clip: rectangle, animations: 'disabled' });
  return captureRecord(page, output, 'fixed tel/WhatsApp controls', rectangle, true, {
    applicable: true,
    controlCount: result.count,
  });
};
