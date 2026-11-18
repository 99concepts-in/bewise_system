<?php
/**
 * @owner HUB · BeWise API core — config, database, responses, ids, time, crypto, rate limits.
 * Works on any Hostinger plan (PHP 8.1+, MySQL/MariaDB). No Composer dependencies on purpose.
 *
 * Private config lives OUTSIDE public_html (written once by /api/install.php):
 *   1. env BEWISE_CONFIG (absolute path), else
 *   2. <parent of document root>/bewise-private/config.php, else
 *   3. api/storage/config.php (web access denied by api/storage/.htaccess)
 * Never commit a config file. Never paste its values into chat, issues or commits.
 */
declare(strict_types=1);

const BW_API_VERSION = '1.0.0';
const BW_TZ = 'Asia/Kolkata';

final class ApiError extends Exception
{
    public function __construct(public string $errCode, string $message, public int $http = 400)
    {
        parent::__construct($message);
    }
}

function bw_fail(string $code, string $message, int $http = 400): never
{
    throw new ApiError($code, $message, $http);
}

// ───────────── config ─────────────
function bw_config_candidates(): array
{
    $c = [];
    if ($env = getenv('BEWISE_CONFIG')) $c[] = $env;
    $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    if ($docRoot !== '') $c[] = dirname(rtrim($docRoot, '/')) . '/bewise-private/config.php';
    $c[] = dirname(__DIR__) . '/storage/config.php';
    return $c;
}

function bw_config_path(): ?string
{
    foreach (bw_config_candidates() as $p) if (is_file($p)) return $p;
    return null;
}

function bw_config(?string $key = null, mixed $default = null): mixed
{
    $cfg = $GLOBALS['__bw_cfg'] ?? null;
    if ($cfg === null) {
        $p = bw_config_path();
        $cfg = $p ? (require $p) : [];
        if (!is_array($cfg)) $cfg = [];
        $GLOBALS['__bw_cfg'] = $cfg;
    }
    if ($key === null) return $cfg;
    $v = $cfg;
    foreach (explode('.', $key) as $k) {
        if (!is_array($v) || !array_key_exists($k, $v)) return $default;
        $v = $v[$k];
    }
    return $v;
}

// ───────────── database ─────────────
function db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;
    $d = bw_config('db');
    if (!$d) bw_fail('not_installed', 'The BeWise server is not set up yet. Open /api/install.php.', 503);
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $d['host'], (int)($d['port'] ?? 3306), $d['name']);
    $pdo = new PDO($dsn, $d['user'], $d['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec("SET time_zone = '+00:00'");
    return $pdo;
}

function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}
function one(string $sql, array $params = []): ?array { $r = q($sql, $params)->fetch(); return $r === false ? null : $r; }
function all(string $sql, array $params = []): array { return q($sql, $params)->fetchAll(); }
function val(string $sql, array $params = []): mixed { $r = q($sql, $params)->fetchColumn(); return $r === false ? null : $r; }

function insert(string $table, array $row): void
{
    $cols = array_keys($row);
    $sql = sprintf('INSERT INTO %s (%s) VALUES (%s)', $table,
        implode(',', array_map(fn($c) => "`$c`", $cols)), implode(',', array_fill(0, count($cols), '?')));
    q($sql, array_map(fn($v) => is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : (is_bool($v) ? (int)$v : $v), array_values($row)));
}

function update(string $table, array $set, string $where, array $params = []): int
{
    $parts = []; $vals = [];
    foreach ($set as $k => $v) { $parts[] = "`$k` = ?"; $vals[] = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : (is_bool($v) ? (int)$v : $v); }
    return q("UPDATE $table SET " . implode(', ', $parts) . " WHERE $where", [...$vals, ...$params])->rowCount();
}

function tx(callable $fn): mixed
{
    $pdo = db();
    if ($pdo->inTransaction()) return $fn();
    $pdo->beginTransaction();
    try { $r = $fn(); $pdo->commit(); return $r; }
    catch (Throwable $e) { $pdo->rollBack(); throw $e; }
}

