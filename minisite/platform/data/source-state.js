import { coreBehavior } from '../contracts/core-behavior.contract.js';
import { freeze, requireValue } from '../utilities/contract.js';
export function sourceState(status, { provenance = null, asOf = null, reason = null } = {}) {
  requireValue(coreBehavior.data.states.includes(status), `Unknown data state: ${status}`);
  return freeze({ status, provenance, asOf, reason });
}
