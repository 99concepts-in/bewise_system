<?php
/**
 * @owner HUB · auth.* — sign in / out.
 * Clients: requestOtp → verifyOtp (6-digit email code, 10 min, 5 tries, rate-limited).
 * Staff: login (email + password). The owner sets staff passwords in Team (staff.invite / staff.setPassword).
 */
declare(strict_types=1);

const BW_OTP_MINUTES = 10;

/** Finds (or creates) the client account for a WhatsApp number. */
function auth_client_by_phone(string $phone, string $name = ''): string
{
    $last10 = substr($phone, -10);
    $uid = val("SELECT id FROM users WHERE phone = ? AND status <> 'disabled' LIMIT 1", [$phone]);
    if (!$uid) {
        $c = one("SELECT id, user_id FROM clients WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '+', ''), '-', '') LIKE ? ORDER BY user_id IS NULL, created_at LIMIT 1", ['%' . $last10]);
        if ($c && $c['user_id']) $uid = $c['user_id'];
        else {
            $uid = uuid();
            insert('users', ['id' => $uid, 'phone' => $phone, 'name' => $name]);
            q("INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, 'client')", [$uid]);
            if ($c) q('UPDATE clients SET user_id = ? WHERE id = ?', [$uid, $c['id']]);
            else { $cid = uuid(); insert('clients', ['id' => $cid, 'code' => make_code('client'), 'user_id' => $uid, 'phone' => $phone, 'name' => $name]); Events::emit('client.created', ['clientId' => $cid]); }
        }
    }
    q("INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, 'client')", [$uid]);
    if (!val('SELECT 1 FROM clients WHERE user_id = ?', [$uid])) insert('clients', ['id' => uuid(), 'code' => make_code('client'), 'user_id' => $uid, 'phone' => $phone, 'name' => $name]);
    return $uid;
}

