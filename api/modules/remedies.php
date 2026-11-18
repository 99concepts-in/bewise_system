<?php
/**
 * @owner CONSULTANT · remedies.* — Bach library, give remedy (D-25: no approval), client view, prep sheet, drops log.
 * @decision(D-02) remedy after a paid consultation is INCLUDED (₹0 remedy order); reorders cost remedy.reorder_price_paise.
 * Rationale per flower is consultant-only (contracts §7.1); manager gets only the prep sheet.
 */
declare(strict_types=1);

function remedies_formula_view(array $f, bool $withRationale): array
{
    $items = all('SELECT fi.remedy_id, fi.rationale, b.name FROM formula_items fi LEFT JOIN bach_remedies b ON b.id = fi.remedy_id WHERE fi.formula_id = ?', [$f['id']]);
    return ['id' => $f['id'], 'version' => (int)$f['version'], 'status' => $f['status'], 'name' => $f['name'],
        'flowers' => array_map(fn($i) => $withRationale ? ['id' => $i['remedy_id'], 'name' => $i['name'] ?? $i['remedy_id'], 'rationale' => $i['rationale']] : ($i['name'] ?? $i['remedy_id']), $items),
        'drops' => (int)$f['drops'], 'timesPerDay' => (int)$f['times_per_day'], 'days' => (int)$f['days'], 'bottleMl' => (int)$f['bottle_ml'],
        'form' => $f['form'], 'alcoholFree' => (bool)$f['alcohol_free'], 'instructions' => $f['instructions'], 'givenAt' => iso($f['given_at']),
        'appointmentId' => $f['appointment_id']];
}

function remedies_remedy_id(string $nameOrId): string
{
    $id = val('SELECT id FROM bach_remedies WHERE id = ? OR name = ?', [$nameOrId, $nameOrId]);
    if (!$id) bw_fail('invalid_input', "Unknown flower: $nameOrId");
    return $id;
}

/** Creates the remedy sales order + fulfilment task for a formula (included or reorder). */
function remedies_create_order(array $f, string $kind, int $pricePaise, string $status, ?array $address = null, bool $pickup = true): array
{
    $roId = uuid();
    insert('remedy_orders', ['id' => $roId, 'formula_id' => $f['id'], 'client_id' => $f['client_id'], 'kind' => $kind]);
    $soId = uuid();
    insert('sales_orders', ['id' => $soId, 'code' => make_code('order'), 'client_id' => $f['client_id'], 'kind' => 'remedy', 'status' => $status,
        'subtotal_paise' => $pricePaise, 'total_paise' => $pricePaise, 'pickup' => (int)$pickup, 'address' => $address,
        'paid_at' => $status === 'paid' ? now_utc() : null, 'created_by' => Auth::userId()]);
    insert('order_items', ['id' => uuid(), 'sales_order_id' => $soId, 'kind' => 'remedy', 'remedy_order_id' => $roId,
        'name' => 'Bach Flower Remedy — ' . $f['name'], 'label' => $f['bottle_ml'] . ' ml ' . $f['form'], 'qty' => 1, 'unit_price_paise' => $pricePaise, 'line_total_paise' => $pricePaise]);
    q('UPDATE remedy_orders SET sales_order_id = ? WHERE id = ?', [$soId, $roId]);
    if ($status === 'paid') fulfilment_create_tasks($soId);
    return ['remedyOrderId' => $roId, 'salesOrderId' => $soId];
}

