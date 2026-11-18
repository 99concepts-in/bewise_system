<?php
/**
 * @owner CLIENT · journal.* — minimal mood journal (D-19: emotion + time + optional note) and separate goals.
 * Consultant may read a client's journal only when the client shares it (D-15, default on).
 */
declare(strict_types=1);

function journal_reader_client(array $in): string
{
    if (Auth::has('consultant') && !empty($in['clientId'])) {
        $c = crm_client_for_staff((string)$in['clientId']);
        if (!(int)$c['share_journal']) bw_fail('not_shared', 'This client keeps their journal private.', 403);
        return $c['id'];
    }
    return Auth::clientId();
}

function journal_goal_view(array $g): array
{
    return ['id' => $g['id'], 'title' => $g['title'], 'kind' => $g['kind'], 'days' => jdec($g['days']), 'done' => (bool)$g['done_at'], 'doneAt' => iso($g['done_at']), 'createdAt' => iso($g['created_at'])];
}

return [
    'listEntries' => function (array $in) {
        $cid = journal_reader_client($in);
        $p = [$cid]; $w = 'client_id = ?';
        if (!empty($in['from'])) { $w .= ' AND logged_at >= ?'; $p[] = to_db_time((string)$in['from']); }
        if (!empty($in['emotion'])) { $w .= ' AND emotion = ?'; $p[] = (string)$in['emotion']; }
        $limit = min(1000, max(1, (int)($in['limit'] ?? 500)));
        return array_map(fn($e) => ['id' => $e['id'], 'emotion' => $e['emotion'], 'note' => Auth::has('client') && !Auth::has('consultant') ? $e['note'] : $e['note'], 'at' => iso($e['logged_at'])],
            all("SELECT * FROM journal_entries WHERE $w ORDER BY logged_at DESC LIMIT $limit", $p));
    },
    'addEntry' => function (array $in) {
        $cid = Auth::clientId();
        $id = (string)($in['id'] ?? uuid());
        if (!preg_match('/^[0-9a-f-]{36}$/', $id)) $id = uuid();
        q('INSERT IGNORE INTO journal_entries (id, client_id, emotion, note, logged_at) VALUES (?, ?, ?, ?, ?)',
            [$id, $cid, req_str($in, 'emotion', 30), req_str($in, 'note', 1000, false), to_db_time((string)($in['at'] ?? 'now'))]);
        return ['id' => $id];
    },
    'deleteEntry' => function (array $in) {
        q('DELETE FROM journal_entries WHERE id = ? AND client_id = ?', [req_str($in, 'id', 36), Auth::clientId()]);
        return ['deleted' => true];
    },
    'listGoals' => fn(array $in) => array_map('journal_goal_view', all('SELECT * FROM client_goals WHERE client_id = ? AND archived_at IS NULL ORDER BY created_at', [journal_reader_client($in)])),
    'upsertGoal' => function (array $in) {
        $cid = Auth::clientId();
        $id = $in['id'] ?? null;
        $title = req_str($in, 'title', 190);
        $kind = req_enum($in, 'kind', ['daily', 'once'], false) ?? 'daily';
        if ($id && val('SELECT 1 FROM client_goals WHERE id = ? AND client_id = ?', [$id, $cid])) update('client_goals', ['title' => $title, 'kind' => $kind], 'id = ?', [$id]);
        else insert('client_goals', ['id' => $id = uuid(), 'client_id' => $cid, 'title' => $title, 'kind' => $kind, 'days' => []]);
        return journal_goal_view(one('SELECT * FROM client_goals WHERE id = ?', [$id]));
    },
    /** daily goal: toggle a date · once goal: done/undone */
    'checkGoal' => function (array $in) {
        $cid = Auth::clientId();
        $g = one('SELECT * FROM client_goals WHERE id = ? AND client_id = ?', [req_str($in, 'id', 36), $cid]);
        if (!$g) bw_fail('not_found', 'Goal not found', 404);
        $done = ($in['done'] ?? true) !== false;
        if ($g['kind'] === 'once') update('client_goals', ['done_at' => $done ? now_utc() : null], 'id = ?', [$g['id']]);
        else {
            $date = (new DateTimeImmutable((string)($in['date'] ?? now_local()->format('Y-m-d'))))->format('Y-m-d');
            $days = array_values(array_diff(jdec($g['days']), [$date]));
            if ($done) $days[] = $date;
            sort($days);
            update('client_goals', ['days' => $days], 'id = ?', [$g['id']]);
        }
        return journal_goal_view(one('SELECT * FROM client_goals WHERE id = ?', [$g['id']]));
    },
    'deleteGoal' => function (array $in) {
        q('UPDATE client_goals SET archived_at = UTC_TIMESTAMP() WHERE id = ? AND client_id = ?', [req_str($in, 'id', 36), Auth::clientId()]);
        return ['deleted' => true];
    },
];
