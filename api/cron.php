<?php
/**
 * @owner HUB (OWNER extends) · Scheduled jobs. Run every 30 minutes from hPanel → Advanced → Cron Jobs:
 *   PHP:  /usr/bin/php /home/<user>/domains/app.bewiseglobal.in/public_html/api/cron.php
 *   or URL: https://app.bewiseglobal.in/api/cron.php?key=<cron key shown on /api/tools.php>
 * Jobs: expire unpaid holds · WhatsApp session reminders (≈24 h and ≈2 h before) — each sent once (dedupe).
 */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/mail.php';
require __DIR__ . '/lib/events.php';
require_once __DIR__ . '/lib/seed.php';
require_once __DIR__ . '/lib/whatsapp.php';
require_once __DIR__ . '/lib/registry.php';
date_default_timezone_set('UTC');

$cli = PHP_SAPI === 'cli';
if (!$cli) {
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    $key = (string)($_GET['key'] ?? '');
    if (!bw_config('app_key') || !hash_equals(hash_hmac('sha256', 'cron', (string)bw_config('app_key')), $key)) { http_response_code(403); exit("forbidden\n"); }
}
if (!bw_config('db')) exit("not installed\n");
bw_auto_migrate();
bw_registry();

$out = [];
tx(function () use (&$out) {
    scheduling_expire_holds();
    $windows = [['rem24', 23 * 3600, 25 * 3600, 'tomorrow'], ['rem2', 5400, 9000, 'today']];
    foreach ($windows as [$tag, $from, $to, $day]) {
        $rows = all("SELECT * FROM appointments WHERE status = 'confirmed' AND starts_at BETWEEN ? AND ?",
            [gmdate('Y-m-d H:i:s', time() + $from), gmdate('Y-m-d H:i:s', time() + $to)]);
        foreach ($rows as $a) {
            $time = (new DateTimeImmutable($a['starts_at'], new DateTimeZone('UTC')))->setTimezone(new DateTimeZone(BW_TZ))->format('g:i a');
            $place = $a['mode'] === 'online' ? ($a['meeting_url'] ? 'online: ' . $a['meeting_url'] : 'online — the video link comes on WhatsApp shortly') : 'at the BeWise center, Alkapuri, Vadodara';
            $ok = wa_send(wa_client_phone($a['client_id']), 'session_reminder', ['name' => wa_client_name($a['client_id']), 'day' => $day, 'time' => $time, 'place' => $place],
                "$tag:{$a['id']}:{$a['starts_at']}", $a['id']);
            $out[] = "$tag {$a['code']} " . ($ok ? 'sent' : 'skipped');
        }
    }
});
echo gmdate('c') . " cron ok\n" . implode("\n", $out) . "\n";
