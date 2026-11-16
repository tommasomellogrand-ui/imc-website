# Authoritative competition catalogue

`IMC Competition Codex Global` stores one row per world and competition. Its existing
IDs, sporting totals and independent IMC005 competition keys are preserved.

Each row contains the official name (`custom_competition`), canonical key,
historical key aliases, world type, category, SM action, country/division,
team count, expected matches and expected matchdays. `IMC_View`, `nexus_view`
and `competition_group` are generated compatibility columns, not independent
values to update.

`IMC Competition Nexus Mapping` is now a read-only SQL view over the Codex. It
expands historical aliases from the same row so old results and schedules keep
their labels and links. It stores no data and cannot be maintained separately.
New importer competition selection reads the Codex directly and returns one
canonical entry per competition.

The JSON migration contains three reviewed Database Manager schema plans and
the canonical rows. Apply schema plans with `plan_migration` / `execute_migration`;
persist rows atomically via Universal Gateway `upsert_many`, then verify the
complete rows, key coverage and totals before retiring the old mapping backup.
Never rerun a completed schema plan blindly.

Regression coverage: `tests/competition-codex-unification.php` runs the migration
in a disposable MySQL database and checks historical alias resolution, automatic
name propagation, read-only compatibility, counts and the single physical table.
