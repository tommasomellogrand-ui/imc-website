from pathlib import Path

path = Path('.github/workflows/deploy-website-aruba.yml')
text = path.read_text()

old_validate = """          test -s api/imc-gateway/index.php\n          test -s api/imc-gateway/config.php\n"""
new_validate = """          test -s api/imc-gateway/index.php\n          test -s api/imc-gateway/config.php\n          test -s api/imc-gateway/database.php\n          php -l api/imc-gateway/index.php\n          php -l api/imc-gateway/database.php\n"""
if old_validate not in text:
    raise SystemExit('gateway validate anchor not found')
text = text.replace(old_validate, new_validate, 1)

old_files = """Path('api/imc-gateway/index.php'),Path('api/imc-gateway/config.php'),Path('api/imc-data/v1/site-ready.php')"""
new_files = """Path('api/imc-gateway/index.php'),Path('api/imc-gateway/config.php'),Path('api/imc-gateway/database.php'),Path('api/imc-data/v1/site-ready.php')"""
if old_files not in text:
    raise SystemExit('gateway upload anchor not found')
text = text.replace(old_files, new_files, 1)

path.write_text(text)
