<?php
/**
 * @owner HUB · Domain events (outbox) + in-app/email notifications + settings accessor.
 * Events are written to domain_events and handled synchronously inside the same transaction
 * (shared hosting has no queue). Handlers are registered by modules with Events::on().
 * Event names & payloads: docs/03-CONTRACTS.md §4.
 */
declare(strict_types=1);

final class Events
{
    /** @var array<string, callable[]> */
    private static array $handlers = [];

    public static function on(string $type, callable $fn): void { self::$handlers[$type][] = $fn; }

    public static function emit(string $type, array $payload): void
    {
        insert('domain_events', ['id' => uuid(), 'type' => $type, 'payload' => $payload, 'actor_id' => Auth::userId()]);
        foreach (self::$handlers[$type] ?? [] as $fn) $fn($payload);
    }
}

/**
 * notify(): in-app inbox row (+ email when the user has an address and channel allows).
 * $to: ['userId'=>…] | ['clientId'=>…] | ['role'=>'consultant'|'manager'|'owner']
 * @cross(OWNER) OWNER replaces this with templates, preferences, WhatsApp (O3); keep the signature.
 */
function notify(array $to, string $title, string $body, ?string $href = null, string $priority = 'normal', bool $email = false): void
{
    $userIds = [];
    if (!empty($to['userId'])) $userIds[] = $to['userId'];
    if (!empty($to['clientId'])) { $u = val('SELECT user_id FROM clients WHERE id = ?', [$to['clientId']]); if ($u) $userIds[] = $u; }
    if (!empty($to['role'])) {
        foreach (all("SELECT u.id FROM users u JOIN user_roles r ON r.user_id = u.id WHERE r.role = ? AND u.status = 'active'", [$to['role']]) as $r) $userIds[] = $r['id'];
    }
    foreach (array_unique($userIds) as $uid) {
        insert('notifications_inbox', ['id' => uuid(), 'user_id' => $uid, 'title' => $title, 'body' => $body, 'href' => $href, 'priority' => $priority]);
        if ($email && ($addr = val('SELECT email FROM users WHERE id = ?', [$uid]))) {
            bw_send_mail($addr, $title, $body . ($href ? "\n\n" . bw_public_url($href) : '') . "\n\n— BeWise Holistic Wellness");
        }
    }
}

function bw_public_url(string $path = ''): string
{
    $base = rtrim((string)bw_config('site_url', (bw_is_https() ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost')), '/');
    return $base . '/' . ltrim($path, '/');
}

// ───────────── settings ─────────────
function setting(string $key, mixed $default = null): mixed
{
    static $cache = [];
    if (array_key_exists($key, $cache)) return $cache[$key];
    $v = val('SELECT value FROM settings WHERE `key` = ?', [$key]);
    return $cache[$key] = ($v === null ? $default : json_decode((string)$v, true));
}

function set_setting(string $key, mixed $value, ?bool $public = null): void
{
    $json = json_encode($value, JSON_UNESCAPED_UNICODE);
    if ($public === null) {
        q('INSERT INTO settings (`key`, value, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)', [$key, $json, Auth::userId()]);
    } else {
        q('INSERT INTO settings (`key`, value, is_public, updated_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), is_public = VALUES(is_public), updated_by = VALUES(updated_by)', [$key, $json, (int)$public, Auth::userId()]);
    }
}
