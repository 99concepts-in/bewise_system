<?php
/**
 * @owner HUB · Owner tools — https://app.bewiseglobal.in/api/tools.php (owner password required).
 *   • add Jitu Bhaiya / Haresh / accountant (with default consulting hours for the consultant)
 *   • create the test login Razorpay's review team uses (username + password, a client account)
 *   • paste Razorpay keys (test or live) — written to the PRIVATE config, never to GitHub
 * Temporary until the owner app (OWNER chat) has these screens; same server functions underneath.
 */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/mail.php';
require __DIR__ . '/lib/events.php';
require_once __DIR__ . '/lib/seed.php';
require_once __DIR__ . '/lib/whatsapp.php';
date_default_timezone_set('UTC');

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'");

$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES);
$msg = []; $err = [];

function tools_page(string $body): never
{
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>BeWise · owner tools</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:linear-gradient(160deg,#e7ecfa,#fbf8f1 55%,#e5efe2);color:#1d2a55;margin:0;padding:24px 16px}
main{max-width:680px;margin:0 auto}section{background:#fff;border-radius:28px;padding:24px;box-shadow:0 10px 40px rgba(36,61,145,.08);margin-bottom:18px}h1{color:#243D91;margin:0 0 14px}
h2{font-size:17px;margin:0 0 6px;color:#243D91}p{line-height:1.5;margin:6px 0}label{display:block;font-size:13px;font-weight:600;margin:10px 0 4px}small{color:#5b6684}
input,select{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #d5dbef;border-radius:12px;font-size:15px}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
button{margin-top:16px;padding:12px 22px;border:0;border-radius:999px;background:#243D91;color:#fff;font-size:15px;font-weight:700;cursor:pointer}
.ok{background:#e9f5ea;color:#1f5d2a;padding:12px 14px;border-radius:12px;margin:0 0 14px}.err{background:#fdecec;color:#8a1c1c;padding:12px 14px;border-radius:12px;margin:0 0 14px}
table{width:100%;border-collapse:collapse;font-size:14px}td{padding:6px 4px;border-bottom:1px solid #eef0f7}.pill{display:inline-block;padding:2px 10px;border-radius:999px;background:#eef1fb;font-size:12px}
@media(max-width:560px){.row{grid-template-columns:1fr}}</style></head><body><main>' . $body . '</main></body></html>';
    exit;
}

function tools_write_config(array $cfg): void
{
    $path = bw_config_path();
    if (!$path || !is_writable($path)) bw_fail('not_writable', 'The private config file is read-only — edit it in hPanel → File Manager instead.');
    file_put_contents($path, "<?php\n// BeWise private config — updated by tools.php on " . gmdate('c') . ". Never commit or share.\nreturn " . var_export($cfg, true) . ";\n");
    if (function_exists('opcache_invalidate')) @opcache_invalidate($path, true);
    unset($GLOBALS['__bw_cfg']);
}

// Any unexpected error shows a readable page instead of a blank HTTP 500 (details go to the PHP error log).
set_exception_handler(function (Throwable $e) {
    error_log('BeWise tools error: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(500);
    tools_page('<section><h1>Something went wrong</h1><p>Please go back and try again. If it keeps happening, send this to your developer: <code>' . htmlspecialchars(substr(md5($e->getMessage()), 0, 8) . ' · ' . basename($e->getFile()) . ':' . $e->getLine()) . '</code></p><p><a href="tools.php">Back to owner tools</a></p></section>');
});

if (!bw_config('db')) tools_page('<section><h1>Not set up yet</h1><p>Run <a href="install.php">install.php</a> first.</p></section>');
bw_auto_migrate();

$csrf = fn() => hash_hmac('sha256', 'tools|' . ($_COOKIE[BW_COOKIE] ?? ''), (string)bw_config('app_key'));
$post = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$f = fn(string $k) => trim((string)($_POST[$k] ?? ''));

// ── sign in ──
if ($post && $f('action') === 'login') {
    try {
        tx(function () use ($f) {
            $email = strtolower($f('email'));
            rate_limit('tools:ip:' . client_ip(), 20, 900);
            $u = one("SELECT u.* FROM users u JOIN user_roles r ON r.user_id = u.id AND r.role = 'owner' WHERE u.email = ? AND u.status = 'active'", [$email]);
            if (!$u || !$u['password_hash'] || !password_verify((string)($_POST['password'] ?? ''), $u['password_hash'])) { commit_now(); bw_fail('bad_login', 'Owner email or password is not right.'); }
            audit('login', 'user', $u['id'], ['method' => 'tools']);
            Auth::startSession($u['id']);
        });
        header('Location: tools.php'); exit;
    } catch (ApiError $e) { $err[] = $e->getMessage(); }
}
if ($post && $f('action') === 'logout') { Auth::endSession(); header('Location: tools.php'); exit; }

$me = Auth::user();
if (!$me || !in_array('owner', $me['roles'], true)) {
    $e = $err ? '<div class=err>' . $h(implode(' ', $err)) . '</div>' : '';
    tools_page("<section><h1>Owner tools</h1>$e<form method=post><input type=hidden name=action value=login>
      <label>Owner email</label><input type=email name=email required><label>Password</label><input type=password name=password required>
      <button>Sign in</button></form></section>");
}

// ── actions (owner only, CSRF-checked) ──
if ($post && hash_equals($csrf(), $f('csrf'))) {
    try {
        tx(function () use ($f, &$msg) {
            $staff = require __DIR__ . '/modules/staff.php';
            switch ($f('action')) {
                case 'team':
                    $u = $staff['invite'](['email' => $f('email'), 'name' => $f('name'), 'role' => $f('role'), 'tempPassword' => (string)($_POST['password'] ?? ''), 'phone' => $f('phone')]);
                    $msg[] = "Added {$u['name']} ({$f('role')}). They sign in with {$u['email']} and the temporary password you set." . ($f('role') === 'consultant' ? ' Default hours: Mon–Sat 10–1 and 4–7 (he can change them).' : '');
                    break;
                case 'testlogin':
                    $user = strtolower($f('username'));
                    $pass = (string)($_POST['password'] ?? '');
                    if (!preg_match('/^[a-z0-9._-]{3,60}$/', $user)) bw_fail('invalid_input', 'Username: 3–60 letters, numbers, dot, dash or underscore.');
                    if (mb_strlen($pass) < 8) bw_fail('weak_password', 'Password: at least 8 characters.');
                    $uid = val('SELECT id FROM users WHERE username = ?', [$user]);
                    if ($uid && val("SELECT 1 FROM user_roles WHERE user_id = ? AND role <> 'client'", [$uid])) bw_fail('invalid_input', 'That username belongs to a team member.');
                    if (!$uid) { $uid = uuid(); insert('users', ['id' => $uid, 'username' => $user, 'name' => $f('name') ?: 'Razorpay Review', 'password_hash' => password_hash($pass, PASSWORD_DEFAULT)]); }
                    else q("UPDATE users SET password_hash = ?, status = 'active' WHERE id = ?", [password_hash($pass, PASSWORD_DEFAULT), $uid]);
                    q("INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, 'client')", [$uid]);
                    if (!val('SELECT 1 FROM clients WHERE user_id = ?', [$uid])) insert('clients', ['id' => uuid(), 'code' => make_code('client'), 'user_id' => $uid, 'name' => $f('name') ?: 'Razorpay Review', 'source' => 'test', 'onboarded_at' => now_utc()]);
                    audit('tools.test_login', 'user', $uid);
                    $msg[] = "Test login ready: username “{$user}”. It signs in on bewiseglobal.in (Account) as a normal client — use it only for Razorpay's review.";
                    break;
                case 'whatsapp':
                    $uidv = $f('vendor_uid'); $tok = (string)($_POST['token'] ?? '');
                    if ($uidv === '') bw_fail('invalid_input', 'Paste your Mart2Meta vendor UID (Console → API & Webhook).');
                    $cfg = bw_config(); $old = $cfg['whatsapp'] ?? [];
                    $cfg['whatsapp'] = ['base' => rtrim($f('base') ?: 'https://login.mart2meta.com', '/'), 'vendor_uid' => $uidv,
                        'token' => $tok !== '' ? $tok : (string)($old['token'] ?? ''), 'from_phone_number_id' => $f('from_phone_number_id'), 'transport' => 'api'];
                    if ($cfg['whatsapp']['token'] === '') bw_fail('invalid_input', 'Paste the API access token.');
                    tools_write_config($cfg);
                    audit('tools.whatsapp', 'config');
                    $msg[] = 'WhatsApp (Mart2Meta) saved. Send a test below.';
                    break;
                case 'watest':
                    unset($GLOBALS['__bw_cfg']);
                    if (!bw_config('whatsapp.token')) bw_fail('invalid_input', 'Connect WhatsApp first.');
                    $to = wa_phone($f('phone'));
                    if (!$to) bw_fail('invalid_input', 'Enter a valid mobile number.');
                    $body = ['phone_number' => $to, 'template_name' => $f('template') ?: 'hello_world', 'template_language' => $f('language') ?: 'en_US'];
                    [$ok, $code, $resp] = wa_http('contact/send-template-message', $body);
                    insert('whatsapp_log', ['id' => uuid(), 'to_phone' => $to, 'template_key' => 'test', 'template_name' => $body['template_name'], 'status' => $ok ? 'sent' : 'failed', 'http_code' => $code, 'response' => is_array($resp) ? $resp : ['raw' => $resp]]);
                    if (!$ok) bw_fail('wa_failed', "Mart2Meta answered (HTTP $code): " . mb_strimwidth(is_array($resp) ? json_encode($resp, JSON_UNESCAPED_UNICODE) : (string)$resp, 0, 300, '…'));
                    $msg[] = "Test sent to …" . substr($to, -4) . " ✓ — check WhatsApp.";
                    break;
                case 'watestlogin':
                    unset($GLOBALS['__bw_cfg']);
                    if (!bw_config('whatsapp.token')) bw_fail('invalid_input', 'Connect WhatsApp first.');
                    $to = wa_phone($f('phone'));
                    if (!$to) bw_fail('invalid_input', 'Enter a valid mobile number.');
                    $tpl = wa_templates()['login_code'];
                    $code = (string)random_int(100000, 999999);
                    $body = wa_body($to, $tpl, ['code' => $code]);
                    [$ok, $hc, $resp] = wa_http('contact/send-template-message', $body);
                    insert('whatsapp_log', ['id' => uuid(), 'to_phone' => $to, 'template_key' => 'test_login', 'template_name' => $tpl['name'], 'status' => $ok ? 'sent' : 'failed', 'http_code' => $hc, 'response' => is_array($resp) ? $resp : ['raw' => $resp]]);
                    if (!$ok) bw_fail('wa_failed', "Template “{$tpl['name']}” — Mart2Meta answered (HTTP $hc): " . mb_strimwidth(is_array($resp) ? json_encode($resp, JSON_UNESCAPED_UNICODE) : (string)$resp, 0, 400, '…') . ' · Sent fields: ' . implode(', ', array_keys($body)));
                    $msg[] = "Sign-in code template “{$tpl['name']}” sent to …" . substr($to, -4) . " ✓ (test code $code). If it arrived, tick it and turn on WhatsApp sign-in below.";
                    break;
                case 'watemplates':
                    $tpls = [];
                    foreach (array_keys(BW_WA_TEMPLATES) as $k) {
                        $params = json_decode((string)($_POST["params_$k"] ?? ''), true);
                        if (!is_array($params)) bw_fail('invalid_input', "Parameters for $k must be JSON like {\"field_1\":\"{name}\"}");
                        $tpls[$k] = ['name' => $f("name_$k"), 'language' => $f("lang_$k") ?: 'en', 'params' => $params, 'off' => empty($_POST["on_$k"])];
                    }
                    set_setting('whatsapp.templates', $tpls);
                    set_setting('whatsapp.login_enabled', !empty($_POST['login_enabled']));
                    audit('tools.whatsapp_templates', 'setting');
                    $msg[] = 'WhatsApp messages saved.';
                    break;
                case 'razorpay':
                    $id = $f('key_id'); $secret = (string)($_POST['key_secret'] ?? ''); $wh = (string)($_POST['webhook_secret'] ?? '');
                    if (!preg_match('/^rzp_(test|live)_[A-Za-z0-9]{6,}$/', $id)) bw_fail('invalid_input', 'Key id looks like rzp_test_… or rzp_live_…');
                    if (strlen($secret) < 10) bw_fail('invalid_input', 'Paste the key secret.');
                    $path = bw_config_path();
                    $cfg = bw_config();
                    $cfg['razorpay'] = ['key_id' => $id, 'key_secret' => $secret, 'webhook_secret' => $wh !== '' ? $wh : (string)($cfg['razorpay']['webhook_secret'] ?? '')];
                    tools_write_config($cfg);
                    audit('tools.razorpay_keys', 'config', null, ['mode' => str_starts_with($id, 'rzp_live') ? 'live' : 'test']);
                    $msg[] = 'Razorpay keys saved (' . (str_starts_with($id, 'rzp_live') ? 'LIVE' : 'test') . ' mode). Checkout now opens Razorpay.';
                    break;
            }
        });
    } catch (ApiError $e) { $err[] = $e->getMessage(); }
    unset($GLOBALS['__bw_cfg']);
} elseif ($post) { $err[] = 'Your session changed — please try again.'; }

// ── status ──
$team = all("SELECT u.name, u.email, u.username, GROUP_CONCAT(r.role) roles, u.last_login_at FROM users u JOIN user_roles r ON r.user_id = u.id
             GROUP BY u.id, u.name, u.email, u.username, u.last_login_at, u.created_at HAVING roles REGEXP 'owner|consultant|manager|accountant' OR u.username IS NOT NULL ORDER BY u.created_at");
$rows = implode('', array_map(fn($t) => '<tr><td>' . $h($t['name']) . '</td><td>' . $h($t['email'] ?: '@' . $t['username']) . '</td><td><span class=pill>' . $h($t['roles']) . '</span></td></tr>', $team));
$rz = bw_config('razorpay.key_id');
$rzState = $rz ? (str_starts_with((string)$rz, 'rzp_live') ? 'LIVE keys' : 'Test keys') . ' · webhook ' . (bw_config('razorpay.webhook_secret') ? 'set' : 'not set') : 'Not set up — checkout shows “pay at the studio”';
$wa = bw_config('whatsapp', []);
$waState = !empty($wa['token']) ? 'Connected · vendor ' . substr((string)$wa['vendor_uid'], 0, 6) . '…' : 'Not connected';
$waRows = '';
foreach (wa_templates() as $k => $tp) {
    $waRows .= '<tr><td><label style="margin:0;font-weight:600"><input type=checkbox name="on_' . $k . '" value=1 style="width:auto"' . (empty($tp['off']) ? ' checked' : '') . '> ' . $h(str_replace('_', ' ', $k)) . '</label></td>'
        . '<td><input name="name_' . $k . '" value="' . $h($tp['name']) . '"></td><td style="width:70px"><input name="lang_' . $k . '" value="' . $h($tp['language'] ?? 'en') . '"></td>'
        . '<td><input name="params_' . $k . '" value="' . $h(json_encode($tp['params'] ?? [], JSON_UNESCAPED_UNICODE)) . '" style="font-family:monospace;font-size:12px"></td></tr>';
}
$waLog = implode('', array_map(fn($r) => '<tr><td>' . $h(substr($r['created_at'], 5, 11)) . '</td><td>' . $h($r['template_key']) . '</td><td>…' . $h(substr($r['to_phone'], -4)) . '</td><td><span class=pill>' . $h($r['status']) . '</span></td></tr>',
    all('SELECT created_at, template_key, to_phone, status FROM whatsapp_log ORDER BY created_at DESC LIMIT 8')));
$loginOn = setting('whatsapp.login_enabled', false) ? ' checked' : '';
$cronKey = hash_hmac('sha256', 'cron', (string)bw_config('app_key'));
$cronUrl = $h(bw_public_url('api/cron.php?key=' . $cronKey));
$cronCli = $h('/usr/bin/php ' . __DIR__ . '/cron.php');
$hasConsultant = (bool)val("SELECT 1 FROM user_roles WHERE role = 'consultant'");
$ok = $msg ? '<div class=ok>' . $h(implode(' ', $msg)) . '</div>' : '';
$bad = $err ? '<div class=err>' . $h(implode(' ', $err)) . '</div>' : '';
$t = $h($csrf());
$webhook = $h(bw_public_url('api/webhooks/razorpay'));
$consultantNote = $hasConsultant ? '' : '<div class=err>No consultant yet — clients can\'t see booking times until you add Jitu Bhaiya below.</div>';

tools_page(<<<HTML
<section><h1>Owner tools</h1>$ok$bad$consultantNote
<p>Signed in as {$h($me['email'])}. <form method=post style="display:inline"><input type=hidden name=action value=logout><button style="margin:0;padding:6px 14px;font-size:13px;background:#eef1fb;color:#243D91">Sign out</button></form></p>
<table>$rows</table><p><small>Payments: {$h($rzState)}</small></p></section>

<section><h2>Add a team member</h2><p><small>Give them the temporary password in person. Jitu Bhaiya gets default hours Mon–Sat 10–1 &amp; 4–7.</small></p>
<form method=post><input type=hidden name=action value=team><input type=hidden name=csrf value="$t">
<div class=row><div><label>Role</label><select name=role><option value=consultant>Consultant (Jitu Bhaiya)</option><option value=manager>Manager (Haresh)</option><option value=accountant>Accountant / CA</option></select></div>
<div><label>Name</label><input name=name required></div></div>
<div class=row><div><label>Email</label><input type=email name=email required></div><div><label>WhatsApp number <small>(for alerts)</small></label><input name=phone placeholder="98xxxxxxxx"></div></div>
<label>Temporary password <small>(10+ characters)</small></label><input type=password name=password required minlength=10>
<button>Add</button></form></section>

<section><h2>Test login for Razorpay review</h2><p><small>A client account Razorpay's team can use on bewiseglobal.in → Account. Signs in with username + password.</small></p>
<form method=post><input type=hidden name=action value=testlogin><input type=hidden name=csrf value="$t">
<div class=row><div><label>Username</label><input name=username value="test" required></div><div><label>Password <small>(8+)</small></label><input type=password name=password required minlength=8></div></div>
<input type=hidden name=name value="Razorpay Review"><button>Create / update test login</button></form></section>

<section><h2>WhatsApp (Mart2Meta)</h2><p><small>Status: <b>{$h($waState)}</b>. In Mart2Meta: Console → <b>API &amp; Webhook</b> (or Settings → API Access) → copy the <b>Vendor UID</b> and generate an <b>Access token</b>.</small></p>
<form method=post autocomplete=off><input type=hidden name=action value=whatsapp><input type=hidden name=csrf value="$t">
<label>Mart2Meta address</label><input name=base value="{$h($wa['base'] ?? 'https://login.mart2meta.com')}">
<div class=row><div><label>Vendor UID</label><input name=vendor_uid value="{$h($wa['vendor_uid'] ?? '')}" required></div><div><label>Access token <small>(leave empty to keep)</small></label><input type=password name=token></div></div>
<label>Phone number ID <small>(optional — only if you have more than one WhatsApp number)</small></label><input name=from_phone_number_id value="{$h($wa['from_phone_number_id'] ?? '')}">
<button>Save WhatsApp</button></form>
<form method=post style="margin-top:18px"><input type=hidden name=action value=watest><input type=hidden name=csrf value="$t">
<div class=row><div><label>Send a test to (your mobile)</label><input name=phone placeholder="98xxxxxxxx" required></div><div class=row><div><label>Template</label><input name=template value="hello_world"></div><div><label>Language</label><input name=language value="en_US"></div></div></div>
<button>Send test</button></form>
<form method=post style="margin-top:14px"><input type=hidden name=action value=watestlogin><input type=hidden name=csrf value="$t">
<div class=row><div><label>Test the sign-in code template <small>(uses the “login code” row below)</small></label><input name=phone placeholder="98xxxxxxxx" required></div><div><label>&nbsp;</label><button style="margin:0;width:100%">Send a test sign-in code</button></div></div></form></section>

<section><h2>WhatsApp messages</h2><p><small>Create these templates in Mart2Meta (Templates → New, category <b>Utility</b>; login code = <b>Authentication</b>) with the texts in the guide, wait for Meta's approval, then tick them here. Unticked messages are not sent. <b>Parameters</b> map Mart2Meta fields to our values.</small></p>
<form method=post><input type=hidden name=action value=watemplates><input type=hidden name=csrf value="$t">
<table><tr><td><b>Message</b></td><td><b>Template name</b></td><td><b>Lang</b></td><td><b>Parameters</b></td></tr>$waRows</table>
<label style="font-weight:600"><input type=checkbox name=login_enabled value=1 style="width:auto"$loginOn> Let clients sign in with a WhatsApp code (needs the <b>login code</b> template approved)</label>
<button>Save messages</button></form>
<p style="margin-top:16px"><small><b>Reminders</b> (24 h and 2 h before each session) need a cron job: hPanel → Advanced → <b>Cron Jobs</b> → every 30 minutes → command:<br><code style="word-break:break-all">$cronCli</code><br>or the URL <code style="word-break:break-all">$cronUrl</code></small></p>
<table>$waLog</table></section>

<section><h2>Razorpay keys</h2><p><small>Razorpay Dashboard → Settings → API Keys (start with <b>Test mode</b>). Webhook: Settings → Webhooks → URL <b>$webhook</b>, events payment.captured + payment.failed.</small></p>
<form method=post autocomplete=off><input type=hidden name=action value=razorpay><input type=hidden name=csrf value="$t">
<label>Key id</label><input name=key_id placeholder="rzp_test_…" required>
<div class=row><div><label>Key secret</label><input type=password name=key_secret required></div><div><label>Webhook secret <small>(optional now)</small></label><input type=password name=webhook_secret></div></div>
<button>Save keys</button></form></section>
HTML);
