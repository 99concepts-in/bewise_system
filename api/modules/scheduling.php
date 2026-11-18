<?php
/**
 * @owner CONSULTANT · scheduling.* — consultation types, availability, slots, booking, check-in, feedback, ICS feed.
 * Times in the API are ISO 8601; slots are computed in Asia/Kolkata wall-clock from availability_rules.
 * @decision(D-16) no refunds: cancelling never returns money — rescheduling is free inside the policy window (D-08).
 */
declare(strict_types=1);

const BW_ACTIVE_STATUSES = ['pending_payment', 'confirmed', 'checked_in', 'in_session'];

function scheduling_types(bool $activeOnly = true): array
{
    $rows = all('SELECT * FROM consultation_types' . ($activeOnly ? ' WHERE active = 1' : '') . ' ORDER BY sort');
    return array_map(fn($t) => ['id' => $t['id'], 'name' => $t['name'], 'minutes' => (int)$t['minutes'], 'feePaise' => (int)$t['fee_paise'],
        'modes' => jdec($t['modes']), 'includesRemedy' => (bool)$t['includes_remedy'], 'active' => (bool)$t['active']], $rows);
}

function scheduling_type(string $id): array
{
    $t = one('SELECT * FROM consultation_types WHERE id = ? AND active = 1', [$id]);
    if (!$t) bw_fail('invalid_input', 'Unknown consultation type');
    return $t;
}

function scheduling_view(array $a, ?string $viewerRole = null): array
{
    $viewerRole ??= Auth::has('consultant') ? 'consultant' : (Auth::has('owner') ? 'owner' : (Auth::has('manager') ? 'manager' : 'client'));
    $c = one('SELECT id, code, name, phone, email FROM clients WHERE id = ?', [$a['client_id']]);
    $fb = one('SELECT * FROM session_feedback WHERE appointment_id = ?', [$a['id']]);
    $out = [
        'id' => $a['id'], 'code' => $a['code'], 'type' => $a['consultation_type_id'], 'mode' => $a['mode'],
        'startsAt' => iso($a['starts_at']), 'endsAt' => iso($a['ends_at']), 'status' => $a['status'],
        'paymentStatus' => $a['payment_status'], 'payLater' => (bool)$a['pay_later'], 'amountPaise' => (int)$a['amount_paise'],
        'holdExpiresAt' => iso($a['hold_expires_at']), 'source' => $a['source'], 'rescheduled' => (int)$a['reschedule_count'],
        'timeRequested' => $a['starts_at'] === null, 'meetingUrl' => $a['mode'] === 'online' && in_array($a['status'], ['confirmed', 'checked_in', 'in_session'], true) ? $a['meeting_url'] : null,
        'paidAt' => iso($a['paid_at']), 'createdAt' => iso($a['created_at']),
        'client' => $viewerRole === 'client' ? null : ['id' => $c['id'], 'code' => $c['code'], 'name' => $c['name'], 'phone' => $c['phone']],
        'hasIntake' => (bool)$a['intake_id'],
    ];
    // feedback: client (own) + consultant see it all; owner rating only; manager nothing (contracts §6)
    if ($fb) {
        if (in_array($viewerRole, ['client', 'consultant'], true)) {
            $out['feedback'] = ['rating' => (int)$fb['rating'], 'tags' => jdec($fb['tags']), 'benefits' => jdec($fb['benefits']), 'notes' => $fb['notes_for_consultant'], 'at' => iso($fb['updated_at'])];
        } elseif ($viewerRole === 'owner') {
            $out['feedback'] = ['rating' => (int)$fb['rating']];
        }
    }
    if (in_array($viewerRole, ['client', 'consultant'], true)) $out['clientNote'] = $a['client_note'];
    return $out;
}

function scheduling_get_for_viewer(string $id): array
{
    $a = one('SELECT * FROM appointments WHERE id = ?', [$id]);
    if (!$a) bw_fail('not_found', 'Appointment not found', 404);
    if (Auth::has('consultant', 'manager', 'owner')) return $a;
    if (Auth::has('client') && $a['client_id'] === Auth::clientId()) return $a;
    bw_fail('not_found', 'Appointment not found', 404);
}

function scheduling_history(string $apptId, string $action, ?string $from = null, ?string $to = null, ?string $note = null): void
{
    insert('appointment_history', ['id' => uuid(), 'appointment_id' => $apptId, 'action' => $action, 'from_value' => $from, 'to_value' => $to, 'by_user' => Auth::userId(), 'note' => $note]);
}

