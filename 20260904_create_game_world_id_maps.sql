-- IMC CORE · canonical mappings between global identities and Game World identities.
-- Applied to Sql1956795_1 on 2026-09-04.

CREATE TABLE IF NOT EXISTS clubs_game_world_id (
    club_id INT UNSIGNED NOT NULL,
    game_world_id VARCHAR(5) NOT NULL,
    club_gw_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (club_id, game_world_id),
    UNIQUE KEY uq_clubs_game_world_local (game_world_id, club_gw_id),
    KEY idx_clubs_game_world (game_world_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nations_game_world_id (
    nation_id BIGINT UNSIGNED NOT NULL,
    game_world_id VARCHAR(5) NOT NULL,
    nation_gw_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (nation_id, game_world_id),
    UNIQUE KEY uq_nations_game_world_local (game_world_id, nation_gw_id),
    KEY idx_nations_game_world (game_world_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
