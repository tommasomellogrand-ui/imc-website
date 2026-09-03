# SINGLE-LEAGUE DATABASE FINAL MANIFEST

## Identity

- Checkpoint: 08
- Target database: `Sql1956795_3`
- Structural family: `single_league`
- Technical template: installed GOLD schema in `Sql1956795_2`
- DDL: `SINGLE_LEAGUE_DATABASE_FINAL_DDL.sql`
- DDL SHA-256: `a83dce2e33d6941d5957c8f004df1dc85dd368fe145527896d1bf003941d0b42`
- MySQL: 8.0

## Real post-install validation

| Metric | Result |
|---|---:|
| Tables | 53 |
| Columns | 785 |
| Primary keys | 53/53 |
| Physical UNIQUE constraints | 54 |
| Internal foreign keys | 115 |
| Idempotency coverage | 53/53 |
| InnoDB | 53/53 |
| Unsafe nullable UNIQUE constraints | 0 |
| Artificial self-referencing foreign keys | 0 |
| References to eliminated structural entities | 0 |
| Data rows | 0 |

## GOLD to SINGLE-LEAGUE difference matrix

| Category | GOLD | SINGLE-LEAGUE | Exact change |
|---|---:|---:|---|
| Tables | 55 | 53 | Removed `gw_countries`, `gw_national_teams` |
| Columns | 806 | 785 | Removed 21 structural columns |
| Primary keys | 55 | 53 | Only the PKs belonging to the two removed tables disappear |
| UNIQUE constraints | 56 | 54 | Only the UNIQUE constraints belonging to the two removed tables disappear |
| Internal foreign keys | 120 | 115 | Removed five FKs tied to the eliminated structural hierarchy |
| Idempotency coverage | 55/55 | 53/53 | Full coverage preserved |
| InnoDB | 55/55 | 53/53 | Full coverage preserved |

### Identical tables (49)

`gw_game_worlds`, `gw_world_rules`, `gw_seasons`, `gw_competitions`, `gw_competition_editions`, `gw_competition_stages`, `gw_competition_rounds`, `gw_competition_groups`, `gw_world_clubs`, `gw_sm_users`, `gw_manager_ranking_snapshots`, `gw_players`, `gw_player_profile_snapshots`, `gw_player_state_snapshots`, `gw_squad_members`, `gw_player_stat_snapshots`, `gw_player_leaderboard_snapshots`, `gw_player_leaderboard_rows`, `gw_stadiums`, `gw_fixtures`, `gw_fixture_results`, `gw_match_reports`, `gw_match_team_stats`, `gw_match_lineups`, `gw_match_lineup_players`, `gw_match_events`, `gw_match_commentary`, `gw_match_tactics_snapshots`, `gw_standings_snapshots`, `gw_standings_rows`, `gw_attendance_snapshots`, `gw_transfers`, `gw_transfer_summary_snapshots`, `gw_player_db_update_batches`, `gw_player_db_updates`, `gw_tactic_slots`, `gw_tactic_instructions`, `gw_tactic_substitutions`, `gw_honours`, `gw_history_snapshots`, `gw_news_items`, `gw_source_page_types`, `gw_source_captures`, `gw_source_fragments`, `gw_source_dom_nodes`, `gw_source_payloads`, `gw_identity_matches`, `gw_import_runs`, `gw_import_issues`.

### Eliminated tables (2)

- `gw_countries`
- `gw_national_teams`

### Adapted tables (4)

| Table | Adaptation |
|---|---|
| `gw_divisions` | Removed optional structural parent `gw_country_id` and its index; direct Game World and season relationships remain |
| `gw_sm_user_assignments` | Removed `world_national_team_id`; `entity_type` restricted to `CLUB` |
| `gw_squads` | Removed `world_national_team_id`; `owner_type` restricted to `CLUB` |
| `gw_tactic_snapshots` | `owner_type` restricted to `CLUB`; generic observed `world_team_id` retained |

### Eliminated structural columns (21)

- All 7 columns belonging to `gw_countries`
- All 11 columns belonging to `gw_national_teams`
- `gw_divisions.gw_country_id`
- `gw_sm_user_assignments.world_national_team_id`
- `gw_squads.world_national_team_id`

All other 785 columns are retained. Descriptive geographic fields remain, including player nationality, club/stadium country codes, competition host country data, images and flags.

### Foreign keys

Removed exactly five structural FKs:

- `gw_countries.game_world_id` to `gw_game_worlds.game_world_id`
- `gw_countries.capture_id` to `gw_source_captures.capture_id`
- `gw_national_teams.game_world_id` to `gw_game_worlds.game_world_id`
- `gw_national_teams.capture_id` to `gw_source_captures.capture_id`
- `gw_divisions.gw_country_id` to `gw_countries.gw_country_id`

No valid FK was otherwise altered. The invalid GOLD self-FK `gw_source_captures.capture_id -> gw_source_captures.capture_id` is not present. The meaningful self-reference `parent_capture_id -> capture_id` is preserved.

### UNIQUE and fingerprints

- Removed only the two UNIQUE constraints owned by the two eliminated tables.
- All remaining physical UNIQUE constraints are unchanged.
- Fingerprint columns and their NULL-safe UNIQUE strategy are unchanged.
- Division, assignment, squad and tactic fingerprints have single-league semantics and do not require Country or National Team identifiers.

## Structural verification

- `gw_divisions` relates directly to `gw_game_worlds` and `gw_seasons`, with no Country parent.
- `gw_competitions` relates directly to `gw_game_worlds`; its editions retain the competition and season relationships.
- The model does not use `soccer_manager_type`, `owner` or `creator` to route a Game World.
- `gw_game_worlds.game_world_type`, `owner` and `creator` remain independent real Soccer Manager metadata.
- GW004 · World League is representable as `single_league` without changing its real Soccer Manager type, owner or creator and without classifying it as Custom.