/** Expires unpaid holds whose time ran out (called lazily before slot / list queries). */
function scheduling_expire_holds(): void
{
    $rows = all("SELECT id FROM appointments WHERE status = 'pending_payment' AND pay_later = 0 AND hold_expires_at IS NOT NULL AND hold_expires_at < UTC_TIMESTAMP()");
    foreach ($rows as $r) {
        q("UPDATE appointments SET status = 'expired' WHERE id = ?", [$r['id']]);
        scheduling_history($r['id'], 'expired');
    }
}

/** Free slots: availability rules − exceptions − booked/held appointments − past times. */
function scheduling_slots(string $typeId, string $mode, string $fromDate, string $toDate, string $consultantId, ?string $ignoreApptId = null): array
{
    $t = scheduling_type($typeId);
    $len = (int)$t['minutes'];
    $tz = new DateTimeZone(BW_TZ);
    $from = new DateTimeImmutable($fromDate, $tz);
    $to = new DateTimeImmutable($toDate, $tz);
    $maxDays = (int)setting('booking.days_ahead', 45);
    $limit = now_local()->setTime(0, 0)->modify("+$maxDays days");
    if ($to > $limit) $to = $limit;
    if ($from < now_local()->setTime(0, 0)) $from = now_local()->setTime(0, 0);
    if ($to->diff($from)->days > 62) $to = $from->modify('+62 days');

    $rules = all('SELECT * FROM availability_rules WHERE consultant_id = ?', [$consultantId]);
    $exc = [];
    foreach (all('SELECT * FROM availability_exceptions WHERE consultant_id = ? AND on_date BETWEEN ? AND ?', [$consultantId, $from->format('Y-m-d'), $to->format('Y-m-d')]) as $e) $exc[$e['on_date']][] = $e;
    $busy = all("SELECT starts_at, ends_at FROM appointments WHERE consultant_id = ? AND starts_at IS NOT NULL AND status IN ('" . implode("','", BW_ACTIVE_STATUSES) . "')
                 AND starts_at < ? AND ends_at > ?" . ($ignoreApptId ? ' AND id <> ?' : ''),
        array_merge([$consultantId, $to->modify('+1 day')->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s'), $from->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s')], $ignoreApptId ? [$ignoreApptId] : []));
    $busyRanges = array_map(fn($b) => [strtotime($b['starts_at'] . ' UTC'), strtotime($b['ends_at'] . ' UTC')], $busy);
    $earliest = time() + 2 * 3600; // at least 2 hours' notice

    $days = [];
    for ($d = $from; $d <= $to; $d = $d->modify('+1 day')) {
        $date = $d->format('Y-m-d');
        $windows = [];
        $dayExc = $exc[$date] ?? [];
        if (array_filter($dayExc, fn($e) => (int)$e['closed'] === 1)) { $days[] = ['date' => $date, 'slots' => []]; continue; }
        $custom = array_filter($dayExc, fn($e) => (int)$e['closed'] === 0 && $e['start_time']);
        if ($custom) {
            foreach ($custom as $e) $windows[] = [$e['start_time'], $e['end_time']];
        } else {
            foreach ($rules as $r) if ((int)$r['weekday'] === (int)$d->format('N') && in_array($mode, jdec($r['modes']), true)) $windows[] = [$r['start_time'], $r['end_time']];
        }
        $slots = [];
        foreach ($windows as [$ws, $we]) {
            $start = new DateTimeImmutable("$date $ws", $tz);
            $end = new DateTimeImmutable("$date $we", $tz);
            for ($s = $start; $s->modify("+$len minutes") <= $end; $s = $s->modify("+$len minutes")) {
                $a = $s->getTimestamp(); $b = $a + $len * 60;
                if ($a < $earliest) continue;
                foreach ($busyRanges as [$x, $y]) if ($a < $y && $b > $x) continue 2;
                $slots[] = $s->format('c');
            }
        }
        sort($slots);
        $days[] = ['date' => $date, 'slots' => array_values(array_unique($slots))];
    }
    return ['consultationTypeId' => $typeId, 'mode' => $mode, 'minutes' => $len, 'days' => $days];
}

function scheduling_assert_free(string $typeId, string $mode, string $startsIso, string $consultantId, ?string $ignore = null): void
{
    $local = (new DateTimeImmutable($startsIso))->setTimezone(new DateTimeZone(BW_TZ));
    $avail = scheduling_slots($typeId, $mode, $local->format('Y-m-d'), $local->format('Y-m-d'), $consultantId, $ignore);
    $wanted = $local->getTimestamp();
    foreach ($avail['days'][0]['slots'] ?? [] as $s) if ((new DateTimeImmutable($s))->getTimestamp() === $wanted) return;
    bw_fail('slot_taken', 'Sorry, that time was just taken or isn\'t open. Please pick another time.', 409);
}

