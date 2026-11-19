<?php
/**
 * @owner OWNER · staff.* — team & roles (OW-16/17/23/28). Only the owner manages people.
 * Roles: consultant (Jitu Bhaiya) · manager (Haresh) · owner · accountant (D-39, read-only finance).
 */
declare(strict_types=1);

function staff_view(array $u): array
{
    return ['id' => $u['id'], 'email' => $u['email'], 'name' => $u['name'], 'phone' => $u['phone'], 'status' => $u['status'],
        'roles' => array_column(all('SELECT role FROM user_roles WHERE user_id = ?', [$u['id']]), 'role'), 'lastLoginAt' => iso($u['last_login_at']), 'hasPassword' => (bool)$u['password_hash']];
}

/** Default hours until the consultant edits them: Mon–Sat 10:00–13:00 and 16:00–19:00 (Asia/Kolkata). */
function staff_default_hours(string $uid): void
{
    if (val('SELECT 1 FROM availability_rules WHERE consultant_id = ?', [$uid])) return;
    for ($d = 1; $d <= 6; $d++) foreach ([['10:00:00', '13:00:00'], ['16:00:00', '19:00:00']] as [$s, $e]) {
        insert('availability_rules', ['id' => uuid(), 'consultant_id' => $uid, 'weekday' => $d, 'start_time' => $s, 'end_time' => $e, 'modes' => ['online', 'in_person']]);
    }
}

return [
    'listStaff' => function (array $in) {
        Auth::require('owner');
        return array_map('staff_view', all("SELECT DISTINCT u.* FROM users u JOIN user_roles r ON r.user_id = u.id AND r.role IN ('consultant','manager','owner','accountant') ORDER BY u.created_at"));
    },
    /** Adds a team member with a temporary password the owner shares in person (they change it after signing in). */
    'invite' => function (array $in) {
        Auth::require('owner');
        $email = req_email($in);
        $role = req_enum($in, 'role', BW_STAFF_ROLES);
        $pass = (string)req_str($in, 'tempPassword', 200);
        if (mb_strlen($pass) < 10) bw_fail('weak_password', 'Temporary password: at least 10 characters.');
        $u = one('SELECT * FROM users WHERE email = ?', [$email]);
        if (!$u) { insert('users', ['id' => $uid = uuid(), 'email' => $email, 'name' => req_str($in, 'name', 120), 'phone' => req_str($in, 'phone', 20, false), 'password_hash' => password_hash($pass, PASSWORD_DEFAULT), 'status' => 'invited']); }
        else { $uid = $u['id']; q('UPDATE users SET password_hash = ?, name = COALESCE(NULLIF(?, \'\'), name), status = IF(status = \'disabled\', \'invited\', status) WHERE id = ?', [password_hash($pass, PASSWORD_DEFAULT), (string)($in['name'] ?? ''), $uid]); }
        q('INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, ?)', [$uid, $role]);
        if ($role === 'consultant') staff_default_hours($uid);
        audit('staff.invite', 'user', $uid, ['role' => $role]);
        bw_send_mail($email, 'You\'ve been added to BeWise', "Hello,\n\nYou've been added to the BeWise team as $role.\nSign in at " . bw_public_url('') . " with this email and the temporary password the owner gave you, then change it.\n\n— BeWise");
        return staff_view(one('SELECT * FROM users WHERE id = ?', [$uid]));
    },
    'setRoles' => function (array $in) {
        $me = Auth::require('owner');
        $uid = (string)req_str($in, 'userId', 36);
        $roles = array_values(array_intersect(req_arr($in, 'roles', true), BW_ROLES));
        if ($uid === $me['id'] && !in_array('owner', $roles, true)) bw_fail('invalid_input', 'You can\'t remove your own owner role.');
        q("DELETE FROM user_roles WHERE user_id = ? AND role <> 'client'", [$uid]);
        foreach ($roles as $r) q('INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, ?)', [$uid, $r]);
        audit('staff.roles', 'user', $uid, ['roles' => $roles]);
        return staff_view(one('SELECT * FROM users WHERE id = ?', [$uid]));
    },
    'setStatus' => function (array $in) {
        $me = Auth::require('owner');
        $uid = (string)req_str($in, 'userId', 36);
        if ($uid === $me['id']) bw_fail('invalid_input', 'You can\'t turn off your own account.');
        $status = req_enum($in, 'status', ['active', 'disabled']);
        q('UPDATE users SET status = ? WHERE id = ?', [$status, $uid]);
        if ($status === 'disabled') q('DELETE FROM sessions WHERE user_id = ?', [$uid]);
        audit('staff.status', 'user', $uid, ['status' => $status]);
        return ['saved' => true];
    },
    'resetPassword' => function (array $in) {
        Auth::require('owner');
        $uid = (string)req_str($in, 'userId', 36);
        $pass = (string)req_str($in, 'tempPassword', 200);
        if (mb_strlen($pass) < 10) bw_fail('weak_password', 'At least 10 characters.');
        q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($pass, PASSWORD_DEFAULT), $uid]);
        q('DELETE FROM sessions WHERE user_id = ?', [$uid]);
        audit('staff.reset_password', 'user', $uid);
        return ['saved' => true];
    },
    'listAudit' => function (array $in) {
        Auth::require('owner');
        return array_map(fn($a) => ['action' => $a['action'], 'entity' => $a['entity'], 'entityId' => $a['entity_id'], 'actor' => $a['actor'], 'at' => iso($a['created_at'])],
            all('SELECT a.*, u.name AS actor FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 300'));
    },
];
