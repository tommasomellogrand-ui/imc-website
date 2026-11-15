#!/usr/bin/env python3
"""Generate single-statement MySQL triggers accepted by Database Manager."""
import json
from pathlib import Path

tables = [
    "CREATE TABLE IF NOT EXISTS IMC_World_Cup_Editions (world_id VARCHAR(16) NOT NULL,edition_start DATE NOT NULL,imc_season INT NOT NULL,group_end DATE NOT NULL,final_date DATE NULL,PRIMARY KEY(world_id,edition_start)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS IMC_World_Cup_Fixtures (world_id VARCHAR(16) NOT NULL,sm_fixture_id BIGINT UNSIGNED NOT NULL,edition_start DATE NOT NULL,imc_season INT NOT NULL,match_date DATE NOT NULL,group_name VARCHAR(128) NULL,competition_stage VARCHAR(128) NULL,competition_round VARCHAR(128) NULL,home_id BIGINT UNSIGNED NOT NULL,away_id BIGINT UNSIGNED NOT NULL,home_name VARCHAR(255) NULL,away_name VARCHAR(255) NULL,report_revision BIGINT NOT NULL DEFAULT 0,PRIMARY KEY(world_id,sm_fixture_id),KEY edition_idx(world_id,edition_start),KEY identity_idx(world_id,match_date,home_id,away_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
]


def triggers(world):
    mr = f"{world}_Match_Reports"
    results = f"{world}_Results"
    where = (f"f.world_id='{world}' AND f.sm_fixture_id=NEW.sm_fixture_id "
             "AND (NEW.match_date IS NULL OR NEW.match_date=f.match_date) "
             "AND (NEW.home_sm_club_id IS NULL OR NEW.home_sm_club_id=0 OR NEW.home_sm_club_id=f.home_id) "
             "AND (NEW.away_sm_club_id IS NULL OR NEW.away_sm_club_id=0 OR NEW.away_sm_club_id=f.away_id)")
    lookup = lambda col: f"(SELECT {col} FROM IMC_World_Cup_Fixtures f WHERE {where})"
    assignments = [
        "NEW.sm_fixture_id=COALESCE(NULLIF(NEW.sm_fixture_id,0),(SELECT CASE WHEN COUNT(*)=1 THEN MAX(f.sm_fixture_id) END FROM IMC_World_Cup_Fixtures f "
        f"WHERE f.world_id='{world}' AND f.match_date=NEW.match_date AND f.home_id=NEW.home_sm_club_id AND f.away_id=NEW.away_sm_club_id))",
        f"NEW.sm_action=IF({lookup('f.sm_fixture_id')} IS NOT NULL,'worldcup',NEW.sm_action)",
        f"NEW.competition_key=IF({lookup('f.sm_fixture_id')} IS NOT NULL,'{world}|NATIONS|worldcup',NEW.competition_key)",
        f"NEW.competition_group=IF({lookup('f.sm_fixture_id')} IS NOT NULL,'NATIONS',NEW.competition_group)",
        f"NEW.imc_season=COALESCE({lookup('f.imc_season')},NEW.imc_season)",
        f"NEW.competition_stage=COALESCE({lookup('f.competition_stage')},NEW.competition_stage)",
        f"NEW.competition_round=IF({lookup('f.sm_fixture_id')} IS NOT NULL,{lookup('f.competition_round')},NEW.competition_round)",
        f"NEW.match_date=COALESCE(NEW.match_date,{lookup('f.match_date')})",
        f"NEW.home_sm_club_id=COALESCE(NULLIF(NEW.home_sm_club_id,0),{lookup('f.home_id')})",
        f"NEW.away_sm_club_id=COALESCE(NULLIF(NEW.away_sm_club_id,0),{lookup('f.away_id')})",
    ]
    columns = ["game_world_id", "imc_season", "sm_fixture_id", "competition_key", "sm_action", "sm_country", "sm_division", "competition_group", "competition_group_name", "competition_stage", "competition_round", "match_date", "home_sm_club_id", "home_name", "away_sm_club_id", "away_name", "home_sm_manager_id", "away_sm_manager_id", "home_score", "away_score", "result_status", "fingerprint", "imported_at"]
    values = [f"'{world}'", "f.imc_season", "f.sm_fixture_id", f"'{world}|NATIONS|worldcup'", "'worldcup'", "NEW.sm_country", "NEW.sm_division", "'NATIONS'", "f.group_name", "f.competition_stage", "f.competition_round", "f.match_date", "f.home_id", "COALESCE(f.home_name,NEW.home_name)", "f.away_id", "COALESCE(f.away_name,NEW.away_name)", "NEW.home_sm_manager_id", "NEW.away_sm_manager_id", "NEW.home_score", "NEW.away_score", "'COMPLETED'", "COALESCE(NULLIF(NEW.fingerprint,''),SHA2(CONCAT(f.world_id,'|worldcup|',f.sm_fixture_id),256))", "NEW.imported_at"]
    # The registry row lock serializes duplicate imports even on legacy Results tables without a UNIQUE fixture index.
    guard = where + " AND f.group_name IS NOT NULL AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL"
    identity = "(r.sm_fixture_id=f.sm_fixture_id OR ((r.sm_fixture_id IS NULL OR r.sm_fixture_id=0) AND r.match_date=f.match_date AND r.home_sm_club_id=f.home_id AND r.away_sm_club_id=f.away_id AND r.sm_action='worldcup'))"
    insert = f"INSERT INTO {results} ({','.join(columns)}) SELECT {','.join(values)} FROM IMC_World_Cup_Fixtures f WHERE {guard} AND NOT EXISTS (SELECT 1 FROM {results} r WHERE {identity})"
    updates = dict(zip(columns, values))
    for key in ["fingerprint", "imported_at", "home_name", "away_name"]:
        updates.pop(key)
    for key in ["home_sm_manager_id", "away_sm_manager_id"]:
        updates[key] = f"COALESCE(NEW.{key},r.{key})"
    update = f"UPDATE {results} r JOIN IMC_World_Cup_Fixtures f ON {identity} SET " + ','.join(f"r.{k}={v}" for k, v in updates.items()) + f" WHERE {guard}"
    out = []
    for event, suffix in [("INSERT", "i"), ("UPDATE", "u")]:
        out.append(f"CREATE TRIGGER imc_wc_{world.lower()}_b{suffix} BEFORE {event} ON {mr} FOR EACH ROW SET " + ','.join(assignments))
        for name, sql in [
            ("lock", f"UPDATE IMC_World_Cup_Fixtures f SET f.report_revision=f.report_revision+1 WHERE {guard}"),
            ("insert", insert), ("update", update)
        ]:
            out.append(f"CREATE TRIGGER imc_wc_{world.lower()}_a{suffix}_{name} AFTER {event} ON {mr} FOR EACH ROW {sql}")
    return out


if __name__ == '__main__':
    payload = {"tables": tables, "worlds": {f"IMC{n:03d}": triggers(f"IMC{n:03d}") for n in range(1, 11)}}
    dest = Path(__file__).resolve().parents[1] / 'database-migrations/20261115_worldcup_automation.json'
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
