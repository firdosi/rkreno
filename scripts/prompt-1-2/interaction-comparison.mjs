import { statusFromDifferences } from './result-status.mjs';
import { boxDifferences } from './visual-comparison.mjs';

const valueDifference = (differences, field, source, staging) => {
  if (JSON.stringify(source) !== JSON.stringify(staging)) {
    differences.push({ field, kind: 'interaction', source, staging });
  }
};

export const compareDesktopInteraction = (source, staging) => {
  const differences = [];
  for (const field of ['hoverOpen', 'escapeClosed', 'keyboardOpen', 'itemCount']) {
    valueDifference(differences, `dropdown.${field}`, source.interaction.dropdown?.[field], staging.interaction.dropdown?.[field]);
  }
  differences.push(...boxDifferences(source.interaction.dropdown?.hoverState?.box, staging.interaction.dropdown?.hoverState?.box, 'dropdown.box'));
  valueDifference(differences, 'dropdown.transition', source.interaction.dropdown?.hoverState?.transition, staging.interaction.dropdown?.hoverState?.transition);
  return { status: statusFromDifferences(differences), differences, source: source.interaction.dropdown, staging: staging.interaction.dropdown };
};

export const compareStickyInteraction = (source, staging) => {
  const differences = [];
  valueDifference(differences, 'sticky.threshold', source.interaction.stickyThreshold?.threshold, staging.interaction.stickyThreshold?.threshold);
  valueDifference(differences, 'sticky.topbarVisible', source.interaction.sticky?.topbarVisible, staging.interaction.sticky?.topbarVisible);
  valueDifference(differences, 'sticky.backgroundColor', source.interaction.sticky?.header?.backgroundColor, staging.interaction.sticky?.header?.backgroundColor);
  valueDifference(differences, 'sticky.boxShadow', source.interaction.sticky?.header?.boxShadow, staging.interaction.sticky?.header?.boxShadow);
  valueDifference(differences, 'sticky.mainLayoutShift', source.interaction.sticky?.mainLayoutShift, staging.interaction.sticky?.mainLayoutShift);
  valueDifference(differences, 'sticky.returnScrollY', source.interaction.returnToTop?.scrollY, staging.interaction.returnToTop?.scrollY);
  differences.push(...boxDifferences(source.interaction.initial?.header?.box, staging.interaction.initial?.header?.box, 'sticky.initialHeader'));
  differences.push(...boxDifferences(source.interaction.sticky?.header?.box, staging.interaction.sticky?.header?.box, 'sticky.scrolledHeader'));
  differences.push(...boxDifferences(source.interaction.initial?.logo?.box, staging.interaction.initial?.logo?.box, 'sticky.initialLogo'));
  differences.push(...boxDifferences(source.interaction.sticky?.logo?.box, staging.interaction.sticky?.logo?.box, 'sticky.scrolledLogo'));
  return { status: statusFromDifferences(differences), differences, source: source.interaction.sticky, staging: staging.interaction.sticky };
};

export const compareMobileInteraction = (source, staging) => {
  const differences = [];
  for (const field of ['open', 'escapeClosed', 'submenuItemCount', 'focusTarget']) {
    valueDifference(differences, `mobileMenu.${field}`, source.interaction.mobileMenu?.[field], staging.interaction.mobileMenu?.[field]);
  }
  const sourceExpanded = String(source.interaction.mobileMenu?.submenuExpanded) === 'true'
    || source.interaction.mobileMenu?.submenuExpanded === null;
  const stagingExpanded = String(staging.interaction.mobileMenu?.submenuExpanded) === 'true';
  valueDifference(differences, 'mobileMenu.submenuExpanded', sourceExpanded, stagingExpanded);
  differences.push(...boxDifferences(source.interaction.mobileMenu?.drawer?.box, staging.interaction.mobileMenu?.drawer?.box, 'mobileMenu.drawer'));
  valueDifference(differences, 'mobileMenu.overlayBackground', source.interaction.mobileMenu?.overlay?.backgroundColor, staging.interaction.mobileMenu?.overlay?.backgroundColor);
  const lock = (value) => Object.values(value || {}).some((item) => /hidden/.test(item));
  valueDifference(differences, 'mobileMenu.scrollLock', lock(source.interaction.mobileMenu?.bodyOverflow), lock(staging.interaction.mobileMenu?.bodyOverflow));
  return { status: statusFromDifferences(differences), differences, source: source.interaction.mobileMenu, staging: staging.interaction.mobileMenu };
};

export const compareFooterInteraction = (source, staging) => {
  const differences = [];
  const action = (value) => value?.replace(/\?[^#]*/, '');
  valueDifference(differences, 'footer.newsletter.action', action(source.inventory.footer.newsletter?.action), action(staging.inventory.footer.newsletter?.action));
  const visibleFields = (value) => value?.fields?.filter(({ type }) => type !== 'hidden').length;
  valueDifference(differences, 'footer.newsletter.fieldCount', visibleFields(source.inventory.footer.newsletter), visibleFields(staging.inventory.footer.newsletter));
  valueDifference(differences, 'footer.newsletter.button', source.inventory.footer.newsletter?.button, staging.inventory.footer.newsletter?.button);
  return { status: statusFromDifferences(differences), differences };
};

export const compareFloatingActions = (source, staging) => {
  const sourceActions = source.inventory.floatingActions;
  const stagingActions = staging.inventory.floatingActions;
  const differences = [];
  valueDifference(differences, 'floatingActions.count', sourceActions.length, stagingActions.length);
  const length = Math.max(sourceActions.length, stagingActions.length);
  for (let index = 0; index < length; index += 1) {
    valueDifference(differences, `floatingActions.${index}.href`, sourceActions[index]?.href, stagingActions[index]?.href);
    differences.push(...boxDifferences(sourceActions[index]?.box, stagingActions[index]?.box, `floatingActions.${index}.box`));
  }
  return { status: statusFromDifferences(differences), differences, source: sourceActions, staging: stagingActions };
};
