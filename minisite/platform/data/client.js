import { requireValue } from '../utilities/contract.js';
import { sourceState } from './source-state.js';
/** No endpoint, credentials, DB knowledge or side effects are built into the platform. */
export function createDataBoundary(read) {
  requireValue(typeof read === 'function', 'Read adapter required');
  return Object.freeze({ async read(resource, { signal, cursor = null, context = {} } = {}) {
    requireValue(typeof resource === 'string' && resource.length > 0, 'Resource required');
    signal?.throwIfAborted();
    const result = await read({ resource, signal, cursor, context: structuredClone(context) });
    signal?.throwIfAborted();
    requireValue(result && Array.isArray(result.rows) && result.sourceState, 'Adapter must return rows and sourceState');
    return { rows: structuredClone(result.rows), sourceState: sourceState(result.sourceState.status, result.sourceState), nextCursor: result.nextCursor ?? null };
  }});
}
