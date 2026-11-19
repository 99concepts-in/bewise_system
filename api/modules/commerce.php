<?php
/**
 * @owner CLIENT · commerce.* — orders from the bag (server prices everything), order list/detail, review, replacement.
 * @decision(D-16) no refunds — damaged / wrong / not delivered → replacement request.
 * Lines use the client app's CartLine keys: product variant id · 'remedy-reorder' · 'remedy-reorder-spray'.
 */
declare(strict_types=1);

const BW_ORDER_STAGE = ['pending_payment' => 0, 'paid' => 0, 'processing' => 1, 'partially_dispatched' => 2, 'dispatched' => 2, 'delivered' => 3];

function commerce_order_view(array $o, bool $staff = false): array
{
    $items = all('SELECT * FROM order_items WHERE sales_order_id = ?', [$o['id']]);
    $tasks = all('SELECT type, stage, courier, awb, tracking_url, dispatched_at, delivered_at FROM fulfilment_tasks WHERE sales_order_id = ?', [$o['id']]);
    $out = ['id' => $o['id'], 'code' => $o['code'], 'kind' => $o['kind'], 'status' => $o['status'], 'stage' => BW_ORDER_STAGE[$o['status']] ?? 0,
        'lines' => array_map(fn($i) => ['id' => $i['id'], 'key' => $i['variant_id'] ?? 'remedy-reorder', 'kind' => $i['kind'], 'name' => $i['name'], 'label' => $i['label'],
            'qty' => (int)$i['qty'], 'pricePaise' => (int)$i['unit_price_paise'], 'totalPaise' => (int)$i['line_total_paise']], $items),
        'subtotalPaise' => (int)$o['subtotal_paise'], 'discountPaise' => (int)$o['discount_paise'], 'shippingPaise' => (int)$o['shipping_paise'], 'totalPaise' => (int)$o['total_paise'],
        'pickup' => (bool)$o['pickup'], 'address' => jdec($o['address'], null), 'notes' => $o['notes'], 'review' => jdec($o['review'], null),
        'placedAt' => iso($o['created_at']), 'paidAt' => iso($o['paid_at']),
        'shipments' => array_map(fn($t) => ['type' => $t['type'], 'stage' => $t['stage'], 'courier' => $t['courier'], 'awb' => $t['awb'], 'trackingUrl' => $t['tracking_url'], 'dispatchedAt' => iso($t['dispatched_at']), 'deliveredAt' => iso($t['delivered_at'])], $tasks)];
    if ($staff) $out['client'] = one('SELECT id, code, name, phone FROM clients WHERE id = ?', [$o['client_id']]);
    return $out;
}

function commerce_get_for_viewer(string $id): array
{
    $o = one('SELECT * FROM sales_orders WHERE id = ? OR code = ?', [$id, $id]);
    if ($o && (Auth::has('manager', 'owner', 'consultant', 'accountant') || (Auth::has('client') && $o['client_id'] === Auth::clientId()))) return $o;
    bw_fail('not_found', 'Order not found', 404);
}

/** Order paid → stock out + fulfilment tasks + notifications (finance → commerce). */
Events::on('payment.captured', function (array $p) {
    if (($p['purpose'] ?? '') !== 'sales_order') return;
    $o = one('SELECT * FROM sales_orders WHERE id = ? FOR UPDATE', [$p['refId']]);
    if (!$o || $o['status'] !== 'pending_payment') return;
    q("UPDATE sales_orders SET status = 'paid', paid_at = UTC_TIMESTAMP() WHERE id = ?", [$o['id']]);
    foreach (all("SELECT variant_id, qty FROM order_items WHERE sales_order_id = ? AND kind = 'product'", [$o['id']]) as $i) {
        q('UPDATE product_variants SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty IS NOT NULL', [(int)$i['qty'], $i['variant_id']]);
        insert('stock_movements', ['id' => uuid(), 'variant_id' => $i['variant_id'], 'type' => 'sale', 'qty' => -(int)$i['qty'], 'ref_type' => 'sales_order', 'ref_id' => $o['id']]);
        $v = one('SELECT stock_qty, reorder_level FROM product_variants WHERE id = ?', [$i['variant_id']]);
        if ($v && $v['stock_qty'] !== null && $v['reorder_level'] !== null && (int)$v['stock_qty'] <= (int)$v['reorder_level']) {
            Events::emit('stock.low', ['variantId' => $i['variant_id'], 'onHand' => (int)$v['stock_qty'], 'reorderLevel' => (int)$v['reorder_level']]);
            notify(['role' => 'manager'], 'Stock running low', "{$i['variant_id']}: {$v['stock_qty']} left", '/manager/');
        }
    }
    fulfilment_create_tasks($o['id']);
    Events::emit('order.paid', ['salesOrderId' => $o['id'], 'clientId' => $o['client_id'], 'kind' => $o['kind']]);
    notify(['clientId' => $o['client_id']], 'Order confirmed', "Thank you! Order {$o['code']} is being prepared.", '/client/app/orders', 'normal', true);
    if ((int)$o['total_paise'] > 0) wa_send(wa_client_phone($o['client_id']), 'order_confirmed', ['name' => wa_client_name($o['client_id']), 'order' => $o['code'], 'amount' => '₹' . number_format($o['total_paise'] / 100)], "order:{$o['id']}", $o['id']);
    notify(['role' => 'manager'], 'New paid order', "{$o['code']} · ₹" . number_format($o['total_paise'] / 100), '/manager/');
});

