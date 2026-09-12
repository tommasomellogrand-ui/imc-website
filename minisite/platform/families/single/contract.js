import { freeze } from '../../utilities/contract.js';
export const singleFamily = freeze({
  id: 'SINGLE', version: 1,
  routes: ['home','competitions','competition','results','schedule','standings','match','clubs','club','managers','manager','players','player','transfers','archive'],
  hierarchy: ['WORLD','COMPETITION','DIVISION_OR_STAGE','DETAIL'],
  contextTypes: ['COMPETITION'], fallbackRoute: 'home',
  contextRoutes: ['competition','results','schedule','standings','match'],
  navigation: { primary: ['home','competitions','results','schedule','standings'], mobile: ['home','results','schedule','standings','more'], placement: 'consistent-primary-navigation-area', secondary: 'full-menu', renderer: 'package-owned' },
  requiredCapabilities: ['competitions','results','schedule','standings','match'],
  optionalCapabilities: ['archive'],
  informationFloor: ['world-identity','competition-scope','source-state','available-detail-actions'],
  behavior: { country: 'never-artificial', match: 'first-class-from-results-and-schedule', hubs: 'stable-detail-routes', back: 'native-history', context: 'retain-only-when-compatible' }
});
