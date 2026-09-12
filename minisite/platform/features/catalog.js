import { freeze } from '../utilities/contract.js';
/** Declarations only: no extracted feature runtime in Phase 1. */
export const featureCatalog = freeze({
  archive: { routes: ['archive'], ownership: 'package-editorial-composition' },
  'territory-map': { routes: ['territory-map'], ownership: 'package-signature-renderer' },
  rivalries: { routes: ['rivalries'], ownership: 'package-editorial-composition' }
});
