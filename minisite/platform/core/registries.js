import { createRegistry } from './registry.js';
import { requireValue } from '../utilities/contract.js';
import { components, validateModel } from '../contracts/components.js';
export function createRegistries() {
  const capabilities = createRegistry(c => requireValue(Array.isArray(c.routes), 'Capability routes required'));
  const renderers = createRegistry(r => {
    requireValue(typeof r.render === 'function' && typeof r.owner === 'string', 'Renderer and owner required');
    requireValue(r.semanticKind == null || Object.hasOwn(components, r.semanticKind), 'Unknown renderer semantic kind');
  });
  const extensions = createRegistry(e => requireValue(typeof e.mount === 'function', 'Extension mount required'));
  return Object.freeze({ capabilities, renderers, extensions,
    render(id, model) { const r = renderers.get(id); if (r.semanticKind) validateModel(r.semanticKind, model); return r.render(model); },
    mount(api) {
      const cleanup = [];
      try { for (const id of extensions.ids()) { const dispose = extensions.get(id).mount(api); if (typeof dispose === 'function') cleanup.push(dispose); } }
      catch (error) { cleanup.reverse().forEach(fn => fn()); throw error; }
      let disposed = false;
      return () => { if (!disposed) { disposed = true; cleanup.reverse().forEach(fn => fn()); } };
    }
  });
}