/** Creates an appointment (client booking or staff booking). */
function scheduling_create(string $clientId, array $in, string $source): array
{
    $typeId = req_str($in, 'consultationTypeId', 40);
    $t = scheduling_type($typeId);
    $mode = req_enum($in, 'mode', ['online', 'in_person']);
    if (!in_array($mode, jdec($t['modes']), true)) bw_fail('invalid_input', 'That consultation is not offered in this mode');
    $consultantId = (string)($in['consultantId'] ?? default_consultant_id());
    $startsAt = $in['startsAt'] ?? null;
    $payLater = !empty($in['payLater']) && setting('booking.pay_later_allowed', true);
    if ($startsAt) {
        // serialise bookings for this consultant so two people can't take the same slot
        val('SELECT GET_LOCK(?, 5)', ['bw-book-' . $consultantId]);
        scheduling_assert_free($typeId, $mode, (string)$startsAt, $consultantId);
    } elseif ($source === 'client' && empty($in['timeRequested'])) {
        bw_fail('invalid_input', 'Please pick a time');
    }
    $startDb = to_db_time($startsAt);
    $endDb = $startDb ? gmdate('Y-m-d H:i:s', strtotime($startDb . ' UTC') + (int)$t['minutes'] * 60) : null;
    $id = uuid();
    $staffBooked = $source !== 'client';
    $holdMin = (int)setting('booking.hold_minutes', 15);
    $status = $payLater ? 'confirmed' : 'pending_payment';
    insert('appointments', [
        'id' => $id, 'code' => make_code('appointment'), 'client_id' => $clientId, 'consultant_id' => $consultantId,
        'consultation_type_id' => $typeId, 'mode' => $mode, 'starts_at' => $startDb, 'ends_at' => $endDb, 'status' => $status,
        'pay_later' => (int)$payLater, 'amount_paise' => (int)$t['fee_paise'],
        // staff bookings wait 24 h for payment; client holds last booking.hold_minutes
        'hold_expires_at' => $payLater ? null : gmdate('Y-m-d H:i:s', time() + ($staffBooked ? 86400 : $holdMin * 60)),
        'client_note' => req_str($in, 'clientNote', 2000, false), 'source' => $source,
        'meeting_url' => $mode === 'online' ? (setting('booking.meeting_url', '') ?: null) : null,
        'intake_id' => $in['intakeId'] ?? null, 'created_by' => Auth::userId(),
    ]);
    if ($startsAt) val('SELECT RELEASE_LOCK(?)', ['bw-book-' . $consultantId]);
    scheduling_history($id, 'created', null, $status);
    if (!empty($in['intakeId'])) intake_attach((string)$in['intakeId'], $id, $clientId);
    Events::emit('appointment.held', ['appointmentId' => $id, 'clientId' => $clientId]);
    if ($payLater) scheduling_confirmed($id);
    if ($staffBooked) notify(['clientId' => $clientId], 'A consultation was booked for you', 'Open the app to see the time and pay.', '/client/app/appointments', 'normal', true);
    return one('SELECT * FROM appointments WHERE id = ?', [$id]);
}

/** Called when an appointment becomes confirmed (paid, or pay-later). */
function scheduling_confirmed(string $id): void
{
    $a = one('SELECT * FROM appointments WHERE id = ?', [$id]);
    Events::emit('appointment.confirmed', ['appointmentId' => $id, 'clientId' => $a['client_id'], 'consultantId' => $a['consultant_id'], 'startsAt' => iso($a['starts_at']), 'mode' => $a['mode']]);
    $when = $a['starts_at'] ? (new DateTimeImmutable($a['starts_at'], new DateTimeZone('UTC')))->setTimezone(new DateTimeZone(BW_TZ))->format('D j M, g:i a') : 'time to be confirmed';
    $c = one('SELECT name FROM clients WHERE id = ?', [$a['client_id']]);
    notify(['clientId' => $a['client_id']], 'Your consultation is booked', "See you on $when (" . ($a['mode'] === 'online' ? 'online' : 'at the studio') . ').', '/client/app/appointments', 'normal', true);
    notify(['userId' => $a['consultant_id']], 'New booking', ($c['name'] ?: 'A client') . " · $when", '/consultant/', 'normal');
    notify(['role' => 'manager'], 'New booking', ($c['name'] ?: 'A client') . " · $when", '/manager/', 'normal');
}

