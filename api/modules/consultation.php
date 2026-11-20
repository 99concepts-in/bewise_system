<?php
/**
 * @owner CONSULTANT · consultation.* — private notes 🔒, optional client summary (D-26), troubling emotions (D-27),
 * 3-line progress summary (D-28). Client version never uses private notes.
 */
declare(strict_types=1);

/** 3-line progress since the last remedy, from journal moods, feedback and concerns. @cross(CONSULTANT) may swap in Claude (D-28), same shape. */
function consultation_progress(string $clientId, string $audience): ?array
{
    $since = val("SELECT given_at FROM formulas WHERE client_id = ? AND status IN ('given','superseded') ORDER BY version DESC LIMIT 1", [$clientId]);
    if (!$since) $since = gmdate('Y-m-d H:i:s', time() - 30 * 86400);
    $moods = all('SELECT emotion, COUNT(*) n FROM journal_entries WHERE client_id = ? AND logged_at >= ? GROUP BY emotion ORDER BY n DESC', [$clientId, $since]);
    $total = array_sum(array_column($moods, 'n'));
    $pleasant = ['calm', 'joyful', 'happy', 'grateful', 'hopeful', 'peaceful', 'content', 'loved', 'confident', 'excited', 'relaxed', 'proud'];
    $good = array_sum(array_map(fn($m) => in_array($m['emotion'], $pleasant, true) ? (int)$m['n'] : 0, $moods));
    $drops = all('SELECT taken FROM drops_log WHERE client_id = ? AND on_date >= ?', [$clientId, substr($since, 0, 10)]);
    $days = max(1, (int)ceil((time() - strtotime("$since UTC")) / 86400));
    $taken = count(array_filter($drops, fn($d) => (int)$d['taken'] === 1));
    $fb = one('SELECT rating, benefits FROM session_feedback WHERE client_id = ? ORDER BY updated_at DESC LIMIT 1', [$clientId]);
    $sinceLocal = (new DateTimeImmutable($since, new DateTimeZone('UTC')))->setTimezone(new DateTimeZone(BW_TZ))->format('j M');
    if ($total === 0 && !$drops && !$fb) return null;
    $lines = [];
    $lines[] = $total ? sprintf('%d mood check-ins since %s — %d%% felt pleasant%s.', $total, $sinceLocal, (int)round(100 * $good / $total), $moods ? ', most often ' . $moods[0]['emotion'] : '')
                      : "No mood check-ins since $sinceLocal yet.";
    $lines[] = $drops ? sprintf('Drops logged on %d of %d days.', $taken, $days) : 'Drops not logged yet.';
    $benefits = $fb ? jdec($fb['benefits']) : [];
    $lines[] = $benefits ? 'After the last session: ' . implode(', ', array_slice($benefits, 0, 3)) . '.' : ($fb ? "Last session rated {$fb['rating']}/5." : 'No session feedback yet.');
    if ($audience === 'consultant') {
        $concerns = array_column(all('SELECT cc.label FROM session_concerns sc JOIN concern_catalog cc ON cc.`key` = sc.concern_key WHERE sc.client_id = ? ORDER BY sc.created_at DESC LIMIT 5', [$clientId]), 'label');
        if ($concerns) $lines[2] .= ' Last troubling emotions: ' . implode(', ', array_unique($concerns)) . '.';
    }
    return ['lines' => $lines, 'since' => iso($since), 'generatedAt' => iso(now_utc()), 'source' => 'rules'];
}

