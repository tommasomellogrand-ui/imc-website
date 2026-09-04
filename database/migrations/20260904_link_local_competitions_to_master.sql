-- IMC Competition Master: logical linkage for local competition catalogs.
-- Apply separately to Sql1956795_2 (gold) and Sql1956795_3 (custom).
-- The authoritative master lives in Sql1956795_1; no cross-database FK is created.

ALTER TABLE gw_competitions
  ADD COLUMN competition_master_id SMALLINT UNSIGNED NULL AFTER competition_type,
  ADD INDEX idx_gw_competitions_master (competition_master_id),
  ADD INDEX idx_gw_competitions_world_master (game_world_id, competition_master_id);

UPDATE gw_competitions
SET
  competition_master_id = CASE competition_type
    WHEN 'league' THEN 1
    WHEN 'leagueshield' THEN 2
    WHEN 'leaguecup' THEN 3
    WHEN 'charityshield' THEN 4
    WHEN 'smfacup' THEN 5
    WHEN 'smfashield' THEN 6
    WHEN 'supercup' THEN 7
    WHEN 'interqualifier' THEN 8
    WHEN 'worldcup' THEN 9
    ELSE NULL
  END,
  competition_group = CASE competition_type
    WHEN 'league' THEN 'DOMESTIC'
    WHEN 'leagueshield' THEN 'DOMESTIC'
    WHEN 'leaguecup' THEN 'DOMESTIC'
    WHEN 'charityshield' THEN 'DOMESTIC'
    WHEN 'smfacup' THEN 'INTERNATIONAL'
    WHEN 'smfashield' THEN 'INTERNATIONAL'
    WHEN 'supercup' THEN 'INTERNATIONAL'
    WHEN 'interqualifier' THEN 'NATIONS'
    WHEN 'worldcup' THEN 'NATIONS'
    ELSE competition_group
  END,
  master_catalog = CASE competition_type
    WHEN 'league' THEN 'leagues'
    WHEN 'leagueshield' THEN 'cups'
    WHEN 'leaguecup' THEN 'cups'
    WHEN 'charityshield' THEN 'cups'
    WHEN 'smfacup' THEN 'international_cups'
    WHEN 'smfashield' THEN 'international_cups'
    WHEN 'supercup' THEN 'international_cups'
    WHEN 'interqualifier' THEN 'international_cups'
    WHEN 'worldcup' THEN 'international_cups'
    ELSE master_catalog
  END,
  master_competition_id = CASE competition_type
    WHEN 'league' THEN 'LEAGUE'
    WHEN 'leagueshield' THEN 'NATIONAL_CUP'
    WHEN 'leaguecup' THEN 'LEAGUE_CUP'
    WHEN 'charityshield' THEN 'CHARITY_SHIELD'
    WHEN 'smfacup' THEN 'SMFA_CHAMPIONS'
    WHEN 'smfashield' THEN 'SMFA_SHIELD'
    WHEN 'supercup' THEN 'SMFA_SUPER_CUP'
    WHEN 'interqualifier' THEN 'INTERNATIONAL_QUALIFIER'
    WHEN 'worldcup' THEN 'WORLD_CUP'
    ELSE master_competition_id
  END
WHERE competition_type IN (
  'league', 'leagueshield', 'leaguecup', 'charityshield',
  'smfacup', 'smfashield', 'supercup', 'interqualifier', 'worldcup'
);
