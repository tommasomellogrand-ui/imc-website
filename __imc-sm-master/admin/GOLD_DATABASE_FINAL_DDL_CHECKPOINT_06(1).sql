-- GOLD / MULTI-LEAGUE FINAL DDL · CHECKPOINT 06
-- Authoritative source: CHECKPOINT 05 certified artifacts
-- Target database: Sql1956795_2
-- MySQL 8.0 · non-destructive installation on an empty database
-- This file intentionally contains no CREATE DATABASE, DROP, TRUNCATE, DELETE, or data writes.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';
USE `Sql1956795_2`;

-- Phase 1: create all 55 tables, primary keys, unique keys and indexes.

CREATE TABLE `gw_game_worlds` (
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `active_manager_count` INT NULL,
  `controlled_clubs` INT NULL,
  `controlled_percentage` DECIMAL(12,4) NULL,
  `created_at` DATETIME(6) NOT NULL,
  `creator` VARCHAR(255) NULL,
  `current_soccer_manager_season` INT UNSIGNED NULL,
  `database_scope` TINYINT(1) NULL,
  `first_match_id_or_label` VARCHAR(255) NULL,
  `game_world_name` VARCHAR(255) NOT NULL,
  `game_world_type` VARCHAR(255) NULL,
  `legacy_game_world_code_raw` VARCHAR(16) NULL,
  `minimum_level` INT NULL,
  `owner` VARCHAR(255) NULL,
  `public_status` VARCHAR(255) NULL,
  `reference_class` VARCHAR(64) NULL,
  `season_appointments` INT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NOT NULL,
  `standard_rules` VARCHAR(255) NULL,
  `total_clubs` INT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  PRIMARY KEY (`game_world_id`),
  CONSTRAINT `uq_gw_game_worlds_sm_game_world_id_1` UNIQUE (`sm_game_world_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_world_rules` (
  `world_rules_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `cash_to_clubs` VARCHAR(255) NULL,
  `cash_transfer_limit` DECIMAL(19,4) NULL,
  `created_at` DATETIME(6) NOT NULL,
  `economy_level` VARCHAR(255) NULL,
  `effective_at` DATETIME(6) NULL,
  `external_buying` VARCHAR(255) NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `manager_login_days` INT NULL,
  `manager_sacked_position` INT NULL,
  `max_transfers` INT NULL,
  `national_buying` VARCHAR(255) NULL,
  `player_age_buying_limit` INT NULL,
  `player_concerns` VARCHAR(255) NULL,
  `player_rating_buying_limit` INT NULL,
  `raw_rules_html` LONGTEXT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `smfa_monitoring` VARCHAR(255) NULL,
  `squad_cap` INT NULL,
  `starting_balance` DECIMAL(19,4) NULL,
  `starting_squads` VARCHAR(255) NULL,
  `transfer_window_1` VARCHAR(255) NULL,
  `transfer_window_2` VARCHAR(255) NULL,
  `unmanaged_buying` VARCHAR(255) NULL,
  PRIMARY KEY (`world_rules_snapshot_id`),
  CONSTRAINT `uq_gw_world_rules_game_world_id_capture_id_1` UNIQUE (`game_world_id`, `capture_id`),
  KEY `ixfk_gw_world_rules_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_seasons` (
  `gw_season_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `end_date` DATE NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `imc_season` INT UNSIGNED NULL,
  `season_dates` DATE NULL,
  `season_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `season_label` VARCHAR(255) NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NOT NULL,
  `start_date` DATE NULL,
  `valid_from_capture_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`gw_season_row_id`),
  CONSTRAINT `uq_gw_seasons_season_identity_fingerprint_1` UNIQUE (`season_identity_fingerprint`),
  KEY `ix_gw_seasons_game_world_id_sm_season_id_1` (`game_world_id`, `sm_season_id`),
  KEY `ix_gw_seasons_game_world_id_imc_season_2` (`game_world_id`, `imc_season`),
  KEY `ixfk_gw_seasons_valid_from_capture_id` (`valid_from_capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_countries` (
  `gw_country_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NULL,
  `country_code` VARCHAR(64) NOT NULL,
  `country_name` VARCHAR(255) NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`gw_country_id`),
  CONSTRAINT `uq_gw_countries_game_world_id_country_code_1` UNIQUE (`game_world_id`, `country_code`),
  KEY `ixfk_gw_countries_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_divisions` (
  `gw_division_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `display_order` SMALLINT UNSIGNED NULL,
  `division_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `division_label` VARCHAR(255) NULL,
  `division_value` INT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_country_id` BIGINT UNSIGNED NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  PRIMARY KEY (`gw_division_id`),
  CONSTRAINT `uq_gw_divisions_division_identity_fingerprint_1` UNIQUE (`division_identity_fingerprint`),
  KEY `ixfk_gw_divisions_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_divisions_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_divisions_gw_country_id` (`gw_country_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_national_teams` (
  `gw_national_team_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NULL,
  `country_code` VARCHAR(8) NULL,
  `created_at` DATETIME(6) NOT NULL,
  `flag_src` TEXT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `master_national_team_id` VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `nation_team_id` BIGINT UNSIGNED NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `team_name` VARCHAR(160) NOT NULL,
  `world_national_team_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`gw_national_team_row_id`),
  CONSTRAINT `uq_gw_national_teams_game_world_id_world_national_team_id_1` UNIQUE (`game_world_id`, `world_national_team_id`),
  KEY `ix_gw_national_teams_master_national_team_id_1` (`master_national_team_id`),
  KEY `ixfk_gw_national_teams_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_competitions` (
  `gw_competition_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `competition_id` BIGINT UNSIGNED NULL,
  `competition_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `competition_name` VARCHAR(255) NULL,
  `competition_type` VARCHAR(64) NULL,
  `country_code` VARCHAR(8) NULL,
  `created_at` DATETIME(6) NOT NULL,
  `division_value` VARCHAR(32) NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `is_active` TINYINT(1) NULL,
  `local_competition_id` VARCHAR(64) NULL,
  `master_catalog` ENUM('leagues','cups','international_cups') NULL,
  `master_competition_id` VARCHAR(64) NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`gw_competition_row_id`),
  CONSTRAINT `uq_gw_competitions_game_world_id_competition_identity_5b35a78b3c` UNIQUE (`game_world_id`, `competition_identity_fingerprint`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_competition_editions` (
  `competition_edition_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(6) NOT NULL,
  `edition_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `edition_label` VARCHAR(160) NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_competition_row_id` BIGINT UNSIGNED NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `host_country_code` VARCHAR(8) NULL,
  `host_country_image` TEXT NULL,
  `host_country_name` VARCHAR(255) NULL,
  `imc_season` INT UNSIGNED NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  `world_cup_edition` VARCHAR(255) NULL,
  PRIMARY KEY (`competition_edition_id`),
  CONSTRAINT `uq_gw_competition_editions_gw_competition_row_id_edit_bec58d86f3` UNIQUE (`gw_competition_row_id`, `edition_identity_fingerprint`),
  KEY `ixfk_gw_competition_editions_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_competition_editions_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_competition_editions_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_competition_stages` (
  `competition_stage_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `competition_edition_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `display_order` SMALLINT UNSIGNED NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `stage` VARCHAR(255) NULL,
  `stage_code` VARCHAR(64) NULL,
  `stage_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `stage_label` VARCHAR(160) NOT NULL,
  PRIMARY KEY (`competition_stage_id`),
  CONSTRAINT `uq_gw_competition_stages_competition_edition_id_stage_65858295c0` UNIQUE (`competition_edition_id`, `stage_identity_fingerprint`),
  KEY `ixfk_gw_competition_stages_game_world_id` (`game_world_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_competition_rounds` (
  `competition_round_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `competition_stage_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `leg_number` TINYINT UNSIGNED NULL,
  `round_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `round_label` VARCHAR(255) NULL,
  `round_number` INT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`competition_round_id`),
  CONSTRAINT `uq_gw_competition_rounds_competition_stage_id_round_i_b790c69e08` UNIQUE (`competition_stage_id`, `round_identity_fingerprint`),
  KEY `ixfk_gw_competition_rounds_game_world_id` (`game_world_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_competition_groups` (
  `competition_group_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `competition_stage_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `display_order` SMALLINT UNSIGNED NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `group_id_or_index` VARCHAR(255) NULL,
  `group_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `group_name` VARCHAR(255) NULL,
  `local_group_value` VARCHAR(64) NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`competition_group_id`),
  CONSTRAINT `uq_gw_competition_groups_competition_stage_id_group_i_168a4b74d8` UNIQUE (`competition_stage_id`, `group_identity_fingerprint`),
  KEY `ixfk_gw_competition_groups_game_world_id` (`game_world_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_world_clubs` (
  `world_club_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NULL,
  `club_balance` DECIMAL(19,4) NULL,
  `club_country_code` VARCHAR(64) NULL,
  `club_division` VARCHAR(255) NULL,
  `club_friends_count` INT NULL,
  `club_id` INT UNSIGNED NULL,
  `club_logo_src` TEXT NULL,
  `club_name` VARCHAR(255) NULL,
  `country_code` VARCHAR(8) NULL,
  `created_at` DATETIME(6) NOT NULL,
  `current_club_flag` TINYINT(1) NULL,
  `division_value` VARCHAR(32) NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `logo_src` TEXT NULL,
  `managed_flag` TINYINT(1) NULL,
  `master_club_id` INT UNSIGNED NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `world_club_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`world_club_row_id`),
  CONSTRAINT `uq_gw_world_clubs_game_world_id_world_club_id_1` UNIQUE (`game_world_id`, `world_club_id`),
  KEY `ixfk_gw_world_clubs_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_sm_users` (
  `sm_user_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(6) NOT NULL,
  `image_src` TEXT NULL,
  `last_online` VARCHAR(255) NULL,
  `manager_image_src` TEXT NULL,
  `manager_reputation` INT NULL,
  `manager_unknown_flag` TINYINT(1) NULL,
  `sm_manager_id` BIGINT UNSIGNED NOT NULL,
  `sm_username` VARCHAR(180) NOT NULL,
  PRIMARY KEY (`sm_user_row_id`),
  CONSTRAINT `uq_gw_sm_users_sm_manager_id_1` UNIQUE (`sm_manager_id`),
  KEY `ix_gw_sm_users_sm_username_1` (`sm_username`),
  KEY `ixfk_gw_sm_users_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_sm_user_assignments` (
  `manager_assignment_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `assignment_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `assignment_target_key` VARCHAR(96) NOT NULL,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `entity_type` ENUM('CLUB','NATIONAL_TEAM') NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `is_current` TINYINT(1) NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_manager_id` BIGINT UNSIGNED NOT NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  `valid_from` DATETIME(6) NULL,
  `valid_to` DATETIME(6) NULL,
  `world_club_id` BIGINT UNSIGNED NULL,
  `world_national_team_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`manager_assignment_id`),
  CONSTRAINT `uq_gw_sm_user_assignments_assignment_fingerprint_1` UNIQUE (`assignment_fingerprint`),
  KEY `ixfk_gw_sm_user_assignments_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_sm_user_assignments_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_sm_user_assignments_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_manager_ranking_snapshots` (
  `manager_ranking_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `manager_average_points` DECIMAL(12,4) NULL,
  `manager_games` INT NULL,
  `manager_points` INT NULL,
  `manager_rank` INT NULL,
  `manager_ranking_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `ranking_type` VARCHAR(64) NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_manager_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  PRIMARY KEY (`manager_ranking_snapshot_id`),
  CONSTRAINT `uq_gw_manager_ranking_snapshots_manager_ranking_fingerprint_1` UNIQUE (`manager_ranking_fingerprint`),
  KEY `ix_gw_manager_ranking_snapshots_game_world_id_capture_d495cb1790` (`game_world_id`, `capture_id`, `ranking_type`, `sm_manager_id`),
  KEY `ixfk_gw_manager_ranking_snapshots_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_manager_ranking_snapshots_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_players` (
  `gw_player_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `first_seen_capture_id` BIGINT UNSIGNED NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `last_seen_capture_id` BIGINT UNSIGNED NOT NULL,
  `master_player_id` INT UNSIGNED NULL,
  `player_id` INT UNSIGNED NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`gw_player_row_id`),
  CONSTRAINT `uq_gw_players_game_world_id_player_id_1` UNIQUE (`game_world_id`, `player_id`),
  KEY `ixfk_gw_players_first_seen_capture_id` (`first_seen_capture_id`),
  KEY `ixfk_gw_players_last_seen_capture_id` (`last_seen_capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_player_profile_snapshots` (
  `player_profile_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `age` BIGINT UNSIGNED NULL,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `date_of_birth` DATE NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `height` DECIMAL(12,4) NULL,
  `image_src` TEXT NULL,
  `nation_code` VARCHAR(64) NULL,
  `observed_at` DATETIME(6) NOT NULL,
  `player_id` INT UNSIGNED NOT NULL,
  `player_name` VARCHAR(255) NULL,
  `positions` VARCHAR(255) NULL,
  `preferred_foot` VARCHAR(64) NULL,
  `real_soccerwiki_club` VARCHAR(255) NULL,
  `short_name` VARCHAR(255) NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `weight` DECIMAL(12,4) NULL,
  PRIMARY KEY (`player_profile_snapshot_id`),
  CONSTRAINT `uq_gw_player_profile_snapshots_game_world_id_player_i_ca5c304951` UNIQUE (`game_world_id`, `player_id`, `capture_id`),
  KEY `ixfk_gw_player_profile_snapshots_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_player_state_snapshots` (
  `player_state_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `concern` VARCHAR(64) NULL,
  `contract` VARCHAR(255) NULL,
  `created_at` DATETIME(6) NOT NULL,
  `fitness` DECIMAL(12,4) NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `international_status` VARCHAR(64) NULL,
  `loan_parent_club` VARCHAR(255) NULL,
  `loan_status` VARCHAR(64) NULL,
  `morale` DECIMAL(12,4) NULL,
  `observed_at` DATETIME(6) NOT NULL,
  `player_id` INT UNSIGNED NOT NULL,
  `previous_rating` INT NULL,
  `rating` INT NULL,
  `rating_delta` INT NULL,
  `shortlist_status` TINYINT(1) NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  `squad_status` VARCHAR(64) NULL,
  `transfer_ban` TINYINT(1) NULL,
  `transfer_ban_date` DATE NULL,
  `value` DECIMAL(19,4) NULL,
  `wage` DECIMAL(19,4) NULL,
  `world_club_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`player_state_snapshot_id`),
  CONSTRAINT `uq_gw_player_state_snapshots_game_world_id_player_id_5f85a3badc` UNIQUE (`game_world_id`, `player_id`, `capture_id`),
  KEY `ixfk_gw_player_state_snapshots_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_player_state_snapshots_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_squads` (
  `squad_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `observed_at` DATETIME(6) NOT NULL,
  `owner_type` ENUM('CLUB','NATIONAL_TEAM') NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  `squad_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `world_club_id` BIGINT UNSIGNED NULL,
  `world_national_team_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`squad_snapshot_id`),
  CONSTRAINT `uq_gw_squads_squad_identity_fingerprint_1` UNIQUE (`squad_identity_fingerprint`),
  KEY `ixfk_gw_squads_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_squads_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_squads_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_squad_members` (
  `squad_member_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `player_id` INT UNSIGNED NOT NULL,
  `raw_row_html` LONGTEXT NULL,
  `row_order` SMALLINT UNSIGNED NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `squad_section` VARCHAR(64) NULL,
  `squad_snapshot_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`squad_member_id`),
  CONSTRAINT `uq_gw_squad_members_squad_snapshot_id_player_id_1` UNIQUE (`squad_snapshot_id`, `player_id`),
  KEY `ixfk_gw_squad_members_game_world_id` (`game_world_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_player_stat_snapshots` (
  `player_stat_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `appearances` INT NULL,
  `assists` INT NULL,
  `average_performance` DECIMAL(12,4) NULL,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `clean_sheets_or_gk_stat` VARCHAR(255) NULL,
  `competition_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `goals` INT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `international_appearances` INT NULL,
  `international_assists` INT NULL,
  `international_average` DECIMAL(12,4) NULL,
  `international_goals` INT NULL,
  `international_mom` INT NULL,
  `international_red` INT NULL,
  `international_yellow` INT NULL,
  `man_of_match` INT NULL,
  `player_id` INT UNSIGNED NOT NULL,
  `player_stat_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `red_cards` INT NULL,
  `scope_type` VARCHAR(64) NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  `yellow_cards` INT NULL,
  PRIMARY KEY (`player_stat_snapshot_id`),
  CONSTRAINT `uq_gw_player_stat_snapshots_player_stat_identity_fingerprint_1` UNIQUE (`player_stat_identity_fingerprint`),
  KEY `ixfk_gw_player_stat_snapshots_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_player_stat_snapshots_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_player_stat_snapshots_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_player_leaderboard_snapshots` (
  `leaderboard_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `competition_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `leaderboard_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `leaderboard_type` VARCHAR(64) NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  PRIMARY KEY (`leaderboard_snapshot_id`),
  CONSTRAINT `uq_gw_player_leaderboard_snapshots_leaderboard_identi_f4d661f1e9` UNIQUE (`leaderboard_identity_fingerprint`),
  KEY `ixfk_gw_player_leaderboard_snapshots_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_player_leaderboard_snapshots_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_player_leaderboard_snapshots_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_player_leaderboard_rows` (
  `leaderboard_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `leaderboard_rank` INT NULL,
  `leaderboard_snapshot_id` BIGINT UNSIGNED NOT NULL,
  `leaderboard_type` VARCHAR(64) NULL,
  `player_id` INT UNSIGNED NOT NULL,
  `rank_position` SMALLINT UNSIGNED NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `stat_value_raw` VARCHAR(64) NULL,
  `world_club_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`leaderboard_row_id`),
  CONSTRAINT `uq_gw_player_leaderboard_rows_leaderboard_snapshot_id_0ca15dcfae` UNIQUE (`leaderboard_snapshot_id`, `player_id`),
  KEY `ixfk_gw_player_leaderboard_rows_game_world_id` (`game_world_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_stadiums` (
  `gw_stadium_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capacity` INT UNSIGNED NULL,
  `capture_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `image_src` TEXT NULL,
  `master_stadium_id` INT UNSIGNED NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `stadium_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `stadium_name` VARCHAR(180) NOT NULL,
  PRIMARY KEY (`gw_stadium_row_id`),
  CONSTRAINT `uq_gw_stadiums_game_world_id_stadium_identity_fingerprint_1` UNIQUE (`game_world_id`, `stadium_identity_fingerprint`),
  KEY `ixfk_gw_stadiums_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_fixtures` (
  `fixture_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `attendance` BIGINT UNSIGNED NULL,
  `away_name` VARCHAR(255) NULL,
  `away_world_club_id` BIGINT UNSIGNED NULL,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `competition_group_id` BIGINT UNSIGNED NULL,
  `competition_id` BIGINT UNSIGNED NULL,
  `competition_name` VARCHAR(255) NULL,
  `competition_round_id` BIGINT UNSIGNED NULL,
  `competition_stage_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(6) NOT NULL,
  `date` DATE NULL,
  `fixture_id` BIGINT UNSIGNED NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `home_away_flag` VARCHAR(64) NULL,
  `home_name` VARCHAR(255) NULL,
  `home_world_club_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `next_fixture_countdown` VARCHAR(255) NULL,
  `raw_row_html` LONGTEXT NULL,
  `result_onclick` TEXT NULL,
  `round_label` VARCHAR(255) NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  `status` VARCHAR(64) NULL,
  `time` TIME NULL,
  `turn` VARCHAR(255) NULL,
  `venue_id` VARCHAR(255) NULL,
  `venue_name` VARCHAR(255) NULL,
  PRIMARY KEY (`fixture_row_id`),
  CONSTRAINT `uq_gw_fixtures_game_world_id_fixture_id_1` UNIQUE (`game_world_id`, `fixture_id`),
  KEY `ixfk_gw_fixtures_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_fixtures_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_fixture_results` (
  `fixture_result_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `aggregate_away` BIGINT UNSIGNED NULL,
  `aggregate_home` BIGINT UNSIGNED NULL,
  `away_score` BIGINT UNSIGNED NULL,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `fixture_id` BIGINT UNSIGNED NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `home_score` BIGINT UNSIGNED NULL,
  `penalty_away` BIGINT UNSIGNED NULL,
  `penalty_home` BIGINT UNSIGNED NULL,
  `result_status` VARCHAR(64) NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `winner_side` ENUM('HOME','AWAY','DRAW','UNKNOWN') NULL,
  PRIMARY KEY (`fixture_result_id`),
  CONSTRAINT `uq_gw_fixture_results_game_world_id_fixture_id_capture_id_1` UNIQUE (`game_world_id`, `fixture_id`, `capture_id`),
  KEY `ixfk_gw_fixture_results_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_match_reports` (
  `match_report_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `away_sm_manager_id` BIGINT UNSIGNED NULL,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `fixture_id` BIGINT UNSIGNED NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `home_sm_manager_id` BIGINT UNSIGNED NULL,
  `raw_report_html` LONGTEXT NULL,
  `report_match_fixing_action` VARCHAR(255) NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `view_match_2d` TINYINT(1) NULL,
  PRIMARY KEY (`match_report_id`),
  CONSTRAINT `uq_gw_match_reports_game_world_id_fixture_id_capture_id_1` UNIQUE (`game_world_id`, `fixture_id`, `capture_id`),
  KEY `ixfk_gw_match_reports_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_match_team_stats` (
  `match_team_stat_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `corners` INT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `fouls` INT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `match_report_id` BIGINT UNSIGNED NOT NULL,
  `offside` INT NULL,
  `possession` DECIMAL(12,4) NULL,
  `shots` INT NULL,
  `shots_on_target` INT NULL,
  `side` ENUM('HOME','AWAY') NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `world_team_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`match_team_stat_id`),
  CONSTRAINT `uq_gw_match_team_stats_match_report_id_side_1` UNIQUE (`match_report_id`, `side`),
  KEY `ixfk_gw_match_team_stats_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_match_team_stats_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_match_lineups` (
  `match_lineup_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `formation` VARCHAR(255) NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `lineups` JSON NULL,
  `match_report_id` BIGINT UNSIGNED NOT NULL,
  `raw_lineup_html` LONGTEXT NULL,
  `side` ENUM('HOME','AWAY') NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `world_team_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`match_lineup_id`),
  CONSTRAINT `uq_gw_match_lineups_match_report_id_side_1` UNIQUE (`match_report_id`, `side`),
  KEY `ixfk_gw_match_lineups_game_world_id` (`game_world_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_match_lineup_players` (
  `match_lineup_player_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `is_substitute` TINYINT(1) NULL,
  `lineup_player_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `match_lineup_id` BIGINT UNSIGNED NOT NULL,
  `player_id` INT UNSIGNED NULL,
  `position_label` VARCHAR(64) NULL,
  `rating_raw` VARCHAR(32) NULL,
  `slot_order` SMALLINT UNSIGNED NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`match_lineup_player_id`),
  CONSTRAINT `uq_gw_match_lineup_players_lineup_player_fingerprint_1` UNIQUE (`lineup_player_fingerprint`),
  KEY `ixfk_gw_match_lineup_players_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_match_lineup_players_match_lineup_id` (`match_lineup_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_match_events` (
  `match_event_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `away_scorers` JSON NULL,
  `created_at` DATETIME(6) NOT NULL,
  `event_order` SMALLINT UNSIGNED NOT NULL,
  `event_type` VARCHAR(64) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `goal_minute` INT NULL,
  `goal_type` VARCHAR(64) NULL,
  `home_scorers` JSON NULL,
  `match_event_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `match_report_id` BIGINT UNSIGNED NOT NULL,
  `minute_raw` VARCHAR(32) NULL,
  `player_id` INT UNSIGNED NULL,
  `raw_event_html` LONGTEXT NULL,
  `related_player_id` INT UNSIGNED NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `substitutions` JSON NULL,
  `world_team_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`match_event_id`),
  CONSTRAINT `uq_gw_match_events_match_event_fingerprint_1` UNIQUE (`match_event_fingerprint`),
  KEY `ixfk_gw_match_events_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_match_events_match_report_id` (`match_report_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_match_commentary` (
  `commentary_event_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `commentary_event_minute` INT NULL,
  `commentary_text` VARCHAR(255) NULL,
  `created_at` DATETIME(6) NOT NULL,
  `event_order` SMALLINT UNSIGNED NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `match_report_id` BIGINT UNSIGNED NOT NULL,
  `raw_event_html` LONGTEXT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`commentary_event_id`),
  CONSTRAINT `uq_gw_match_commentary_match_report_id_event_order_1` UNIQUE (`match_report_id`, `event_order`),
  KEY `ixfk_gw_match_commentary_game_world_id` (`game_world_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_match_tactics_snapshots` (
  `match_tactics_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `formation_name` VARCHAR(64) NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `match_report_id` BIGINT UNSIGNED NOT NULL,
  `match_tactics_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `minute_from` SMALLINT UNSIGNED NULL,
  `raw_tactics_html` LONGTEXT NULL,
  `side` ENUM('HOME','AWAY') NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `tactics_snapshot` JSON NULL,
  PRIMARY KEY (`match_tactics_snapshot_id`),
  CONSTRAINT `uq_gw_match_tactics_snapshots_match_tactics_fingerprint_1` UNIQUE (`match_tactics_fingerprint`),
  KEY `ixfk_gw_match_tactics_snapshots_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_match_tactics_snapshots_match_report_id` (`match_report_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_standings_snapshots` (
  `standings_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `competition_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(6) NOT NULL,
  `division_id` BIGINT UNSIGNED NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `group_id` BIGINT UNSIGNED NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `league_table_type` VARCHAR(64) NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  `standings_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `table_type` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`standings_snapshot_id`),
  CONSTRAINT `uq_gw_standings_snapshots_standings_identity_fingerprint_1` UNIQUE (`standings_identity_fingerprint`),
  KEY `ixfk_gw_standings_snapshots_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_standings_snapshots_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_standings_snapshots_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_standings_rows` (
  `standings_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `drawn` INT NULL,
  `form_points` INT NULL,
  `form_sequence` JSON NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `goal_difference` INT NULL,
  `goals_against` INT NULL,
  `goals_for` INT NULL,
  `lost` INT NULL,
  `old_position` INT NULL,
  `played` INT NULL,
  `points` INT NULL,
  `position` INT NULL,
  `raw_row_html` LONGTEXT NULL,
  `row_order` SMALLINT UNSIGNED NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `standings_row_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `standings_snapshot_id` BIGINT UNSIGNED NOT NULL,
  `team_name_snapshot` VARCHAR(180) NOT NULL,
  `won` INT NULL,
  `world_team_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`standings_row_id`),
  CONSTRAINT `uq_gw_standings_rows_standings_row_fingerprint_1` UNIQUE (`standings_row_fingerprint`),
  KEY `ixfk_gw_standings_rows_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_standings_rows_standings_snapshot_id` (`standings_snapshot_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_attendance_snapshots` (
  `attendance_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `attendance_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `average` INT NULL,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `competition_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `gw_stadium_row_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  `stadium_capacity` INT NULL,
  `stadium_name` VARCHAR(255) NULL,
  `total` INT NULL,
  `world_club_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`attendance_snapshot_id`),
  CONSTRAINT `uq_gw_attendance_snapshots_attendance_identity_fingerprint_1` UNIQUE (`attendance_identity_fingerprint`),
  KEY `ixfk_gw_attendance_snapshots_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_attendance_snapshots_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_attendance_snapshots_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_transfers` (
  `transfer_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `cost_numeric` DECIMAL(12,4) NULL,
  `cost_raw` VARCHAR(255) NULL,
  `created_at` DATETIME(6) NOT NULL,
  `currency` VARCHAR(255) NULL,
  `date` DATE NULL,
  `direction` VARCHAR(64) NULL,
  `event_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `from_club_name` VARCHAR(255) NULL,
  `from_world_club_id` BIGINT UNSIGNED NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `player_id` INT UNSIGNED NULL,
  `player_value_at_event` DECIMAL(19,4) NULL,
  `raw_row_html` LONGTEXT NULL,
  `record_rank` INT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  `status` VARCHAR(255) NULL,
  `to_club_name` VARCHAR(255) NULL,
  `to_world_club_id` BIGINT UNSIGNED NULL,
  `transfer_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `transfer_id` VARCHAR(255) NULL,
  PRIMARY KEY (`transfer_row_id`),
  CONSTRAINT `uq_gw_transfers_game_world_id_transfer_fingerprint_1` UNIQUE (`game_world_id`, `transfer_fingerprint`),
  KEY `ixfk_gw_transfers_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_transfers_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_transfer_summary_snapshots` (
  `transfer_summary_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `average_spent` DECIMAL(19,4) NULL,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `page_offset_or_turn` INT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  `total_count` INT NULL,
  `total_spent` DECIMAL(19,4) NULL,
  `transfer_summary_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `world_club_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`transfer_summary_snapshot_id`),
  CONSTRAINT `uq_gw_transfer_summary_snapshots_transfer_summary_fingerprint_1` UNIQUE (`transfer_summary_fingerprint`),
  KEY `ixfk_gw_transfer_summary_snapshots_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_transfer_summary_snapshots_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_transfer_summary_snapshots_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_player_db_update_batches` (
  `db_update_batch_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `observed_date` DATE NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `tab_type` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`db_update_batch_id`),
  CONSTRAINT `uq_gw_player_db_update_batches_capture_id_tab_type_1` UNIQUE (`capture_id`, `tab_type`),
  KEY `ixfk_gw_player_db_update_batches_game_world_id` (`game_world_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_player_db_updates` (
  `db_update_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `db_update_batch_id` BIGINT UNSIGNED NOT NULL,
  `db_update_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `free_agent_label` VARCHAR(255) NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `new_positions` VARCHAR(255) NULL,
  `new_rating` INT NULL,
  `old_positions` VARCHAR(255) NULL,
  `old_rating` INT NULL,
  `player_id` INT UNSIGNED NOT NULL,
  `rating_change` INT NULL,
  `raw_row_html` LONGTEXT NULL,
  `row_order` INT UNSIGNED NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `update_date` DATE NULL,
  `update_type` VARCHAR(64) NULL,
  PRIMARY KEY (`db_update_row_id`),
  CONSTRAINT `uq_gw_player_db_updates_db_update_fingerprint_1` UNIQUE (`db_update_fingerprint`),
  KEY `ixfk_gw_player_db_updates_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_player_db_updates_db_update_batch_id` (`db_update_batch_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_tactic_snapshots` (
  `tactic_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `formation_name` VARCHAR(255) NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `imc_season` INT UNSIGNED NULL,
  `owner_type` ENUM('CLUB','NATIONAL_TEAM') NOT NULL,
  `raw_tactics_html` LONGTEXT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  `tactic_snapshot_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `world_team_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`tactic_snapshot_id`),
  CONSTRAINT `uq_gw_tactic_snapshots_tactic_snapshot_fingerprint_1` UNIQUE (`tactic_snapshot_fingerprint`),
  KEY `ixfk_gw_tactic_snapshots_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_tactic_snapshots_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_tactic_snapshots_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_tactic_slots` (
  `tactic_slot_row_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `captain` TINYINT(1) NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `lineup_order` INT NULL,
  `player_id` INT UNSIGNED NULL,
  `raw_slot_html` LONGTEXT NULL,
  `role` VARCHAR(255) NULL,
  `set_piece_taker` VARCHAR(64) NULL,
  `slot_id` VARCHAR(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `tactic_snapshot_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`tactic_slot_row_id`),
  CONSTRAINT `uq_gw_tactic_slots_tactic_snapshot_id_slot_id_1` UNIQUE (`tactic_snapshot_id`, `slot_id`),
  KEY `ix_gw_tactic_slots_player_id_1` (`player_id`),
  KEY `ixfk_gw_tactic_slots_game_world_id` (`game_world_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_tactic_instructions` (
  `tactic_instruction_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `display_order` SMALLINT UNSIGNED NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `in_game_trigger` VARCHAR(64) NULL,
  `instruction` VARCHAR(64) NULL,
  `instruction_type` VARCHAR(64) NULL,
  `instruction_value_raw` VARCHAR(255) NULL,
  `preset` VARCHAR(255) NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `tactic_instruction_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `tactic_snapshot_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`tactic_instruction_id`),
  CONSTRAINT `uq_gw_tactic_instructions_tactic_instruction_fingerprint_1` UNIQUE (`tactic_instruction_fingerprint`),
  KEY `ixfk_gw_tactic_instructions_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_tactic_instructions_tactic_snapshot_id` (`tactic_snapshot_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_tactic_substitutions` (
  `tactic_substitution_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `display_order` SMALLINT UNSIGNED NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `in_player_id` INT UNSIGNED NULL,
  `out_player_id` INT UNSIGNED NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `substitution_condition` VARCHAR(64) NULL,
  `substitution_minute` INT NULL,
  `tactic_snapshot_id` BIGINT UNSIGNED NOT NULL,
  `tactic_substitution_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (`tactic_substitution_id`),
  CONSTRAINT `uq_gw_tactic_substitutions_tactic_substitution_fingerprint_1` UNIQUE (`tactic_substitution_fingerprint`),
  KEY `ixfk_gw_tactic_substitutions_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_tactic_substitutions_tactic_snapshot_id` (`tactic_snapshot_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_honours` (
  `honour_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `competition_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `honour_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `imc_season` INT UNSIGNED NULL,
  `raw_row_html` LONGTEXT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  `winner_local_id` BIGINT UNSIGNED NULL,
  `winner_name_snapshot` VARCHAR(180) NOT NULL,
  `winner_type` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`honour_id`),
  CONSTRAINT `uq_gw_honours_honour_fingerprint_1` UNIQUE (`honour_fingerprint`),
  KEY `ixfk_gw_honours_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_honours_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_honours_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_history_snapshots` (
  `history_snapshot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gw_season_row_id` BIGINT UNSIGNED NULL,
  `history_section` VARCHAR(64) NOT NULL,
  `history_snapshot_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `imc_season` INT UNSIGNED NULL,
  `raw_section_html` LONGTEXT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_season_id` BIGINT UNSIGNED NULL,
  `soccer_manager_season` INT UNSIGNED NULL,
  PRIMARY KEY (`history_snapshot_id`),
  CONSTRAINT `uq_gw_history_snapshots_history_snapshot_fingerprint_1` UNIQUE (`history_snapshot_fingerprint`),
  KEY `ixfk_gw_history_snapshots_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_history_snapshots_gw_season_row_id` (`gw_season_row_id`),
  KEY `ixfk_gw_history_snapshots_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_news_items` (
  `news_item_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `fixture_id` BIGINT UNSIGNED NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `news_item_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `player_id` INT UNSIGNED NULL,
  `published_at` DATETIME(6) NULL,
  `published_raw` VARCHAR(100) NULL,
  `raw_item_html` LONGTEXT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `sm_manager_id` BIGINT UNSIGNED NULL,
  `source_message_id` VARCHAR(64) NULL,
  `text_raw` LONGTEXT NOT NULL,
  `world_club_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`news_item_id`),
  CONSTRAINT `uq_gw_news_items_game_world_id_news_item_fingerprint_1` UNIQUE (`game_world_id`, `news_item_fingerprint`),
  KEY `ixfk_gw_news_items_capture_id` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_source_page_types` (
  `page_type_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `function_description` VARCHAR(255) NOT NULL,
  `page_code` VARCHAR(16) NOT NULL,
  `page_name` VARCHAR(160) NOT NULL,
  `scope_status` VARCHAR(64) NOT NULL,
  `url_pattern` VARCHAR(500) NULL,
  PRIMARY KEY (`page_type_id`),
  CONSTRAINT `uq_gw_source_page_types_page_code_1` UNIQUE (`page_code`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_source_captures` (
  `capture_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_json` JSON NOT NULL,
  `capture_status` VARCHAR(32) NOT NULL,
  `charset` VARCHAR(255) NULL,
  `content_type` VARCHAR(64) NULL,
  `created_at` DATETIME(6) NOT NULL,
  `full_html` LONGTEXT NOT NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `generated_at` DATETIME(6) NULL,
  `hash` VARCHAR(255) NULL,
  `hostname` VARCHAR(255) NULL,
  `language` VARCHAR(64) NULL,
  `origin` TEXT NULL,
  `page_title` VARCHAR(255) NULL,
  `page_type_id` SMALLINT UNSIGNED NOT NULL,
  `parent_capture_id` BIGINT UNSIGNED NULL,
  `parser_version` VARCHAR(64) NULL,
  `pathname` VARCHAR(255) NULL,
  `ready_state` VARCHAR(64) NULL,
  `report_type` VARCHAR(64) NULL,
  `report_version` VARCHAR(32) NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `source_file_name` VARCHAR(255) NOT NULL,
  `source_file_sha256` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `source_identity_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `source_url` TEXT NULL,
  `user_agent` VARCHAR(255) NULL,
  PRIMARY KEY (`capture_id`),
  CONSTRAINT `uq_gw_source_captures_source_file_sha256_1` UNIQUE (`source_file_sha256`),
  CONSTRAINT `uq_gw_source_captures_source_identity_fingerprint_2` UNIQUE (`source_identity_fingerprint`),
  KEY `ixfk_gw_source_captures_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_source_captures_parent_capture_id` (`parent_capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_source_fragments` (
  `source_fragment_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `attributes_json` JSON NULL,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `dom_path` TEXT NULL,
  `entity_local_id` VARCHAR(64) NULL,
  `entity_type` VARCHAR(64) NULL,
  `fragment_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `fragment_hash` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `fragment_type` VARCHAR(64) NOT NULL,
  `raw_html` LONGTEXT NOT NULL,
  `raw_text` LONGTEXT NULL,
  PRIMARY KEY (`source_fragment_id`),
  CONSTRAINT `uq_gw_source_fragments_capture_id_fragment_fingerprint_1` UNIQUE (`capture_id`, `fragment_fingerprint`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_source_dom_nodes` (
  `dom_node_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `active_tab_class` VARCHAR(64) NULL,
  `alt` VARCHAR(255) NULL,
  `attributes_json` JSON NOT NULL,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `class_tokens` JSON NULL,
  `created_at` DATETIME(6) NOT NULL,
  `data_attributes` JSON NULL,
  `dom_id` VARCHAR(255) NULL,
  `dom_node_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `dom_path` TEXT NULL,
  `fragment_id` BIGINT UNSIGNED NULL,
  `hidden_value` VARCHAR(255) NULL,
  `href` TEXT NULL,
  `modal_target` VARCHAR(255) NULL,
  `name_attribute` VARCHAR(255) NULL,
  `onclick` TEXT NULL,
  `pagination_offset` INT NULL,
  `src` TEXT NULL,
  `style` TEXT NULL,
  `tag_name` VARCHAR(64) NOT NULL,
  `text_raw` LONGTEXT NULL,
  `title` VARCHAR(255) NULL,
  `value_attribute` VARCHAR(255) NULL,
  PRIMARY KEY (`dom_node_id`),
  CONSTRAINT `uq_gw_source_dom_nodes_capture_id_dom_node_fingerprint_1` UNIQUE (`capture_id`, `dom_node_fingerprint`),
  KEY `ixfk_gw_source_dom_nodes_fragment_id` (`fragment_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_source_payloads` (
  `source_payload_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `payload_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `payload_hash` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `payload_json` JSON NULL,
  `payload_key` VARCHAR(160) NULL,
  `payload_text` LONGTEXT NULL,
  `payload_type` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`source_payload_id`),
  CONSTRAINT `uq_gw_source_payloads_capture_id_payload_fingerprint_1` UNIQUE (`capture_id`, `payload_fingerprint`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_identity_matches` (
  `identity_match_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `confidence` ENUM('HIGH','MEDIUM','LOW') NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `entity_type` VARCHAR(64) NOT NULL,
  `evidence_json` JSON NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `identity_match_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `local_id` VARCHAR(64) NULL,
  `master_id` VARCHAR(64) NULL,
  `master_table` VARCHAR(64) NULL,
  `match_status` ENUM('MATCHED','CANDIDATE','UNMATCHED','NOT APPLICABLE') NOT NULL,
  `matched_at` DATETIME(6) NOT NULL,
  `matching_version` VARCHAR(64) NOT NULL,
  `notes` TEXT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `source_capture_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`identity_match_id`),
  CONSTRAINT `uq_gw_identity_matches_identity_match_fingerprint_1` UNIQUE (`identity_match_fingerprint`),
  KEY `ixfk_gw_identity_matches_game_world_id` (`game_world_id`),
  KEY `ixfk_gw_identity_matches_source_capture_id` (`source_capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_import_runs` (
  `import_run_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(6) NOT NULL,
  `finished_at` DATETIME(6) NULL,
  `game_world_id` VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `parser_version` VARCHAR(64) NOT NULL,
  `run_status` VARCHAR(32) NOT NULL,
  `run_uuid` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `sm_game_world_id` BIGINT UNSIGNED NULL,
  `source_capture_count` INT UNSIGNED NOT NULL,
  `started_at` DATETIME(6) NOT NULL,
  `stats_json` JSON NULL,
  PRIMARY KEY (`import_run_id`),
  CONSTRAINT `uq_gw_import_runs_run_uuid_1` UNIQUE (`run_uuid`),
  KEY `ixfk_gw_import_runs_game_world_id` (`game_world_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gw_import_issues` (
  `import_issue_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capture_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(6) NOT NULL,
  `entity_local_id` VARCHAR(64) NULL,
  `entity_type` VARCHAR(64) NULL,
  `fragment_id` BIGINT UNSIGNED NULL,
  `import_run_id` BIGINT UNSIGNED NULL,
  `issue_code` VARCHAR(64) NOT NULL,
  `issue_fingerprint` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `message` TEXT NOT NULL,
  `raw_context_json` JSON NULL,
  `severity` VARCHAR(16) NOT NULL,
  PRIMARY KEY (`import_issue_id`),
  CONSTRAINT `uq_gw_import_issues_issue_fingerprint_1` UNIQUE (`issue_fingerprint`),
  KEY `ix_gw_import_issues_import_run_id_1` (`import_run_id`),
  KEY `ix_gw_import_issues_capture_id_2` (`capture_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Phase 2: add the 121 certified internal foreign keys after every parent exists.

ALTER TABLE `gw_world_rules`
  ADD CONSTRAINT `fk_gw_world_rules_game_world_id_gw_game_worlds_game_world_id_1`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_world_rules`
  ADD CONSTRAINT `fk_gw_world_rules_capture_id_gw_source_captures_capture_id_2`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_seasons`
  ADD CONSTRAINT `fk_gw_seasons_game_world_id_gw_game_worlds_game_world_id_3`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_seasons`
  ADD CONSTRAINT `fk_gw_seasons_valid_from_capture_id_gw_source_capture_ad0d3496c3`
  FOREIGN KEY (`valid_from_capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_countries`
  ADD CONSTRAINT `fk_gw_countries_game_world_id_gw_game_worlds_game_world_id_5`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_countries`
  ADD CONSTRAINT `fk_gw_countries_capture_id_gw_source_captures_capture_id_6`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_divisions`
  ADD CONSTRAINT `fk_gw_divisions_game_world_id_gw_game_worlds_game_world_id_7`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_divisions`
  ADD CONSTRAINT `fk_gw_divisions_gw_season_row_id_gw_seasons_gw_season_row_id_8`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_national_teams`
  ADD CONSTRAINT `fk_gw_national_teams_game_world_id_gw_game_worlds_gam_fc7c4dedcf`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_national_teams`
  ADD CONSTRAINT `fk_gw_national_teams_capture_id_gw_source_captures_capture_id_10`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_competitions`
  ADD CONSTRAINT `fk_gw_competitions_game_world_id_gw_game_worlds_game_world_id_11`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_competition_editions`
  ADD CONSTRAINT `fk_gw_competition_editions_game_world_id_gw_game_worl_d711f66c53`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_competition_editions`
  ADD CONSTRAINT `fk_gw_competition_editions_gw_season_row_id_gw_season_1eb673995f`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_competition_editions`
  ADD CONSTRAINT `fk_gw_competition_editions_capture_id_gw_source_captu_7b7d9eb7ef`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_competition_stages`
  ADD CONSTRAINT `fk_gw_competition_stages_game_world_id_gw_game_worlds_f8b0511809`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_competition_rounds`
  ADD CONSTRAINT `fk_gw_competition_rounds_game_world_id_gw_game_worlds_5c1d9a490c`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_competition_groups`
  ADD CONSTRAINT `fk_gw_competition_groups_game_world_id_gw_game_worlds_c42aaf0545`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_world_clubs`
  ADD CONSTRAINT `fk_gw_world_clubs_game_world_id_gw_game_worlds_game_world_id_18`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_world_clubs`
  ADD CONSTRAINT `fk_gw_world_clubs_capture_id_gw_source_captures_capture_id_19`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_sm_users`
  ADD CONSTRAINT `fk_gw_sm_users_capture_id_gw_source_captures_capture_id_20`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_sm_user_assignments`
  ADD CONSTRAINT `fk_gw_sm_user_assignments_game_world_id_gw_game_world_d786eae04c`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_sm_user_assignments`
  ADD CONSTRAINT `fk_gw_sm_user_assignments_gw_season_row_id_gw_seasons_ccc8f57f8a`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_sm_user_assignments`
  ADD CONSTRAINT `fk_gw_sm_user_assignments_capture_id_gw_source_captur_59e6337fb2`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_manager_ranking_snapshots`
  ADD CONSTRAINT `fk_gw_manager_ranking_snapshots_game_world_id_gw_game_6660c2960d`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_manager_ranking_snapshots`
  ADD CONSTRAINT `fk_gw_manager_ranking_snapshots_gw_season_row_id_gw_s_902a323f18`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_manager_ranking_snapshots`
  ADD CONSTRAINT `fk_gw_manager_ranking_snapshots_capture_id_gw_source_08c49124bf`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_players`
  ADD CONSTRAINT `fk_gw_players_game_world_id_gw_game_worlds_game_world_id_27`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_players`
  ADD CONSTRAINT `fk_gw_players_first_seen_capture_id_gw_source_capture_e2f34fb72b`
  FOREIGN KEY (`first_seen_capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_players`
  ADD CONSTRAINT `fk_gw_players_last_seen_capture_id_gw_source_captures_4fb93aa309`
  FOREIGN KEY (`last_seen_capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_profile_snapshots`
  ADD CONSTRAINT `fk_gw_player_profile_snapshots_game_world_id_gw_game_b44f8e8c9e`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_profile_snapshots`
  ADD CONSTRAINT `fk_gw_player_profile_snapshots_capture_id_gw_source_c_55e722134d`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_state_snapshots`
  ADD CONSTRAINT `fk_gw_player_state_snapshots_game_world_id_gw_game_wo_655ea7dabb`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_state_snapshots`
  ADD CONSTRAINT `fk_gw_player_state_snapshots_gw_season_row_id_gw_seas_f2444efe02`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_state_snapshots`
  ADD CONSTRAINT `fk_gw_player_state_snapshots_capture_id_gw_source_cap_d93b669868`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_squads`
  ADD CONSTRAINT `fk_gw_squads_game_world_id_gw_game_worlds_game_world_id_35`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_squads`
  ADD CONSTRAINT `fk_gw_squads_gw_season_row_id_gw_seasons_gw_season_row_id_36`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_squads`
  ADD CONSTRAINT `fk_gw_squads_capture_id_gw_source_captures_capture_id_37`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_squad_members`
  ADD CONSTRAINT `fk_gw_squad_members_game_world_id_gw_game_worlds_game_f6527ec8fc`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_stat_snapshots`
  ADD CONSTRAINT `fk_gw_player_stat_snapshots_game_world_id_gw_game_wor_1416a6e6a8`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_stat_snapshots`
  ADD CONSTRAINT `fk_gw_player_stat_snapshots_gw_season_row_id_gw_seaso_e2bb5cc976`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_stat_snapshots`
  ADD CONSTRAINT `fk_gw_player_stat_snapshots_capture_id_gw_source_capt_4feaef8345`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_leaderboard_snapshots`
  ADD CONSTRAINT `fk_gw_player_leaderboard_snapshots_game_world_id_gw_g_0d7cdebf34`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_leaderboard_snapshots`
  ADD CONSTRAINT `fk_gw_player_leaderboard_snapshots_gw_season_row_id_g_32f7787ca7`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_leaderboard_snapshots`
  ADD CONSTRAINT `fk_gw_player_leaderboard_snapshots_capture_id_gw_sour_407ab6ce21`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_leaderboard_rows`
  ADD CONSTRAINT `fk_gw_player_leaderboard_rows_game_world_id_gw_game_w_a955b2df13`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_stadiums`
  ADD CONSTRAINT `fk_gw_stadiums_game_world_id_gw_game_worlds_game_world_id_46`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_stadiums`
  ADD CONSTRAINT `fk_gw_stadiums_capture_id_gw_source_captures_capture_id_47`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_fixtures`
  ADD CONSTRAINT `fk_gw_fixtures_game_world_id_gw_game_worlds_game_world_id_48`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_fixtures`
  ADD CONSTRAINT `fk_gw_fixtures_gw_season_row_id_gw_seasons_gw_season_row_id_49`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_fixtures`
  ADD CONSTRAINT `fk_gw_fixtures_capture_id_gw_source_captures_capture_id_50`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_fixture_results`
  ADD CONSTRAINT `fk_gw_fixture_results_game_world_id_gw_game_worlds_ga_50ac1945ff`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_fixture_results`
  ADD CONSTRAINT `fk_gw_fixture_results_capture_id_gw_source_captures_c_1b8f6b6b74`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_reports`
  ADD CONSTRAINT `fk_gw_match_reports_game_world_id_gw_game_worlds_game_b1d8597567`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_reports`
  ADD CONSTRAINT `fk_gw_match_reports_capture_id_gw_source_captures_capture_id_54`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_team_stats`
  ADD CONSTRAINT `fk_gw_match_team_stats_game_world_id_gw_game_worlds_g_8d89ed5498`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_team_stats`
  ADD CONSTRAINT `fk_gw_match_team_stats_capture_id_gw_source_captures_d74b046d69`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_lineups`
  ADD CONSTRAINT `fk_gw_match_lineups_game_world_id_gw_game_worlds_game_56450bb898`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_lineup_players`
  ADD CONSTRAINT `fk_gw_match_lineup_players_game_world_id_gw_game_worl_bf5f9c9dd8`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_events`
  ADD CONSTRAINT `fk_gw_match_events_game_world_id_gw_game_worlds_game_world_id_59`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_commentary`
  ADD CONSTRAINT `fk_gw_match_commentary_game_world_id_gw_game_worlds_g_b87704c09b`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_tactics_snapshots`
  ADD CONSTRAINT `fk_gw_match_tactics_snapshots_game_world_id_gw_game_w_eb1b1f05c8`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_standings_snapshots`
  ADD CONSTRAINT `fk_gw_standings_snapshots_game_world_id_gw_game_world_c102f861c2`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_standings_snapshots`
  ADD CONSTRAINT `fk_gw_standings_snapshots_gw_season_row_id_gw_seasons_9b8757f840`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_standings_snapshots`
  ADD CONSTRAINT `fk_gw_standings_snapshots_capture_id_gw_source_captur_0967b358b7`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_standings_rows`
  ADD CONSTRAINT `fk_gw_standings_rows_game_world_id_gw_game_worlds_gam_51f1c53c23`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_attendance_snapshots`
  ADD CONSTRAINT `fk_gw_attendance_snapshots_game_world_id_gw_game_worl_a011c0b883`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_attendance_snapshots`
  ADD CONSTRAINT `fk_gw_attendance_snapshots_gw_season_row_id_gw_season_1ac7c76ae7`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_attendance_snapshots`
  ADD CONSTRAINT `fk_gw_attendance_snapshots_capture_id_gw_source_captu_7dcc44109a`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_transfers`
  ADD CONSTRAINT `fk_gw_transfers_game_world_id_gw_game_worlds_game_world_id_69`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_transfers`
  ADD CONSTRAINT `fk_gw_transfers_gw_season_row_id_gw_seasons_gw_season_row_id_70`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_transfers`
  ADD CONSTRAINT `fk_gw_transfers_capture_id_gw_source_captures_capture_id_71`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_transfer_summary_snapshots`
  ADD CONSTRAINT `fk_gw_transfer_summary_snapshots_game_world_id_gw_gam_c9c0c1845e`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_transfer_summary_snapshots`
  ADD CONSTRAINT `fk_gw_transfer_summary_snapshots_gw_season_row_id_gw_df78c2b45d`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_transfer_summary_snapshots`
  ADD CONSTRAINT `fk_gw_transfer_summary_snapshots_capture_id_gw_source_caeff2926a`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_db_update_batches`
  ADD CONSTRAINT `fk_gw_player_db_update_batches_game_world_id_gw_game_421c25e727`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_db_update_batches`
  ADD CONSTRAINT `fk_gw_player_db_update_batches_capture_id_gw_source_c_70939f9f43`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_db_updates`
  ADD CONSTRAINT `fk_gw_player_db_updates_game_world_id_gw_game_worlds_48d8ba35fb`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_tactic_snapshots`
  ADD CONSTRAINT `fk_gw_tactic_snapshots_game_world_id_gw_game_worlds_g_a878cf2795`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_tactic_snapshots`
  ADD CONSTRAINT `fk_gw_tactic_snapshots_gw_season_row_id_gw_seasons_gw_adad1733d8`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_tactic_snapshots`
  ADD CONSTRAINT `fk_gw_tactic_snapshots_capture_id_gw_source_captures_32b058372a`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_tactic_slots`
  ADD CONSTRAINT `fk_gw_tactic_slots_game_world_id_gw_game_worlds_game_world_id_81`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_tactic_instructions`
  ADD CONSTRAINT `fk_gw_tactic_instructions_game_world_id_gw_game_world_9e5e6cd0e4`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_tactic_substitutions`
  ADD CONSTRAINT `fk_gw_tactic_substitutions_game_world_id_gw_game_worl_8060dd8edb`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_honours`
  ADD CONSTRAINT `fk_gw_honours_game_world_id_gw_game_worlds_game_world_id_84`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_honours`
  ADD CONSTRAINT `fk_gw_honours_gw_season_row_id_gw_seasons_gw_season_row_id_85`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_honours`
  ADD CONSTRAINT `fk_gw_honours_capture_id_gw_source_captures_capture_id_86`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_history_snapshots`
  ADD CONSTRAINT `fk_gw_history_snapshots_game_world_id_gw_game_worlds_3960efdb86`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_history_snapshots`
  ADD CONSTRAINT `fk_gw_history_snapshots_gw_season_row_id_gw_seasons_g_65aa284ac6`
  FOREIGN KEY (`gw_season_row_id`)
  REFERENCES `gw_seasons` (`gw_season_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_history_snapshots`
  ADD CONSTRAINT `fk_gw_history_snapshots_capture_id_gw_source_captures_652a004da1`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_news_items`
  ADD CONSTRAINT `fk_gw_news_items_game_world_id_gw_game_worlds_game_world_id_90`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_news_items`
  ADD CONSTRAINT `fk_gw_news_items_capture_id_gw_source_captures_capture_id_91`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_source_captures`
  ADD CONSTRAINT `fk_gw_source_captures_game_world_id_gw_game_worlds_ga_22fcdb997e`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_source_captures`
  ADD CONSTRAINT `fk_gw_source_captures_capture_id_gw_source_captures_c_63bab51a68`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_source_captures`
  ADD CONSTRAINT `fk_gw_source_captures_parent_capture_id_gw_source_cap_cc74f657e6`
  FOREIGN KEY (`parent_capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_source_fragments`
  ADD CONSTRAINT `fk_gw_source_fragments_capture_id_gw_source_captures_27746e9d96`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_source_dom_nodes`
  ADD CONSTRAINT `fk_gw_source_dom_nodes_capture_id_gw_source_captures_232ea69e95`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_source_payloads`
  ADD CONSTRAINT `fk_gw_source_payloads_capture_id_gw_source_captures_c_bd271ad0a8`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_identity_matches`
  ADD CONSTRAINT `fk_gw_identity_matches_game_world_id_gw_game_worlds_g_0e459e65ea`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_identity_matches`
  ADD CONSTRAINT `fk_gw_identity_matches_source_capture_id_gw_source_ca_373795795f`
  FOREIGN KEY (`source_capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_import_runs`
  ADD CONSTRAINT `fk_gw_import_runs_game_world_id_gw_game_worlds_game_world_id_100`
  FOREIGN KEY (`game_world_id`)
  REFERENCES `gw_game_worlds` (`game_world_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_import_issues`
  ADD CONSTRAINT `fk_gw_import_issues_capture_id_gw_source_captures_capture_id_101`
  FOREIGN KEY (`capture_id`)
  REFERENCES `gw_source_captures` (`capture_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_divisions`
  ADD CONSTRAINT `fk_gw_divisions_gw_country_id_gw_countries_gw_country_id_102`
  FOREIGN KEY (`gw_country_id`)
  REFERENCES `gw_countries` (`gw_country_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_competition_editions`
  ADD CONSTRAINT `fk_gw_competition_editions_gw_competition_row_id_gw_c_3d8583d888`
  FOREIGN KEY (`gw_competition_row_id`)
  REFERENCES `gw_competitions` (`gw_competition_row_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_competition_stages`
  ADD CONSTRAINT `fk_gw_competition_stages_competition_edition_id_gw_co_8a9c5e04b6`
  FOREIGN KEY (`competition_edition_id`)
  REFERENCES `gw_competition_editions` (`competition_edition_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_competition_rounds`
  ADD CONSTRAINT `fk_gw_competition_rounds_competition_stage_id_gw_comp_f775714a4f`
  FOREIGN KEY (`competition_stage_id`)
  REFERENCES `gw_competition_stages` (`competition_stage_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_competition_groups`
  ADD CONSTRAINT `fk_gw_competition_groups_competition_stage_id_gw_comp_8e2660d5a0`
  FOREIGN KEY (`competition_stage_id`)
  REFERENCES `gw_competition_stages` (`competition_stage_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_squad_members`
  ADD CONSTRAINT `fk_gw_squad_members_squad_snapshot_id_gw_squads_squad_f05ab50faf`
  FOREIGN KEY (`squad_snapshot_id`)
  REFERENCES `gw_squads` (`squad_snapshot_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_leaderboard_rows`
  ADD CONSTRAINT `fk_gw_player_leaderboard_rows_leaderboard_snapshot_id_73da30c9b7`
  FOREIGN KEY (`leaderboard_snapshot_id`)
  REFERENCES `gw_player_leaderboard_snapshots` (`leaderboard_snapshot_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_team_stats`
  ADD CONSTRAINT `fk_gw_match_team_stats_match_report_id_gw_match_repor_f03212387e`
  FOREIGN KEY (`match_report_id`)
  REFERENCES `gw_match_reports` (`match_report_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_lineups`
  ADD CONSTRAINT `fk_gw_match_lineups_match_report_id_gw_match_reports_20f1fcf524`
  FOREIGN KEY (`match_report_id`)
  REFERENCES `gw_match_reports` (`match_report_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_lineup_players`
  ADD CONSTRAINT `fk_gw_match_lineup_players_match_lineup_id_gw_match_l_5a4af268c9`
  FOREIGN KEY (`match_lineup_id`)
  REFERENCES `gw_match_lineups` (`match_lineup_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_events`
  ADD CONSTRAINT `fk_gw_match_events_match_report_id_gw_match_reports_m_bbd2f2a262`
  FOREIGN KEY (`match_report_id`)
  REFERENCES `gw_match_reports` (`match_report_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_commentary`
  ADD CONSTRAINT `fk_gw_match_commentary_match_report_id_gw_match_repor_85ae5cfd5c`
  FOREIGN KEY (`match_report_id`)
  REFERENCES `gw_match_reports` (`match_report_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_match_tactics_snapshots`
  ADD CONSTRAINT `fk_gw_match_tactics_snapshots_match_report_id_gw_matc_a107dabff8`
  FOREIGN KEY (`match_report_id`)
  REFERENCES `gw_match_reports` (`match_report_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_standings_rows`
  ADD CONSTRAINT `fk_gw_standings_rows_standings_snapshot_id_gw_standin_d2398b5f80`
  FOREIGN KEY (`standings_snapshot_id`)
  REFERENCES `gw_standings_snapshots` (`standings_snapshot_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_player_db_updates`
  ADD CONSTRAINT `fk_gw_player_db_updates_db_update_batch_id_gw_player_d8e8836667`
  FOREIGN KEY (`db_update_batch_id`)
  REFERENCES `gw_player_db_update_batches` (`db_update_batch_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_tactic_slots`
  ADD CONSTRAINT `fk_gw_tactic_slots_tactic_snapshot_id_gw_tactic_snaps_6032cc2849`
  FOREIGN KEY (`tactic_snapshot_id`)
  REFERENCES `gw_tactic_snapshots` (`tactic_snapshot_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_tactic_instructions`
  ADD CONSTRAINT `fk_gw_tactic_instructions_tactic_snapshot_id_gw_tacti_87dee42d64`
  FOREIGN KEY (`tactic_snapshot_id`)
  REFERENCES `gw_tactic_snapshots` (`tactic_snapshot_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_tactic_substitutions`
  ADD CONSTRAINT `fk_gw_tactic_substitutions_tactic_snapshot_id_gw_tact_b41db2b62a`
  FOREIGN KEY (`tactic_snapshot_id`)
  REFERENCES `gw_tactic_snapshots` (`tactic_snapshot_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_import_issues`
  ADD CONSTRAINT `fk_gw_import_issues_import_run_id_gw_import_runs_impo_3c3ab1a248`
  FOREIGN KEY (`import_run_id`)
  REFERENCES `gw_import_runs` (`import_run_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;

ALTER TABLE `gw_source_dom_nodes`
  ADD CONSTRAINT `fk_gw_source_dom_nodes_fragment_id_gw_source_fragment_70ec633436`
  FOREIGN KEY (`fragment_id`)
  REFERENCES `gw_source_fragments` (`source_fragment_id`)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;
