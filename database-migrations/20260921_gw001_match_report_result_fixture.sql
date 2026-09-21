-- CUSTOM only. GW001 only. Supersedes key reconstruction for GW001.
-- Match Reports inherit competition_key only from exactly one Result with the same world and fixture.
-- Missing/ambiguous/empty Result key => NULL, never reconstruct or guess.
-- The importer and the player/minute/statistics fields are unchanged.
-- Install new triggers after old ones, then remove old ones to avoid an unprotected import window.
CREATE TRIGGER imc_mr_result_gw001_bi BEFORE INSERT ON `GW001_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw001_bi SET NEW.competition_key = (SELECT CASE WHEN COUNT(*)=1 THEN MAX(NULLIF(TRIM(r.competition_key),'')) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);
CREATE TRIGGER imc_mr_result_gw001_bu BEFORE UPDATE ON `GW001_IMC Match Report` FOR EACH ROW FOLLOWS imc_mr_key_gw001_bu SET NEW.competition_key = (SELECT CASE WHEN COUNT(*)=1 THEN MAX(NULLIF(TRIM(r.competition_key),'')) ELSE NULL END FROM `GW001_IMC Results` r WHERE r.game_world_id=NEW.game_world_id AND r.sm_fixture_id=NEW.sm_fixture_id);
DROP TRIGGER imc_mr_key_gw001_bi;
DROP TRIGGER imc_mr_key_gw001_bu;

-- Post-import normalization for uniquely matched Results; audit unresolved rows separately.
UPDATE `GW001_IMC Match Report` m JOIN (SELECT game_world_id,sm_fixture_id,MAX(NULLIF(TRIM(competition_key),'')) competition_key FROM `GW001_IMC Results` GROUP BY game_world_id,sm_fixture_id HAVING COUNT(*)=1) r ON r.game_world_id=m.game_world_id AND r.sm_fixture_id=m.sm_fixture_id SET m.competition_key=r.competition_key WHERE r.competition_key IS NOT NULL AND NOT(m.competition_key <=> r.competition_key);

-- Unresolved audit (must be empty before claiming complete normalization).
SELECT m.sm_fixture_id,COUNT(r.sm_fixture_id) result_matches FROM `GW001_IMC Match Report` m LEFT JOIN `GW001_IMC Results` r ON r.game_world_id=m.game_world_id AND r.sm_fixture_id=m.sm_fixture_id GROUP BY m.sm_fixture_id HAVING COUNT(r.sm_fixture_id)<>1 OR MAX(NULLIF(TRIM(r.competition_key),'')) IS NULL;
