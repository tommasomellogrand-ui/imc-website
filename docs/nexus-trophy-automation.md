# Nexus Trophy Room automation

GW001–GW010 use their own `GWxxx_IMC_Trophy_Room` on the existing gold/custom routing. The old CORE trophy table is not read or modified.

## Source and update path

Each Results, Match_Report and Schedule table has three AFTER triggers (INSERT, UPDATE, DELETE). They increment a per-world revision in `IMC_Trophy_Sync_State` in the importing transaction. They do not calculate standings or modify source data. A rolled-back import also rolls back its revision.

The Nexus Trophy Room endpoint checks this revision before serving data. The GitHub workflow `nexus-trophies.yml` additionally requests a refresh of every world on a five-minute schedule, so updates do not require a visitor. GitHub scheduled runs can be delayed; this is eventual processing, not a real-time SLA. Imports are debounced for 30 seconds after their last change. A daily recheck covers date transitions and refreshed competition definitions.

## Assignment rules

- Group Results by IMC season and exact competition key. Identical fixture duplicates count once; conflicting duplicates suspend the affected competition.
- League: use the CORE competition Codex expected team/match counts. If absent, require a complete round-robin Schedule as evidence. Require the exact expected number of completed Results, all home/away pairings with the expected repetition factor, and completion of every available scheduled fixture. Future or unfinished matches cannot count. Rank by points, goal difference and goals scored; an unresolved tie is pending, never alphabetical. Grouped or unsupported league formats are pending.
- Cups, playoffs and World Cup: require an explicitly identified final and a linked Match Report. Semi-finals, quarter-finals and qualifiers are not finals. Results provide competition/season context; score disagreements with the report are pending. A first leg cannot award a title. The deciding order is penalties, aggregate, then a single-match score. For a two-leg final without a stored aggregate, sum the two Results only when dates and reversed team IDs establish the tie. A tied aggregate without a decisive penalty result stays pending; no away-goal rule is invented.
- Unknown season/key, incomplete identity or insufficient source evidence stays pending. The engine does not infer a winner just because that club currently leads.

## Persistence and recovery

Unique `(imc_season, competition_key)` keys prevent duplicate awards in each GW table. Each sync uses a per-world MySQL advisory lock and a repeatable-read transaction. It updates changed records, inserts new awards and withdraws awards no longer supported by the sources. Every changed batch archives the full previous trophy rows and a change summary in `IMC_Trophy_Sync_Log`, in the same transaction. Source tables are never edited by the engine.

An import committed during a calculation increases the revision; the next run processes it. Failed syncs roll back and leave the revision pending for retry. `enabled=0` on a world's state row pauses its writes without stopping imports or reads.

`nexus/trophies/automation.php?world=GW001&preview=1` performs a read-only calculation and reports proposed awards and reasons for pending competitions. The endpoint accepts only a validated GW and preview flag, never externally supplied scores or winners.

## Validation

`tests/nexus-trophies.php` covers competition completeness, duplicate/conflicting fixtures, ties, missing reports, penalties, two-leg finals and season isolation. `tests/nexus-trophies-integration.php` runs the actual schema migrations and sync engine against isolated MySQL databases for all ten worlds, including queue revisions, dry-run isolation, idempotence, revocation and transactional rollback.

Database migrations are recorded in `docs/trophy-automation-migrations.json`; apply through the existing Database Manager plan/execute mechanism. Do not blindly rerun already applied migrations.
