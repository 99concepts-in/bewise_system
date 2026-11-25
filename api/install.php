<?php
/**
 * @owner HUB · One-time web installer: https://<your-domain>/api/install.php
 * Connects the Hostinger MySQL database, writes the PRIVATE config outside public_html, creates tables,
 * seeds data and creates the owner (+ optional Jitendra Khimlani / Haresh) accounts. Locks itself afterwards.
 * Safety: only accepts a database on this server (localhost) so nobody else can point the site at their own database.
 */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/mail.php';
require __DIR__ . '/lib/events.php';
require_once __DIR__ . '/lib/seed.php';
require_once __DIR__ . '/lib/whatsapp.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'");

$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES);
$errors = []; $done = null;
$installed = (bool)bw_config('db');

function page(string $title, string $body): never
{
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' . $title . '</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:linear-gradient(160deg,#e7ecfa,#fbf8f1 55%,#e5efe2);color:#1d2a55;margin:0;padding:24px 16px}
main{max-width:640px;margin:0 auto;background:#fff;border-radius:28px;padding:28px;box-shadow:0 10px 40px rgba(36,61,145,.08)}h1{font-size:26px;margin:0 0 6px;color:#243D91}
h2{font-size:16px;margin:26px 0 8px;color:#243D91}p,li{line-height:1.55}label{display:block;font-size:13px;font-weight:600;margin:12px 0 4px}
input,select{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #d5dbef;border-radius:12px;font-size:15px}small{color:#5b6684}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.err{background:#fdecec;color:#8a1c1c;padding:12px 14px;border-radius:12px;margin:12px 0}
.ok{background:#e9f5ea;color:#1f5d2a;padding:12px 14px;border-radius:12px;margin:12px 0}button{margin-top:22px;width:100%;padding:14px;border:0;border-radius:999px;background:#243D91;color:#fff;font-size:16px;font-weight:700;cursor:pointer}
code{background:#f1f3fb;padding:2px 6px;border-radius:6px}</style></head><body><main>' . $body . '</main></body></html>';
    exit;
}

if ($installed) {
    $status = '';
    try { $n = (int)val('SELECT COUNT(*) FROM users'); $status = "<div class=ok>Database connected · $n accounts.</div>"; }
    catch (Throwable $e) { $status = '<div class=err>Config found but the database can\'t be reached: ' . $h($e->getMessage()) . '</div>'; }
    page('BeWise · installed', '<h1>BeWise is set up ✅</h1>' . $status . '<p>This installer is locked. To change database or email settings, edit the private config file on the server:<br><code>' . $h(bw_config_path()) . '</code></p><p><a href="../">Open BeWise</a></p>');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $f = fn($k, $d = '') => trim((string)($_POST[$k] ?? $d));
    $db = ['host' => $f('db_host', 'localhost'), 'port' => (int)$f('db_port', '3306'), 'name' => $f('db_name'), 'user' => $f('db_user'), 'pass' => (string)($_POST['db_pass'] ?? '')];
    if (!in_array($db['host'], ['localhost', '127.0.0.1'], true) && getenv('BEWISE_ALLOW_REMOTE_DB') !== '1') $errors[] = 'Database host must be "localhost" (the MySQL database in this Hostinger account).';
    if (!$db['name'] || !$db['user']) $errors[] = 'Enter the database name and user from hPanel → Databases.';
    $ownerEmail = strtolower($f('owner_email'));
    if (!filter_var($ownerEmail, FILTER_VALIDATE_EMAIL)) $errors[] = 'Enter a valid owner email.';
    if (mb_strlen((string)($_POST['owner_password'] ?? '')) < 10) $errors[] = 'Owner password: at least 10 characters.';
    $staff = [];
    foreach (['consultant', 'manager'] as $r) {
        $e = strtolower($f("{$r}_email"));
        if ($e === '') continue;
        if (!filter_var($e, FILTER_VALIDATE_EMAIL)) $errors[] = "Enter a valid $r email (or leave it empty).";
        if (mb_strlen((string)($_POST["{$r}_password"] ?? '')) < 10) $errors[] = ucfirst($r) . ' temporary password: at least 10 characters.';
        $staff[$r] = ['email' => $e, 'name' => $f("{$r}_name"), 'pass' => (string)$_POST["{$r}_password"]];
    }
    if (!$errors) {
        try {
            $pdo = new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $db['host'], $db['port'], $db['name']), $db['user'], $db['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $pdo->query('SELECT 1');
        } catch (Throwable $e) { $errors[] = 'Could not connect to the database: ' . $e->getMessage(); }
    }
    if (!$errors) {
        $mail = ['transport' => $f('mail_transport', 'mail'), 'from' => $f('mail_from'), 'from_name' => 'BeWise Holistic Wellness'];
        if ($mail['transport'] === 'smtp') $mail += ['host' => $f('smtp_host', 'smtp.hostinger.com'), 'port' => (int)$f('smtp_port', '465'), 'user' => $f('smtp_user') ?: $mail['from'], 'pass' => (string)($_POST['smtp_pass'] ?? '')];
        $cfg = ['db' => $db, 'app_key' => base64_encode(random_bytes(32)), 'site_url' => rtrim($f('site_url'), '/'), 'mail' => $mail, 'debug' => false, 'debug_show_otp' => false];
        if ($f('rzp_key_id')) $cfg['razorpay'] = ['key_id' => $f('rzp_key_id'), 'key_secret' => (string)($_POST['rzp_key_secret'] ?? ''), 'webhook_secret' => (string)($_POST['rzp_webhook_secret'] ?? '')];
        $docRoot = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
        $targets = [];
        if ($docRoot !== '') $targets[] = dirname($docRoot) . '/bewise-private';
        $targets[] = __DIR__ . '/storage';
        $written = null;
        foreach ($targets as $dir) {
            if (!is_dir($dir)) @mkdir($dir, 0750, true);
            $file = "$dir/config.php";
            if (is_dir($dir) && is_writable($dir) && @file_put_contents($file, "<?php\n// BeWise private config — written by install.php on " . gmdate('c') . ". Never commit or share.\nreturn " . var_export($cfg, true) . ";\n") !== false) {
                @chmod($file, 0640); $written = $file; break;
            }
        }
        if (!$written) $errors[] = 'Could not write the private config file. Check folder permissions in hPanel → File Manager.';
        else {
            putenv("BEWISE_CONFIG=$written");
            unset($GLOBALS['__bw_cfg']);
            try {
                bw_migrate();
                bw_seed();
                $mk = function (string $email, string $name, string $pass, string $role) {
                    $id = val('SELECT id FROM users WHERE email = ?', [$email]) ?: uuid();
                    q('INSERT INTO users (id, email, name, password_hash, status) VALUES (?, ?, ?, ?, \'active\') ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash)', [$id, $email, $name, password_hash($pass, PASSWORD_DEFAULT)]);
                    q('INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, ?)', [$id, $role]);
                    return $id;
                };
                $mk($ownerEmail, $f('owner_name') ?: 'Owner', (string)$_POST['owner_password'], 'owner');
                foreach ($staff as $r => $s) {
                    $sid = $mk($s['email'], $s['name'] ?: ($r === 'consultant' ? 'Jitendra Khimlani' : 'Haresh Moorjani'), $s['pass'], $r);
                    if ($r === 'consultant' && !val('SELECT 1 FROM availability_rules WHERE consultant_id = ?', [$sid])) {
                        // default hours until Jitendra Khimlani edits them: Mon–Sat 10:00–13:00 and 16:00–19:00
                        for ($d = 1; $d <= 6; $d++) foreach ([['10:00:00', '13:00:00'], ['16:00:00', '19:00:00']] as [$s1, $e1]) {
                            insert('availability_rules', ['id' => uuid(), 'consultant_id' => $sid, 'weekday' => $d, 'start_time' => $s1, 'end_time' => $e1, 'modes' => ['online', 'in_person']]);
                        }
                    }
                }
                $done = $written;
            } catch (Throwable $e) {
                @unlink($written);
                $errors[] = 'Setup failed: ' . $e->getMessage();
            }
        }
    }
    if ($done) {
        page('BeWise · ready', '<h1>All set 🎉</h1><div class=ok>Database tables created, data seeded and accounts ready.</div>
        <p>Private config saved at <code>' . $h($done) . '</code>' . (str_starts_with($done, __DIR__) ? ' (inside the site, protected from the web)' : ' (outside public_html — safe from deploys)') . '.</p>
        <ul><li>Owner app: <a href="../owner/">/owner/</a></li><li>Jitendra Khimlani: <a href="../consultant/">/consultant/</a></li><li>Haresh: <a href="../manager/">/manager/</a></li><li>Clients: <a href="../client/">/client/</a></li>
        <li>Health check: <a href="v1/system.health">/api/v1/system.health</a></li></ul><p>This installer is now locked.</p>');
    }
}

$err = $errors ? '<div class=err>' . implode('<br>', array_map($h, $errors)) . '</div>' : '';
$v = fn($k, $d = '') => $h($_POST[$k] ?? $d);
$host = $h(($_SERVER['HTTP_HOST'] ?? ''));
page('BeWise · set up', <<<HTML
<h1>Set up BeWise</h1>
<p>One-time setup. First create a MySQL database in <b>hPanel → Websites → Manage → Databases → Management</b>, then fill this in. Passwords you type here are saved only on this server — never in GitHub or chat.</p>
$err
<form method="post" autocomplete="off">
<h2>1 · Database (from hPanel)</h2>
<div class="row"><div><label>Database name</label><input name="db_name" value="{$v('db_name')}" placeholder="u123456789_bewise" required></div>
<div><label>Database user</label><input name="db_user" value="{$v('db_user')}" placeholder="u123456789_bewise" required></div></div>
<label>Database password</label><input type="password" name="db_pass" required>
<div class="row"><div><label>Host</label><input name="db_host" value="{$v('db_host', 'localhost')}"></div><div><label>Port</label><input name="db_port" value="{$v('db_port', '3306')}"></div></div>
<label>Site address</label><input name="site_url" value="{$v('site_url', 'https://' . $host)}">

<h2>2 · Owner account</h2>
<div class="row"><div><label>Your name</label><input name="owner_name" value="{$v('owner_name')}"></div><div><label>Email</label><input type="email" name="owner_email" value="{$v('owner_email')}" required></div></div>
<label>Password <small>(10+ characters)</small></label><input type="password" name="owner_password" required>

<h2>3 · Team (optional — you can add them later in the owner app)</h2>
<div class="row"><div><label>Jitendra Khimlani's email</label><input type="email" name="consultant_email" value="{$v('consultant_email')}"></div><div><label>Temporary password</label><input type="password" name="consultant_password"></div></div>
<input type="hidden" name="consultant_name" value="Jitendra Khimlani">
<div class="row"><div><label>Haresh's email</label><input type="email" name="manager_email" value="{$v('manager_email')}"></div><div><label>Temporary password</label><input type="password" name="manager_password"></div></div>
<input type="hidden" name="manager_name" value="Haresh Moorjani">

<h2>4 · Email for sign-in codes</h2>
<label>How to send</label><select name="mail_transport"><option value="smtp">Hostinger mailbox (SMTP) — recommended</option><option value="mail">PHP mail()</option></select>
<label>From address <small>(a mailbox you created in hPanel → Emails, e.g. care@yourdomain)</small></label><input type="email" name="mail_from" value="{$v('mail_from')}">
<label>Mailbox password <small>(SMTP only)</small></label><input type="password" name="smtp_pass">
<div class="row"><div><label>SMTP host</label><input name="smtp_host" value="{$v('smtp_host', 'smtp.hostinger.com')}"></div><div><label>SMTP port</label><input name="smtp_port" value="{$v('smtp_port', '465')}"></div></div>

<h2>5 · Razorpay (optional — add later)</h2>
<p><small>Without it, clients can book with "Pay at the center / pay later" and Haresh records payments.</small></p>
<label>Key id</label><input name="rzp_key_id" value="{$v('rzp_key_id')}" placeholder="rzp_test_…">
<div class="row"><div><label>Key secret</label><input type="password" name="rzp_key_secret"></div><div><label>Webhook secret</label><input type="password" name="rzp_webhook_secret"></div></div>
<button type="submit">Create tables &amp; finish setup</button>
</form>
HTML);
