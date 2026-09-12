import { freeze, requireValue } from '../utilities/contract.js';
import { coreBehavior } from './core-behavior.contract.js';
/** Keys define minimum semantic information, not visual sequence. Null means unavailable, never zero. */
export const components = freeze({
  match: { required: ['fixtureId','competition','context','home','away','dateTime','status','score','sourceState','actions','accessibleLabel'], optional: ['penalties','aggregate','managers','players','events','stats','reportState'] },
  competition: { required: ['id','label','context','capabilities','sourceState','actions','accessibleLabel'], optional: ['division','stage','round'] },
  standings: { required: ['competition','context','rows','rankingMeaning','sourceState','actions','accessibleLabel'], optional: ['tieBreak','asOf'] },
  contextEntry: { required: ['contextId','label','sourceState','actions','accessibleLabel'], optional: ['rank','activeManagerCount'] }
});
export function validateModel(kind, model) {
  const contract = components[kind];
  requireValue(contract && model && typeof model === 'object', `Unknown model: ${kind}`);
  for (const key of contract.required) requireValue(Object.hasOwn(model, key), `${kind}.${key} missing`);
  requireValue(coreBehavior.data.states.includes(model.sourceState?.status), 'Invalid source state');
  requireValue(Array.isArray(model.actions), 'Actions must be semantic action descriptors');
  requireValue(typeof model.accessibleLabel === 'string' && model.accessibleLabel.trim(), 'Accessible label required');
  for (const key of ['html','markup','css','layout','skin']) requireValue(!Object.hasOwn(model, key), `Visual property in semantic model: ${key}`);
  return model;
}
