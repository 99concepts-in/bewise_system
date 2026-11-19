<?php
/**
 * @owner OWNER (base by HUB, 2026-11-19) · WhatsApp via Mart2Meta (WhatsJet-based WhatsApp Cloud API panel).
 *   POST {base}/api/{vendor_uid}/contact/send-template-message   (Authorization: Bearer {token})
 *   POST {base}/api/{vendor_uid}/contact/send-message            (free text — only inside the 24 h customer window)
 * Private config (set on /api/tools.php, never in GitHub):
 *   'whatsapp' => ['base' => 'https://login.mart2meta.com', 'vendor_uid' => '…', 'token' => '…', 'from_phone_number_id' => '' , 'transport' => 'api'|'log']
 * Template names, languages and parameters live in settings `whatsapp.templates` (owner edits on tools.php). Each template's
 * `params` maps provider fields to placeholders, e.g. {"field_1": "{name}", "field_2": "{when}", "copy_code": "{code}"}.
 * Message texts to create in Mart2Meta: hosting/WHATSAPP-MART2META.md.
 * Sending never breaks the caller: failures are logged in whatsapp_log and error_log.
 */
declare(strict_types=1);

/** Defaults — the owner can rename / re-map on tools.php (stored in settings whatsapp.templates). */
const BW_WA_TEMPLATES = [
    'login_code'        => ['name' => 'bw_login_code', 'language' => 'en', 'params' => ['field_1' => '{code}', 'copy_code' => '{code}']],
    'booking_confirmed' => ['name' => 'bw_booking_confirmed', 'language' => 'en', 'params' => ['field_1' => '{name}', 'field_2' => '{session}', 'field_3' => '{when}', 'field_4' => '{place}', 'field_5' => '{code}']],
    'session_reminder'  => ['name' => 'bw_session_reminder', 'language' => 'en', 'params' => ['field_1' => '{name}', 'field_2' => '{day}', 'field_3' => '{time}', 'field_4' => '{place}']],
    'payment_due'       => ['name' => 'bw_payment_due', 'language' => 'en', 'params' => ['field_1' => '{name}', 'field_2' => '{what}', 'field_3' => '{amount}', 'field_4' => '{link}']],
    'remedy_ready'      => ['name' => 'bw_remedy_ready', 'language' => 'en', 'params' => ['field_1' => '{name}', 'field_2' => '{how}']],
    'order_confirmed'   => ['name' => 'bw_order_confirmed', 'language' => 'en', 'params' => ['field_1' => '{name}', 'field_2' => '{order}', 'field_3' => '{amount}']],
    'order_dispatched'  => ['name' => 'bw_order_dispatched', 'language' => 'en', 'params' => ['field_1' => '{name}', 'field_2' => '{order}', 'field_3' => '{courier}', 'field_4' => '{tracking}']],
    'staff_alert'       => ['name' => 'bw_staff_alert', 'language' => 'en', 'params' => ['field_1' => '{text}']],
];

function wa_configured(): bool
{
    return (bool)(bw_config('whatsapp.token') && bw_config('whatsapp.vendor_uid')) || bw_config('whatsapp.transport') === 'log';
}

function wa_templates(): array
{
    $saved = setting('whatsapp.templates', []);
    $out = BW_WA_TEMPLATES;
    foreach ((array)$saved as $k => $t) if (isset($out[$k]) && is_array($t)) $out[$k] = array_merge($out[$k], array_filter($t, fn($v) => $v !== '' && $v !== null));
    return $out;
}

/** "90542 20952" / "+91 9054220952" / "09054220952" → "919054220952" (India default). Null when not a phone. */
function wa_phone(?string $raw): ?string
{
    $d = preg_replace('/\D/', '', (string)$raw);
    if ($d === '') return null;
    if (strlen($d) === 11 && $d[0] === '0') $d = substr($d, 1);
    if (strlen($d) === 10) $d = '91' . $d;
    return (strlen($d) >= 11 && strlen($d) <= 15) ? $d : null;
}

