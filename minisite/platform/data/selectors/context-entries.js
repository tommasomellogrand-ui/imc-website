import { requireValue } from '../../utilities/contract.js';
/** Fixed set order is owned by the package; this never ranks countries. */
export function fixedContextSet(entries, primaryIds = entries.map(e => e.contextId).slice(0, 4)) {
  requireValue(Array.isArray(entries) && entries.length > 0, 'Context entries required');
  const ids = entries.map(e => e.contextId);
  requireValue(ids.every(id => typeof id === 'string' && id.length > 0) && new Set(ids).size === ids.length, 'Context IDs must be unique');
  requireValue(entries.every(e => typeof e.label === 'string' && e.label.length > 0), 'Context labels required');
  requireValue(primaryIds.length <= 4 && new Set(primaryIds).size === primaryIds.length && primaryIds.every(id => ids.includes(id)), 'Invalid primary context set');
  requireValue(primaryIds.length === Math.min(4, entries.length), 'Primary set must contain four entries when possible');
  const complete = structuredClone(entries);
  return { primary: primaryIds.map(id => complete.find(e => e.contextId === id)), complete };
}