return [
    'saveNotes' => function (array $in) {
        $u = Auth::require('consultant');
        $client = crm_client_for_staff((string)req_str($in, 'clientId', 36));
        $body = (string)req_str($in, 'body', 20000, false);
        $apptId = req_str($in, 'appointmentId', 36, false);
        $existing = $apptId ? val('SELECT id FROM practitioner_notes WHERE appointment_id = ? AND author_id = ?', [$apptId, $u['id']]) : ($in['id'] ?? null);
        if ($existing) update('practitioner_notes', ['body_enc' => seal($body)], 'id = ? AND author_id = ?', [$existing, $u['id']]);
        else insert('practitioner_notes', ['id' => $existing = uuid(), 'appointment_id' => $apptId, 'client_id' => $client['id'], 'author_id' => $u['id'], 'body_enc' => seal($body)]);
        return ['id' => $existing, 'saved' => true];
    },

    /** Author only — contracts §7.1. */
    'listNotes' => function (array $in) {
        $u = Auth::require('consultant');
        return array_map(fn($n) => ['id' => $n['id'], 'appointmentId' => $n['appointment_id'], 'body' => unseal($n['body_enc']), 'at' => iso($n['updated_at'])],
            all('SELECT * FROM practitioner_notes WHERE client_id = ? AND author_id = ? ORDER BY created_at DESC', [req_str($in, 'clientId', 36), $u['id']]));
    },

    /** Optional summary for the client (D-26). share=true makes it visible to them. */
    'saveClientSummary' => function (array $in) {
        $u = Auth::require('consultant');
        $client = crm_client_for_staff((string)req_str($in, 'clientId', 36));
        $id = uuid();
        $share = ($in['share'] ?? true) !== false;
        insert('client_summaries', ['id' => $id, 'appointment_id' => req_str($in, 'appointmentId', 36, false), 'client_id' => $client['id'], 'author_id' => $u['id'],
            'body' => req_str($in, 'body', 4000), 'shared_at' => $share ? now_utc() : null]);
        if ($share) {
            Events::emit('client_summary.shared', ['summaryId' => $id, 'clientId' => $client['id']]);
            notify(['clientId' => $client['id']], 'A note from Jitendra Khimlani', 'Your session summary is in the app.', '/client/app/appointments');
        }
        return ['id' => $id, 'shared' => $share];
    },

    'listClientSummaries' => function (array $in) {
        $cid = crm_target_client($in);
        $clientView = !Auth::has('consultant', 'owner');
        if (Auth::has('manager') && !Auth::has('consultant', 'owner')) bw_fail('forbidden', 'Not available', 403);
        $rows = all('SELECT * FROM client_summaries WHERE client_id = ?' . ($clientView ? ' AND shared_at IS NOT NULL' : '') . ' ORDER BY created_at DESC', [$cid]);
        return array_map(fn($s) => ['id' => $s['id'], 'appointmentId' => $s['appointment_id'], 'body' => $s['body'], 'sharedAt' => iso($s['shared_at']), 'at' => iso($s['created_at'])], $rows);
    },

    'listConcernCatalog' => function (array $in) {
        Auth::require('consultant', 'owner');
        return array_map(fn($c) => ['key' => $c['key'], 'label' => $c['label'], 'flowers' => jdec($c['flowers']), 'active' => (bool)$c['active']],
            all('SELECT * FROM concern_catalog ORDER BY sort, label'));
    },

    'upsertConcern' => function (array $in) {
        Auth::require('consultant');
        $label = (string)req_str($in, 'label', 80);
        $key = strtolower(preg_replace('/[^a-z0-9]+/i', '_', (string)($in['key'] ?? $label)));
        q('INSERT INTO concern_catalog (`key`, label, flowers, active, sort) VALUES (?, ?, ?, ?, 99) ON DUPLICATE KEY UPDATE label = VALUES(label), flowers = VALUES(flowers), active = VALUES(active)',
            [$key, $label, json_encode(array_values(req_arr($in, 'flowers'))), ($in['active'] ?? true) ? 1 : 0]);
        return ['key' => $key];
    },

    'setSessionConcerns' => function (array $in) {
        Auth::require('consultant');
        $a = scheduling_get_for_viewer((string)req_str($in, 'appointmentId', 36));
        q('DELETE FROM session_concerns WHERE appointment_id = ?', [$a['id']]);
        foreach (req_arr($in, 'concernKeys') as $k) {
            if (!val('SELECT 1 FROM concern_catalog WHERE `key` = ?', [$k])) bw_fail('invalid_input', "Unknown concern $k");
            insert('session_concerns', ['appointment_id' => $a['id'], 'concern_key' => $k, 'client_id' => $a['client_id']]);
        }
        return ['saved' => true];
    },

    'getSessionConcerns' => function (array $in) {
        Auth::require('consultant');
        return array_column(all('SELECT concern_key FROM session_concerns WHERE appointment_id = ?', [req_str($in, 'appointmentId', 36)]), 'concern_key');
    },

    /** audience 'client' → own (client) · 'consultant' → consultant only. Manager / owner: no access. */
    'getProgressSummary' => function (array $in) {
        $aud = req_enum($in, 'audience', ['client', 'consultant'], false) ?? (Auth::has('consultant') ? 'consultant' : 'client');
        if ($aud === 'consultant') { Auth::require('consultant'); $cid = crm_client_for_staff((string)req_str($in, 'clientId', 36))['id']; }
        else $cid = Auth::clientId();
        return consultation_progress($cid, $aud);
    },
];
