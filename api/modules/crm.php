<?php
/**
 * @owner MANAGER (base by HUB) · crm.* — client profile, addresses, consents, client search for staff.
 * Field sets are filtered by role (contracts §6): staff never get intake answers or notes from here.
 */
declare(strict_types=1);

function crm_client_view(array $c, bool $staff = false): array
{
    $out = ['id' => $c['id'], 'code' => $c['code'], 'name' => $c['name'], 'email' => $c['email'], 'phone' => $c['phone'],
        'dob' => $c['dob'], 'gender' => $c['gender'], 'city' => $c['city'], 'allergies' => jdec($c['allergies']),
        'shareJournal' => (bool)$c['share_journal'], 'onboardedAt' => iso($c['onboarded_at']), 'createdAt' => iso($c['created_at'])];
    if ($staff) {
        $out['hasAccount'] = (bool)$c['user_id'];
        $out['source'] = $c['source'];
        $out['lastVisit'] = iso(val("SELECT MAX(starts_at) FROM appointments WHERE client_id = ? AND status = 'completed'", [$c['id']]));
        $out['nextVisit'] = iso(val("SELECT MIN(starts_at) FROM appointments WHERE client_id = ? AND starts_at > UTC_TIMESTAMP() AND status IN ('confirmed','pending_payment')", [$c['id']]));
        $out['visits'] = (int)val("SELECT COUNT(*) FROM appointments WHERE client_id = ? AND status = 'completed'", [$c['id']]);
    }
    return $out;
}

function crm_client_for_staff(string $clientId): array
{
    Auth::require('consultant', 'manager', 'owner');
    $c = one('SELECT * FROM clients WHERE id = ?', [$clientId]);
    if (!$c) bw_fail('not_found', 'Client not found', 404);
    return $c;
}

/** Resolves which client a call is about: a client acts on self; staff pass clientId. */
function crm_target_client(array $in): string
{
    if (Auth::has('consultant', 'manager', 'owner') && !empty($in['clientId'])) return crm_client_for_staff((string)$in['clientId'])['id'];
    return Auth::clientId();
}