/** Payment captured for an appointment (finance → scheduling). */
Events::on('payment.captured', function (array $p) {
    if (($p['purpose'] ?? '') !== 'appointment') return;
    $a = one('SELECT * FROM appointments WHERE id = ? FOR UPDATE', [$p['refId']]);
    if (!$a || $a['payment_status'] === 'paid') return;
    $wasConfirmed = $a['status'] === 'confirmed';
    $set = ['payment_status' => 'paid', 'paid_at' => now_utc(), 'hold_expires_at' => null];
    if (in_array($a['status'], ['pending_payment', 'expired'], true)) {
        $set['status'] = 'confirmed';
        // paid after the hold expired and the slot was taken → keep the money, ask for a new time (consultant K1 §4.3)
        if ($a['status'] === 'expired' && $a['starts_at']) {
            $clash = val("SELECT 1 FROM appointments WHERE consultant_id = ? AND id <> ? AND status IN ('" . implode("','", BW_ACTIVE_STATUSES) . "') AND starts_at < ? AND ends_at > ?",
                [$a['consultant_id'], $a['id'], $a['ends_at'], $a['starts_at']]);
            if ($clash) { $set['starts_at'] = null; $set['ends_at'] = null; }
        }
    }
    update('appointments', $set, 'id = ?', [$a['id']]);
    scheduling_history($a['id'], 'paid');
    if (!$wasConfirmed) scheduling_confirmed($a['id']);
});

function scheduling_ics_feed(string $token): string
{
    $row = one('SELECT user_id FROM calendar_feed_tokens WHERE token_hash = ? AND revoked_at IS NULL', [hash('sha256', $token)]);
    if (!$row) { http_response_code(404); return ''; }
    $isConsultant = (bool)val("SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'consultant'", [$row['user_id']]);
    $rows = $isConsultant
        ? all("SELECT a.*, c.name AS cname FROM appointments a JOIN clients c ON c.id = a.client_id WHERE a.consultant_id = ? AND a.starts_at > UTC_TIMESTAMP() - INTERVAL 30 DAY AND a.status IN ('confirmed','checked_in','in_session','completed')", [$row['user_id']])
        : all("SELECT a.*, '' AS cname FROM appointments a JOIN clients c ON c.id = a.client_id WHERE c.user_id = ? AND a.starts_at > UTC_TIMESTAMP() - INTERVAL 30 DAY AND a.status IN ('confirmed','checked_in','in_session','completed')", [$row['user_id']]);
    $esc = fn(string $s) => addcslashes($s, ",;\\\n");
    $out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BeWise//Appointments//EN", "X-WR-CALNAME:BeWise", "CALSCALE:GREGORIAN"];
    foreach ($rows as $a) {
        if (!$a['starts_at']) continue;
        $title = $isConsultant ? 'BeWise · ' . ($a['cname'] ?: 'Client') : 'BeWise consultation with Jitu Bhaiya';
        $out[] = 'BEGIN:VEVENT';
        $out[] = 'UID:' . $a['id'] . '@bewise';
        $out[] = 'DTSTAMP:' . gmdate('Ymd\THis\Z');
        $out[] = 'DTSTART:' . gmdate('Ymd\THis\Z', strtotime($a['starts_at'] . ' UTC'));
        $out[] = 'DTEND:' . gmdate('Ymd\THis\Z', strtotime($a['ends_at'] . ' UTC'));
        $out[] = 'SUMMARY:' . $esc($title);
        $out[] = 'LOCATION:' . $esc($a['mode'] === 'online' ? ($a['meeting_url'] ?: 'Online') : (string)(setting('business.profile', [])['studio'] ?? 'BeWise studio'));
        $out[] = 'END:VEVENT';
    }
    $out[] = 'END:VCALENDAR';
    return implode("\r\n", $out) . "\r\n";
}

