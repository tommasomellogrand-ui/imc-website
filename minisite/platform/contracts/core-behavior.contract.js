import { freeze } from '../utilities/contract.js';
export const coreBehavior = freeze({
  id: 'CORE_BEHAVIOR', version: 1,
  routing: { sourceOfTruth: 'URL', unknown: 'not-found', history: 'native-back-forward', format: 'package-owned-path-and-query-map', restore: 'parse-on-entry-and-popstate' },
  navigation: { binding: 'registered-family', active: 'canonical-route-id', focus: 'main-after-client-navigation', keyboard: 'native-links-and-controls', origin: 'preserve-when-valid' },
  context: { dimensions: 'declarative', serialize: 'URL', validate: 'allowed-values', inherit: 'compatible-routes-only', invalid: 'omit', switchFallback: 'family-declared' },
  data: { access: 'injected-read-only-adapter', states: ['loading','ready','empty','error','not-found','stale','degraded'], cancel: 'AbortSignal', cache: 'no-implicit-cache', pagination: 'adapter-owned-cursor', source: 'explicit-provenance', normalization: 'view-model-boundary' },
  state: { shareable: 'URL', ephemeral: 'instance-local', hiddenGlobals: false },
  accessibility: { landmarks: ['main','navigation'], focus: 'visible-and-restorable', labels: 'accessible-names-required', motion: 'respect-prefers-reduced-motion', touchTargetCssPx: 44, overflow: 'no-page-overflow; named-scroll-regions-allowed' },
  extension: { public: ['capabilities','renderers','extensions'], internalPatching: false, lifecycle: ['mount','unmount'], cleanup: 'reverse-registration-order' },
  regression: { versioning: 'breaking-change-requires-contract-version', acceptance: 'behavior-and-creative-golden-master', liveIntegration: false }
});
