-- IMC Match Report: canonical Result fields on incoming INSERT/UPDATE.
-- Applied through Database Manager on 2026-09-21.
-- Route: Gold GW002/GW003/GW007/GW008; Custom GW001/GW004/GW005/GW006/GW009/GW010.
-- Importer unchanged. Match identity is game_world_id + sm_fixture_id.
-- Exactly one Result: all 20 shared scalar fields come from Results, including NULLs.
-- Missing/ambiguous Result: shared fields become NULL; report-specific fields remain intact.
-- Existing player normalization and site projection triggers remain installed.
-- No historical bulk rewrite. Results-only writes do not trigger this normalization;
-- if Results arrive later, updating the Match Report re-runs the lookup.
-- The nonunique lookup index preserves existing duplicate policy.

-- TARGET gold
USE `Sql1956795_2`;

CREATE INDEX imc_results_world_fixture ON `GW002_IMC Results` (game_world_id,sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw002_bi BEFORE INSERT ON `GW002_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw002_bi SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw002_bu BEFORE UPDATE ON `GW002_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw002_bu SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW002_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

DROP TRIGGER imc_mr_key_gw002_bi;

DROP TRIGGER imc_mr_key_gw002_bu;

CREATE INDEX imc_results_world_fixture ON `GW003_IMC Results` (game_world_id,sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw003_bi BEFORE INSERT ON `GW003_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw003_bi SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw003_bu BEFORE UPDATE ON `GW003_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw003_bu SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW003_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

DROP TRIGGER imc_mr_key_gw003_bi;

DROP TRIGGER imc_mr_key_gw003_bu;

CREATE INDEX imc_results_world_fixture ON `GW007_IMC Results` (game_world_id,sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw007_bi BEFORE INSERT ON `GW007_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw007_bi SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw007_bu BEFORE UPDATE ON `GW007_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw007_bu SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW007_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

DROP TRIGGER imc_mr_key_gw007_bi;

DROP TRIGGER imc_mr_key_gw007_bu;

CREATE INDEX imc_results_world_fixture ON `GW008_IMC Results` (game_world_id,sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw008_bi BEFORE INSERT ON `GW008_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw008_bi SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw008_bu BEFORE UPDATE ON `GW008_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw008_bu SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW008_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

DROP TRIGGER imc_mr_key_gw008_bi;

DROP TRIGGER imc_mr_key_gw008_bu;

-- TARGET custom
USE `Sql1956795_3`;

CREATE INDEX imc_results_world_fixture ON `GW001_IMC Results` (game_world_id,sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw001_bi BEFORE INSERT ON `GW001_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_result_gw001_bi SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw001_bu BEFORE UPDATE ON `GW001_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_result_gw001_bu SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

DROP TRIGGER imc_mr_result_gw001_bi;

DROP TRIGGER imc_mr_result_gw001_bu;

CREATE INDEX imc_results_world_fixture ON `GW004_IMC Results` (game_world_id,sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw004_bi BEFORE INSERT ON `GW004_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw004_bi SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw004_bu BEFORE UPDATE ON `GW004_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw004_bu SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW004_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

DROP TRIGGER imc_mr_key_gw004_bi;

DROP TRIGGER imc_mr_key_gw004_bu;

CREATE INDEX imc_results_world_fixture ON `GW005_IMC Results` (game_world_id,sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw005_bi BEFORE INSERT ON `GW005_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw005_bi SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw005_bu BEFORE UPDATE ON `GW005_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw005_bu SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW005_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

DROP TRIGGER imc_mr_key_gw005_bi;

DROP TRIGGER imc_mr_key_gw005_bu;

CREATE INDEX imc_results_world_fixture ON `GW006_IMC Results` (game_world_id,sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw006_bi BEFORE INSERT ON `GW006_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw006_bi SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw006_bu BEFORE UPDATE ON `GW006_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw006_bu SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW006_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

DROP TRIGGER imc_mr_key_gw006_bi;

DROP TRIGGER imc_mr_key_gw006_bu;

CREATE INDEX imc_results_world_fixture ON `GW009_IMC Results` (game_world_id,sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw009_bi BEFORE INSERT ON `GW009_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw009_bi SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw009_bu BEFORE UPDATE ON `GW009_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw009_bu SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW009_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

DROP TRIGGER imc_mr_key_gw009_bi;

DROP TRIGGER imc_mr_key_gw009_bu;

CREATE INDEX imc_results_world_fixture ON `GW010_IMC Results` (game_world_id,sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw010_bi BEFORE INSERT ON `GW010_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw010_bi SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

CREATE TRIGGER imc_mr_canonical_gw010_bu BEFORE UPDATE ON `GW010_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw010_bu SET NEW.`competition_key`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_key`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_action`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_action`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_country`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_country`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`sm_division`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`sm_division`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_group`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_group`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_stage`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_stage`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`competition_round`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`competition_round`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`match_date`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`match_date`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_club_id`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_name`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_club_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_club_id`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_name`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_name`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_sm_manager_id`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_sm_manager_id`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_sm_manager_id`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`home_score`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`away_score`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_home_score`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`penalty_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`penalty_away_score`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_home_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_home_score`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id),
NEW.`aggregate_away_score`=(SELECT CASE WHEN COUNT(*)=1 THEN MAX(r.`aggregate_away_score`) ELSE NULL END FROM `GW010_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);

DROP TRIGGER imc_mr_key_gw010_bi;

DROP TRIGGER imc_mr_key_gw010_bu;
