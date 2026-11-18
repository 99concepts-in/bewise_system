<?php
/**
 * @owner HUB · Sessions & roles.
 * Clients sign in with a 6-digit email code (D-04: phone OTP later, needs an SMS/WhatsApp provider).
 * Staff (owner · consultant · manager · accountant) sign in with email + password set by the owner.
 * Session = random token in an HttpOnly, Secure, SameSite=Lax cookie; only its SHA-256 is stored.
 */
declare(strict_types=1);

const BW_ROLES = ['client', 'consultant', 'manager', 'owner', 'accountant'];
const BW_STAFF_ROLES = ['consultant', 'manager', 'owner', 'accountant'];
const BW_SESSION_DAYS = 30;
const BW_COOKIE = 'bw_session';

final class Auth
{
    private static ?array $user = null;
    private static bool $loaded = false;

    public static function load(): void
    {
        if (self::$loaded) return;
        self::$loaded = true;
        $token = $_COOKIE[BW_COOKIE] ?? null;
        $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!$token && str_starts_with($hdr, 'Bearer ')) $token = substr($hdr, 7);
        if (!$token || strlen($token) < 32) return;
        $row = one('SELECT s.user_id, s.expires_at, s.last_seen_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id
                    WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() AND u.status = \'active\'', [hash('sha256', $token)]);
        if (!$row) return;
        if (!$row['last_seen_at'] || strtotime($row['last_seen_at'] . ' UTC') < time() - 3600) {
            q('UPDATE sessions SET last_seen_at = UTC_TIMESTAMP() WHERE token_hash = ?', [hash('sha256', $token)]);
        }
        self::$user = self::hydrate($row);
    }

    private static function hydrate(array $u): array
    {
        $roles = array_column(all('SELECT role FROM user_roles WHERE user_id = ?', [$u['id']]), 'role');
        $client = in_array('client', $roles, true) ? one('SELECT id, code FROM clients WHERE user_id = ?', [$u['id']]) : null;
        return ['id' => $u['id'], 'email' => $u['email'], 'name' => $u['name'], 'phone' => $u['phone'], 'roles' => $roles,
            'clientId' => $client['id'] ?? null, 'clientCode' => $client['code'] ?? null, 'hasPassword' => !empty($u['password_hash'])];
    }

    public static function user(): ?array { self::load(); return self::$user; }
    public static function userId(): ?string { return self::user()['id'] ?? null; }
    public static function roles(): array { return self::user()['roles'] ?? []; }
    public static function has(string ...$roles): bool { return (bool)array_intersect($roles, self::roles()); }

    public static function require(string ...$roles): array
    {
        $u = self::user();
        if (!$u) bw_fail('unauthenticated', 'Please sign in.', 401);
        if ($roles && !self::has(...$roles)) bw_fail('forbidden', 'You don\'t have access to this.', 403);
        return $u;
    }

    /** The signed-in client's id (clients only). */
    public static function clientId(): string
    {
        $u = self::require('client');
        if (!$u['clientId']) bw_fail('no_client', 'Client profile missing', 500);
        return $u['clientId'];
    }

    public static function startSession(string $userId): array
    {
        $token = bin2hex(random_bytes(32));
        insert('sessions', ['token_hash' => hash('sha256', $token), 'user_id' => $userId, 'ip' => client_ip(),
            'user_agent' => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
            'expires_at' => gmdate('Y-m-d H:i:s', time() + BW_SESSION_DAYS * 86400)]);
        q('UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?', [$userId]);
        self::setCookie($token, time() + BW_SESSION_DAYS * 86400);
        self::$loaded = true;
        self::$user = self::hydrate(one('SELECT * FROM users WHERE id = ?', [$userId]));
        return self::$user;
    }

    public static function endSession(): void
    {
        if ($t = $_COOKIE[BW_COOKIE] ?? null) q('DELETE FROM sessions WHERE token_hash = ?', [hash('sha256', $t)]);
        self::setCookie('', time() - 3600);
        self::$user = null;
    }

    private static function setCookie(string $value, int $expires): void
    {
        if (PHP_SAPI === 'cli') return;
        setcookie(BW_COOKIE, $value, ['expires' => $expires, 'path' => '/', 'secure' => bw_is_https(),
            'httponly' => true, 'samesite' => 'Lax']);
    }

    /** Creates (or returns) the user + client row for a client email. */
    public static function ensureClientUser(string $email, string $name = ''): string
    {
        $u = one('SELECT id FROM users WHERE email = ?', [$email]);
        if ($u) {
            $uid = $u['id'];
        } else {
            $uid = uuid();
            insert('users', ['id' => $uid, 'email' => $email, 'name' => $name]);
        }
        q('INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, \'client\')', [$uid]);
        if (!val('SELECT id FROM clients WHERE user_id = ?', [$uid])) {
            // A walk-in created by staff with the same email gets linked instead of duplicated.
            $walkIn = one('SELECT id FROM clients WHERE user_id IS NULL AND email = ? LIMIT 1', [$email]);
            if ($walkIn) {
                q('UPDATE clients SET user_id = ? WHERE id = ?', [$uid, $walkIn['id']]);
            } else {
                $cid = uuid();
                insert('clients', ['id' => $cid, 'code' => make_code('client'), 'user_id' => $uid, 'email' => $email, 'name' => $name]);
                Events::emit('client.created', ['clientId' => $cid]);
            }
        }
        return $uid;
    }
}

function bw_is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

/** Staff user id of the (single, v1) consultant — D-14: data supports many, UI assumes Jitu Bhaiya. */
function default_consultant_id(): string
{
    $id = val("SELECT u.id FROM users u JOIN user_roles r ON r.user_id = u.id AND r.role = 'consultant' WHERE u.status = 'active' ORDER BY u.created_at LIMIT 1");
    if (!$id) bw_fail('no_consultant', 'No consultant account yet — the owner adds one in Team.', 409);
    return $id;
}
