from pathlib import Path


def replace(path, old, new, label):
    p = Path(path)
    if not p.is_file():
        raise SystemExit(f'missing {label}: {path}')
    s = p.read_text()
    if old not in s:
        raise SystemExit(f'anchor not found for {label}: {path}')
    p.write_text(s.replace(old, new, 1))

# 1) Block legacy CORE schema installers and snapshot writers in all active ops copies.
for path in [
    'ops/sm-master/admin/core.php',
    'ops/__imc-sm-master/admin/core.php',
    'ops/__imc-sm-master copy 1/admin/core.php',
]:
    replace(
        path,
        "function smm_install_schema(): array {\n    $schema = dirname(__DIR__) . '/schema.sql';",
        "function smm_install_schema(): array {\n    throw new RuntimeException('legacy_core_removed: schema installation disabled by IMC-DB-001-05');\n    $schema = dirname(__DIR__) . '/schema.sql';",
        'legacy schema installer',
    )
    replace(
        path,
        "function smm_create_snapshot(string $source, string $date, string $filename, string $path): array {\n    $db = smm_db();",
        "function smm_create_snapshot(string $source, string $date, string $filename, string $path): array {\n    throw new RuntimeException('legacy_core_removed: source import pipeline disabled by IMC-DB-001-05');\n    $db = smm_db();",
        'legacy snapshot writer',
    )

# 2) Block canonical rebuilds that write deleted projections.
for path in [
    'ops/sm-master/admin/canonical.php',
    'ops/__imc-sm-master/admin/canonical.php',
    'ops/__imc-sm-master copy 1/admin/canonical.php',
]:
    replace(
        path,
        "function smm_rebuild_canonical(): array {\n    $db=smm_db(); $db->begin_transaction();",
        "function smm_rebuild_canonical(): array {\n    throw new RuntimeException('legacy_core_removed: canonical rebuild disabled by IMC-DB-001-05');\n    $db=smm_db(); $db->begin_transaction();",
        'legacy canonical rebuild',
    )

# 3) Block the old CORE ingestion library before it can recreate ingestion/manager/world tables.
replace(
    'ops/sm-master/admin/ingestion.php',
    "function smm_ingestion_tables(mysqli $db):void{\n",
    "function smm_ingestion_tables(mysqli $db):void{\n    throw new RuntimeException('legacy_core_removed: legacy CORE ingestion schema disabled by IMC-DB-001-05');\n",
    'legacy ingestion table creator',
)
replace(
    'ops/sm-master/admin/ingestion.php',
    "function smm_handle_ingestion():never{",
    "function smm_handle_ingestion():never{throw new RuntimeException('legacy_core_removed: legacy CORE ingestion disabled by IMC-DB-001-05');",
    'legacy ingestion dispatcher',
)

# 4) Current ingestion handlers rely on deleted CORE context/mappings. Fail explicitly before dispatch.
replace(
    '__imc-sm-master/admin/ingestion/router.php',
    "function ingestion_route(mysqli $db, array $body, string $type, string $action): never {\n",
    "function ingestion_route(mysqli $db, array $body, string $type, string $action): never {\n    ingestion_fail('legacy_core_removed: ingestion rebuild required after IMC-DB-001-04', 503);\n",
    'current ingestion router guard',
)

# 5) Team Hub: asset identity has an exact IMC source; world-local datasets do not.
replace(
    'api/imc-gateway/team-hub.php',
    "$stmt = $core->prepare('SELECT image_url FROM clubs WHERE club_id=? LIMIT 1');",
    "$stmt = $core->prepare('SELECT image_url FROM `IMC Club Codex Global` WHERE id=? LIMIT 1');",
    'team hub club asset',
)
replace(
    'api/imc-gateway/team-hub.php',
    "$stmt = $core->prepare('SELECT image_url FROM national_teams WHERE national_team_id=? LIMIT 1');",
    "$stmt = $core->prepare('SELECT image_url FROM `IMC National Team Codex Global` WHERE id=? LIMIT 1');",
    'team hub nation asset',
)
replace(
    'api/imc-gateway/team-hub.php',
    "  if (!in_array($dataset,['clubs','nations'],true)) team_hub_out(['ok'=>false,'error'=>'invalid_dataset'],422);\n\n  if ($dataset === 'clubs') {",
    "  if (!in_array($dataset,['clubs','nations'],true)) team_hub_out(['ok'=>false,'error'=>'invalid_dataset'],422);\n  team_hub_out(['ok'=>false,'error'=>'core_mapping_rebuild_required','dataset'=>$dataset],503);\n\n  if ($dataset === 'clubs') {",
    'team hub world mapping guard',
)

# 6) Site-ready enrichment that depended on deleted local club mapping becomes an explicit no-op.
p = Path('api/imc-data/v1/site-ready.php')
s = p.read_text()
needle = 'function core_club_assets('
if needle in s:
    start = s.index(needle)
    brace = s.index('{', start)
    depth = 0
    end = None
    for i in range(brace, len(s)):
        if s[i] == '{': depth += 1
        elif s[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        raise SystemExit('core_club_assets function end not found')
    header = s[start:brace+1]
    s = s[:start] + header + "\n    return []; // world-local CORE mapping removed by IMC-DB-001-04; rebuild required.\n}" + s[end:]
    p.write_text(s)
else:
    raise SystemExit('core_club_assets function not found')
