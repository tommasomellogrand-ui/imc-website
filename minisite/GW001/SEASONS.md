# GW001 global season state

Source: Aruba CORE (`Sql1956795_1`), `IMC Game World Season`, restricted to `game_world_id = 'GW001'`.

Operational source verification uses Supabase project (`toanuzojdkfjgucztpze`) → `private.imc_aruba_request` (`action=query`, `target=core`) → Database Manager Aruba. The deployed site uses its existing private server configuration and `imc_minisite_db()` CORE connection for the fixed SELECT in `api.php`. No credentials reach the frontend.

`POST /minisite/GW001/api.php` with `{"game_world_id":"GW001","resource":"seasons"}` reads every available season on each request. It does not use the versioned dossier snapshot, fixture dates, or a stored season number. Adding a row needs no rebuild or deploy.

The response contains `game_world_id`, `source`, `timezone`, `today`, `read_at`, `seasons`, `current_season`, and `current_status`. Each season contains `game_world_id`, integer `imc_season`, nullable integer `soccer_manager_season`, nullable `imc_season_start_date` and `imc_season_end_date`, and boolean `is_current`.

The server compares today's date in Europe/Rome with both dates, inclusively. Incomplete date intervals are not treated as current. No match returns `current_season: null`; overlapping intervals return `current_status: "ambiguous"` and no arbitrary selection. Other statuses are `current`, `no_current`, and `empty`.

Both page controllers start the same module. All ten menu pages expose the immutable state at `window.IMC_GW001.seasonState`; components may also import `worldState` from `./world-state.js?v=GW001_SEASONS_01`. Consumers can await `worldState.refreshSeasons()` or listen to `imc:gw001:season-change` (`event.detail` contains the state). Check `status === "ready"` before consuming season data. Loading and errors have no current season; errors do not block existing page content.

Concurrent consumers share one pending request. Reads occur at page load, when returning to the visible page, and every 60 seconds while visible. No session/local storage or immutable snapshot caches the season. Results, Schedule and Match Report are neither filtered nor assigned a season by this integration. No selector or layout change is included.

Validation: `php minisite/GW001/seasons.test.php`, `node --test minisite/GW001/world-state.test.mjs`, and the season acceptance checks in `verify.py --live` run in the GW001 deploy workflow.
