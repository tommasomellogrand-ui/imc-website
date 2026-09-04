CREATE TABLE `imc_competition_master` (
  `competition_master_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `competition_code` VARCHAR(64) NOT NULL,
  `display_name` VARCHAR(120) NOT NULL,
  `competition_group` VARCHAR(20) NOT NULL,
  `competition_family` VARCHAR(32) NOT NULL,
  `default_scope` VARCHAR(20) NOT NULL,
  `season_required` TINYINT(1) NOT NULL DEFAULT 1,
  `first_imc_season` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `has_divisions` TINYINT(1) NOT NULL DEFAULT 0,
  `has_match_days` TINYINT(1) NOT NULL DEFAULT 0,
  `has_group_stage` TINYINT(1) NOT NULL DEFAULT 0,
  `has_knockout_stage` TINYINT(1) NOT NULL DEFAULT 0,
  `hierarchy_path` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`competition_master_id`),
  UNIQUE KEY `uq_imc_competition_master_code` (`competition_code`),
  KEY `ix_imc_competition_master_group` (`competition_group`,`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `imc_competition_rules` (
  `competition_rule_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `competition_master_id` SMALLINT UNSIGNED NOT NULL,
  `rule_code` VARCHAR(100) NOT NULL,
  `world_structure` VARCHAR(20) NOT NULL DEFAULT 'ALL',
  `game_world_id` VARCHAR(16) DEFAULT NULL,
  `country_code` VARCHAR(64) DEFAULT NULL,
  `min_imc_season` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `max_imc_season` SMALLINT UNSIGNED DEFAULT NULL,
  `priority` SMALLINT UNSIGNED NOT NULL DEFAULT 100,
  `rule_kind` VARCHAR(40) NOT NULL,
  `config_json` JSON NOT NULL,
  `description` VARCHAR(500) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`competition_rule_id`),
  UNIQUE KEY `uq_imc_competition_rules_code` (`rule_code`),
  KEY `ix_imc_competition_rules_resolution` (`competition_master_id`,`game_world_id`,`country_code`,`min_imc_season`,`priority`,`is_active`),
  CONSTRAINT `fk_imc_competition_rules_master` FOREIGN KEY (`competition_master_id`) REFERENCES `imc_competition_master` (`competition_master_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `imc_competition_master`
(`competition_master_id`,`competition_code`,`display_name`,`competition_group`,`competition_family`,`default_scope`,`season_required`,`first_imc_season`,`has_divisions`,`has_match_days`,`has_group_stage`,`has_knockout_stage`,`hierarchy_path`)
VALUES
(1,'LEAGUE','League','DOMESTIC','LEAGUE','WORLD_OR_COUNTRY',1,1,1,1,0,0,'DOMESTIC/LEAGUE/DIVISION/MATCH_DAY'),
(2,'NATIONAL_CUP','National Cup','DOMESTIC','CUP','WORLD_OR_COUNTRY',1,1,0,0,0,1,'DOMESTIC/NATIONAL_CUP/KNOCKOUT/ROUND'),
(3,'LEAGUE_CUP','League Cup','DOMESTIC','CUP','WORLD_OR_COUNTRY',1,1,0,0,0,1,'DOMESTIC/LEAGUE_CUP/KNOCKOUT/ROUND'),
(4,'CHARITY_SHIELD','Charity Shield','DOMESTIC','SUPERCUP','WORLD_OR_COUNTRY',1,2,0,0,0,1,'DOMESTIC/CHARITY_SHIELD/FINAL'),
(5,'SMFA_CHAMPIONS','SMFA Champions','INTERNATIONAL','HYBRID','WORLD',1,1,0,0,1,1,'INTERNATIONAL/SMFA_CHAMPIONS/GROUP_STAGE_OR_KNOCKOUT/FINAL'),
(6,'SMFA_SHIELD','SMFA Shield','INTERNATIONAL','HYBRID','WORLD',1,1,0,0,1,1,'INTERNATIONAL/SMFA_SHIELD/GROUP_STAGE_OR_KNOCKOUT/FINAL'),
(7,'SMFA_SUPER_CUP','SMFA Super Cup','INTERNATIONAL','SUPERCUP','WORLD',1,2,0,0,0,1,'INTERNATIONAL/SMFA_SUPER_CUP/FINAL'),
(8,'INTERNATIONAL_QUALIFIER','International Qualifiers','NATIONS','GROUPS','WORLD',1,1,0,1,1,0,'NATIONS/INTERNATIONAL_QUALIFIER/GROUP/MATCH_DAY'),
(9,'WORLD_CUP','World Cup','NATIONS','HYBRID','WORLD',1,1,0,0,1,1,'NATIONS/WORLD_CUP/GROUP_STAGE/KNOCKOUT/FINAL');

INSERT INTO `imc_competition_rules`
(`competition_master_id`,`rule_code`,`world_structure`,`game_world_id`,`country_code`,`min_imc_season`,`priority`,`rule_kind`,`config_json`,`description`)
VALUES
(1,'LEAGUE_SINGLE_STANDARD','SINGLE_LEAGUE',NULL,NULL,1,100,'FORMAT',JSON_OBJECT('competition_group','DOMESTIC','country_scope',false,'division_min',1,'division_max',5,'legs',2,'match_day_label','MATCH DAY','expected_match_days_formula','(team_count - 1) * legs'),'Single-League: una League per divisione e stagione; massimo cinque divisioni.'),
(1,'LEAGUE_MULTI_STANDARD','MULTI_LEAGUE',NULL,NULL,1,100,'FORMAT',JSON_OBJECT('competition_group','DOMESTIC','country_scope',true,'division_min',1,'division_max',5,'legs',2,'match_day_label','MATCH DAY','expected_match_days_formula','(team_count - 1) * legs'),'Multi-League: una League per nazione, divisione e stagione; massimo cinque divisioni.'),
(1,'LEAGUE_GW007_SCOTLAND','MULTI_LEAGUE','GW007','Scotland',1,1000,'EXCEPTION',JSON_OBJECT('competition_group','DOMESTIC','country_scope',true,'legs',4,'match_day_label','MATCH DAY','expected_match_days_formula','(team_count - 1) * legs'),'Eccezione ufficiale: in GW007 Scotland ogni coppia si affronta quattro volte.'),
(2,'NATIONAL_CUP_SINGLE_STANDARD','SINGLE_LEAGUE',NULL,NULL,1,100,'FORMAT',JSON_OBJECT('competition_group','DOMESTIC','country_scope',false,'format','SINGLE_ELIMINATION','legs',1,'replay',false,'draw_resolution','PENALTIES','final_legs',1),'National Cup Single-League: eliminazione diretta, partita secca, rigori in caso di parità.'),
(2,'NATIONAL_CUP_MULTI_STANDARD','MULTI_LEAGUE',NULL,NULL,1,100,'FORMAT',JSON_OBJECT('competition_group','DOMESTIC','country_scope',true,'format','SINGLE_ELIMINATION','legs',1,'replay',false,'draw_resolution','PENALTIES','final_legs',1),'National Cup Multi-League: una per nazione prevista; eliminazione diretta e partita secca.'),
(3,'LEAGUE_CUP_SINGLE_STANDARD','SINGLE_LEAGUE',NULL,NULL,1,100,'FORMAT',JSON_OBJECT('competition_group','DOMESTIC','country_scope',false,'format','SINGLE_ELIMINATION','legs',1,'replay',false,'draw_resolution','PENALTIES','final_legs',1),'League Cup Single-League: eliminazione diretta, partita secca, rigori in caso di parità.'),
(3,'LEAGUE_CUP_MULTI_STANDARD','MULTI_LEAGUE',NULL,NULL,1,100,'FORMAT',JSON_OBJECT('competition_group','DOMESTIC','country_scope',true,'format','SINGLE_ELIMINATION','legs',1,'replay',false,'draw_resolution','PENALTIES','final_legs',1),'League Cup Multi-League: una per nazione prevista; eliminazione diretta e partita secca.'),
(4,'CHARITY_SHIELD_SINGLE_FROM_S2','SINGLE_LEAGUE',NULL,NULL,2,100,'AVAILABILITY_FORMAT',JSON_OBJECT('competition_group','DOMESTIC','country_scope',false,'format','SINGLE_MATCH','round_label','FINAL','expected_matches',1,'draw_resolution','PENALTIES','not_contested_before_season',2),'Charity Shield Single-League: non disputata in IMC Season 1; una finale secca dalla Season 2.'),
(4,'CHARITY_SHIELD_MULTI_FROM_S2','MULTI_LEAGUE',NULL,NULL,2,100,'AVAILABILITY_FORMAT',JSON_OBJECT('competition_group','DOMESTIC','country_scope',true,'format','SINGLE_MATCH','round_label','FINAL','expected_matches',1,'draw_resolution','PENALTIES','not_contested_before_season',2),'Charity Shield Multi-League: una per nazione prevista, dalla IMC Season 2.'),
(5,'SMFA_CHAMPIONS_STANDARD','ALL',NULL,NULL,1,100,'FORMAT',JSON_OBJECT('competition_group','INTERNATIONAL','country_scope',false,'group_stage',true,'group_matches_per_team_options',JSON_ARRAY(3,6),'knockout_stage',true,'knockout_legs',2,'away_goals_rule',true,'draw_resolution','PENALTIES','final_legs',1),'SMFA Champions: fase a gironi, poi knockout; finale secca.'),
(6,'SMFA_SHIELD_STANDARD','ALL',NULL,NULL,1,100,'FORMAT',JSON_OBJECT('competition_group','INTERNATIONAL','country_scope',false,'group_stage',true,'group_matches_per_team_options',JSON_ARRAY(3,6),'knockout_stage',true,'knockout_legs',2,'away_goals_rule',true,'draw_resolution','PENALTIES','final_legs',1),'SMFA Shield ordinaria: fase a gironi, poi knockout; finale secca.'),
(6,'SMFA_SHIELD_GW008_DIRECT_KNOCKOUT','ALL','GW008',NULL,1,1000,'EXCEPTION',JSON_OBJECT('competition_group','INTERNATIONAL','country_scope',false,'group_stage',false,'knockout_from_first_round',true,'knockout_legs',2,'away_goals_rule',true,'draw_resolution','PENALTIES','final_legs',1),'Eccezione ufficiale GW008: SMFA Shield a eliminazione diretta dal primo turno.'),
(7,'SMFA_SUPER_CUP_FROM_S2','ALL',NULL,NULL,2,100,'AVAILABILITY_FORMAT',JSON_OBJECT('competition_group','INTERNATIONAL','country_scope',false,'format','SINGLE_MATCH','round_label','FINAL','expected_matches',1,'draw_resolution','PENALTIES','participants_from_previous_season',JSON_ARRAY('SMFA_CHAMPIONS_WINNER','SMFA_SHIELD_WINNER'),'not_contested_before_season',2),'Una SMFA Super Cup per Game World dalla Season 2, tra le vincitrici Champions e Shield della stagione precedente.'),
(8,'INTERNATIONAL_QUALIFIER_STANDARD','ALL',NULL,NULL,1,100,'FORMAT',JSON_OBJECT('competition_group','NATIONS','groups_count',16,'teams_per_group',5,'legs',2,'matches_per_team',8,'match_days',10,'matches_per_match_day',2,'byes_per_match_day',1,'qualifying_positions',2,'qualified_teams_total',32,'matches_per_group',20,'matches_total',320,'match_day_label','MATCH DAY'),'International Qualifiers: sedici gironi da cinque, dieci Match Day e prime due qualificate.'),
(9,'WORLD_CUP_STANDARD','ALL',NULL,NULL,1,100,'FORMAT',JSON_OBJECT('competition_group','NATIONS','teams_per_group',4,'group_matches_per_team',3,'group_stage',true,'knockout_stage',true,'knockout_legs',1,'draw_resolution','PENALTIES','final_legs',1,'retain_origin_imc_season',true,'may_cross_next_season_dates',true),'World Cup: gironi da quattro, poi eliminazione diretta secca; conserva la stagione di origine anche se termina nella successiva.');
