<?php
/**
 * @owner MANAGER · fulfilment.* — prep & pack board, dispatch (manual AWB now; Shiprocket API later, D-06), delivery.
 */
declare(strict_types=1);

const BW_STAGES = ['new', 'preparing', 'quality_check', 'packing', 'ready_to_dispatch', 'dispatched', 'delivered', 'failed_delivery', 'rto', 'cancelled'];

function fulfilment_create_tasks(string $salesOrderId): void
{
    if (val('SELECT 1 FROM fulfilment_tasks WHERE sales_order_id = ?', [$salesOrderId])) return;
    foreach (all("SELECT remedy_order_id FROM order_items WHERE sales_order_id = ? AND kind = 'remedy'", [$salesOrderId]) as $r) {
        insert('fulfilment_tasks', ['id' => uuid(), 'sales_order_id' => $salesOrderId, 'type' => 'remedy_prep', 'remedy_order_id' => $r['remedy_order_id']]);
    }
    if (val("SELECT 1 FROM order_items WHERE sales_order_id = ? AND kind = 'product' LIMIT 1", [$salesOrderId])) {
        insert('fulfilment_tasks', ['id' => uuid(), 'sales_order_id' => $salesOrderId, 'type' => 'pick_pack']);
    }
    q("UPDATE sales_orders SET status = 'processing' WHERE id = ? AND status = 'paid'", [$salesOrderId]);
}

/** Keeps the order status in step with its tasks. */
function fulfilment_sync_order(string $salesOrderId): void
{
    $stages = array_column(all("SELECT stage FROM fulfilment_tasks WHERE sales_order_id = ? AND stage <> 'cancelled'", [$salesOrderId]), 'stage');
    if (!$stages) return;
    $o = one('SELECT * FROM sales_orders WHERE id = ?', [$salesOrderId]);
    $status = 'processing';
    if (count(array_filter($stages, fn($s) => $s === 'delivered')) === count($stages)) $status = 'delivered';
    elseif (count(array_filter($stages, fn($s) => in_array($s, ['dispatched', 'delivered'], true))) === count($stages)) $status = 'dispatched';
    elseif (array_intersect($stages, ['dispatched', 'delivered'])) $status = 'partially_dispatched';
    if ($status !== $o['status']) {
        q('UPDATE sales_orders SET status = ? WHERE id = ?', [$status, $salesOrderId]);
        $msg = ['dispatched' => ['Your order is on its way', "Order {$o['code']} has been dispatched."], 'delivered' => ['Delivered', "Order {$o['code']} was delivered. We hope you love it."]][$status] ?? null;
        if ($msg) notify(['clientId' => $o['client_id']], $msg[0], $msg[1], '/client/app/orders', 'normal', true);
        if ($status === 'dispatched') {
            $t = one("SELECT courier, awb, tracking_url FROM fulfilment_tasks WHERE sales_order_id = ? AND stage = 'dispatched' ORDER BY updated_at DESC LIMIT 1", [$salesOrderId]);
            wa_send(wa_client_phone($o['client_id']), 'order_dispatched', ['name' => wa_client_name($o['client_id']), 'order' => $o['code'], 'courier' => $t['courier'] ?: 'our courier partner',
                'tracking' => $t['tracking_url'] ?: ($t['awb'] ? 'AWB ' . $t['awb'] : 'we’ll share it shortly')], "dispatched:$salesOrderId", $salesOrderId);
        }
    }
}

