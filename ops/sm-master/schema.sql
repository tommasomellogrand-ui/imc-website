-- IMC | SM MASTER DATABASE
-- Baseline model: 2026-09-03
-- Global Soccer Manager / SoccerWiki data only. No Game World data.

CREATE TABLE IF NOT EXISTS source_snapshots (
  snapshot_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_code VARCHAR(32) NOT NULL,
  snapshot_date DATE NOT NULL,
  source_filename VARCHAR(255) NOT NULL,
  sha256 CHAR(64) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  imported_at DATETIME NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  counts_json LONGTEXT NULL,
  error_message TEXT NULL,
  PRIMARY KEY (snapshot_id),
  UNIQUE KEY uq_source_sha256 (source_code, sha256),
  KEY idx_source_date (source_code, snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS import_errors (
  error_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  snapshot_id BIGINT UNSIGNED NULL,
  source_code VARCHAR(32) NULL,
  phase VARCHAR(80) NULL,
  error_message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (error_id),
  KEY idx_error_snapshot (snapshot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sm_players_source (
  player_id INT UNSIGNED NOT NULL,
  forename VARCHAR(100) NOT NULL DEFAULT '',
  surname VARCHAR(100) NOT NULL DEFAULT '',
  image_file VARCHAR(255) NOT NULL DEFAULT '',
  image_base_url VARCHAR(500) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  first_snapshot_id BIGINT UNSIGNED NOT NULL,
  last_snapshot_id BIGINT UNSIGNED NOT NULL,
  active_latest TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (player_id),
  KEY idx_sm_players_active (active_latest),
  KEY idx_sm_players_last_snapshot (last_snapshot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sm_clubs_source (
  club_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  image_file VARCHAR(255) NOT NULL DEFAULT '',
  image_base_url VARCHAR(500) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  first_snapshot_id BIGINT UNSIGNED NOT NULL,
  last_snapshot_id BIGINT UNSIGNED NOT NULL,
  active_latest TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (club_id),
  KEY idx_sm_clubs_active (active_latest)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sw_players_source (
  player_id INT UNSIGNED NOT NULL,
  forename VARCHAR(100) NOT NULL DEFAULT '',
  surname VARCHAR(100) NOT NULL DEFAULT '',
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  first_snapshot_id BIGINT UNSIGNED NOT NULL,
  last_snapshot_id BIGINT UNSIGNED NOT NULL,
  active_latest TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (player_id),
  KEY idx_sw_players_active (active_latest)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sw_clubs_source (
  club_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  short_name VARCHAR(16) NOT NULL DEFAULT '',
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  first_snapshot_id BIGINT UNSIGNED NOT NULL,
  last_snapshot_id BIGINT UNSIGNED NOT NULL,
  active_latest TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (club_id),
  KEY idx_sw_clubs_active (active_latest)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sw_leagues_source (
  league_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  first_snapshot_id BIGINT UNSIGNED NOT NULL,
  last_snapshot_id BIGINT UNSIGNED NOT NULL,
  active_latest TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (league_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sw_cups_source (
  cup_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  first_snapshot_id BIGINT UNSIGNED NOT NULL,
  last_snapshot_id BIGINT UNSIGNED NOT NULL,
  active_latest TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (cup_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sw_stadiums_source (
  stadium_id INT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  first_snapshot_id BIGINT UNSIGNED NOT NULL,
  last_snapshot_id BIGINT UNSIGNED NOT NULL,
  active_latest TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (stadium_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sw_football_managers_source (
  manager_id INT UNSIGNED NOT NULL,
  forename VARCHAR(120) NOT NULL DEFAULT '',
  surname VARCHAR(120) NOT NULL DEFAULT '',
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  first_snapshot_id BIGINT UNSIGNED NOT NULL,
  last_snapshot_id BIGINT UNSIGNED NOT NULL,
  active_latest TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sw_national_teams_source (
  national_team_id VARCHAR(16) NOT NULL,
  name VARCHAR(160) NOT NULL,
  short_name VARCHAR(16) NOT NULL DEFAULT '',
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  first_snapshot_id BIGINT UNSIGNED NOT NULL,
  last_snapshot_id BIGINT UNSIGNED NOT NULL,
  active_latest TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (national_team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sw_international_cups_source (
  international_cup_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  first_snapshot_id BIGINT UNSIGNED NOT NULL,
  last_snapshot_id BIGINT UNSIGNED NOT NULL,
  active_latest TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (international_cup_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sw_awards_source (
  award_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  first_snapshot_id BIGINT UNSIGNED NOT NULL,
  last_snapshot_id BIGINT UNSIGNED NOT NULL,
  active_latest TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (award_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sw_player_images_source (
  player_id INT UNSIGNED NOT NULL,
  image_action_url VARCHAR(700) NOT NULL DEFAULT '',
  image_action_peak_url VARCHAR(700) NOT NULL DEFAULT '',
  image_peak_url VARCHAR(700) NOT NULL DEFAULT '',
  image_youth_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  first_snapshot_id BIGINT UNSIGNED NOT NULL,
  last_snapshot_id BIGINT UNSIGNED NOT NULL,
  active_latest TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Canonical master tables. Soccer Manager is preferred when the same global ID exists in both sources.
CREATE TABLE IF NOT EXISTS players (
  player_id INT UNSIGNED NOT NULL,
  forename VARCHAR(100) NOT NULL DEFAULT '',
  surname VARCHAR(100) NOT NULL DEFAULT '',
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  canonical_source VARCHAR(32) NOT NULL,
  present_in_sm TINYINT(1) NOT NULL DEFAULT 0,
  present_in_soccerwiki TINYINT(1) NOT NULL DEFAULT 0,
  source_conflict TINYINT(1) NOT NULL DEFAULT 0,
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (player_id),
  KEY idx_players_active (is_active),
  KEY idx_players_name (surname, forename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clubs (
  club_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  short_name VARCHAR(16) NOT NULL DEFAULT '',
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  canonical_source VARCHAR(32) NOT NULL,
  present_in_sm TINYINT(1) NOT NULL DEFAULT 0,
  present_in_soccerwiki TINYINT(1) NOT NULL DEFAULT 0,
  source_conflict TINYINT(1) NOT NULL DEFAULT 0,
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (club_id),
  KEY idx_clubs_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leagues (
  league_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (league_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cups (
  cup_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (cup_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stadiums (
  stadium_id INT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (stadium_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS football_managers (
  manager_id INT UNSIGNED NOT NULL,
  forename VARCHAR(120) NOT NULL DEFAULT '',
  surname VARCHAR(120) NOT NULL DEFAULT '',
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (manager_id),
  KEY idx_football_managers_name (surname, forename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS national_teams (
  national_team_id VARCHAR(16) NOT NULL,
  name VARCHAR(160) NOT NULL,
  short_name VARCHAR(16) NOT NULL DEFAULT '',
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (national_team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS international_cups (
  international_cup_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (international_cup_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS awards (
  award_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  image_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (award_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS player_images (
  player_id INT UNSIGNED NOT NULL,
  image_action_url VARCHAR(700) NOT NULL DEFAULT '',
  image_action_peak_url VARCHAR(700) NOT NULL DEFAULT '',
  image_peak_url VARCHAR(700) NOT NULL DEFAULT '',
  image_youth_url VARCHAR(700) NOT NULL DEFAULT '',
  first_seen_date DATE NOT NULL,
  last_seen_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
