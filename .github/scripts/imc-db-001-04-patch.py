from pathlib import Path


def replace(path: str, old: str, new: str, label: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Expected block not found: {label} in {path}")
    p.write_text(text.replace(old, new, 1))


p = Path("api/imc-gateway/index.php")
text = p.read_text()
text = text.replace("function public_gateway_version(): string { return '1.9.0'; }", "function public_gateway_version(): string { return '1.9.1'; }", 1)
text = text.replace("function public_core_tables(): array { return ['gw_manager_assignments','imc_managers','clubs_game_world_id']; }", "function public_core_tables(): array { return ['gw_manager_assignments'=>'IMC Manager Assignment Global','imc_managers'=>'IMC Manager Codex Global']; }", 1)
old = "function normalize_public_rows(array $rows, string $repo): array {\n  if ($repo === 'schedule' || $repo === 'site_schedule') {\n"
new = "function normalize_public_rows(array $rows, string $repo): array {\n  if ($repo === 'gw_manager_assignments') {\n    foreach ($rows as &$row) {\n      $row['team_id'] = $row['club_id'] ?? null;\n      $row['nation_id'] = $row['national_team_id'] ?? null;\n      if (!array_key_exists('season_id',$row)) $row['season_id'] = null;\n    }\n    unset($row);\n  }\n  if ($repo === 'schedule' || $repo === 'site_schedule') {\n"
if old not in text:
    raise SystemExit("gateway normalize block not found")
text = text.replace(old, new, 1)
old = "  if ($source === 'core') {\n    if (!in_array($repo,public_core_tables(),true)) out(['ok'=>false,'error'=>'core_repository_not_enabled'],422);\n    try { $pdo=imc_core_db($cfg); read_public_table($pdo,$repo,$gw,$repo,'core'); } catch(Throwable $e) { out(['ok'=>false,'error'=>'gateway_read_error'],500); }\n  }\n"
new = "  if ($source === 'core') {\n    $coreTables=public_core_tables();\n    if (!isset($coreTables[$repo])) out(['ok'=>false,'error'=>'core_repository_not_enabled'],422);\n    try { $pdo=imc_core_db($cfg); read_public_table($pdo,$coreTables[$repo],$gw,$repo,'core'); } catch(Throwable $e) { out(['ok'=>false,'error'=>'gateway_read_error'],500); }\n  }\n"
if old not in text:
    raise SystemExit("gateway core branch not found")
p.write_text(text.replace(old, new, 1))

replace(
    "api/imc-data/v1/index.php",
    "'SELECT manager_id,full_name,sm_manager_id,sm_username FROM imc_managers ORDER BY full_name,manager_id'",
    "'SELECT manager_id,full_name,sm_manager_id,NULL AS sm_username FROM `IMC Manager Codex Global` ORDER BY full_name,manager_id'",
    "api manager identity",
)

replace(
    "__imc-sm-master/admin/ingestion/handlers/manager-scan.php",
    "$core=smm_db();$r=$core->query('SELECT sm_manager_id,full_name FROM imc_managers WHERE sm_manager_id IS NOT NULL');$out=[];",
    "$core=smm_db();$r=$core->query('SELECT sm_manager_id,full_name FROM `IMC Manager Codex Global` WHERE sm_manager_id IS NOT NULL');$out=[];",
    "manager scan identity",
)

replace(
    "__imc-sm-master/admin/ingestion/handlers/match-report.php",
    "$core=smm_db();$sql='SELECT a.assignment_id,a.manager_id,a.team_id,a.nation_id,a.assignment_type,a.start_date,a.end_date,m.sm_manager_id,m.sm_username FROM gw_manager_assignments a LEFT JOIN imc_managers m ON m.manager_id=a.manager_id WHERE a.game_world_id=?';",
    "$core=smm_db();$sql='SELECT a.id AS assignment_id,a.manager_id,a.club_id AS team_id,a.national_team_id AS nation_id,a.assignment_type,a.start_date,a.end_date,m.sm_manager_id,NULL AS sm_username FROM `IMC Manager Assignment Global` a LEFT JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id WHERE a.game_world_id=?';",
    "match report assignments",
)

replace(
    "__imc-sm-master/admin/ingestion/handlers/match-report.php",
    "$core=smm_db();$q=$core->prepare('SELECT 1 FROM gw_manager_assignments a LEFT JOIN imc_managers m ON m.manager_id=a.manager_id WHERE a.game_world_id=? AND a.start_date<=? AND (a.end_date IS NULL OR a.end_date>=?) AND ((a.team_id IS NOT NULL AND a.team_id IN (?,?)) OR (m.sm_manager_id IS NOT NULL AND m.sm_manager_id IN (?,?))) LIMIT 1');",
    "$core=smm_db();$q=$core->prepare('SELECT 1 FROM `IMC Manager Assignment Global` a LEFT JOIN `IMC Manager Codex Global` m ON m.manager_id=a.manager_id WHERE a.game_world_id=? AND a.start_date<=? AND (a.end_date IS NULL OR a.end_date>=?) AND ((a.club_id IS NOT NULL AND a.club_id IN (?,?)) OR (m.sm_manager_id IS NOT NULL AND m.sm_manager_id IN (?,?))) LIMIT 1');",
    "match report managed check",
)
