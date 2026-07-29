const stable = (value) => JSON.stringify(value);

const counts = (items) => {
  const result = new Map();
  for (const item of items) {
    const key = stable(item);
    result.set(key, { item, count: (result.get(key)?.count || 0) + 1 });
  }
  return result;
};

export function sequenceDifference(source = [], target = []) {
  const sourceCounts = counts(source);
  const targetCounts = counts(target);
  const missing = [];
  const extra = [];
  for (const [key, value] of sourceCounts) {
    const amount = value.count - (targetCounts.get(key)?.count || 0);
    for (let index = 0; index < amount; index += 1) missing.push(value.item);
  }
  for (const [key, value] of targetCounts) {
    const amount = value.count - (sourceCounts.get(key)?.count || 0);
    for (let index = 0; index < amount; index += 1) extra.push(value.item);
  }
  const reordered = missing.length === 0 && extra.length === 0
    && source.map(stable).some((value, index) => value !== stable(target[index]));
  return { missing, extra, reordered };
}

export const scalarDifference = (source, target) => (
  stable(source) === stable(target) ? null : { source, target }
);

export const hasDifference = (value) => {
  if (value == null || value === false) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};