return [
    'getMyProfile' => function (array $in) {
        $c = one('SELECT * FROM clients WHERE id = ?', [Auth::clientId()]);
        $consents = [];
        foreach (all('SELECT type, granted FROM consent_records WHERE client_id = ? ORDER BY created_at', [$c['id']]) as $r) $consents[$r['type']] = (bool)$r['granted'];
        return crm_client_view($c) + ['consents' => $consents];
    },

    'updateClientProfile' => function (array $in) {
        $id = crm_target_client($in);
        $set = [];
        foreach (['name' => 120, 'phone' => 20, 'city' => 80, 'gender' => 30] as $k => $max) if (array_key_exists($k, $in)) $set[$k] = req_str($in, $k, $max, false);
        if (array_key_exists('dob', $in)) $set['dob'] = $in['dob'] ? (new DateTimeImmutable((string)$in['dob']))->format('Y-m-d') : null;
        if (array_key_exists('allergies', $in)) $set['allergies'] = array_values(array_map('strval', req_arr($in, 'allergies')));
        if (array_key_exists('shareJournal', $in)) $set['share_journal'] = (bool)$in['shareJournal'];
        if (!empty($in['onboarded'])) $set['onboarded_at'] = now_utc();
        if ($set) update('clients', $set, 'id = ?', [$id]);
        if (isset($set['name']) && ($uid = val('SELECT user_id FROM clients WHERE id = ?', [$id]))) q('UPDATE users SET name = ? WHERE id = ?', [$set['name'], $uid]);
        if (isset($set['phone']) && ($uid ??= val('SELECT user_id FROM clients WHERE id = ?', [$id]))) q('UPDATE users SET phone = ? WHERE id = ?', [$set['phone'], $uid]);
        return crm_client_view(one('SELECT * FROM clients WHERE id = ?', [$id]), Auth::has('consultant', 'manager', 'owner'));
    },

    'recordConsent' => function (array $in) {
        $id = crm_target_client($in);
        $type = req_enum($in, 'type', ['wellbeing', 'whatsapp', 'offers', 'ai_summary', 'share_journal']);
        insert('consent_records', ['id' => uuid(), 'client_id' => $id, 'type' => $type, 'granted' => !empty($in['granted']), 'source' => (string)($in['source'] ?? 'app')]);
        if ($type === 'share_journal') q('UPDATE clients SET share_journal = ? WHERE id = ?', [(int)!empty($in['granted']), $id]);
        return ['recorded' => true];
    },

    'listAddresses' => function (array $in) {
        $id = crm_target_client($in);
        return array_map('crm_address_view', all('SELECT * FROM client_addresses WHERE client_id = ? AND archived_at IS NULL ORDER BY is_default DESC, created_at DESC', [$id]));
    },

    'upsertAddress' => function (array $in) {
        $cid = crm_target_client($in);
        $row = ['name' => req_str($in, 'name', 120), 'phone' => req_str($in, 'phone', 20), 'line1' => req_str($in, 'line1'),
            'line2' => (string)req_str($in, 'line2', 190, false), 'city' => req_str($in, 'city', 80), 'state' => req_str($in, 'state', 80),
            'pin' => req_str($in, 'pin', 10)];
        if (!preg_match('/^\d{6}$/', (string)$row['pin'])) bw_fail('invalid_input', 'PIN code should be 6 digits.');
        $id = $in['id'] ?? null;
        if ($id) {
            if (!update('client_addresses', $row, 'id = ? AND client_id = ?', [$id, $cid]) && !val('SELECT 1 FROM client_addresses WHERE id = ? AND client_id = ?', [$id, $cid])) bw_fail('not_found', 'Address not found', 404);
        } else {
            $id = uuid();
            insert('client_addresses', $row + ['id' => $id, 'client_id' => $cid, 'is_default' => (int)!val('SELECT 1 FROM client_addresses WHERE client_id = ? AND archived_at IS NULL', [$cid])]);
        }
        if (!empty($in['isDefault'])) { q('UPDATE client_addresses SET is_default = 0 WHERE client_id = ?', [$cid]); q('UPDATE client_addresses SET is_default = 1 WHERE id = ?', [$id]); }
        return crm_address_view(one('SELECT * FROM client_addresses WHERE id = ?', [$id]));
    },

    'deleteAddress' => function (array $in) {
        $cid = crm_target_client($in);
        q('UPDATE client_addresses SET archived_at = UTC_TIMESTAMP() WHERE id = ? AND client_id = ?', [req_str($in, 'id', 36), $cid]);
        return ['deleted' => true];
    },

    // ── staff ──
    'searchClients' => function (array $in) {
        Auth::require('consultant', 'manager', 'owner');
        $s = trim((string)($in['q'] ?? ''));
        $limit = min(100, max(1, (int)($in['limit'] ?? 50)));
        $offset = max(0, (int)($in['offset'] ?? 0));
        $where = 'archived_at IS NULL'; $p = [];
        if ($s !== '') { $where .= ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR code LIKE ?)'; $like = '%' . addcslashes($s, '%_') . '%'; $p = [$like, $like, $like, $like]; }
        $rows = all("SELECT * FROM clients WHERE $where ORDER BY updated_at DESC LIMIT $limit OFFSET $offset", $p);
        return ['items' => array_map(fn($c) => crm_client_view($c, true), $rows), 'total' => (int)val("SELECT COUNT(*) FROM clients WHERE $where", $p)];
    },

    'getClient' => function (array $in) {
        $c = crm_client_for_staff((string)req_str($in, 'id', 36));
        return crm_client_view($c, true);
    },

    /** Walk-in / phone booking: staff create a client without an app account (links automatically when they sign in with the same email). */
    'createClient' => function (array $in) {
        Auth::require('consultant', 'manager', 'owner');
        $email = !empty($in['email']) ? req_email($in) : null;
        $phone = req_str($in, 'phone', 20, false);
        if ($email && ($dup = one('SELECT * FROM clients WHERE email = ?', [$email]))) return crm_client_view($dup, true);
        if ($phone && ($dup = one('SELECT * FROM clients WHERE phone = ?', [$phone]))) return crm_client_view($dup, true);
        $id = uuid();
        $src = Auth::has('consultant') ? 'consultant' : 'manager';
        insert('clients', ['id' => $id, 'code' => make_code('client'), 'name' => req_str($in, 'name', 120), 'email' => $email, 'phone' => $phone,
            'city' => req_str($in, 'city', 80, false), 'source' => $src, 'created_by' => Auth::userId()]);
        Events::emit('client.created', ['clientId' => $id]);
        return crm_client_view(one('SELECT * FROM clients WHERE id = ?', [$id]), true);
    },
];

function crm_address_view(array $a): array
{
    return ['id' => $a['id'], 'name' => $a['name'], 'phone' => $a['phone'], 'line1' => $a['line1'], 'line2' => $a['line2'],
        'city' => $a['city'], 'state' => $a['state'], 'pin' => $a['pin'], 'isDefault' => (bool)$a['is_default']];
}
