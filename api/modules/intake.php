<?php
/**
 * @owner CONSULTANT (data, mapping, AI) · CLIENT builds IN-01…IN-12 · spec docs/specs/client/01-INTAKE-CASE-TAKING.md
 * @sensitive answers + case summary are encrypted at rest and readable only by the client (own answers) and the consultant.
 * Manager sees only `alcoholFree` via the prep sheet. Owner sees nothing (aggregate stats later). Safety alert → consultant only (D-38).
 * Answers use the client app's IntakeAnswers shape (apps/client/src/lib/store.ts).
 */
declare(strict_types=1);

function intake_flags_from(array $a): array
{
    $f = [];
    $s = $a['safety'] ?? [];
    if (in_array($a['selfHarm'] ?? 'No', ['Sometimes', 'Often'], true)) $f[] = ['flag' => 'safety', 'level' => strtolower($a['selfHarm'])];
    if (!empty($s['alcoholFree'])) $f[] = ['flag' => 'alcohol_free'];
    if (!empty($s['pregnant'])) $f[] = ['flag' => 'pregnancy'];
    if (!empty($s['allergies'])) $f[] = ['flag' => 'allergy'];
    if (!empty($s['medicines'])) $f[] = ['flag' => 'medication'];
    if (!empty($s['doctor'])) $f[] = ['flag' => 'doctor'];
    $age = (int)($a['dependent']['age'] ?? 0);
    if (($a['who'] ?? 'me') === 'child' || ($age > 0 && $age < 18)) $f[] = ['flag' => 'minor'];
    return $f;
}

function intake_get_owned(string $id): array
{
    $row = one('SELECT * FROM intakes WHERE id = ?', [$id]);
    if (!$row) bw_fail('not_found', 'Intake not found', 404);
    if (Auth::has('consultant')) { audit('view_sensitive', 'intake', $id); return $row; }
    if (Auth::has('client') && $row['client_id'] === Auth::clientId()) return $row;
    bw_fail('not_found', 'Intake not found', 404);
}

function intake_attach(string $intakeId, string $appointmentId, string $clientId): void
{
    if (!val('SELECT 1 FROM intakes WHERE id = ? AND client_id = ?', [$intakeId, $clientId])) bw_fail('not_found', 'Intake not found', 404);
    q('UPDATE intakes SET appointment_id = ? WHERE id = ?', [$appointmentId, $intakeId]);
    q('UPDATE appointments SET intake_id = ? WHERE id = ? AND client_id = ?', [$intakeId, $appointmentId, $clientId]);
}

/** Deterministic "flowers to consider" (D-37): statement → flower mapping, never AI. Consultant only. */
function intake_flowers(array $answers): array
{
    $map = [];
    foreach (all('SELECT statement, statement_key, flowers FROM intake_mapping') as $m) $map[$m['statement_key']] = $m;
    $out = [];
    $rank = ['Mild' => 1, 'Moderate' => 2, 'Strong' => 3];
    foreach (($answers['nuance'] ?? []) as $feeling => $n) {
        $intensity = $n['intensity'] ?? 'Moderate';
        foreach (($n['statements'] ?? []) as $st) {
            $m = $map[bw_norm_statement((string)$st)] ?? null;
            if (!$m) continue;
            foreach (jdec($m['flowers']) as $flower) {
                $out[$flower] ??= ['flowerId' => $flower, 'reasons' => [], 'intensity' => 'mild', 'score' => 0];
                $out[$flower]['reasons'][] = "$feeling: “{$m['statement']}”";
                if (($rank[$intensity] ?? 2) > $out[$flower]['score']) { $out[$flower]['score'] = $rank[$intensity] ?? 2; $out[$flower]['intensity'] = strtolower($intensity); }
            }
        }
    }
    $life = array_diff($answers['life'] ?? [], ['Nothing major']);
    if ($life) {
        $out['Walnut'] ??= ['flowerId' => 'Walnut', 'reasons' => [], 'intensity' => 'mild', 'score' => 1];
        $out['Walnut']['reasons'][] = 'Life change: ' . implode(', ', $life);
    }
    usort($out, fn($a, $b) => [$b['score'], count($b['reasons'])] <=> [$a['score'], count($a['reasons'])]);
    return array_map(fn($x) => ['flowerId' => $x['flowerId'], 'reasons' => array_values(array_unique($x['reasons'])), 'intensity' => $x['intensity']], $out);
}

