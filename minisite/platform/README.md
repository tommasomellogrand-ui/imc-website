# Minisite platform · Phase 1

CASE IMC-ENG-009-04. Parallel foundation only. No production page imports this directory.

`core/bootstrap.js` explicitly assembles injected families, a package-owned URL map,
an injected read adapter and instance-local registries. It performs no requests,
rendering, history writes or listener registration. `router.js` is a pure codec;
`context.js` validates declarative dimensions. Live adapter extraction is deferred.

The versioned contract set is Core Behavior, SINGLE, MULTI_GOLD, one Creative Freedom
Contract and minimum Match/Competition/Standings/Context Entry semantic contracts.
They define meaning and minimum information, never markup or a shared visual shell.
`creative-freedom.contract.js` contains all twelve approved guardrails in one system.
Some guardrails are necessarily acceptance/review requirements: code validation does
not certify perceptual non-degradation or accessibility conformance.

`data/client.js` accepts an explicit read-only adapter with AbortSignal and cursor.
Source states retain provenance; null never becomes an invented zero. There is no
endpoint, DB query, cache, ranking query or gateway dependency. Fixed contexts are
selected independently of their renderer. Ranked active-manager countries remain a
declared future provider pending the authoritative input contract; they are not used
by the two Phase 1 Golden Masters.

`features/catalog.js` declares optional Archive, Territory Map and Rivalries. The
registry interfaces support signatures and extension cleanup without Core branches.
No feature renderer has been extracted. Themes, motion, assets, composition and all
existing world packages remain where they are.

Offline declarations and actual URL mappings for the two Golden Masters live under
`../tests/golden-master/`, not inside their live packages. The future canonical
family destination set is intentionally broader than the current live route set.
An unavailable current route is not silently invented by the foundation.

Run from repository root:

```sh
node --test minisite/tests/contracts.test.mjs
node minisite/tests/verify-isolation.mjs
python3 minisite/tests/live-check.py live-check.json
```

No npm install is needed (Node 22+, Python 3). See `../tests/README.md` for baseline,
responsive/interaction harness, known legacy gaps, visual limits and rollback.