return [
    /** { lines: [{ key, qty }], addressId? | pickup: true, notes? } → pending_payment order. Then finance.createCheckout. */
    'createOrder' => function (array $in) {
        $cid = Auth::clientId();
        $lines = req_arr($in, 'lines', true);
        if (!$lines || count($lines) > 30) bw_fail('invalid_input', 'Your bag is empty.');
        $pickup = !empty($in['pickup']);
        $addr = null;
        if (!$pickup) {
            $a = one('SELECT * FROM client_addresses WHERE id = ? AND client_id = ? AND archived_at IS NULL', [req_str($in, 'addressId', 36), $cid]);
            if (!$a) bw_fail('invalid_input', 'Please choose a delivery address.');
            $addr = crm_address_view($a);
        }
        $items = []; $hasProduct = false; $hasRemedy = false;
        foreach ($lines as $l) {
            $key = (string)req_str($l, 'key', 80);
            $qty = req_int($l, 'qty', 1, 20);
            if (str_starts_with($key, 'remedy-reorder')) {
                $f = one("SELECT * FROM formulas WHERE client_id = ? AND status = 'given' ORDER BY version DESC LIMIT 1", [$cid]);
                if (!$f) bw_fail('no_remedy', 'You can reorder your blend after your first consultation.', 409);
                $price = (int)setting('remedy.reorder_price_paise', 80000);
                $items[] = ['kind' => 'remedy', 'formula' => $f, 'name' => 'Bach Flower Remedy — ' . $f['name'], 'label' => '30 ml ' . (str_ends_with($key, 'spray') ? 'spray' : 'dropper'), 'qty' => $qty, 'unit' => $price];
                $hasRemedy = true;
            } else {
                $v = catalog_variant($key);
                if ($v['sold_out'] || ($v['stock_qty'] !== null && (int)$v['stock_qty'] < $qty)) bw_fail('sold_out', "{$v['product_name']} is sold out right now.", 409);
                $items[] = ['kind' => 'product', 'variant_id' => $key, 'name' => $v['product_name'], 'label' => $v['label'], 'qty' => $qty, 'unit' => (int)$v['price_paise']];
                $hasProduct = true;
            }
        }
        $subtotal = array_sum(array_map(fn($i) => $i['unit'] * $i['qty'], $items));
        $ship = setting('shipping.rates', ['flatPaise' => 0, 'freeAbovePaise' => 0]);
        $shipping = $pickup || ((int)$ship['freeAbovePaise'] > 0 && $subtotal >= (int)$ship['freeAbovePaise']) ? 0 : (int)$ship['flatPaise'];
        $soId = uuid();
        $code = make_code('order');
        insert('sales_orders', ['id' => $soId, 'code' => $code, 'client_id' => $cid, 'kind' => $hasProduct && $hasRemedy ? 'combined' : ($hasRemedy ? 'remedy' : 'store'),
            'status' => 'pending_payment', 'subtotal_paise' => $subtotal, 'shipping_paise' => $shipping, 'total_paise' => $subtotal + $shipping,
            'pickup' => (int)$pickup, 'address' => $addr, 'notes' => req_str($in, 'notes', 500, false), 'created_by' => Auth::userId()]);
        foreach ($items as $i) {
            $roId = null;
            if ($i['kind'] === 'remedy') {
                $roId = uuid();
                insert('remedy_orders', ['id' => $roId, 'formula_id' => $i['formula']['id'], 'client_id' => $cid, 'sales_order_id' => $soId, 'kind' => 'reorder']);
            }
            insert('order_items', ['id' => uuid(), 'sales_order_id' => $soId, 'kind' => $i['kind'], 'variant_id' => $i['variant_id'] ?? null, 'remedy_order_id' => $roId,
                'name' => $i['name'], 'label' => $i['label'], 'qty' => $i['qty'], 'unit_price_paise' => $i['unit'], 'line_total_paise' => $i['unit'] * $i['qty']]);
        }
        Events::emit('order.placed', ['salesOrderId' => $soId, 'clientId' => $cid, 'totalPaise' => $subtotal + $shipping]);
        return commerce_order_view(one('SELECT * FROM sales_orders WHERE id = ?', [$soId]));
    },

    'listOrders' => function (array $in) {
        $staff = Auth::has('manager', 'owner', 'accountant');
        $p = []; $w = "status <> 'draft'";
        if (!$staff) { $w .= ' AND client_id = ?'; $p[] = Auth::clientId(); }
        elseif (!empty($in['clientId'])) { $w .= ' AND client_id = ?'; $p[] = $in['clientId']; }
        if (!empty($in['status'])) { $w .= ' AND status = ?'; $p[] = (string)$in['status']; }
        if (!$staff || empty($in['includeUnpaid'])) $w .= $staff ? " AND status <> 'pending_payment'" : '';
        $limit = min(200, max(1, (int)($in['limit'] ?? 100)));
        return ['items' => array_map(fn($o) => commerce_order_view($o, $staff), all("SELECT * FROM sales_orders WHERE $w ORDER BY created_at DESC LIMIT $limit", $p))];
    },

    'getOrder' => fn(array $in) => commerce_order_view(commerce_get_for_viewer((string)req_str($in, 'id', 36)), Auth::has('manager', 'owner', 'accountant')),

    'submitReview' => function (array $in) {
        $o = commerce_get_for_viewer((string)req_str($in, 'id', 36));
        if ($o['client_id'] !== (Auth::user()['clientId'] ?? null)) bw_fail('forbidden', 'Only the buyer can review', 403);
        update('sales_orders', ['review' => ['rating' => req_int($in, 'rating', 1, 5), 'text' => (string)req_str($in, 'text', 1000, false), 'at' => iso(now_utc())]], 'id = ?', [$o['id']]);
        return ['saved' => true];
    },

    /** No refunds (D-16): damaged / wrong / not delivered → replacement. */
    'requestReplacement' => function (array $in) {
        $o = commerce_get_for_viewer((string)req_str($in, 'salesOrderId', 36));
        if ($o['client_id'] !== (Auth::user()['clientId'] ?? null)) bw_fail('forbidden', 'Only the buyer can ask for a replacement', 403);
        $id = uuid();
        insert('replacement_requests', ['id' => $id, 'sales_order_id' => $o['id'], 'client_id' => $o['client_id'], 'item_ids' => req_arr($in, 'itemIds'), 'reason' => req_str($in, 'reason', 500)]);
        notify(['role' => 'manager'], 'Replacement request', "Order {$o['code']}: " . mb_strimwidth((string)$in['reason'], 0, 120, '…'), '/manager/', 'high');
        return ['id' => $id];
    },

    'listReplacementRequests' => function (array $in) {
        Auth::require('manager', 'owner');
        return array_map(fn($r) => ['id' => $r['id'], 'salesOrderId' => $r['sales_order_id'], 'orderCode' => $r['code'], 'clientName' => $r['cname'], 'reason' => $r['reason'], 'status' => $r['status'], 'at' => iso($r['created_at'])],
            all('SELECT r.*, o.code, c.name AS cname FROM replacement_requests r JOIN sales_orders o ON o.id = r.sales_order_id JOIN clients c ON c.id = r.client_id ORDER BY r.created_at DESC LIMIT 200'));
    },

    'decideReplacement' => function (array $in) {
        Auth::require('manager', 'owner');
        $r = one('SELECT * FROM replacement_requests WHERE id = ?', [req_str($in, 'id', 36)]);
        if (!$r) bw_fail('not_found', 'Request not found', 404);
        $status = req_enum($in, 'status', ['approved', 'rejected', 'sent']);
        q('UPDATE replacement_requests SET status = ? WHERE id = ?', [$status, $r['id']]);
        notify(['clientId' => $r['client_id']], 'About your replacement request', $status === 'rejected' ? 'We\'ve reviewed it — please check the app or WhatsApp us.' : 'Good news — we\'re sending a replacement.', '/client/app/orders', 'normal', true);
        return ['saved' => true];
    },
];