/** Rules-based case summary (always available). @cross(CONSULTANT) replace/augment with Claude (D-36) once an API key is set — keep this shape. */
function intake_rules_summary(array $a, array $flags, ?string $clientName): array
{
    $who = ($a['who'] ?? 'me') === 'me' ? ($clientName ?: 'The client') : (($a['dependent']['name'] ?? 'A dependent') . ' (' . ($a['dependent']['relation'] ?? $a['who']) . ', ' . ($a['dependent']['age'] ?? '?') . ')');
    $mind = trim((string)($a['onMind'] ?? ''));
    $feel = [];
    foreach (($a['feelings'] ?? []) as $f) $feel[] = $f . (isset($a['nuance'][$f]['intensity']) ? ' (' . strtolower($a['nuance'][$f]['intensity']) . ')' : '');
    $body = $a['body'] ?? [];
    $sleep = isset($a['sleepQuality']) ? "sleep {$a['sleepQuality']}/5" : null;
    $lines = [
        "$who — " . ($mind !== '' ? mb_strimwidth($mind, 0, 160, '…') : 'no description given') . (!empty($a['duration']) ? " (for {$a['duration']})" : ''),
        'Feeling: ' . ($feel ? implode(', ', $feel) : 'not specified'),
        'Body & energy: ' . implode(' · ', array_filter([$body ? implode(', ', $body) : 'no physical discomfort', $sleep, isset($a['energy']) ? "energy {$a['energy']}/5" : null, isset($a['stress']) ? "stress {$a['stress']}/5" : null])),
        'Wants to feel: ' . (($a['goals'] ?? []) ? implode(', ', $a['goals']) : 'not specified') . (!empty($a['goalText']) ? ' — ' . mb_strimwidth((string)$a['goalText'], 0, 80, '…') : ''),
    ];
    $q = [];
    if ($feel) $q[] = 'When did the ' . strtolower(explode(' (', $feel[0])[0]) . ' start, and what makes it stronger?';
    if (array_diff($a['life'] ?? [], ['Nothing major'])) $q[] = 'How is the recent change (' . implode(', ', array_diff($a['life'], ['Nothing major'])) . ') affecting day-to-day life?';
    $q[] = 'What would a good week look like for you a month from now?';
    return ['summary' => $lines, 'flags' => array_column($flags, 'flag'), 'questionsToExplore' => array_slice($q, 0, 3), 'source' => 'rules',
        'label' => 'Prepared from the client\'s answers — please verify in the session.'];
}

