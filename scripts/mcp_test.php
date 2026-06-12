<?php
// Simple MCP Supabase test script
// Reads DB config from be-laravel/.env and attempts to query the database
function load_env($path) {
    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!$lines) return [];
    $out = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (!strpos($line, '=')) continue;
        [$k,$v] = array_map('trim', explode('=', $line, 2));
        $v = trim($v, "\"'");
        $out[$k] = $v;
    }
    return $out;
}

$envPath = __DIR__ . DIRECTORY_SEPARATOR . 'be-laravel' . DIRECTORY_SEPARATOR . '.env';
// allow running from repo root where this script is placed
if (!file_exists($envPath)) {
    $envPath = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'be-laravel' . DIRECTORY_SEPARATOR . '.env';
}
if (!file_exists($envPath)) {
    fwrite(STDERR, "Cannot find .env at expected location: $envPath\n");
    exit(2);
}

$env = load_env($envPath);
$host = $env['DB_HOST'] ?? getenv('DB_HOST');
$port = $env['DB_PORT'] ?? 5432;
$db = $env['DB_DATABASE'] ?? 'postgres';
$user = $env['DB_USERNAME'] ?? getenv('DB_USERNAME');
$pass = $env['DB_PASSWORD'] ?? getenv('DB_PASSWORD');
$sslmode = $env['DB_SSLMODE'] ?? 'require';

echo "Using DB host={$host} port={$port} db={$db} user={$user}\n";

$result = [
    'connected' => false,
    'error' => null,
    'info' => null,
    'tables' => []
];

// Try PDO first
try {
    $dsn = "pgsql:host={$host};port={$port};dbname={$db};sslmode={$sslmode}";
    $opts = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5];
    $pdo = new PDO($dsn, $user, $pass, $opts);
    $result['connected'] = true;
    $infoStmt = $pdo->query("select current_database() as database, current_user as user, current_schema() as schema");
    $result['info'] = $infoStmt->fetch(PDO::FETCH_ASSOC);
    $tblStmt = $pdo->prepare("select table_schema, table_name from information_schema.tables where table_schema='public' order by table_name limit 50");
    $tblStmt->execute();
    $result['tables'] = $tblStmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $result['error'] = 'PDO: ' . $e->getMessage();
    // try pg_connect as fallback
    try {
        $connStr = sprintf("host=%s port=%s dbname=%s user=%s password=%s sslmode=%s", $host, $port, $db, $user, $pass, $sslmode);
        $pg = @pg_connect($connStr);
        if ($pg) {
            $result['connected'] = true;
            $res = pg_query($pg, "select current_database() as database, current_user as user, current_schema() as schema");
            $result['info'] = pg_fetch_assoc($res);
            $res2 = pg_query($pg, "select table_schema, table_name from information_schema.tables where table_schema='public' order by table_name limit 50");
            $tables = [];
            while ($r = pg_fetch_assoc($res2)) $tables[] = $r;
            $result['tables'] = $tables;
        } else {
            $result['error'] .= ' | pg_connect failed';
        }
    } catch (Exception $e2) {
        $result['error'] .= ' | pg_fallback: ' . $e2->getMessage();
    }
}

echo json_encode($result, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) . "\n";
