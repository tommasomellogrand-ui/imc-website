import { requireValue } from '../utilities/contract.js';
/** Normalize only declared dimensions, with optional parent-dependent value sets. */
export function normalizeContext(input, dimensions) {
  const result = {};
  for (const dimension of dimensions) {
    const allowed = typeof dimension.values === 'function' ? dimension.values(result) : dimension.values;
    requireValue(Array.isArray(allowed), 'Dimension values required');
    if (allowed.includes(input?.[dimension.key])) result[dimension.key] = input[dimension.key];
  }
  return result;
}
export function switchContext({ route, context }, next, family, dimensions) {
  return { route: family.contextRoutes.includes(route) ? route : family.fallbackRoute, context: normalizeContext({ ...context, ...next }, dimensions) };
}
