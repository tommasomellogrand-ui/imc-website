import { requireValue } from '../utilities/contract.js';
/** Small instance-local registry. Duplicate ownership is an error, not an override. */
export function createRegistry(validate = () => {}) {
  const entries = new Map();
  return Object.freeze({
    register(id, value) {
      requireValue(typeof id === 'string' && id.length > 0 && !entries.has(id), `Invalid or duplicate registration: ${id}`);
      validate(value); entries.set(id, value); return value;
    },
    get(id) { requireValue(entries.has(id), `Unregistered: ${id}`); return entries.get(id); },
    has: id => entries.has(id),
    ids: () => [...entries.keys()]
  });
}
