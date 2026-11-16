# Canonical world identifiers

| Previous route | Canonical ID |
|---|---|
| GW001 | IMC001 |
| GW005 | IMC002 |
| GW009 | IMC003 |
| GW010 | IMC004 |
| GW011 | IMC005 |
| GW004 | IMC006 |
| GW006 | IMC007 |
| IMC-008 | IMC008 |

Hyphenated IMC aliases resolve to the corresponding canonical ID. Numeric Soccer
Manager IDs, club IDs, national-team IDs, fixtures, imported fingerprints,
ratings, scores and dates do not change.

The live-schema plans in `manifest.json` are applied with Database Manager
`plan_migration` then `execute_migration`, preserving the exact server token.
For each table, existing triggers are temporarily removed during the explicit
identity backfill so unrelated sporting automation cannot alter match facts.
The original triggers are restored in their original order, with quoted world
identifiers normalized. A leading BEFORE trigger canonicalizes future writes.

Preflight checks validate transformed unique keys. Per-table counts and checksums
of all non-identity columns are compared before/after. Inactive reserve tables
are retained as historical backups and are not rewritten.

Old IDs remain accepted at compatibility inputs. Site payloads, current CORE
identifiers and newly persisted rows use the canonical IDs. Existing downloaded
importers retain their legacy read envelope; canonical clients can request
`list_imc_worlds` with `format: canonical`.
