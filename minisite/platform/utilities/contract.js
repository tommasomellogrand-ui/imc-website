/** Versioned contracts are immutable data, never visual templates. */
export function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
export function requireValue(condition, message) {
  if (!condition) throw new TypeError(message);
}
