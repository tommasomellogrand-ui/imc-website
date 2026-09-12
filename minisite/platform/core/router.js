import { requireValue } from '../utilities/contract.js';
/** Pure route codec. Wiring listeners/history to live pages belongs to the adapter CASE. */
export function createRouteCodec({ basePath, routes }) {
  requireValue(basePath?.startsWith('/') && basePath.endsWith('/'), 'Absolute directory basePath required');
  const names = Object.keys(routes);
  const paths = names.map(id => routes[id].path);
  requireValue(new Set(paths).size === paths.length && paths.every(p => /^[a-z0-9-]+\.html$/i.test(p)), 'Unique local HTML paths required');
  return Object.freeze({
    parse(href) {
      const url = new URL(href, 'https://minisite.invalid');
      const path = url.pathname === basePath ? 'index.html' : url.pathname.startsWith(basePath) ? url.pathname.slice(basePath.length) : null;
      const route = names.find(id => routes[id].path === path);
      if (!route) return { route: 'not-found', params: {}, hash: url.hash };
      const params = {};
      for (const key of routes[route].query || []) if (url.searchParams.has(key)) params[key] = url.searchParams.get(key);
      return { route, params, hash: url.hash };
    },
    serialize({ route, params = {}, hash = '' }) {
      requireValue(Object.hasOwn(routes, route), `Unknown route: ${route}`);
      const query = new URLSearchParams();
      for (const key of routes[route].query || []) if (params[key] != null) query.set(key, String(params[key]));
      const url = new URL(basePath + routes[route].path, 'https://minisite.invalid');
      url.search = query.toString();
      url.hash = hash;
      return url.pathname + url.search + url.hash;
    }
  });
}
