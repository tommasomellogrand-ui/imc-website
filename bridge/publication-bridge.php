<?php
declare(strict_types=1);

/**
 * IMC PUBLICATION BRIDGE
 * Full file-management bridge for italianmastersclub.it
 *
 * Actions:
 * health, list, read, write, upload, import, delete, mkdir, rmdir,
 * move, copy, stat, exists, history
 *
 * Authorization:
 * Authorization: Bearer <token>
 * or X-IMC-Bridge-Token: <token>
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const BRIDGE_NAME = 'IMC Publication Bridge';
const VERSION = '2.0.0';

$configFile = __DIR__ . DIRECTORY_SEPARATOR . 'publication-config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'publication-config.php not found'], JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT);
    exit;
}
$config = require $configFile;
if (!is_array($config)) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'Invalid publication-config.php'], JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT);
    exit;
}

$ROOT = getenv('IMC_BRIDGE_ROOT') ?: (string)($config['root'] ?? '');
$TOKEN = getenv('IMC_BRIDGE_TOKEN') ?: (string)($config['token'] ?? '');
$HISTORY_DIR = getenv('IMC_BRIDGE_HISTORY_DIR') ?: (string)($config['history_dir'] ?? (__DIR__ . '/.publication-history'));
$MAX_BYTES = (int)($config['max_bytes'] ?? 52428800); // 50 MB default

function respond(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
function fail(int $status, string $error, array $extra = []): never {
    respond($status, array_merge(['ok'=>false,'bridge'=>BRIDGE_NAME,'version'=>VERSION,'error'=>$error,'timestamp'=>gmdate('c')], $extra));
}
function ok(array $data = []): never {
    respond(200, array_merge(['ok'=>true,'bridge'=>BRIDGE_NAME,'version'=>VERSION,'timestamp'=>gmdate('c')], $data));
}
function req_headers(): array {
    $headers = function_exists('getallheaders') ? (getallheaders() ?: []) : [];
    if (!$headers) {
        foreach ($_SERVER as $k => $v) {
            if (str_starts_with($k, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($k, 5)));
                $headers[$name] = (string)$v;
            }
        }
    }
    $out = [];
    foreach ($headers as $k => $v) $out[strtolower((string)$k)] = (string)$v;
    return $out;
}
function authenticate(string $expected): void {
    if ($expected === '' || $expected === 'CHANGE_ME_IMC_BRIDGE_TOKEN') fail(500, 'Bridge token is not configured.');
    $headers = req_headers();
    $provided = '';
    $auth = $headers['authorization'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) $provided = trim($m[1]);
    elseif (!empty($headers['x-imc-bridge-token'])) $provided = trim($headers['x-imc-bridge-token']);
    if ($provided === '' || !hash_equals($expected, $provided)) fail(401, 'Unauthorized.');
}
function request_data(): array {
    $contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
    if (str_contains($contentType, 'multipart/form-data') || str_contains($contentType, 'application/x-www-form-urlencoded')) {
        return is_array($_POST) ? $_POST : [];
    }
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return [];
    $data = json_decode($raw, true);
    if (!is_array($data)) fail(400, 'Invalid JSON body.');
    return $data;
}
function root_real(string $root): string {
    if ($root === '' || !is_dir($root)) fail(500, 'Configured root does not exist.', ['configured_root'=>$root]);
    $real = realpath($root);
    if ($real === false) fail(500, 'Unable to resolve configured root.');
    return rtrim($real, DIRECTORY_SEPARATOR);
}
function normalize_rel(string $path): string {
    $path = str_replace('\\', '/', trim($path));
    $path = preg_replace('#/+#', '/', $path) ?? $path;
    $path = ltrim($path, '/');
    $parts = [];
    foreach (explode('/', $path) as $p) {
        if ($p === '' || $p === '.') continue;
        if ($p === '..') {
            if (!$parts) fail(400, 'Path escapes bridge root.');
            array_pop($parts);
            continue;
        }
        if (str_contains($p, "\0")) fail(400, 'Invalid path.');
        $parts[] = $p;
    }
    return implode('/', $parts);
}
function abs_path(string $root, string $rel): string {
    $rel = normalize_rel($rel);
    return $rel === '' ? $root : $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rel);
}
function ensure_inside_root(string $root, string $target): void {
    $probe = (file_exists($target) || is_link($target)) ? $target : dirname($target);
    while (!file_exists($probe) && dirname($probe) !== $probe) $probe = dirname($probe);
    $real = realpath($probe);
    if ($real === false) fail(400, 'Unable to resolve path.');
    $real = rtrim($real, DIRECTORY_SEPARATOR);
    if ($real !== $root && !str_starts_with($real . DIRECTORY_SEPARATOR, $root . DIRECTORY_SEPARATOR)) fail(403, 'Path escapes bridge root.');
}
function mkdirs(string $dir): void {
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) fail(500, 'Unable to create directory.', ['directory'=>$dir]);
}
function snapshot(string $historyDir, string $root, string $path): void {
    if (!file_exists($path) || !is_file($path)) return;
    mkdirs($historyDir);
    $rel = ltrim(str_replace($root, '', $path), DIRECTORY_SEPARATOR);
    $safe = str_replace([DIRECTORY_SEPARATOR, '/', '\\'], '__', $rel);
    $dst = rtrim($historyDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . gmdate('Ymd_His') . '__' . bin2hex(random_bytes(3)) . '__' . $safe;
    @copy($path, $dst);
}
function remove_tree(string $path): bool {
    if (is_file($path) || is_link($path)) return @unlink($path);
    if (!is_dir($path)) return false;
    foreach (scandir($path) ?: [] as $item) {
        if ($item === '.' || $item === '..') continue;
        if (!remove_tree($path . DIRECTORY_SEPARATOR . $item)) return false;
    }
    return @rmdir($path);
}
function copy_tree(string $src, string $dst): bool {
    if (is_file($src)) { mkdirs(dirname($dst)); return @copy($src, $dst); }
    if (!is_dir($src)) return false;
    mkdirs($dst);
    foreach (scandir($src) ?: [] as $item) {
        if ($item === '.' || $item === '..') continue;
        if (!copy_tree($src . DIRECTORY_SEPARATOR . $item, $dst . DIRECTORY_SEPARATOR . $item)) return false;
    }
    return true;
}
function write_payload(array $body, string $path, int $maxBytes): int {
    if (isset($_FILES['file']) && is_array($_FILES['file']) && (int)($_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        $f = $_FILES['file'];
        if ((int)$f['error'] !== UPLOAD_ERR_OK) fail(400, 'Multipart upload failed.', ['upload_error'=>(int)$f['error']]);
        $size = (int)($f['size'] ?? 0);
        if ($size > $maxBytes) fail(413, 'File exceeds max_bytes.', ['bytes'=>$size,'max_bytes'=>$maxBytes]);
        if (!is_uploaded_file((string)$f['tmp_name'])) fail(400, 'Invalid uploaded file.');
        if (!move_uploaded_file((string)$f['tmp_name'], $path)) fail(500, 'Unable to store uploaded file.');
        return (int)(filesize($path) ?: 0);
    }
    $content = $body['content'] ?? null;
    if (!is_string($content)) fail(400, 'Missing content or multipart file field named "file".');
    $encoding = strtolower((string)($body['encoding'] ?? 'utf-8'));
    if ($encoding === 'base64') {
        $decoded = base64_decode($content, true);
        if ($decoded === false) fail(400, 'Invalid base64 content.');
        $content = $decoded;
    } elseif (!in_array($encoding, ['utf-8','utf8','text','raw'], true)) {
        fail(400, 'Unsupported encoding.', ['encoding'=>$encoding]);
    }
    if (strlen($content) > $maxBytes) fail(413, 'Content exceeds max_bytes.', ['bytes'=>strlen($content),'max_bytes'=>$maxBytes]);
    $bytes = file_put_contents($path, $content, LOCK_EX);
    if ($bytes === false) fail(500, 'Unable to write file.');
    return $bytes;
}

authenticate($TOKEN);
$ROOT_REAL = root_real($ROOT);
mkdirs($HISTORY_DIR);
$body = request_data();
$action = strtolower((string)($body['action'] ?? $_GET['action'] ?? 'health'));

switch ($action) {
    case 'health':
        ok(['root'=>$ROOT_REAL,'writable'=>is_writable($ROOT_REAL),'max_bytes'=>$MAX_BYTES,'actions'=>['health','list','read','write','upload','import','delete','mkdir','rmdir','move','copy','stat','exists','history']]);

    case 'list':
        $rel=(string)($body['path']??''); $path=abs_path($ROOT_REAL,$rel); ensure_inside_root($ROOT_REAL,$path);
        if(!is_dir($path)) fail(404,'Directory not found.'); $items=[];
        foreach(scandir($path)?:[] as $name){ if($name==='.'||$name==='..')continue; $p=$path.DIRECTORY_SEPARATOR.$name; $items[]=['name'=>$name,'type'=>is_dir($p)?'directory':'file','size'=>is_file($p)?filesize($p):null,'modified_at'=>gmdate('c',filemtime($p)?:time()),'writable'=>is_writable($p)]; }
        ok(['path'=>normalize_rel($rel),'items'=>$items]);

    case 'read':
        $rel=(string)($body['path']??''); $path=abs_path($ROOT_REAL,$rel); ensure_inside_root($ROOT_REAL,$path); if(!is_file($path))fail(404,'File not found.');
        $content=file_get_contents($path); if($content===false)fail(500,'Unable to read file.');
        $base64=(bool)($body['base64']??false); ok(['path'=>normalize_rel($rel),'encoding'=>$base64?'base64':'utf-8','content'=>$base64?base64_encode($content):$content,'bytes'=>strlen($content)]);

    case 'write':
    case 'upload':
    case 'import':
        $rel=(string)($body['path']??($_POST['path']??'')); if($rel==='')fail(400,'Missing path.');
        $path=abs_path($ROOT_REAL,$rel); ensure_inside_root($ROOT_REAL,$path); mkdirs(dirname($path)); if(file_exists($path))snapshot($HISTORY_DIR,$ROOT_REAL,$path);
        $bytes=write_payload($body,$path,$MAX_BYTES); ok(['action'=>$action,'path'=>normalize_rel($rel),'bytes'=>$bytes]);

    case 'delete':
        $rel=(string)($body['path']??''); if($rel==='')fail(400,'Missing path.'); $path=abs_path($ROOT_REAL,$rel); ensure_inside_root($ROOT_REAL,$path); if(!is_file($path)&&!is_link($path))fail(404,'File not found.'); snapshot($HISTORY_DIR,$ROOT_REAL,$path); if(!@unlink($path))fail(500,'Unable to delete file.'); ok(['action'=>'delete','path'=>normalize_rel($rel)]);

    case 'mkdir':
        $rel=(string)($body['path']??''); if($rel==='')fail(400,'Missing path.'); $path=abs_path($ROOT_REAL,$rel); ensure_inside_root($ROOT_REAL,$path); mkdirs($path); ok(['action'=>'mkdir','path'=>normalize_rel($rel)]);

    case 'rmdir':
        $rel=(string)($body['path']??''); if($rel==='')fail(400,'Missing path.'); $path=abs_path($ROOT_REAL,$rel); ensure_inside_root($ROOT_REAL,$path); if($path===$ROOT_REAL)fail(403,'Cannot remove bridge root.'); if(!is_dir($path))fail(404,'Directory not found.'); $recursive=(bool)($body['recursive']??false); $done=$recursive?remove_tree($path):@rmdir($path); if(!$done)fail(500,'Unable to remove directory.'); ok(['action'=>'rmdir','path'=>normalize_rel($rel),'recursive'=>$recursive]);

    case 'move':
        $from=(string)($body['source']??''); $to=(string)($body['destination']??''); if($from===''||$to==='')fail(400,'Missing source or destination.'); $src=abs_path($ROOT_REAL,$from); $dst=abs_path($ROOT_REAL,$to); ensure_inside_root($ROOT_REAL,$src); ensure_inside_root($ROOT_REAL,$dst); if(!file_exists($src)&&!is_link($src))fail(404,'Source not found.'); mkdirs(dirname($dst));
        if(file_exists($dst)){ if(!(bool)($body['overwrite']??false))fail(409,'Destination exists.'); if(is_file($dst))snapshot($HISTORY_DIR,$ROOT_REAL,$dst); if(is_dir($dst)?!remove_tree($dst):!@unlink($dst))fail(500,'Unable to replace destination.'); }
        if(!@rename($src,$dst))fail(500,'Unable to move path.'); ok(['action'=>'move','source'=>normalize_rel($from),'destination'=>normalize_rel($to)]);

    case 'copy':
        $from=(string)($body['source']??''); $to=(string)($body['destination']??''); if($from===''||$to==='')fail(400,'Missing source or destination.'); $src=abs_path($ROOT_REAL,$from); $dst=abs_path($ROOT_REAL,$to); ensure_inside_root($ROOT_REAL,$src); ensure_inside_root($ROOT_REAL,$dst); if(!file_exists($src))fail(404,'Source not found.');
        if(file_exists($dst)&&!(bool)($body['overwrite']??false))fail(409,'Destination exists.'); if(file_exists($dst)){ if(is_dir($dst))remove_tree($dst); else {snapshot($HISTORY_DIR,$ROOT_REAL,$dst); @unlink($dst);} }
        if(!copy_tree($src,$dst))fail(500,'Unable to copy path.'); ok(['action'=>'copy','source'=>normalize_rel($from),'destination'=>normalize_rel($to)]);

    case 'stat':
        $rel=(string)($body['path']??''); $path=abs_path($ROOT_REAL,$rel); ensure_inside_root($ROOT_REAL,$path); if(!file_exists($path)&&!is_link($path))fail(404,'Path not found.'); ok(['path'=>normalize_rel($rel),'type'=>is_dir($path)?'directory':'file','size'=>is_file($path)?filesize($path):null,'modified_at'=>gmdate('c',filemtime($path)?:time()),'permissions'=>substr(sprintf('%o',fileperms($path)),-4),'writable'=>is_writable($path)]);

    case 'exists':
        $rel=(string)($body['path']??''); $path=abs_path($ROOT_REAL,$rel); ensure_inside_root($ROOT_REAL,$path); ok(['path'=>normalize_rel($rel),'exists'=>file_exists($path)||is_link($path)]);

    case 'history':
        $items=[]; foreach(scandir($HISTORY_DIR)?:[] as $name){ if($name==='.'||$name==='..')continue; $p=$HISTORY_DIR.DIRECTORY_SEPARATOR.$name; if(!is_file($p))continue; $items[]=['name'=>$name,'size'=>filesize($p),'modified_at'=>gmdate('c',filemtime($p)?:time())]; } usort($items,fn($a,$b)=>strcmp($b['modified_at'],$a['modified_at'])); ok(['items'=>$items]);

    default: fail(422,'Unknown action.',['action'=>$action]);
}