/** Low-level POST to Mart2Meta. Returns [ok, httpCode, decodedBody|raw]. */
function wa_http(string $path, array $body): array
{
    $base = rtrim((string)bw_config('whatsapp.base', 'https://login.mart2meta.com'), '/');
    $url = $base . '/api/' . rawurlencode((string)bw_config('whatsapp.vendor_uid')) . '/' . ltrim($path, '/');
    if ($pid = bw_config('whatsapp.from_phone_number_id')) $body['from_phone_number_id'] = $pid;
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json', 'Authorization: Bearer ' . bw_config('whatsapp.token')],
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE)]);
    $res = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    $j = json_decode((string)$res, true);
    $ok = $code >= 200 && $code < 300 && is_array($j) && (($j['result'] ?? '') === 'success' || ($j['status'] ?? '') === 'success' || !empty($j['data']['wamid'] ?? null));
    return [$ok, $code, is_array($j) ? $j : ($err ?: substr((string)$res, 0, 300))];
}

/**
 * Sends a template to a phone. $vars fill the template's placeholders. $dedupe (optional) makes the send happen once ever.
 * Returns true when accepted by the provider (or logged in 'log' transport).
 */
function wa_send(?string $phoneRaw, string $key, array $vars, ?string $dedupe = null, ?string $ref = null): bool
{
    try {
        $phone = wa_phone($phoneRaw);
        if (!$phone || !wa_configured()) return false;
        $tpl = wa_templates()[$key] ?? null;
        if (!$tpl || empty($tpl['name']) || !empty($tpl['off'])) return false;
        if ($dedupe && val('SELECT 1 FROM whatsapp_log WHERE dedupe_key = ?', [$dedupe])) return true;
        $body = ['phone_number' => $phone, 'template_name' => $tpl['name'], 'template_language' => $tpl['language'] ?? 'en'];
        foreach (($tpl['params'] ?? []) as $field => $pattern) {
            $body[$field] = mb_substr(preg_replace_callback('/\{(\w+)\}/', fn($m) => (string)($vars[$m[1]] ?? ''), (string)$pattern), 0, 900);
        }
        if (bw_config('whatsapp.transport') === 'log') { $ok = true; $code = 0; $resp = 'logged'; }
        else [$ok, $code, $resp] = wa_http('contact/send-template-message', $body);
        insert('whatsapp_log', ['id' => uuid(), 'to_phone' => $phone, 'template_key' => $key, 'template_name' => $tpl['name'], 'status' => $ok ? 'sent' : 'failed',
            'http_code' => $code, 'response' => is_array($resp) ? $resp : ['raw' => $resp], 'dedupe_key' => $ok ? $dedupe : null, 'ref' => $ref,
            'vars' => $key === 'login_code' ? ['code' => '••••••'] : $vars]);
        if (!$ok) error_log("BeWise WhatsApp $key to …" . substr($phone, -4) . " failed: HTTP $code " . json_encode($resp));
        return $ok;
    } catch (Throwable $e) {
        error_log('BeWise WhatsApp error: ' . $e->getMessage());
        return false;
    }
}

/** Client's WhatsApp number unless they turned WhatsApp off (consent record 'whatsapp' = false). */
function wa_client_phone(string $clientId): ?string
{
    $c = one('SELECT c.phone, u.phone AS uphone FROM clients c LEFT JOIN users u ON u.id = c.user_id WHERE c.id = ?', [$clientId]);
    if (!$c) return null;
    $optOut = val("SELECT granted FROM consent_records WHERE client_id = ? AND type = 'whatsapp' ORDER BY created_at DESC LIMIT 1", [$clientId]);
    if ($optOut !== null && (int)$optOut === 0) return null;
    return $c['phone'] ?: $c['uphone'];
}

function wa_client_name(string $clientId): string
{
    $n = trim((string)val('SELECT name FROM clients WHERE id = ?', [$clientId]));
    return $n !== '' ? explode(' ', $n)[0] : 'there';
}

/** Staff WhatsApp alert (consultant / manager / owner phones from Team). */
function wa_staff(string $role, string $text, ?string $userId = null): void
{
    $rows = $userId ? all("SELECT phone FROM users WHERE id = ? AND status = 'active'", [$userId])
        : all("SELECT u.phone FROM users u JOIN user_roles r ON r.user_id = u.id AND r.role = ? WHERE u.status = 'active'", [$role]);
    foreach ($rows as $r) if ($r['phone']) wa_send($r['phone'], 'staff_alert', ['text' => mb_substr($text, 0, 500)]);
}

function wa_when(?string $dbUtc): string
{
    if (!$dbUtc) return 'a time we’ll confirm with you';
    return (new DateTimeImmutable($dbUtc, new DateTimeZone('UTC')))->setTimezone(new DateTimeZone(BW_TZ))->format('D j M, g:i a');
}
