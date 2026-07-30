import { statusFromDifferences } from './result-status.mjs';
import { boxDifferences } from './visual-comparison.mjs';

const ignoredProperties = new Set(['transition', 'transform']);

export const compareStyles = (source, staging, componentNames) => {
  const differences = [];
  const records = [];
  for (const component of componentNames) {
    const sourceValue = source.computedStyles[component];
    const stagingValue = staging.computedStyles[component];
    const componentDifferences = [];
    if (!sourceValue?.selectorFound || !stagingValue?.selectorFound) {
      componentDifferences.push({ field: component, kind: 'selector-missing', sourceFound: sourceValue?.selectorFound, stagingFound: stagingValue?.selectorFound });
    } else {
      componentDifferences.push(...boxDifferences(sourceValue.box, stagingValue.box, `${component}.box`));
      for (const property of new Set([...Object.keys(sourceValue.computed || {}), ...Object.keys(stagingValue.computed || {})])) {
        if (ignoredProperties.has(property)) continue;
        if (sourceValue.computed?.[property] !== stagingValue.computed?.[property]) {
          componentDifferences.push({
            field: `${component}.${property}`,
            kind: 'computed-style',
            source: sourceValue.computed?.[property],
            staging: stagingValue.computed?.[property],
          });
        }
      }
    }
    differences.push(...componentDifferences);
    records.push({ component, source: sourceValue, staging: stagingValue, differences: componentDifferences });
  }
  return { status: statusFromDifferences(differences), differences, records };
};
