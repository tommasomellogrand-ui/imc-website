# Schedule normalizer v1

Enabled for GW001–GW010 through both existing Universal Gateway import paths.
No new public endpoint or credential is introduced. This is an application-level
post-write normalizer, not a MySQL trigger: direct SQL inserts outside the Gateway
do not invoke it.

## Identity rules

- Only NULL club IDs are filled. Existing IDs and source fingerprints are preserved.
- CORE club mapping and manager assignments are read in the same Game World.
- Explicit side manager takes precedence over the logged importing manager.
- A valid match date and an active club assignment are required. Later assignments
  supersede older open-ended appointments; conflicting active clubs remain unresolved.
- Assignment team IDs may denote a world, Core or global club ID. Multiple possible
  world clubs are rejected.
- Fixture name must match the mapping or canonical name after case/whitespace
  normalization. No fuzzy-name matching, cross-world guesses, or global-ID substitution.
- National-team fixtures remain unchanged; they use a distinct mapping namespace.

## Persistence and reporting

After an insert/update, incomplete rows already in that world's source Schedule are
rechecked. Derived IDs are also copied to matching NULL fields in IMC Site Schedule,
when that table exists. The match date, fixture ID, team name and importing manager
must agree. Existing mirror IDs are never overwritten.

Per-world locking serializes Gateway Schedule writes. The batch and reconciliation
are committed together; errors roll them back. The response `normalization` contains
checked rows, updated source/site IDs, unresolved side count and up to 25 pending
fixture/side/reason entries. A summary is also written to the server error log.

## Verification

The deployment workflow runs 19 resolver assertions and an isolated MySQL integration
suite before publication, alongside the existing playoff and world-routing tests.
Tests cover both ID domains, missing dates/managers, conflicting assignments,
existing IDs, world isolation, duplicate names, mirror propagation, idempotency,
transaction rollback and lock release.

## Rollback

Restore ingress.php and write.php to call imc_playoff_import and require
playoff-normalizer.php; deploy via the existing Gateway workflow. Filled IDs are
not automatically cleared. Review any desired data rollback separately against
the original missing-ID audit.
