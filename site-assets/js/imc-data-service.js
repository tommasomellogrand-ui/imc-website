(function (global) {
  'use strict';

  const API_ROOT = '/api/imc-data/v1';

  async function request(path) {
    const response = await fetch(`${API_ROOT}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error('La risposta del servizio dati non è valida.');
    }

    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error(payload?.error?.message || `Servizio dati non disponibile (${response.status}).`);
    }

    return payload;
  }

  function worldPath(gameWorldId) {
    const value = String(gameWorldId || '').toUpperCase();
    if (!/^GW\d{3}$/.test(value)) throw new Error('Game World ID non valido.');
    return `/worlds/${encodeURIComponent(value)}`;
  }

  async function getWorld(gameWorldId, season) {
    const query = season ? `?season=${encodeURIComponent(season)}` : '';
    return request(`${worldPath(gameWorldId)}${query}`);
  }

  async function getMatches(gameWorldId, season, options = {}) {
    const params = new URLSearchParams({ season: String(season) });
    if (options.limit != null) params.set('limit', String(options.limit));
    if (options.offset != null) params.set('offset', String(options.offset));
    return request(`${worldPath(gameWorldId)}/matches?${params}`);
  }

  async function getAllMatches(gameWorldId, season) {
    const limit = 500;
    const first = await getMatches(gameWorldId, season, { limit, offset: 0 });
    const rows = [...first.data];
    const total = Number(first.pagination?.total || rows.length);

    for (let offset = rows.length; offset < total; offset += limit) {
      const page = await getMatches(gameWorldId, season, { limit, offset });
      rows.push(...page.data);
    }

    return {
      ...first,
      data: rows,
      pagination: { ...first.pagination, total, offset: 0, returned: rows.length }
    };
  }

  async function getCompetitions(gameWorldId, season, options = {}) {
    const params = new URLSearchParams({ season: String(season) });
    if (options.group) {
      const group = String(options.group).toLowerCase();
      if (!['domestic', 'international', 'nations'].includes(group)) throw new Error('Competition Group non valido.');
      params.set('group', group);
    }
    return request(`${worldPath(gameWorldId)}/competitions?${params}`);
  }

  async function getManagers(gameWorldId) {
    return request(`${worldPath(gameWorldId)}/managers`);
  }

  async function getClubs(gameWorldId) {
    return request(`${worldPath(gameWorldId)}/clubs`);
  }

  async function getNations(gameWorldId) {
    return request(`${worldPath(gameWorldId)}/nations`);
  }


  async function getTransfers(gameWorldId, options = {}) {
    const params = new URLSearchParams();
    if (options.limit != null) params.set('limit', String(options.limit));
    if (options.offset != null) params.set('offset', String(options.offset));
    const query = params.toString();
    return request(`${worldPath(gameWorldId)}/transfers${query ? `?${query}` : ''}`);
  }

  async function getAllTransfers(gameWorldId) {
    const limit = 500;
    const first = await getTransfers(gameWorldId, { limit, offset: 0 });
    const rows = [...first.data];
    const total = Number(first.pagination?.total || rows.length);
    for (let offset = rows.length; offset < total; offset += limit) {
      const page = await getTransfers(gameWorldId, { limit, offset });
      rows.push(...page.data);
    }
    return { ...first, data: rows, pagination: { ...first.pagination, total, offset: 0, returned: rows.length } };
  }

  async function getTransfer(gameWorldId, transferRowId) {
    const value = String(transferRowId || '');
    if (!/^\d+$/.test(value)) throw new Error('Numero trasferimento non valido.');
    return request(`${worldPath(gameWorldId)}/transfers/${encodeURIComponent(value)}`);
  }

  async function getMatch(gameWorldId, fixtureId) {
    const value = String(fixtureId || '');
    if (!/^\d+$/.test(value)) throw new Error('Fixture ID non valido.');
    return request(`${worldPath(gameWorldId)}/matches/${encodeURIComponent(value)}`);
  }

  global.IMCDataService = Object.freeze({ getWorld, getMatches, getAllMatches, getCompetitions, getManagers, getClubs, getNations, getTransfers, getAllTransfers, getTransfer, getMatch });
})(window);
