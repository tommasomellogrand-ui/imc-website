import { freeze, requireValue } from '../utilities/contract.js';
/** The single creative contract. Guardrails are review gates, not twelve subsystems. */
export const creativeFreedom = freeze({
  id: 'CREATIVE_FREEDOM', version: 1,
  guardrails: {
    goldenMaster: 'Approved experiences are acceptance tests; no degradation to fit the platform.',
    semantics: 'Models define data, states, actions and accessibility, never DOM, geometry or skin.',
    composition: 'Package owns full Home/detail order, scale, grouping, pacing, rails and disclosure.',
    signatures: 'First-class package registration; no world branching or internal patching.',
    theme: 'Typography, spacing, shape, borders, materials, depth, surfaces, icons, charts, imagery, density, status and creative tokens.',
    motion: 'Package owns easing, reveal, transition metaphor and emphasis; Core owns lifecycle and accessibility safety.',
    responsive: 'Package may use independent compositions at each breakpoint with capability parity.',
    editorial: 'Hero, archive, match storytelling, interruptions, photography scale and pacing remain package-owned.',
    assets: 'Package owns assets and art direction; common loading/fallback/accessibility semantics only.',
    primaryContext: 'Selection is information logic separated from rendering; no mandatory Top-4 visual component.',
    informationFloor: 'Required information is a floor, not an ordered complete layout.',
    newWorld: 'A radically different synthetic package must register without changing Core.'
  },
  packageOwnership: ['compositions','renderers','signatures','theme','motion','assets','responsive','editorial'],
  forbidden: ['core-patching','data-boundary-bypass','route-redefinition','local-ranking-algorithm','shared-behavior-fork'],
  review: { baselineRequired: true, perceptualApproval: 'Creative Direction', pixelEqualityAloneSufficient: false }
});
export function validateCreativePackage(pkg) {
  requireValue(pkg?.creativeContractVersion === creativeFreedom.version, 'Creative contract version mismatch');
  for (const key of creativeFreedom.packageOwnership) requireValue(Object.hasOwn(pkg, key), `Missing creative ownership: ${key}`);
  for (const key of ['dom','layout','skin']) requireValue(!Object.hasOwn(pkg.semanticOverrides || {}, key), `Visual template in semantic contract: ${key}`);
  return pkg;
}