return [
    'listConsultationTypes' => fn(array $in) => scheduling_types(($in['activeOnly'] ?? true) !== false),

    /** OWNER settings (O-09) edits fee / duration / modes. */
    'upsertConsultationType' => function (array $in) {
        Auth::require('owner');
        $id = req_str($in, 'id', 40);
        $row = ['name' => req_str($in, 'name', 120), 'minutes' => req_int($in, 'minutes', 10, 240), 'fee_paise' => req_int($in, 'feePaise', 0, 10_000_000),
            'modes' => array_values(array_intersect(req_arr($in, 'modes', true), ['online', 'in_person'])), 'active' => ($in['active'] ?? true) ? 1 : 0];
        q('INSERT INTO consultation_types (id, name, minutes, fee_paise, modes, active) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), minutes = VALUES(minutes), fee_paise = VALUES(fee_paise), modes = VALUES(modes), active = VALUES(active)',
            [$id, $row['name'], $row['minutes'], $row['fee_paise'], json_encode($row['modes']), $row['active']]);
        audit('settings.consultation_type', 'consultation_type', $id, $row);
        return scheduling_types(false);
    },

    'getAvailability' => function (array $in) {
        $u = Auth::require('consultant', 'manager', 'owner');
        $cid = Auth::has('consultant') ? $u['id'] : default_consultant_id();
        return [
            'rules' => array_map(fn($r) => ['id' => $r['id'], 'weekday' => (int)$r['weekday'], 'start' => substr($r['start_time'], 0, 5), 'end' => substr($r['end_time'], 0, 5), 'modes' => jdec($r['modes'])],
                all('SELECT * FROM availability_rules WHERE consultant_id = ? ORDER BY weekday, start_time', [$cid])),
            'exceptions' => array_map(fn($e) => ['id' => $e['id'], 'date' => $e['on_date'], 'closed' => (bool)$e['closed'], 'start' => $e['start_time'] ? substr($e['start_time'], 0, 5) : null, 'end' => $e['end_time'] ? substr($e['end_time'], 0, 5) : null, 'note' => $e['note']],
                all('SELECT * FROM availability_exceptions WHERE consultant_id = ? AND on_date >= CURDATE() - INTERVAL 1 DAY ORDER BY on_date', [$cid])),
        ];
    },

    /** Replaces the weekly hours: rules = [{ weekday 1-7, start "10:00", end "13:00", modes [...] }] */
    'setAvailability' => function (array $in) {
        $u = Auth::require('consultant');
        $rules = req_arr($in, 'rules', true);
        q('DELETE FROM availability_rules WHERE consultant_id = ?', [$u['id']]);
        foreach ($rules as $r) {
            if (!is_array($r)) continue;
            $wd = req_int($r, 'weekday', 1, 7);
            $s = req_str($r, 'start', 5); $e = req_str($r, 'end', 5);
            if (!preg_match('/^\d\d:\d\d$/', $s) || !preg_match('/^\d\d:\d\d$/', $e) || $s >= $e) bw_fail('invalid_input', 'Hours must look like 10:00 – 13:00');
            $modes = array_values(array_intersect(req_arr($r, 'modes') ?: ['online', 'in_person'], ['online', 'in_person']));
            insert('availability_rules', ['id' => uuid(), 'consultant_id' => $u['id'], 'weekday' => $wd, 'start_time' => "$s:00", 'end_time' => "$e:00", 'modes' => $modes]);
        }
        return ['saved' => count($rules)];
    },

    'addException' => function (array $in) {
        $u = Auth::require('consultant');
        $date = (new DateTimeImmutable((string)req_str($in, 'date', 10)))->format('Y-m-d');
        $closed = ($in['closed'] ?? true) ? 1 : 0;
        $id = uuid();
        insert('availability_exceptions', ['id' => $id, 'consultant_id' => $u['id'], 'on_date' => $date, 'closed' => $closed,
            'start_time' => $closed ? null : req_str($in, 'start', 5) . ':00', 'end_time' => $closed ? null : req_str($in, 'end', 5) . ':00', 'note' => req_str($in, 'note', 190, false)]);
        return ['id' => $id];
    },

    'removeException' => function (array $in) {
        $u = Auth::require('consultant');
        q('DELETE FROM availability_exceptions WHERE id = ? AND consultant_id = ?', [req_str($in, 'id', 36), $u['id']]);
        return ['removed' => true];
    },

    'getAvailableSlots' => function (array $in) {
        scheduling_expire_holds();
        $today = now_local()->format('Y-m-d');
        return scheduling_slots(req_str($in, 'consultationTypeId', 40), req_enum($in, 'mode', ['online', 'in_person']),
            (string)($in['from'] ?? $today), (string)($in['to'] ?? now_local()->modify('+14 days')->format('Y-m-d')),
            (string)($in['consultantId'] ?? default_consultant_id()));
    },

    /** CLIENT books for self → pending_payment hold (or confirmed when payLater). Then finance.createCheckout. */
    'holdAppointment' => function (array $in) {
        scheduling_expire_holds();
        $cid = Auth::clientId();
        return scheduling_view(scheduling_create($cid, $in, 'client'), 'client');
    },

    /** Consultant / manager book for a client (walk-in, phone call). Arrives awaiting payment unless payLater. */
    'bookForClient' => function (array $in) {
        Auth::require('consultant', 'manager', 'owner');
        scheduling_expire_holds();
        $client = crm_client_for_staff((string)req_str($in, 'clientId', 36));
        $src = Auth::has('consultant') ? 'consultant' : (Auth::has('manager') ? 'manager' : 'owner');
        return scheduling_view(scheduling_create($client['id'], $in, $src));
    },

    'rescheduleAppointment' => function (array $in) {
        $a = scheduling_get_for_viewer((string)req_str($in, 'appointmentId', 36));
        if (!in_array($a['status'], ['pending_payment', 'confirmed'], true)) bw_fail('invalid_state', 'This appointment can\'t be moved now.', 409);
        $policy = setting('policy.reschedule', ['freeHoursBefore' => 24, 'lateReschedulesAllowed' => 1]);
        $isClient = !Auth::has('consultant', 'manager', 'owner');
        if ($isClient && $a['starts_at']) {
            $hoursLeft = (strtotime($a['starts_at'] . ' UTC') - time()) / 3600;
            if ($hoursLeft < 0) bw_fail('too_late', 'This time has passed. Please message us on WhatsApp.', 409);
            if ($hoursLeft < (int)$policy['freeHoursBefore'] && (int)$a['reschedule_count'] >= (int)$policy['lateReschedulesAllowed']) {
                bw_fail('policy', 'Less than ' . (int)$policy['freeHoursBefore'] . ' hours to go — please message us on WhatsApp to move it.', 409);
            }
        }
        $starts = (string)req_str($in, 'startsAt', 40);
        val('SELECT GET_LOCK(?, 5)', ['bw-book-' . $a['consultant_id']]);
        scheduling_assert_free($a['consultation_type_id'], (string)($in['mode'] ?? $a['mode']), $starts, $a['consultant_id'], $a['id']);
        $len = (int)val('SELECT minutes FROM consultation_types WHERE id = ?', [$a['consultation_type_id']]);
        $db = to_db_time($starts);
        update('appointments', ['starts_at' => $db, 'ends_at' => gmdate('Y-m-d H:i:s', strtotime("$db UTC") + $len * 60),
            'mode' => req_enum($in, 'mode', ['online', 'in_person'], false) ?? $a['mode'], 'reschedule_count' => (int)$a['reschedule_count'] + ($a['starts_at'] ? 1 : 0)], 'id = ?', [$a['id']]);
        val('SELECT RELEASE_LOCK(?)', ['bw-book-' . $a['consultant_id']]);
        scheduling_history($a['id'], $a['starts_at'] ? 'rescheduled' : 'time_set', iso($a['starts_at']), $starts, req_str($in, 'reason', 255, false));
        Events::emit('appointment.rescheduled', ['appointmentId' => $a['id'], 'fromStartsAt' => iso($a['starts_at']), 'toStartsAt' => $starts, 'by' => Auth::userId()]);
        $when = (new DateTimeImmutable($starts))->setTimezone(new DateTimeZone(BW_TZ))->format('D j M, g:i a');
        if ($isClient) notify(['userId' => $a['consultant_id']], 'Appointment moved', "Now on $when", '/consultant/');
        else notify(['clientId' => $a['client_id']], 'Your consultation time changed', "New time: $when", '/client/app/appointments', 'normal', true);
        return scheduling_view(one('SELECT * FROM appointments WHERE id = ?', [$a['id']]));
    },

    /** @decision(D-16) no refunds — cancelling a paid session keeps the payment as credit for a reschedule (staff decide). */
    'cancelAppointment' => function (array $in) {
        $a = scheduling_get_for_viewer((string)req_str($in, 'appointmentId', 36));
        if (!in_array($a['status'], ['pending_payment', 'confirmed'], true)) bw_fail('invalid_state', 'This appointment can\'t be cancelled now.', 409);
        if ($a['payment_status'] === 'paid' && !Auth::has('consultant', 'manager', 'owner')) {
            bw_fail('no_refunds', 'Paid sessions can\'t be cancelled, but you can move them to another time.', 409);
        }
        update('appointments', ['status' => 'cancelled', 'cancelled_at' => now_utc(), 'cancel_reason' => req_str($in, 'reason', 255, false)], 'id = ?', [$a['id']]);
        scheduling_history($a['id'], 'cancelled', $a['status'], 'cancelled', req_str($in, 'reason', 255, false));
        Events::emit('appointment.cancelled', ['appointmentId' => $a['id'], 'by' => Auth::userId(), 'reason' => $in['reason'] ?? null, 'refundEligiblePaise' => 0]);
        return ['refundEligiblePaise' => 0];
    },

    'listAppointments' => function (array $in) {
        scheduling_expire_holds();
        $where = ['1=1']; $p = [];
        if (Auth::has('consultant', 'manager', 'owner')) {
            if (Auth::has('consultant') && !Auth::has('owner', 'manager')) { $where[] = 'a.consultant_id = ?'; $p[] = Auth::userId(); }
            if (!empty($in['clientId'])) { $where[] = 'a.client_id = ?'; $p[] = $in['clientId']; }
        } else {
            $where[] = 'a.client_id = ?'; $p[] = Auth::clientId();
        }
        if (!empty($in['status'])) { $st = array_values(array_intersect((array)$in['status'], ['pending_payment', 'confirmed', 'checked_in', 'in_session', 'completed', 'cancelled', 'no_show', 'expired'])); if ($st) $where[] = "a.status IN ('" . implode("','", $st) . "')"; }
        if (!empty($in['from'])) { $where[] = '(a.starts_at >= ? OR a.starts_at IS NULL)'; $p[] = to_db_time((string)$in['from']); }
        if (!empty($in['to'])) { $where[] = 'a.starts_at < ?'; $p[] = to_db_time((string)$in['to']); }
        if (!empty($in['date'])) {
            $d = new DateTimeImmutable((string)$in['date'], new DateTimeZone(BW_TZ));
            $where[] = 'a.starts_at >= ? AND a.starts_at < ?';
            $p[] = $d->setTime(0, 0)->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
            $p[] = $d->setTime(0, 0)->modify('+1 day')->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
        }
        $limit = min(200, max(1, (int)($in['limit'] ?? 100)));
        $order = ($in['order'] ?? 'asc') === 'desc' ? 'DESC' : 'ASC';
        $rows = all('SELECT a.* FROM appointments a WHERE ' . implode(' AND ', $where) . " ORDER BY a.starts_at IS NULL, a.starts_at $order LIMIT $limit", $p);
        return ['items' => array_map(fn($a) => scheduling_view($a), $rows)];
    },

    'getAppointment' => fn(array $in) => scheduling_view(scheduling_get_for_viewer((string)req_str($in, 'id', 36))),

    'checkInAppointment' => function (array $in) {
        Auth::require('consultant', 'manager', 'owner');
        $a = scheduling_get_for_viewer((string)req_str($in, 'id', 36));
        if ($a['status'] !== 'confirmed') bw_fail('invalid_state', 'Only confirmed appointments can be checked in.', 409);
        update('appointments', ['status' => 'checked_in', 'checked_in_at' => now_utc()], 'id = ?', [$a['id']]);
        scheduling_history($a['id'], 'checked_in');
        notify(['userId' => $a['consultant_id']], 'Client has arrived', (string)val('SELECT name FROM clients WHERE id = ?', [$a['client_id']]) . ' is here.', '/consultant/', 'high');
        return scheduling_view(one('SELECT * FROM appointments WHERE id = ?', [$a['id']]));
    },

    'startSession' => function (array $in) {
        Auth::require('consultant');
        $a = scheduling_get_for_viewer((string)req_str($in, 'id', 36));
        if (!in_array($a['status'], ['confirmed', 'checked_in'], true)) bw_fail('invalid_state', 'This session can\'t start now.', 409);
        update('appointments', ['status' => 'in_session'], 'id = ?', [$a['id']]);
        scheduling_history($a['id'], 'in_session');
        return scheduling_view(one('SELECT * FROM appointments WHERE id = ?', [$a['id']]));
    },

    'completeAppointment' => function (array $in) {
        Auth::require('consultant', 'manager', 'owner');
        $a = scheduling_get_for_viewer((string)req_str($in, 'id', 36));
        if (!in_array($a['status'], ['confirmed', 'checked_in', 'in_session'], true)) bw_fail('invalid_state', 'This session can\'t be completed now.', 409);
        update('appointments', ['status' => 'completed', 'completed_at' => now_utc()], 'id = ?', [$a['id']]);
        scheduling_history($a['id'], 'completed');
        Events::emit('appointment.completed', ['appointmentId' => $a['id']]);
        notify(['clientId' => $a['client_id']], 'How do you feel after your session?', 'Share a quick note for Jitu Bhaiya — it helps him prepare next time.', '/client/app/appointments');
        return scheduling_view(one('SELECT * FROM appointments WHERE id = ?', [$a['id']]));
    },

    'markNoShow' => function (array $in) {
        Auth::require('consultant', 'manager', 'owner');
        $a = scheduling_get_for_viewer((string)req_str($in, 'id', 36));
        if ($a['status'] !== 'confirmed') bw_fail('invalid_state', 'Only confirmed appointments can be marked as no-show.', 409);
        update('appointments', ['status' => 'no_show'], 'id = ?', [$a['id']]);
        scheduling_history($a['id'], 'no_show');
        Events::emit('appointment.no_show', ['appointmentId' => $a['id']]);
        return scheduling_view(one('SELECT * FROM appointments WHERE id = ?', [$a['id']]));
    },

    'getAppointmentHistory' => function (array $in) {
        Auth::require('consultant', 'manager', 'owner');
        return array_map(fn($h) => ['action' => $h['action'], 'from' => $h['from_value'], 'to' => $h['to_value'], 'note' => $h['note'], 'at' => iso($h['created_at'])],
            all('SELECT * FROM appointment_history WHERE appointment_id = ? ORDER BY created_at', [req_str($in, 'id', 36)]));
    },

    /** CLIENT CL-23 — editable later. */
    'submitSessionFeedback' => function (array $in) {
        $cid = Auth::clientId();
        $a = one('SELECT * FROM appointments WHERE id = ? AND client_id = ?', [req_str($in, 'appointmentId', 36), $cid]);
        if (!$a) bw_fail('not_found', 'Appointment not found', 404);
        $rating = req_int($in, 'rating', 1, 5);
        $row = ['rating' => $rating, 'tags' => array_slice(array_map('strval', req_arr($in, 'tags')), 0, 20),
            'benefits' => array_slice(array_map('strval', req_arr($in, 'benefits')), 0, 20), 'notes_for_consultant' => req_str($in, 'notesForConsultant', 4000, false)];
        $existing = val('SELECT id FROM session_feedback WHERE appointment_id = ?', [$a['id']]);
        if ($existing) update('session_feedback', $row, 'id = ?', [$existing]);
        else insert('session_feedback', $row + ['id' => $existing = uuid(), 'appointment_id' => $a['id'], 'client_id' => $cid, 'consultant_id' => $a['consultant_id']]);
        Events::emit('session_feedback.submitted', ['feedbackId' => $existing, 'appointmentId' => $a['id'], 'clientId' => $cid, 'consultantId' => $a['consultant_id'], 'rating' => $rating]);
        notify(['userId' => $a['consultant_id']], 'New session feedback', (string)val('SELECT name FROM clients WHERE id = ?', [$cid]) . " · $rating/5", '/consultant/');
        return scheduling_view(one('SELECT * FROM appointments WHERE id = ?', [$a['id']]), 'client');
    },

    'listSessionFeedback' => function (array $in) {
        Auth::require('consultant', 'owner');
        $p = []; $w = '1=1';
        if (Auth::has('consultant') && !Auth::has('owner')) { $w .= ' AND f.consultant_id = ?'; $p[] = Auth::userId(); }
        if (!empty($in['clientId'])) { $w .= ' AND f.client_id = ?'; $p[] = $in['clientId']; }
        $rows = all("SELECT f.*, c.name AS client_name FROM session_feedback f JOIN clients c ON c.id = f.client_id WHERE $w ORDER BY f.updated_at DESC LIMIT 200", $p);
        $ownerOnly = !Auth::has('consultant');
        return array_map(fn($f) => $ownerOnly
            ? ['appointmentId' => $f['appointment_id'], 'rating' => (int)$f['rating'], 'at' => iso($f['updated_at'])]
            : ['appointmentId' => $f['appointment_id'], 'clientId' => $f['client_id'], 'clientName' => $f['client_name'], 'rating' => (int)$f['rating'],
               'tags' => jdec($f['tags']), 'benefits' => jdec($f['benefits']), 'notes' => $f['notes_for_consultant'], 'at' => iso($f['updated_at'])], $rows);
    },

    /** Private ICS link (D-31) — paste into Google / Apple Calendar "subscribe by URL". Calling again replaces the old link. */
    'getCalendarFeedUrl' => function (array $in) {
        $u = Auth::require();
        q('UPDATE calendar_feed_tokens SET revoked_at = UTC_TIMESTAMP() WHERE user_id = ? AND revoked_at IS NULL', [$u['id']]);
        $token = bin2hex(random_bytes(24));
        insert('calendar_feed_tokens', ['token_hash' => hash('sha256', $token), 'user_id' => $u['id']]);
        return ['url' => bw_public_url("api/calendar/$token.ics")];
    },
];
