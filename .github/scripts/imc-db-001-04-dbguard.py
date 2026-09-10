from pathlib import Path
p=Path('__imc-sm-master/admin/database-manager/index.php')
text=p.read_text()
old_version="const IMC_DBM_VERSION = '1.5.1';"
new_version="const IMC_DBM_VERSION = '1.5.2';"
if old_version not in text:
    raise SystemExit('Expected Database Manager v1.5.1 marker not found')
text=text.replace(old_version,new_version,1)
old="if ($dropTable && str_starts_with(strtoupper((string)$dropTableMatch[1]), 'IMC')) throw new InvalidArgumentException('DROP TABLE is forbidden for IMC-prefixed tables.');"
new="if ($dropTable && str_starts_with((string)$dropTableMatch[1], 'IMC_')) throw new InvalidArgumentException('DROP TABLE is forbidden for protected IMC_ identifiers.');"
if old not in text:
    raise SystemExit('Expected IMC drop protection line not found')
text=text.replace(old,new,1)
p.write_text(text)
