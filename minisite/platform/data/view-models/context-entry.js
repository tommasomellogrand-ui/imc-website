import { validateModel } from '../../contracts/components.js';
export function contextEntry(entry, sourceState, destination) {
  return validateModel('contextEntry', {
    contextId: entry.contextId, label: entry.label, sourceState,
    actions: [{ type: 'navigate', route: destination, context: { id: entry.contextId } }],
    accessibleLabel: entry.label
  });
}
