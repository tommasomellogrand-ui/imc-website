import { createRegistry } from './registry.js';
import { createRegistries } from './registries.js';
import { validateDeclaration } from './declaration.js';
import { createRouteCodec } from './router.js';
import { createDataBoundary } from '../data/client.js';
import { validateCreativePackage } from '../contracts/creative-freedom.contract.js';
/** Explicit, side-effect-free assembly. No DOM, event listeners, fetch or global state. */
export function createPlatform({ declaration, families, routeMap, read, creativePackage }) {
  const familyRegistry = createRegistry();
  for (const family of families) familyRegistry.register(family.id, family);
  const family = validateDeclaration(declaration, familyRegistry);
  validateCreativePackage(creativePackage);
  return Object.freeze({
    family,
    router: createRouteCodec(routeMap),
    data: createDataBoundary(read),
    registries: createRegistries(),
    navigation: route => family.navigation.primary.map(id => ({ id, active: id === route, available: Object.hasOwn(routeMap.routes,id) }))
  });
}