function fulfilment_task_view(array $t): array
{
    $o = one('SELECT code, client_id, pickup, address, created_at FROM sales_orders WHERE id = ?', [$t['sales_order_id']]);
    $c = one('SELECT name, phone, code FROM clients WHERE id = ?', [$o['client_id']]);
    $items = $t['type'] === 'pick_pack' ? all("SELECT name, label, qty FROM order_items WHERE sales_order_id = ? AND kind = 'product'", [$t['sales_order_id']]) : [];
    return ['id' => $t['id'], 'type' => $t['type'], 'stage' => $t['stage'], 'salesOrderId' => $t['sales_order_id'], 'orderCode' => $o['code'],
        'remedyOrderId' => $t['remedy_order_id'], 'client' => $c, 'pickup' => (bool)$o['pickup'], 'address' => jdec($o['address'], null),
        'items' => array_map(fn($i) => ['name' => $i['name'], 'label' => $i['label'], 'qty' => (int)$i['qty']], $items),
        'alcoholFree' => $t['remedy_order_id'] ? (bool)val('SELECT f.alcohol_free FROM remedy_orders r JOIN formulas f ON f.id = r.formula_id WHERE r.id = ?', [$t['remedy_order_id']]) : null,
        'courier' => $t['courier'], 'awb' => $t['awb'], 'trackingUrl' => $t['tracking_url'], 'createdAt' => iso($t['created_at']), 'updatedAt' => iso($t['updated_at'])];
}

return [
    'listTasks' => function (array $in) {
        Auth::require('manager', 'owner', 'consultant');
        $p = []; $w = '1=1';
        if (!empty($in['stage'])) { $st = array_values(array_intersect((array)$in['stage'], BW_STAGES)); if ($st) $w .= " AND stage IN ('" . implode("','", $st) . "')"; }
        elseif (empty($in['includeDone'])) $w .= " AND stage NOT IN ('delivered','cancelled')";
        if (!empty($in['type'])) { $w .= ' AND type = ?'; $p[] = (string)$in['type']; }
        return ['items' => array_map('fulfilment_task_view', all("SELECT * FROM fulfilment_tasks WHERE $w ORDER BY created_at LIMIT 300", $p))];
    },
    'setStage' => function (array $in) {
        Auth::require('manager', 'owner');
        $t = one('SELECT * FROM fulfilment_tasks WHERE id = ?', [req_str($in, 'id', 36)]);
        if (!$t) bw_fail('not_found', 'Task not found', 404);
        $stage = req_enum($in, 'stage', BW_STAGES);
        $set = ['stage' => $stage];
        if ($stage === 'dispatched') { $set['dispatched_at'] = now_utc(); foreach (['courier' => 60, 'awb' => 60, 'trackingUrl' => 255] as $k => $m) if (isset($in[$k])) $set[$k === 'trackingUrl' ? 'tracking_url' : $k] = req_str($in, $k, $m, false); }
        if ($stage === 'delivered') $set['delivered_at'] = now_utc();
        update('fulfilment_tasks', $set, 'id = ?', [$t['id']]);
        Events::emit('fulfilment.stage_changed', ['taskId' => $t['id'], 'salesOrderId' => $t['sales_order_id'], 'from' => $t['stage'], 'to' => $stage]);
        if ($stage === 'dispatched') Events::emit('shipment.dispatched', ['salesOrderId' => $t['sales_order_id'], 'courier' => $set['courier'] ?? null, 'awb' => $set['awb'] ?? null, 'trackingUrl' => $set['tracking_url'] ?? null]);
        if ($stage === 'delivered') Events::emit('shipment.delivered', ['salesOrderId' => $t['sales_order_id'], 'deliveredAt' => iso(now_utc())]);
        if ($t['type'] === 'remedy_prep' && $stage === 'ready_to_dispatch' && (int)val('SELECT pickup FROM sales_orders WHERE id = ?', [$t['sales_order_id']])) {
            $cid = (string)val('SELECT client_id FROM sales_orders WHERE id = ?', [$t['sales_order_id']]);
            notify(['clientId' => $cid], 'Your blend is ready', 'Collect it at the studio anytime.', '/client/app/remedies', 'normal', true);
            wa_send(wa_client_phone($cid), 'remedy_ready', ['name' => wa_client_name($cid), 'how' => 'Collect it from the BeWise studio, Alkapuri (Mon–Sat 10–1 & 4–7).'], "ready:{$t['id']}", $t['id']);
        }
        fulfilment_sync_order($t['sales_order_id']);
        return fulfilment_task_view(one('SELECT * FROM fulfilment_tasks WHERE id = ?', [$t['id']]));
    },
    'getOrderTracking' => function (array $in) {
        $o = commerce_get_for_viewer((string)req_str($in, 'salesOrderId', 36));
        return commerce_order_view($o)['shipments'];
    },
];
