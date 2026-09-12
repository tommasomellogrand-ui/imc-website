import { requireValue } from '../utilities/contract.js';
/** Family lookup is injected. Core has no world/family branches. */
export function validateDeclaration(declaration, families) {
  const family = families.get(declaration.family);
  requireValue(declaration.contractVersion === family.version, 'Family version mismatch');
  requireValue(family.contextTypes.includes(declaration.context?.type), 'Unsupported context type');
  requireValue(Array.isArray(declaration.capabilities), 'Capabilities required');
  for (const id of family.requiredCapabilities) requireValue(declaration.capabilities.includes(id), `Missing capability: ${id}`);
  if (family.primaryContext) requireValue(family.primaryContext.providers.includes(declaration.primaryContext?.provider), 'Context provider required');
  return family;
}