return [
    /** { email } → code by email · { phone } → code on WhatsApp (when the owner has turned WhatsApp sign-in on). */
    'requestOtp' => function (array $in) {
        if (!empty($in['phone'])) {
            $phone = wa_phone((string)$in['phone']);
            if (!$phone) bw_fail('invalid_phone', 'Please enter a valid mobile number.');
            if (!setting('whatsapp.login_enabled', false) || !wa_configured()) bw_fail('whatsapp_off', 'WhatsApp sign-in isn\'t available yet — please use your email.', 409);
            rate_limit('otp:ip:' . client_ip(), 20, 3600);
            rate_limit('otp:wa:' . $phone, 5, 900);
            $code = (string)random_int(100000, 999999);
            insert('otp_codes', ['id' => uuid(), 'identifier' => "wa:$phone", 'code_hash' => hash_hmac('sha256', $code, (string)bw_config('app_key')),
                'expires_at' => gmdate('Y-m-d H:i:s', time() + BW_OTP_MINUTES * 60)]);
            commit_now();
            if (!wa_send($phone, 'login_code', ['code' => $code])) bw_fail('whatsapp_failed', 'We couldn\'t send the WhatsApp message. Please try email instead.', 502);
            $out = ['sent' => true, 'channel' => 'whatsapp', 'expiresInSeconds' => BW_OTP_MINUTES * 60];
            if (bw_config('debug_show_otp') === true) $out['devCode'] = $code;
            return $out;
        }
        $email = req_email($in);
        rate_limit('otp:ip:' . client_ip(), 20, 3600);
        rate_limit('otp:email:' . $email, 5, 900);
        $code = (string)random_int(100000, 999999);
        insert('otp_codes', ['id' => uuid(), 'identifier' => $email, 'code_hash' => hash_hmac('sha256', $code, (string)bw_config('app_key')),
            'expires_at' => gmdate('Y-m-d H:i:s', time() + BW_OTP_MINUTES * 60)]);
        $sent = bw_send_mail($email, "Your BeWise sign-in code: $code",
            "Your BeWise sign-in code is $code\n\nIt works for " . BW_OTP_MINUTES . " minutes. If you didn't ask for it, you can ignore this email.\n\n— BeWise Holistic Wellness");
        if (!$sent) bw_fail('email_failed', 'We couldn\'t send the email just now. Please try again in a minute.', 502);
        $out = ['sent' => true, 'expiresInSeconds' => BW_OTP_MINUTES * 60];
        // Local development only (config debug_show_otp). Never enable on the live site.
        if (bw_config('debug_show_otp') === true) $out['devCode'] = $code;
        return $out;
    },

    'verifyOtp' => function (array $in) {
        $phone = !empty($in['phone']) ? wa_phone((string)$in['phone']) : null;
        $email = $phone ? null : req_email($in);
        $code = preg_replace('/\D/', '', (string)req_str($in, 'code', 10));
        rate_limit('otpv:ip:' . client_ip(), 40, 3600);
        $row = one('SELECT * FROM otp_codes WHERE identifier = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP() ORDER BY created_at DESC LIMIT 1', [$phone ? "wa:$phone" : $email]);
        if (!$row) bw_fail('code_expired', 'That code has expired. Please ask for a new one.');
        if ($row['attempts'] >= 5) bw_fail('too_many_attempts', 'Too many wrong tries. Please ask for a new code.', 429);
        if (!hash_equals($row['code_hash'], hash_hmac('sha256', $code, (string)bw_config('app_key')))) {
            q('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [$row['id']]);
            commit_now();
            bw_fail('wrong_code', 'That code doesn\'t match. Please check and try again.');
        }
        q('UPDATE otp_codes SET used_at = UTC_TIMESTAMP() WHERE id = ?', [$row['id']]);
        if ($phone) {
            $uid = auth_client_by_phone($phone, (string)($in['name'] ?? ''));
            if (val("SELECT status FROM users WHERE id = ?", [$uid]) === 'disabled') bw_fail('disabled', 'This account is turned off. Please contact BeWise.', 403);
            audit('login', 'user', $uid, ['method' => 'whatsapp']);
            return Auth::startSession($uid);
        }
        $existing = one('SELECT id, status FROM users WHERE email = ?', [$email]);
        if ($existing && $existing['status'] === 'disabled') bw_fail('disabled', 'This account is turned off. Please contact BeWise.', 403);
        if ($existing && $existing['status'] === 'invited') q("UPDATE users SET status = 'active' WHERE id = ?", [$existing['id']]);
        $uid = $existing ? $existing['id'] : Auth::ensureClientUser($email, (string)($in['name'] ?? ''));
        // Staff signing in by code keep their roles; anyone without a role becomes a client.
        if (!val('SELECT 1 FROM user_roles WHERE user_id = ? LIMIT 1', [$uid])) Auth::ensureClientUser($email);
        audit('login', 'user', $uid, ['method' => 'otp']);
        return Auth::startSession($uid);
    },

    /** { login: email or username, password } — `email` still accepted. */
    'login' => function (array $in) {
        $login = strtolower(trim((string)($in['login'] ?? $in['email'] ?? '')));
        if ($login === '') bw_fail('invalid_input', 'Enter your email or username.');
        $pass = (string)req_str($in, 'password', 200);
        rate_limit('login:ip:' . client_ip(), 30, 900);
        rate_limit('login:id:' . $login, 8, 900);
        $col = str_contains($login, '@') ? 'email' : 'username';
        $u = one("SELECT * FROM users WHERE $col = ? AND status IN ('active','invited')", [$login]);
        if (!$u || !$u['password_hash'] || !password_verify($pass, $u['password_hash'])) {
            commit_now();   // keep the failed-attempt count
            bw_fail('bad_login', 'Email/username or password is not right.', 401);
        }
        if ($u['status'] === 'invited') q("UPDATE users SET status = 'active' WHERE id = ?", [$u['id']]);
        if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($pass, PASSWORD_DEFAULT), $u['id']]);
        audit('login', 'user', $u['id'], ['method' => 'password']);
        return Auth::startSession($u['id']);
    },

    'me' => fn(array $in) => Auth::user(),

    'logout' => function (array $in) { Auth::endSession(); return ['signedOut' => true]; },

    /** Staff change their own password (min 10 chars). */
    'changePassword' => function (array $in) {
        $u = Auth::require(...BW_STAFF_ROLES);
        $new = (string)req_str($in, 'newPassword', 200);
        if (mb_strlen($new) < 10) bw_fail('weak_password', 'Use at least 10 characters.');
        $hash = val('SELECT password_hash FROM users WHERE id = ?', [$u['id']]);
        if ($hash && !password_verify((string)($in['currentPassword'] ?? ''), $hash)) bw_fail('bad_login', 'Current password is not right.', 401);
        q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($new, PASSWORD_DEFAULT), $u['id']]);
        q('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?', [$u['id'], hash('sha256', (string)($_COOKIE[BW_COOKIE] ?? ''))]);
        audit('password.changed', 'user', $u['id']);
        return ['changed' => true];
    },
];
