export const STATUS = Object.freeze({
  match: 'MATCH',
  difference: 'DIFFERENCE',
  notApplicable: 'NOT_APPLICABLE',
  sourceNondeterministic: 'SOURCE_NONDETERMINISTIC',
});

export const statusFromDifferences = (differences, options = {}) => {
  if (options.notApplicable) return STATUS.notApplicable;
  if (options.sourceNondeterministic) return STATUS.sourceNondeterministic;
  return differences.length === 0 ? STATUS.match : STATUS.difference;
};

export const compareOrdered = (source, staging, field) => {
  const differences = [];
  const length = Math.max(source.length, staging.length);
  for (let index = 0; index < length; index += 1) {
    if (source[index] === undefined) {
      differences.push({ field, kind: 'extra-staging', index, staging: staging[index] });
    } else if (staging[index] === undefined) {
      differences.push({ field, kind: 'missing-staging', index, source: source[index] });
    } else if (JSON.stringify(source[index]) !== JSON.stringify(staging[index])) {
      differences.push({ field, kind: 'value-or-order', index, source: source[index], staging: staging[index] });
    }
  }
  return differences;
};

export const compareObject = (source, staging, field) => {
  const differences = [];
  for (const key of new Set([...Object.keys(source || {}), ...Object.keys(staging || {})])) {
    if (JSON.stringify(source?.[key]) !== JSON.stringify(staging?.[key])) {
      differences.push({ field: `${field}.${key}`, kind: 'value', source: source?.[key], staging: staging?.[key] });
    }
  }
  return differences;
};
