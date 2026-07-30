import { compareObject, compareOrdered, statusFromDifferences } from './result-status.mjs';

const assetKey = (value) => {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('rk-reno-solutions-logo')) return 'rk-reno-solutions-logo';
  return normalized.split('/').pop()?.replace(/-[a-f0-9]{8}(?=\.)/, '') || '';
};

const logoComparable = (logo) => ({ assetKey: assetKey(logo?.src), alt: logo?.alt || '' });
const duplicates = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = JSON.stringify(item);
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
};

export const compareHeaderSemantic = ({ sourceDesktop, stagingDesktop, sourceMobile, stagingMobile }) => {
  const source = sourceDesktop.inventory;
  const staging = stagingDesktop.inventory;
  const differences = [
    ...compareOrdered(source.topbarItems, staging.topbarItems, 'topbarItems'),
    ...compareObject(logoComparable(source.logo), logoComparable(staging.logo), 'logo'),
    ...compareOrdered(source.primaryMenu, staging.primaryMenu, 'primaryMenu'),
    ...compareOrdered(source.dropdownItems, staging.dropdownItems, 'dropdownItems'),
    ...compareObject(source.cta || {}, staging.cta || {}, 'cta'),
    ...compareOrdered(sourceMobile.inventory.mobileMenu, stagingMobile.inventory.mobileMenu, 'mobileMenu'),
    ...compareOrdered(sourceMobile.inventory.mobileSubmenu, stagingMobile.inventory.mobileSubmenu, 'mobileSubmenu'),
    ...compareOrdered(sourceMobile.inventory.mobileContactActions, stagingMobile.inventory.mobileContactActions, 'mobileContactActions'),
  ];
  for (const [field, items] of [
    ['primaryMenu', staging.primaryMenu],
    ['dropdownItems', staging.dropdownItems],
    ['mobileMenu', stagingMobile.inventory.mobileMenu],
    ['mobileSubmenu', stagingMobile.inventory.mobileSubmenu],
  ]) {
    const found = duplicates(items);
    if (found.length) differences.push({ field, kind: 'duplicates', staging: found });
  }
  return { status: statusFromDifferences(differences), differences, source, staging };
};

export const compareFooterSemantic = ({ source, staging }) => {
  const sourceFooter = source.inventory.footer;
  const stagingFooter = staging.inventory.footer;
  const newsletterComparable = (value) => value ? {
    fields: value.fields.filter(({ type }) => type !== 'hidden'),
    button: value.button,
    action: value.action.replace(/\?[^#]*/, ''),
  } : null;
  const differences = [
    ...compareObject(logoComparable(sourceFooter.logo), logoComparable(stagingFooter.logo), 'footer.logo'),
    ...compareOrdered(sourceFooter.headings, stagingFooter.headings, 'footer.headings'),
    ...compareOrdered(sourceFooter.links, stagingFooter.links, 'footer.links'),
    ...compareObject(newsletterComparable(sourceFooter.newsletter) || {}, newsletterComparable(stagingFooter.newsletter) || {}, 'footer.newsletter'),
  ];
  if (sourceFooter.description !== stagingFooter.description) {
    differences.push({ field: 'footer.description', kind: 'value', source: sourceFooter.description, staging: stagingFooter.description });
  }
  const compactText = (value) => (value || '').replace(/\s+/g, '');
  if (compactText(sourceFooter.addressText) !== compactText(stagingFooter.addressText)) {
    differences.push({ field: 'footer.addressText', kind: 'value', source: sourceFooter.addressText, staging: stagingFooter.addressText });
  }
  if (sourceFooter.copyright !== stagingFooter.copyright) {
    differences.push({ field: 'footer.copyright', kind: 'value', source: sourceFooter.copyright, staging: stagingFooter.copyright });
  }
  differences.push(...compareOrdered(duplicates(sourceFooter.links), duplicates(stagingFooter.links), 'footer.linkDuplicates'));
  return { status: statusFromDifferences(differences), differences, source: sourceFooter, staging: stagingFooter };
};
