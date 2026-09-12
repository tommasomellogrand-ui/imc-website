import { freeze } from '../../utilities/contract.js';
import { singleFamily } from '../single/contract.js';
export const multiGoldFamily = freeze({
  id: 'MULTI_GOLD', version: 1,
  routes: [...singleFamily.routes,'context-index','context-detail','division-detail'],
  hierarchy: ['WORLD','DECLARED_CONTEXT','DIVISION_OR_COMPETITION','DETAIL'],
  contextTypes: ['COUNTRY','TERRITORY'], fallbackRoute: 'context-detail',
  contextRoutes: ['context-detail','division-detail','competition','results','schedule','standings','match','clubs','club','managers','manager','players','player','transfers'],
  navigation: { primary: ['home','context-index','competitions','results','schedule','standings'], mobile: ['home','results','schedule','standings','more'], placement: 'consistent-primary-navigation-area', secondary: 'full-menu', contextSelector: 'always-reachable-without-hidden-gestures', renderer: 'package-owned' },
  requiredCapabilities: ['contexts','competitions','results','schedule','standings','match'],
  optionalCapabilities: ['territory-map','rivalries'],
  primaryContext: { maxPrimary: 4, completeSetAlwaysAvailable: true, providers: ['FIXED_CONTEXT_SET','RANKED_ACTIVE_MANAGER_COUNTRIES'], rankedProviderStatus: 'deferred-until-authoritative-data-contract' },
  informationFloor: ['world-identity','active-context-before-content','competition-scope','source-state','complete-context-access'],
  behavior: { context: 'URL-preserved', switch: 'keep-compatible-route-otherwise-declared-fallback', primarySelection: 'data-logic-not-visual-component' }
});