// ───────────── migrations ─────────────
function bw_migrate(): array
{
    $pdo = db();
    $pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(190) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $done = array_flip($pdo->query('SELECT name FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN));
    $files = glob(dirname(__DIR__) . '/migrations/*.sql') ?: [];
    sort($files);
    $applied = [];
    foreach ($files as $f) {
        $name = basename($f);
        if (isset($done[$name])) continue;
        $sql = preg_replace('/^\s*--.*$/m', '', (string)file_get_contents($f));
        foreach (array_filter(array_map('trim', preg_split('/;\s*\n/', (string)$sql))) as $stmt) $pdo->exec($stmt);
        $pdo->prepare('INSERT INTO schema_migrations (name) VALUES (?)')->execute([$name]);
        $applied[] = $name;
    }
    return $applied;
}

/** Runs pending migrations once per deploy (cheap file check), so a new migration goes live with the next push. */
function bw_auto_migrate(): void
{
    $files = glob(dirname(__DIR__) . '/migrations/*.sql') ?: [];
    $stamp = md5(implode('|', array_map('basename', $files)));
    $marker = bw_storage_dir() . '/migrated-' . $stamp;
    if (is_file($marker)) return;
    bw_migrate();
    require_once __DIR__ . '/seed.php';
    bw_seed();
    @file_put_contents($marker, gmdate('c'));
}

function bw_storage_dir(): string
{
    $p = bw_config_path();
    $dir = ($p && !str_starts_with($p, dirname(__DIR__))) ? dirname($p) : dirname(__DIR__) . '/storage';
    if (!is_dir($dir)) @mkdir($dir, 0750, true);
    return $dir;
}

// ───────────── ids, codes, time ─────────────
function uuid(): string
{
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

function next_counter(string $name): int
{
    q('INSERT INTO counters (name, value) VALUES (?, 1) ON DUPLICATE KEY UPDATE value = LAST_INSERT_ID(value + 1)', [$name]);
    $id = (int)db()->lastInsertId();
    return $id > 0 ? $id : (int)val('SELECT value FROM counters WHERE name = ?', [$name]);
}

/** Financial year label for a date, Apr–Mar: 2026-11-18 → "2026-27". */
function fy_label(?DateTimeImmutable $d = null): string
{
    $d ??= now_local();
    $y = (int)$d->format('Y');
    $start = ((int)$d->format('n')) >= 4 ? $y : $y - 1;
    return sprintf('%d-%02d', $start, ($start + 1) % 100);
}

function make_code(string $kind): string
{
    return match ($kind) {
        'client' => sprintf('BW-C-%05d', next_counter('client')),
        'appointment' => sprintf('BW-A-%05d', next_counter('appointment')),
        'order' => sprintf('BW-%05d', next_counter('order')),
        'invoice' => sprintf('INV/%s/%04d', $fy = fy_label(), next_counter("invoice:$fy")),
        'expense' => sprintf('EXP/%s/%04d', $fy = fy_label(), next_counter("expense:$fy")),
        default => bw_fail('bad_code_kind', $kind, 500),
    };
}

function now_utc(): string { return gmdate('Y-m-d H:i:s'); }
function now_local(): DateTimeImmutable { return new DateTimeImmutable('now', new DateTimeZone(BW_TZ)); }

/** Accepts ISO 8601 (any offset) → 'Y-m-d H:i:s' UTC for the database. */
function to_db_time(?string $iso): ?string
{
    if ($iso === null || $iso === '') return null;
    try { $d = new DateTimeImmutable($iso, new DateTimeZone(BW_TZ)); }
    catch (Exception) { bw_fail('bad_time', "Not a valid date/time: $iso"); }
    return $d->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
}

/** Database UTC → ISO 8601 with Z, for the apps. */
function iso(?string $dbTime): ?string
{
    if ($dbTime === null) return null;
    return (new DateTimeImmutable($dbTime, new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
}

function jdec(?string $json, mixed $default = []): mixed
{
    if ($json === null || $json === '') return $default;
    $v = json_decode($json, true);
    return $v ?? $default;
}

// ───────────── crypto (sensitive columns) ─────────────
function bw_key(): string
{
    $k = bw_config('app_key');
    if (!$k) bw_fail('not_installed', 'Missing app key', 503);
    return sodium_crypto_generichash(base64_decode($k), '', SODIUM_CRYPTO_SECRETBOX_KEYBYTES);
}

/** @sensitive encrypts intake answers, case summaries and practitioner notes at rest. */
function seal(mixed $data): string
{
    $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    return 'v1:' . base64_encode($nonce . sodium_crypto_secretbox(json_encode($data, JSON_UNESCAPED_UNICODE), $nonce, bw_key()));
}

function unseal(?string $blob): mixed
{
    if (!$blob || !str_starts_with($blob, 'v1:')) return null;
    $raw = base64_decode(substr($blob, 3));
    $nonce = substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    $plain = sodium_crypto_secretbox_open(substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), $nonce, bw_key());
    return $plain === false ? null : json_decode($plain, true);
}

// ───────────── request helpers ─────────────
function client_ip(): string { return substr((string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? ''), 0, 64); }

/** Fixed-window limiter. Throws rate_limited when exceeded. */
function rate_limit(string $bucket, int $max, int $windowSeconds): void
{
    $start = gmdate('Y-m-d H:i:s', intdiv(time(), $windowSeconds) * $windowSeconds);
    q('INSERT INTO rate_limits (bucket, window_start, hits) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE hits = hits + 1', [$bucket, $start]);
    $hits = (int)val('SELECT hits FROM rate_limits WHERE bucket = ? AND window_start = ?', [$bucket, $start]);
    if ($hits > $max) bw_fail('rate_limited', 'Too many tries. Please wait a few minutes and try again.', 429);
    if (random_int(1, 50) === 1) q('DELETE FROM rate_limits WHERE window_start < ?', [gmdate('Y-m-d H:i:s', time() - 86400)]);
}

function audit(string $action, ?string $entity = null, ?string $entityId = null, ?array $detail = null): void
{
    insert('audit_logs', ['id' => uuid(), 'actor_id' => Auth::userId(), 'action' => $action, 'entity' => $entity,
        'entity_id' => $entityId, 'detail' => $detail, 'ip' => client_ip()]);
}

// ───────────── input validation ─────────────
function req_str(array $in, string $k, int $max = 190, bool $required = true): ?string
{
    $v = $in[$k] ?? null;
    if ($v === null || $v === '') { if ($required) bw_fail('invalid_input', "Missing $k"); return null; }
    if (!is_string($v) && !is_numeric($v)) bw_fail('invalid_input', "$k must be text");
    $v = trim((string)$v);
    if (mb_strlen($v) > $max) bw_fail('invalid_input', "$k is too long");
    return $v;
}
function req_int(array $in, string $k, ?int $min = null, ?int $max = null, bool $required = true): ?int
{
    $v = $in[$k] ?? null;
    if ($v === null || $v === '') { if ($required) bw_fail('invalid_input', "Missing $k"); return null; }
    if (!is_numeric($v) || (int)$v != $v) bw_fail('invalid_input', "$k must be a whole number");
    $v = (int)$v;
    if (($min !== null && $v < $min) || ($max !== null && $v > $max)) bw_fail('invalid_input', "$k is out of range");
    return $v;
}
function req_enum(array $in, string $k, array $allowed, bool $required = true): ?string
{
    $v = $in[$k] ?? null;
    if ($v === null || $v === '') { if ($required) bw_fail('invalid_input', "Missing $k"); return null; }
    if (!in_array($v, $allowed, true)) bw_fail('invalid_input', "$k must be one of: " . implode(', ', $allowed));
    return $v;
}
function req_arr(array $in, string $k, bool $required = false): array
{
    $v = $in[$k] ?? null;
    if ($v === null) { if ($required) bw_fail('invalid_input', "Missing $k"); return []; }
    if (!is_array($v)) bw_fail('invalid_input', "$k must be a list");
    return $v;
}
function req_email(array $in, string $k = 'email'): string
{
    $v = strtolower((string)req_str($in, $k));
    if (!filter_var($v, FILTER_VALIDATE_EMAIL)) bw_fail('invalid_email', 'Please enter a valid email address.');
    return $v;
}

/** Commits what happened so far (e.g. a failed-attempt counter) before throwing an error that would roll it back. */
function commit_now(): void
{
    $pdo = db();
    if ($pdo->inTransaction()) { $pdo->commit(); $pdo->beginTransaction(); }
}