return [
    'listBachRemedies' => function (array $in) {
        Auth::require();
        $all = !empty($in['includeHidden']) && Auth::has('consultant');
        return array_map(fn($b) => ['id' => $b['id'], 'name' => $b['name'], 'group' => $b['group_name'], 'note' => $b['note'], 'hidden' => (bool)$b['hidden']],
            all('SELECT * FROM bach_remedies' . ($all ? '' : ' WHERE hidden = 0') . ' ORDER BY sort'));
    },

    'updateBachRemedy' => function (array $in) {
        Auth::require('consultant');
        $id = (string)req_str($in, 'id', 40);
        $set = [];
        if (array_key_exists('note', $in)) $set['note'] = req_str($in, 'note', 255, false);
        if (array_key_exists('hidden', $in)) $set['hidden'] = (bool)$in['hidden'];
        if ($set) update('bach_remedies', $set, 'id = ?', [$id]);
        return ['saved' => true];
    },

    /**
     * CONSULTANT "Give remedy" (CN): flowers = [{ id|name, rationale? }] (max 7). Sends to client + office.
     * Included (₹0) when the appointment is paid/consultation; otherwise pass chargeReorder to bill the reorder price.
     */
    'giveRemedy' => function (array $in) {
        $u = Auth::require('consultant');
        $client = crm_client_for_staff((string)req_str($in, 'clientId', 36));
        $flowers = req_arr($in, 'flowers', true);
        if (count($flowers) < 1 || count($flowers) > 7) bw_fail('invalid_input', 'Choose between 1 and 7 flowers.');
        $apptId = req_str($in, 'appointmentId', 36, false);
        if ($apptId && !val('SELECT 1 FROM appointments WHERE id = ? AND client_id = ?', [$apptId, $client['id']])) bw_fail('invalid_input', 'Appointment does not belong to this client');
        $alcoholFree = array_key_exists('alcoholFree', $in) ? (bool)$in['alcoholFree']
            : (bool)val("SELECT 1 FROM intake_flags f JOIN intakes i ON i.id = f.intake_id WHERE f.client_id = ? AND f.flag = 'alcohol_free' AND i.id = (SELECT id FROM intakes WHERE client_id = ? AND status = 'submitted' ORDER BY submitted_at DESC LIMIT 1)", [$client['id'], $client['id']]);
        q("UPDATE formulas SET status = 'superseded' WHERE client_id = ? AND status = 'given'", [$client['id']]);
        $version = (int)val('SELECT COALESCE(MAX(version), 0) + 1 FROM formulas WHERE client_id = ?', [$client['id']]);
        $fid = uuid();
        insert('formulas', ['id' => $fid, 'client_id' => $client['id'], 'consultant_id' => $u['id'], 'appointment_id' => $apptId, 'version' => $version, 'status' => 'given',
            'name' => req_str($in, 'name', 120, false) ?? 'Your blend', 'drops' => req_int($in, 'drops', 1, 20, false) ?? 4,
            'times_per_day' => req_int($in, 'timesPerDay', 1, 12, false) ?? 4, 'days' => req_int($in, 'days', 1, 120, false) ?? 25,
            'bottle_ml' => req_int($in, 'bottleMl', 10, 100, false) ?? 30, 'form' => req_enum($in, 'form', ['dropper', 'spray'], false) ?? 'dropper',
            'alcohol_free' => (int)$alcoholFree, 'instructions' => req_str($in, 'instructions', 500, false), 'given_at' => now_utc()]);
        foreach ($flowers as $fl) {
            $key = is_array($fl) ? (string)($fl['id'] ?? $fl['name'] ?? '') : (string)$fl;
            insert('formula_items', ['id' => uuid(), 'formula_id' => $fid, 'remedy_id' => remedies_remedy_id($key), 'rationale' => is_array($fl) ? req_str($fl, 'rationale', 1000, false) : null]);
        }
        $f = one('SELECT * FROM formulas WHERE id = ?', [$fid]);
        $charge = !empty($in['chargeReorder']);
        $price = $charge ? (int)setting('remedy.reorder_price_paise', 80000) : 0;
        $order = remedies_create_order($f, $charge ? 'reorder' : 'included', $price, $charge ? 'pending_payment' : 'paid', null, ($in['delivery'] ?? 'pickup') !== 'ship');
        audit('remedy.given', 'formula', $fid, ['version' => $version, 'flowers' => count($flowers)]);
        Events::emit('remedy.given', ['formulaVersionId' => $fid, 'remedyOrderId' => $order['remedyOrderId'], 'clientId' => $client['id'], 'bottleSizeMl' => (int)$f['bottle_ml']]);
        notify(['clientId' => $client['id']], 'Your new blend is ready', 'Jitu Bhaiya has prepared your blend. Open the app to see how to take it.', '/client/app/remedies', 'normal', true);
        notify(['role' => 'manager'], 'New remedy to prepare', ($client['name'] ?: 'Client') . " · {$f['bottle_ml']} ml " . ($alcoholFree ? '· ALCOHOL-FREE' : ''), '/manager/');
        return remedies_formula_view($f, true) + $order;
    },

    /** CLIENT view — names, how to take, duration. NO rationale. */
    'getCurrentRemedyForClient' => function (array $in) {
        $cid = crm_target_client($in);
        $f = one("SELECT * FROM formulas WHERE client_id = ? AND status = 'given' ORDER BY version DESC LIMIT 1", [$cid]);
        if (!$f) return null;
        $v = remedies_formula_view($f, false);
        $v['startedOn'] = substr((string)$f['given_at'], 0, 10);
        $v['reorderPricePaise'] = (int)setting('remedy.reorder_price_paise', 80000);
        return $v;
    },

    'listFormulaHistory' => function (array $in) {
        Auth::require('consultant');
        return array_map(fn($f) => remedies_formula_view($f, true), all('SELECT * FROM formulas WHERE client_id = ? ORDER BY version DESC', [req_str($in, 'clientId', 36)]));
    },

    /** CLIENT reorders the same blend (charged). Returns a sales order → finance.createCheckout(purpose sales_order). */
    'reorderRemedy' => function (array $in) {
        $cid = Auth::clientId();
        $f = one("SELECT * FROM formulas WHERE client_id = ? AND status = 'given' ORDER BY version DESC LIMIT 1", [$cid]);
        if (!$f) bw_fail('no_remedy', 'You don\'t have a blend yet.', 409);
        $pickup = !empty($in['pickup']);
        $addr = null;
        if (!$pickup) {
            $a = one('SELECT * FROM client_addresses WHERE id = ? AND client_id = ? AND archived_at IS NULL', [req_str($in, 'addressId', 36), $cid]);
            if (!$a) bw_fail('invalid_input', 'Please choose a delivery address');
            $addr = crm_address_view($a);
        }
        $qty = req_int($in, 'qty', 1, 6, false) ?? 1;
        $price = (int)setting('remedy.reorder_price_paise', 80000) * $qty;
        $o = remedies_create_order($f, 'reorder', $price, 'pending_payment', $addr, $pickup);
        if ($qty > 1) q('UPDATE order_items SET qty = ?, unit_price_paise = ? WHERE sales_order_id = ?', [$qty, (int)($price / $qty), $o['salesOrderId']]);
        return $o + ['totalPaise' => $price];
    },

    /** MANAGER prep sheet: remedy names + drops + bottle + label + alcohol-free. No notes, no rationale, no intake. */
    'getPrepSheet' => function (array $in) {
        Auth::require('consultant', 'manager', 'owner');
        $ro = one('SELECT * FROM remedy_orders WHERE id = ?', [req_str($in, 'remedyOrderId', 36)]);
        if (!$ro) bw_fail('not_found', 'Remedy order not found', 404);
        $f = one('SELECT * FROM formulas WHERE id = ?', [$ro['formula_id']]);
        $c = one('SELECT name, code FROM clients WHERE id = ?', [$ro['client_id']]);
        return ['remedyOrderId' => $ro['id'], 'client' => ['name' => $c['name'], 'code' => $c['code']], 'version' => (int)$f['version'],
            'flowers' => array_column(all('SELECT b.name FROM formula_items fi JOIN bach_remedies b ON b.id = fi.remedy_id WHERE fi.formula_id = ?', [$f['id']]), 'name'),
            'dropsEachPerBottle' => 2, 'bottleMl' => (int)$f['bottle_ml'], 'form' => $f['form'], 'alcoholFree' => (bool)$f['alcohol_free'],
            'label' => ['name' => $c['name'], 'blend' => $f['name'], 'dose' => "{$f['drops']} drops, {$f['times_per_day']} times a day", 'version' => 'v' . $f['version'], 'date' => now_local()->format('d M Y')]];
    },

    /** Daily "Took my drops" tick (client) — consultant sees adherence. */
    'logDrops' => function (array $in) {
        $cid = Auth::clientId();
        $date = (new DateTimeImmutable((string)($in['date'] ?? now_local()->format('Y-m-d'))))->format('Y-m-d');
        q('INSERT INTO drops_log (client_id, on_date, taken) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE taken = VALUES(taken)', [$cid, $date, (int)($in['taken'] ?? true)]);
        return ['logged' => true];
    },
    'listDrops' => function (array $in) {
        $cid = crm_target_client($in);
        return array_map(fn($r) => ['date' => $r['on_date'], 'taken' => (bool)$r['taken']], all('SELECT * FROM drops_log WHERE client_id = ? AND on_date >= CURDATE() - INTERVAL 60 DAY ORDER BY on_date', [$cid]));
    },
];