return [
    /** Returns the client's open draft (or a new one), pre-filled from their last submitted answers. */
    'getIntakeForm' => function (array $in) {
        $cid = Auth::clientId();
        $kind = req_enum($in, 'kind', ['first', 'followup'], false) ?? 'first';
        $draft = one("SELECT * FROM intakes WHERE client_id = ? AND kind = ? AND status = 'draft' ORDER BY created_at DESC LIMIT 1", [$cid, $kind]);
        $last = one("SELECT * FROM intakes WHERE client_id = ? AND status = 'submitted' ORDER BY submitted_at DESC LIMIT 1", [$cid]);
        if (!$draft) {
            $id = uuid();
            insert('intakes', ['id' => $id, 'client_id' => $cid, 'kind' => $kind, 'answers_enc' => seal($last ? unseal($last['answers_enc']) : new stdClass())]);
            $draft = one('SELECT * FROM intakes WHERE id = ?', [$id]);
        }
        return ['intakeId' => $draft['id'], 'kind' => $kind, 'step' => (int)$draft['step'], 'answers' => unseal($draft['answers_enc']) ?: new stdClass(),
            'lastSubmittedAt' => iso($last['submitted_at'] ?? null), 'lastFeelings' => $last ? (unseal($last['answers_enc'])['feelings'] ?? []) : []];
    },

    'saveIntakeDraft' => function (array $in) {
        $row = intake_get_owned((string)req_str($in, 'intakeId', 36));
        if ($row['client_id'] !== (Auth::user()['clientId'] ?? null)) bw_fail('forbidden', 'Only the client can edit their answers', 403);
        if ($row['status'] === 'submitted' && $row['appointment_id']) {
            $starts = val('SELECT starts_at FROM appointments WHERE id = ?', [$row['appointment_id']]);
            if ($starts && strtotime("$starts UTC") - time() < 7200) bw_fail('locked', 'Answers can be changed until 2 hours before your session.', 409);
        }
        update('intakes', ['answers_enc' => seal(req_arr($in, 'answers', true)), 'step' => (int)($in['step'] ?? $row['step'])], 'id = ?', [$row['id']]);
        return ['saved' => true];
    },

    'submitIntake' => function (array $in) {
        $row = intake_get_owned((string)req_str($in, 'intakeId', 36));
        $cid = Auth::clientId();
        if ($row['client_id'] !== $cid) bw_fail('forbidden', 'Only the client can submit their answers', 403);
        $answers = req_arr($in, 'answers', true);
        $consent = req_arr($in, 'consent');
        if (empty($consent['shareWithConsultant'])) bw_fail('consent_required', 'Please allow us to share your answers with your consultant.');
        $flags = intake_flags_from($answers);
        update('intakes', ['answers_enc' => seal($answers), 'status' => 'submitted', 'submitted_at' => now_utc(), 'consent_ai' => (int)!empty($consent['aiSummary'])], 'id = ?', [$row['id']]);
        q('DELETE FROM intake_flags WHERE intake_id = ?', [$row['id']]);
        foreach ($flags as $f) insert('intake_flags', ['id' => uuid(), 'intake_id' => $row['id'], 'client_id' => $cid, 'flag' => $f['flag'], 'level' => $f['level'] ?? null]);
        $name = (string)val('SELECT name FROM clients WHERE id = ?', [$cid]);
        q('DELETE FROM case_summaries WHERE intake_id = ?', [$row['id']]);
        insert('case_summaries', ['id' => uuid(), 'intake_id' => $row['id'], 'client_id' => $cid, 'summary_enc' => seal(intake_rules_summary($answers, $flags, $name)), 'source' => 'rules']);
        Events::emit('intake.submitted', ['intakeId' => $row['id'], 'clientId' => $cid, 'appointmentId' => $row['appointment_id']]);
        foreach ($flags as $f) if ($f['flag'] === 'safety') {
            // D-38: alert to Jitendra Khimlani ONLY — never manager / owner. Client already saw Tele-MANAS 14416 / 112 in the app.
            Events::emit('intake.safety_flagged', ['clientId' => $cid, 'level' => $f['level']]);
            foreach (all("SELECT u.id FROM users u JOIN user_roles r ON r.user_id = u.id AND r.role = 'consultant' WHERE u.status = 'active'") as $c) {
                wa_staff('consultant', 'Please check in personally with ' . ($name ?: 'a client') . ' — they answered "' . ucfirst($f['level']) . '" to the safety question in their intake. Details in your app.', $c['id']);
                notify(['userId' => $c['id']], 'Please check in with a client', ($name ?: 'A client') . ' answered "' . ucfirst($f['level']) . '" to the safety question. Please reach out personally.', '/consultant/', 'high', true);
            }
        }
        if (!empty($in['appointmentId'])) intake_attach($row['id'], (string)$in['appointmentId'], $cid);
        return ['intakeId' => $row['id'], 'flags' => array_column($flags, 'flag')];
    },

    'attachIntakeToAppointment' => function (array $in) {
        intake_attach((string)req_str($in, 'intakeId', 36), (string)req_str($in, 'appointmentId', 36), Auth::clientId());
        return ['attached' => true];
    },

    /** Client re-reads own answers (no AI text). Consultant reads any (audited). */
    'getIntakeAnswers' => function (array $in) {
        if (!empty($in['appointmentId'])) {
            $a = scheduling_get_for_viewer((string)$in['appointmentId']);
            if (!$a['intake_id']) return null;
            $row = intake_get_owned($a['intake_id']);
        } else {
            $row = intake_get_owned((string)req_str($in, 'intakeId', 36));
        }
        return ['intakeId' => $row['id'], 'kind' => $row['kind'], 'status' => $row['status'], 'answers' => unseal($row['answers_enc']), 'submittedAt' => iso($row['submitted_at'])];
    },

    /** CONSULTANT only — { summary[4], flags[], questionsToExplore[3], label } */
    'getCaseSummary' => function (array $in) {
        Auth::require('consultant');
        $intakeId = $in['intakeId'] ?? val('SELECT intake_id FROM appointments WHERE id = ?', [req_str($in, 'appointmentId', 36)]);
        if (!$intakeId) {
            $clientId = val('SELECT client_id FROM appointments WHERE id = ?', [$in['appointmentId'] ?? '']) ?: ($in['clientId'] ?? null);
            $intakeId = $clientId ? val("SELECT id FROM intakes WHERE client_id = ? AND status = 'submitted' ORDER BY submitted_at DESC LIMIT 1", [$clientId]) : null;
        }
        if (!$intakeId) return null;
        audit('view_sensitive', 'case_summary', (string)$intakeId);
        $s = one('SELECT * FROM case_summaries WHERE intake_id = ?', [$intakeId]);
        return $s ? unseal($s['summary_enc']) + ['intakeId' => $intakeId, 'generatedAt' => iso($s['created_at'])] : null;
    },

    /** CONSULTANT only (D-37) — reference, his judgement decides; never shown to the client. */
    'getFlowersToConsider' => function (array $in) {
        Auth::require('consultant');
        $intakeId = $in['intakeId'] ?? val('SELECT intake_id FROM appointments WHERE id = ?', [req_str($in, 'appointmentId', 36)]);
        if (!$intakeId) return [];
        $row = intake_get_owned((string)$intakeId);
        return intake_flowers(unseal($row['answers_enc']) ?: []);
    },

    'listClientFlags' => function (array $in) {
        Auth::require('consultant');
        $cid = (string)req_str($in, 'clientId', 36);
        $last = val("SELECT id FROM intakes WHERE client_id = ? AND status = 'submitted' ORDER BY submitted_at DESC LIMIT 1", [$cid]);
        return $last ? array_map(fn($f) => ['flag' => $f['flag'], 'level' => $f['level']], all('SELECT flag, level FROM intake_flags WHERE intake_id = ?', [$last])) : [];
    },

    /** Manager prep sheet needs only this (contracts §5 intake). */
    'getIntakeFlagsForPrep' => function (array $in) {
        Auth::require('consultant', 'manager', 'owner');
        $cid = val('SELECT client_id FROM remedy_orders WHERE id = ?', [req_str($in, 'remedyOrderId', 36)]);
        $last = $cid ? val("SELECT id FROM intakes WHERE client_id = ? AND status = 'submitted' ORDER BY submitted_at DESC LIMIT 1", [$cid]) : null;
        return ['alcoholFree' => $last ? (bool)val("SELECT 1 FROM intake_flags WHERE intake_id = ? AND flag = 'alcohol_free'", [$last]) : false];
    },

    // ── mapping (CONSULTANT edits wording & flowers without code) ──
    'listMapping' => function (array $in) {
        Auth::require('consultant');
        return array_map(fn($m) => ['id' => $m['id'], 'statement' => $m['statement'], 'flowers' => jdec($m['flowers']), 'approved' => (bool)$m['approved_by_consultant']],
            all('SELECT * FROM intake_mapping ORDER BY statement'));
    },
    'upsertMapping' => function (array $in) {
        $u = Auth::require('consultant');
        $st = (string)req_str($in, 'statement', 255);
        $flowers = array_values(array_map('strval', req_arr($in, 'flowers', true)));
        q('INSERT INTO intake_mapping (id, statement, statement_key, flowers, approved_by_consultant, updated_by) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE statement = VALUES(statement), flowers = VALUES(flowers), approved_by_consultant = VALUES(approved_by_consultant), updated_by = VALUES(updated_by)',
            [uuid(), $st, bw_norm_statement($st), json_encode($flowers), (int)!empty($in['approved']), $u['id']]);
        return ['saved' => true];
    },
];
