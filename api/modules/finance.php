<?php
/**
 * @owner OWNER · finance.* — Razorpay checkout (webhook = source of truth, idempotent), manual payments (cash / UPI / bank),
 * invoices (INV/FY/####), double-entry posting (draft CoA, D-13), expenses + owner approval, sales & profit (D-33).
 * @sensitive Money in paise. Posted journal entries are never edited (reverse & re-post).
 * @decision(D-16) no refunds anywhere. @decision(D-05) GST off until GSTIN is set in settings.tax.rates.
 */
declare(strict_types=1);

function finance_target(string $purpose, string $refId): array
{
    if ($purpose === 'appointment') {
        $a = one('SELECT * FROM appointments WHERE id = ?', [$refId]);
        if (!$a) bw_fail('not_found', 'Appointment not found', 404);
        if ($a['payment_status'] === 'paid') bw_fail('already_paid', 'This is already paid.', 409);
        if (!in_array($a['status'], ['pending_payment', 'confirmed', 'expired'], true)) bw_fail('invalid_state', 'This appointment can\'t be paid now.', 409);
        $name = (string)val('SELECT name FROM consultation_types WHERE id = ?', [$a['consultation_type_id']]);
        return ['clientId' => $a['client_id'], 'amount' => (int)$a['amount_paise'], 'label' => "$name ({$a['code']})", 'code' => $a['code'], 'income' => '4000'];
    }
    if ($purpose === 'sales_order') {
        $o = one('SELECT * FROM sales_orders WHERE id = ?', [$refId]);
        if (!$o) bw_fail('not_found', 'Order not found', 404);
        if ($o['status'] !== 'pending_payment') bw_fail('already_paid', 'This order is already paid.', 409);
        return ['clientId' => $o['client_id'], 'amount' => (int)$o['total_paise'], 'label' => "Order {$o['code']}", 'code' => $o['code'], 'income' => $o['kind'] === 'remedy' ? '4200' : '4100'];
    }
    bw_fail('invalid_input', 'Unknown payment purpose');
}

function finance_assert_payer(array $t): void
{
    if (Auth::has('manager', 'owner')) return;
    if (Auth::has('client') && $t['clientId'] === Auth::clientId()) return;
    bw_fail('not_found', 'Not found', 404);
}

function razorpay_request(string $method, string $path, ?array $body = null): array
{
    $id = bw_config('razorpay.key_id'); $secret = bw_config('razorpay.key_secret');
    if (!$id || !$secret) bw_fail('payments_not_set_up', 'Online payment is not set up yet.', 503);
    $ch = curl_init('https://api.razorpay.com/v1/' . ltrim($path, '/'));
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_USERPWD => "$id:$secret", CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_POSTFIELDS => $body ? json_encode($body) : null]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = json_decode((string)$res, true);
    if ($code >= 300 || !is_array($data)) { error_log("Razorpay $path failed: $code $res"); bw_fail('payment_provider_error', 'Payment service is busy. Please try again.', 502); }
    return $data;
}

/** Marks a payment captured (once), then lets scheduling / commerce react, issues the invoice and posts the journal. */
function finance_capture(array $pay, ?string $method, ?string $razorpayPaymentId = null): void
{
    $p = one('SELECT * FROM payments WHERE id = ? FOR UPDATE', [$pay['id']]);
    if ($p['status'] === 'captured') return;                                     // idempotent (webhook + client callback)
    update('payments', ['status' => 'captured', 'method' => $method ?? $p['method'], 'razorpay_payment_id' => $razorpayPaymentId ?? $p['razorpay_payment_id'],
        'captured_at' => now_utc(), 'received_on' => $p['received_on'] ?? now_local()->format('Y-m-d')], 'id = ?', [$p['id']]);
    $t = finance_target_loose($p['purpose'], $p['ref_id']);
    Events::emit('payment.captured', ['paymentId' => $p['id'], 'amountPaise' => (int)$p['amount_paise'], 'purpose' => $p['purpose'], 'refId' => $p['ref_id'],
        'appointmentId' => $p['purpose'] === 'appointment' ? $p['ref_id'] : null, 'salesOrderId' => $p['purpose'] === 'sales_order' ? $p['ref_id'] : null, 'method' => $method]);
    $inv = finance_issue_invoice($p, $t);
    finance_post_payment($p, $t, $inv);
}

/** Like finance_target but tolerant of already-paid targets (used after capture). */
function finance_target_loose(string $purpose, string $refId): array
{
    if ($purpose === 'appointment') {
        $a = one('SELECT a.*, t.name AS tname FROM appointments a JOIN consultation_types t ON t.id = a.consultation_type_id WHERE a.id = ?', [$refId]);
        return ['clientId' => $a['client_id'], 'amount' => (int)$a['amount_paise'], 'label' => "{$a['tname']} — includes your Bach remedy blend", 'code' => $a['code'], 'income' => '4000', 'lines' => null];
    }
    $o = one('SELECT * FROM sales_orders WHERE id = ?', [$refId]);
    $lines = array_map(fn($i) => ['description' => trim($i['name'] . ' ' . $i['label']), 'qty' => (int)$i['qty'], 'unit' => (int)$i['unit_price_paise'], 'total' => (int)$i['line_total_paise']],
        all('SELECT * FROM order_items WHERE sales_order_id = ?', [$refId]));
    if ((int)$o['shipping_paise'] > 0) $lines[] = ['description' => 'Shipping', 'qty' => 1, 'unit' => (int)$o['shipping_paise'], 'total' => (int)$o['shipping_paise']];
    return ['clientId' => $o['client_id'], 'amount' => (int)$o['total_paise'], 'label' => "Order {$o['code']}", 'code' => $o['code'], 'income' => $o['kind'] === 'remedy' ? '4200' : '4100', 'lines' => $lines];
}

function finance_tax_bp(string $income): int
{
    $r = setting('tax.rates', ['consultationBp' => 0, 'productBp' => 0]);
    return (int)($income === '4000' ? $r['consultationBp'] : $r['productBp']);
}

function finance_issue_invoice(array $p, array $t): array
{
    $existing = one("SELECT * FROM invoices WHERE ref_type = ? AND ref_id = ? AND status <> 'void'", [$p['purpose'], $p['ref_id']]);
    $bp = finance_tax_bp($t['income']);
    $total = (int)$p['amount_paise'];
    $tax = $bp > 0 ? (int)round($total * $bp / (10000 + $bp)) : 0;   // prices include tax
    if ($existing) {
        $paid = (int)$existing['paid_paise'] + $total;
        update('invoices', ['paid_paise' => $paid, 'status' => $paid >= (int)$existing['total_paise'] ? 'paid' : 'partially_paid'], 'id = ?', [$existing['id']]);
        return one('SELECT * FROM invoices WHERE id = ?', [$existing['id']]);
    }
    $client = one('SELECT name FROM clients WHERE id = ?', [$t['clientId']]);
    $id = uuid();
    $today = now_local()->format('Y-m-d');
    insert('invoices', ['id' => $id, 'number' => make_code('invoice'), 'client_id' => $t['clientId'], 'party_name' => $client['name'] ?: 'Client', 'ref_type' => $p['purpose'], 'ref_id' => $p['ref_id'],
        'status' => 'paid', 'subtotal_paise' => $total - $tax, 'tax_paise' => $tax, 'total_paise' => $total, 'paid_paise' => $total, 'issued_on' => $today, 'due_on' => $today]);
    foreach ($t['lines'] ?? [['description' => $t['label'], 'qty' => 1, 'unit' => $total, 'total' => $total]] as $l) {
        insert('invoice_lines', ['id' => uuid(), 'invoice_id' => $id, 'description' => mb_substr($l['description'], 0, 255), 'qty' => $l['qty'], 'unit_price_paise' => $l['unit'], 'tax_rate_bp' => $bp, 'line_total_paise' => $l['total']]);
    }
    Events::emit('invoice.issued', ['invoiceId' => $id, 'partyType' => 'client', 'partyId' => $t['clientId'], 'totalPaise' => $total]);
    return one('SELECT * FROM invoices WHERE id = ?', [$id]);
}

/** Double-entry: Dr cash/bank/Razorpay clearing · Cr income (net) · Cr CGST/SGST. Balanced or it throws. */
function finance_post(string $sourceType, string $sourceId, string $date, string $memo, array $lines): void
{
    if (val('SELECT 1 FROM journal_entries_fin WHERE source_type = ? AND source_id = ?', [$sourceType, $sourceId])) return;
    $dr = array_sum(array_column($lines, 'debit')); $cr = array_sum(array_column($lines, 'credit'));
    if ($dr !== $cr) throw new RuntimeException("Unbalanced journal $sourceType/$sourceId: $dr ≠ $cr");
    $eid = uuid();
    insert('journal_entries_fin', ['id' => $eid, 'entry_date' => $date, 'source_type' => $sourceType, 'source_id' => $sourceId, 'memo' => mb_substr($memo, 0, 255)]);
    foreach ($lines as $l) if (($l['debit'] ?? 0) || ($l['credit'] ?? 0)) insert('journal_lines', ['id' => uuid(), 'entry_id' => $eid, 'account_code' => $l['account'], 'debit_paise' => $l['debit'] ?? 0, 'credit_paise' => $l['credit'] ?? 0]);
    Events::emit('journal.posted', ['journalEntryId' => $eid, 'sourceType' => $sourceType, 'sourceId' => $sourceId]);
}

function finance_post_payment(array $p, array $t, array $inv): void
{
    $p = one('SELECT * FROM payments WHERE id = ?', [$p['id']]);
    $amount = (int)$p['amount_paise'];
    $bp = finance_tax_bp($t['income']);
    $tax = $bp > 0 ? (int)round($amount * $bp / (10000 + $bp)) : 0;
    $cgst = intdiv($tax, 2);
    $asset = $p['provider'] === 'razorpay' ? '1020' : ($p['method'] === 'cash' ? '1000' : '1010');
    finance_post('payment', $p['id'], (string)$p['received_on'], "{$inv['number']} · {$t['label']}", [
        ['account' => $asset, 'debit' => $amount],
        ['account' => $t['income'], 'credit' => $amount - $tax],
        ['account' => '2100', 'credit' => $cgst],
        ['account' => '2110', 'credit' => $tax - $cgst],
    ]);
}

function finance_invoice_view(array $i, bool $withLines = false): array
{
    $out = ['id' => $i['id'], 'number' => $i['number'], 'partyName' => $i['party_name'], 'clientId' => $i['client_id'], 'refType' => $i['ref_type'], 'refId' => $i['ref_id'],
        'status' => $i['status'], 'subtotalPaise' => (int)$i['subtotal_paise'], 'taxPaise' => (int)$i['tax_paise'], 'totalPaise' => (int)$i['total_paise'], 'paidPaise' => (int)$i['paid_paise'],
        'issuedOn' => $i['issued_on'], 'dueOn' => $i['due_on']];
    if ($withLines) {
        $out['lines'] = array_map(fn($l) => ['description' => $l['description'], 'qty' => (int)$l['qty'], 'unitPricePaise' => (int)$l['unit_price_paise'], 'taxRateBp' => (int)$l['tax_rate_bp'], 'totalPaise' => (int)$l['line_total_paise']],
            all('SELECT * FROM invoice_lines WHERE invoice_id = ?', [$i['id']]));
        $out['business'] = setting('business.profile', []);
        $out['payments'] = array_map(fn($p) => ['method' => $p['method'], 'amountPaise' => (int)$p['amount_paise'], 'on' => $p['received_on'], 'reference' => $p['reference']],
            all("SELECT * FROM payments WHERE purpose = ? AND ref_id = ? AND status = 'captured'", [$i['ref_type'], $i['ref_id']]));
    }
    return $out;
}

/** Razorpay webhook (Dashboard → Webhooks → URL https://<domain>/api/webhooks/razorpay, events payment.captured + payment.failed). */
function finance_razorpay_webhook(string $body, string $signature): array
{
    $secret = (string)bw_config('razorpay.webhook_secret');
    if ($secret === '' || !hash_equals(hash_hmac('sha256', $body, $secret), $signature)) bw_fail('bad_signature', 'Invalid signature', 400);
    $e = json_decode($body, true);
    $ent = $e['payload']['payment']['entity'] ?? null;
    if (!$ent) return ['ignored' => true];
    return tx(function () use ($e, $ent) {
        $p = one('SELECT * FROM payments WHERE razorpay_order_id = ?', [$ent['order_id'] ?? '']);
        if (!$p) return ['ignored' => true];
        if (($e['event'] ?? '') === 'payment.captured' || ($ent['status'] ?? '') === 'captured') {
            if ((int)$ent['amount'] !== (int)$p['amount_paise']) { error_log('Razorpay amount mismatch ' . $p['id']); return ['ignored' => true]; }
            finance_capture($p, $ent['method'] ?? null, $ent['id'] ?? null);
            return ['captured' => true];
        }
        if (($e['event'] ?? '') === 'payment.failed' && $p['status'] !== 'captured') {
            q("UPDATE payments SET status = 'failed' WHERE id = ?", [$p['id']]);
            Events::emit('payment.failed', ['paymentId' => $p['id'], 'reason' => $ent['error_description'] ?? null]);
        }
        return ['ok' => true];
    });
}

return [
    /**
     * purpose 'appointment' | 'sales_order', refId. With Razorpay keys → { provider:'razorpay', razorpayOrderId, keyId, amountPaise, prefill }.
     * Without keys → { provider:'manual' } — the app shows "Pay at the center / UPI; we'll confirm" and staff use recordPayment.
     */
    'createCheckout' => function (array $in) {
        $purpose = req_enum($in, 'purpose', ['appointment', 'sales_order']);
        $refId = (string)req_str($in, 'refId', 36);
        $t = finance_target($purpose, $refId);
        finance_assert_payer($t);
        if (!bw_config('razorpay.key_id')) return ['provider' => 'manual', 'amountPaise' => $t['amount'], 'upi' => setting('business.profile', [])['upi'] ?? null];
        $existing = one("SELECT * FROM payments WHERE purpose = ? AND ref_id = ? AND status = 'created' AND provider = 'razorpay' AND amount_paise = ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR ORDER BY created_at DESC LIMIT 1", [$purpose, $refId, $t['amount']]);
        if (!$existing) {
            $ro = razorpay_request('POST', 'orders', ['amount' => $t['amount'], 'currency' => 'INR', 'receipt' => substr($t['code'], 0, 40), 'notes' => ['purpose' => $purpose, 'ref' => $refId]]);
            $pid = uuid();
            insert('payments', ['id' => $pid, 'purpose' => $purpose, 'ref_id' => $refId, 'client_id' => $t['clientId'], 'amount_paise' => $t['amount'], 'status' => 'created', 'provider' => 'razorpay', 'razorpay_order_id' => $ro['id']]);
            $existing = one('SELECT * FROM payments WHERE id = ?', [$pid]);
        }
        $c = one('SELECT name, email, phone FROM clients WHERE id = ?', [$t['clientId']]);
        return ['provider' => 'razorpay', 'razorpayOrderId' => $existing['razorpay_order_id'], 'keyId' => bw_config('razorpay.key_id'), 'amountPaise' => $t['amount'],
            'name' => 'BeWise Holistic Wellness', 'description' => $t['label'], 'prefill' => ['name' => $c['name'], 'email' => $c['email'], 'contact' => $c['phone']]];
    },

    /** Razorpay Checkout handler callback. The webhook is still the source of truth; both are idempotent. */
    'verifyCheckout' => function (array $in) {
        $orderId = (string)req_str($in, 'razorpayOrderId', 60);
        $paymentId = (string)req_str($in, 'razorpayPaymentId', 60);
        $sig = (string)req_str($in, 'signature', 200);
        $p = one('SELECT * FROM payments WHERE razorpay_order_id = ?', [$orderId]);
        if (!$p) bw_fail('not_found', 'Payment not found', 404);
        finance_assert_payer(['clientId' => $p['client_id']]);
        if (!hash_equals(hash_hmac('sha256', "$orderId|$paymentId", (string)bw_config('razorpay.key_secret')), $sig)) bw_fail('bad_signature', 'We couldn\'t verify the payment. If money was taken, it will confirm automatically in a few minutes.');
        $rp = razorpay_request('GET', "payments/$paymentId");
        if (($rp['order_id'] ?? '') !== $orderId || (int)($rp['amount'] ?? 0) !== (int)$p['amount_paise']) bw_fail('mismatch', 'Payment details don\'t match.', 409);
        if (($rp['status'] ?? '') === 'authorized') $rp = razorpay_request('POST', "payments/$paymentId/capture", ['amount' => (int)$p['amount_paise'], 'currency' => 'INR']);
        if (($rp['status'] ?? '') !== 'captured') bw_fail('not_captured', 'Payment is still processing. It will confirm automatically.', 202);
        finance_capture($p, $rp['method'] ?? null, $paymentId);
        return ['paymentId' => $p['id'], 'status' => 'captured'];
    },

    /** Staff record money received at the center / by UPI / bank transfer (MANAGER M-14, OWNER). */
    'recordPayment' => function (array $in) {
        $u = Auth::require('manager', 'owner');
        $purpose = req_enum($in, 'purpose', ['appointment', 'sales_order']);
        $refId = (string)req_str($in, 'refId', 36);
        $t = finance_target($purpose, $refId);
        $method = req_enum($in, 'method', ['cash', 'upi', 'card', 'bank_transfer', 'cheque']);
        $amount = req_int($in, 'amountPaise', 1, 100_000_000, false) ?? $t['amount'];
        if ($amount !== $t['amount']) bw_fail('invalid_input', 'Part payments are not supported yet — record the full amount.');
        $pid = uuid();
        insert('payments', ['id' => $pid, 'purpose' => $purpose, 'ref_id' => $refId, 'client_id' => $t['clientId'], 'amount_paise' => $amount, 'status' => 'created',
            'method' => $method, 'provider' => 'manual', 'reference' => req_str($in, 'reference', 120, false),
            'received_on' => (new DateTimeImmutable((string)($in['receivedOn'] ?? now_local()->format('Y-m-d'))))->format('Y-m-d'), 'recorded_by' => $u['id']]);
        finance_capture(one('SELECT * FROM payments WHERE id = ?', [$pid]), $method);
        audit('payment.recorded', 'payment', $pid, ['amountPaise' => $amount, 'method' => $method]);
        return ['paymentId' => $pid, 'invoice' => finance_invoice_view(one("SELECT * FROM invoices WHERE ref_type = ? AND ref_id = ?", [$purpose, $refId]))];
    },

    'listInvoices' => function (array $in) {
        $staff = Auth::has('manager', 'owner', 'accountant');
        $p = []; $w = '1=1';
        if (!$staff) { $w .= ' AND client_id = ?'; $p[] = Auth::clientId(); }
        if (!empty($in['from'])) { $w .= ' AND issued_on >= ?'; $p[] = (string)$in['from']; }
        if (!empty($in['to'])) { $w .= ' AND issued_on <= ?'; $p[] = (string)$in['to']; }
        $limit = min(500, max(1, (int)($in['limit'] ?? 200)));
        return ['items' => array_map('finance_invoice_view', all("SELECT * FROM invoices WHERE $w ORDER BY issued_on DESC, number DESC LIMIT $limit", $p))];
    },

    'getInvoice' => function (array $in) {
        $i = one('SELECT * FROM invoices WHERE id = ? OR number = ?', [req_str($in, 'id', 36), $in['id']]);
        if (!$i || (!Auth::has('manager', 'owner', 'accountant') && $i['client_id'] !== (Auth::user()['clientId'] ?? '-'))) bw_fail('not_found', 'Invoice not found', 404);
        return finance_invoice_view($i, true);
    },

    'listPayments' => function (array $in) {
        Auth::require('manager', 'owner', 'accountant');
        $rows = all("SELECT p.*, c.name AS cname FROM payments p LEFT JOIN clients c ON c.id = p.client_id WHERE p.status = 'captured' ORDER BY p.captured_at DESC LIMIT 300");
        return ['items' => array_map(fn($p) => ['id' => $p['id'], 'purpose' => $p['purpose'], 'refId' => $p['ref_id'], 'clientName' => $p['cname'], 'amountPaise' => (int)$p['amount_paise'],
            'method' => $p['method'], 'provider' => $p['provider'], 'reference' => $p['reference'], 'receivedOn' => $p['received_on'], 'capturedAt' => iso($p['captured_at'])], $rows)];
    },

    /** Money still to collect: unpaid confirmed appointments (pay later / staff bookings) and unpaid orders. */
    'getDues' => function (array $in) {
        Auth::require('manager', 'owner', 'accountant');
        $appts = all("SELECT a.id, a.code, a.amount_paise, a.starts_at, a.status, c.id cid, c.name, c.phone FROM appointments a JOIN clients c ON c.id = a.client_id
                      WHERE a.payment_status = 'unpaid' AND a.status IN ('pending_payment','confirmed','checked_in','in_session','completed') ORDER BY a.starts_at");
        $orders = all("SELECT o.id, o.code, o.total_paise, o.created_at, c.id cid, c.name, c.phone FROM sales_orders o JOIN clients c ON c.id = o.client_id
                       WHERE o.status = 'pending_payment' AND o.created_at > UTC_TIMESTAMP() - INTERVAL 30 DAY ORDER BY o.created_at");
        return [
            'appointments' => array_map(fn($a) => ['purpose' => 'appointment', 'refId' => $a['id'], 'code' => $a['code'], 'amountPaise' => (int)$a['amount_paise'], 'when' => iso($a['starts_at']), 'status' => $a['status'], 'client' => ['id' => $a['cid'], 'name' => $a['name'], 'phone' => $a['phone']]], $appts),
            'orders' => array_map(fn($o) => ['purpose' => 'sales_order', 'refId' => $o['id'], 'code' => $o['code'], 'amountPaise' => (int)$o['total_paise'], 'when' => iso($o['created_at']), 'client' => ['id' => $o['cid'], 'name' => $o['name'], 'phone' => $o['phone']]], $orders),
            'totalPaise' => array_sum(array_map('intval', array_column($appts, 'amount_paise'))) + array_sum(array_map('intval', array_column($orders, 'total_paise'))),
        ];
    },

    // ── expenses: manager submits, owner approves (contracts §6) ──
    'createExpense' => function (array $in) {
        $u = Auth::require('manager', 'owner');
        $id = uuid();
        $owner = Auth::has('owner');
        insert('expenses', ['id' => $id, 'number' => make_code('expense'), 'category' => req_str($in, 'category', 60), 'description' => req_str($in, 'description', 255),
            'vendor' => req_str($in, 'vendor', 120, false), 'amount_paise' => req_int($in, 'amountPaise', 1, 1_000_000_000),
            'spent_on' => (new DateTimeImmutable((string)($in['spentOn'] ?? now_local()->format('Y-m-d'))))->format('Y-m-d'),
            'paid_from' => req_enum($in, 'paidFrom', ['bank', 'cash', 'upi'], false) ?? 'bank', 'status' => $owner ? 'approved' : 'submitted',
            'created_by' => $u['id'], 'decided_by' => $owner ? $u['id'] : null, 'decided_at' => $owner ? now_utc() : null]);
        $e = one('SELECT * FROM expenses WHERE id = ?', [$id]);
        if ($owner) finance_post_expense($e);
        else { Events::emit('expense.submitted', ['expenseId' => $id, 'amountPaise' => (int)$e['amount_paise']]); notify(['role' => 'owner'], 'Expense to approve', "{$e['description']} · ₹" . number_format($e['amount_paise'] / 100), '/owner/', 'normal'); }
        return finance_expense_view($e);
    },
    'listExpenses' => function (array $in) {
        Auth::require('manager', 'owner', 'accountant');
        $w = !empty($in['status']) ? 'WHERE status = ?' : '';
        return ['items' => array_map('finance_expense_view', all("SELECT * FROM expenses $w ORDER BY spent_on DESC, created_at DESC LIMIT 300", $w ? [(string)$in['status']] : []))];
    },
    'decideExpense' => function (array $in) {
        $u = Auth::require('owner');
        $e = one('SELECT * FROM expenses WHERE id = ?', [req_str($in, 'id', 36)]);
        if (!$e || $e['status'] !== 'submitted') bw_fail('invalid_state', 'This expense is not waiting for approval.', 409);
        $status = req_enum($in, 'decision', ['approved', 'rejected']);
        update('expenses', ['status' => $status, 'approver_comment' => req_str($in, 'comment', 255, false), 'decided_by' => $u['id'], 'decided_at' => now_utc()], 'id = ?', [$e['id']]);
        $e = one('SELECT * FROM expenses WHERE id = ?', [$e['id']]);
        if ($status === 'approved') finance_post_expense($e);
        Events::emit("expense.$status", ['expenseId' => $e['id'], 'by' => $u['id'], 'comment' => $e['approver_comment']]);
        if ($e['created_by']) notify(['userId' => $e['created_by']], 'Expense ' . $status, "{$e['description']} · ₹" . number_format($e['amount_paise'] / 100), '/manager/');
        return finance_expense_view($e);
    },

    /** Sales AND profit, read-only, for consultant, manager, owner, accountant (D-33). Period: from/to (YYYY-MM-DD, local). */
    'getSalesSummary' => function (array $in) {
        Auth::require('consultant', 'manager', 'owner', 'accountant');
        $from = (string)($in['from'] ?? now_local()->modify('first day of this month')->format('Y-m-d'));
        $to = (string)($in['to'] ?? now_local()->format('Y-m-d'));
        $inc = fn(string $codes) => (int)val("SELECT COALESCE(SUM(l.credit_paise - l.debit_paise), 0) FROM journal_lines l JOIN journal_entries_fin e ON e.id = l.entry_id WHERE l.account_code IN ($codes) AND e.entry_date BETWEEN ? AND ?", [$from, $to]);
        $exp = fn(string $codes) => (int)val("SELECT COALESCE(SUM(l.debit_paise - l.credit_paise), 0) FROM journal_lines l JOIN journal_entries_fin e ON e.id = l.entry_id WHERE l.account_code IN ($codes) AND e.entry_date BETWEEN ? AND ?", [$from, $to]);
        $consult = $inc("'4000'"); $products = $inc("'4100'"); $reorders = $inc("'4200'");
        $cogs = (int)val("SELECT COALESCE(SUM(oi.qty * COALESCE(v.cost_paise, 0)), 0) FROM order_items oi JOIN sales_orders o ON o.id = oi.sales_order_id JOIN product_variants v ON v.id = oi.variant_id
                          WHERE oi.kind = 'product' AND o.paid_at IS NOT NULL AND DATE(CONVERT_TZ(o.paid_at, '+00:00', '+05:30')) BETWEEN ? AND ?", [$from, $to]);
        $opex = $exp("'5100','5200'");
        $sales = $consult + $products + $reorders;
        $byDay = all("SELECT e.entry_date d, SUM(l.credit_paise - l.debit_paise) s FROM journal_lines l JOIN journal_entries_fin e ON e.id = l.entry_id WHERE l.account_code IN ('4000','4100','4200') AND e.entry_date BETWEEN ? AND ? GROUP BY e.entry_date ORDER BY e.entry_date", [$from, $to]);
        return ['from' => $from, 'to' => $to, 'salesPaise' => $sales, 'consultationsPaise' => $consult, 'productsPaise' => $products, 'remedyReordersPaise' => $reorders,
            'costOfGoodsPaise' => $cogs, 'expensesPaise' => $opex, 'profitPaise' => $sales - $cogs - $opex,
            'sessions' => (int)val("SELECT COUNT(*) FROM appointments WHERE status = 'completed' AND DATE(CONVERT_TZ(completed_at, '+00:00', '+05:30')) BETWEEN ? AND ?", [$from, $to]),
            'orders' => (int)val("SELECT COUNT(*) FROM sales_orders WHERE paid_at IS NOT NULL AND total_paise > 0 AND DATE(CONVERT_TZ(paid_at, '+00:00', '+05:30')) BETWEEN ? AND ?", [$from, $to]),
            'byDay' => array_map(fn($r) => ['date' => $r['d'], 'salesPaise' => (int)$r['s']], $byDay),
            'note' => 'Draft accounts — pending your accountant (D-13). Cost of goods uses product cost prices set in the catalogue.'];
    },

    'getTrialBalance' => function (array $in) {
        Auth::require('owner', 'accountant');
        $to = (string)($in['to'] ?? now_local()->format('Y-m-d'));
        return array_map(fn($r) => ['code' => $r['code'], 'name' => $r['name'], 'type' => $r['type'], 'debitPaise' => (int)$r['dr'], 'creditPaise' => (int)$r['cr']],
            all('SELECT a.code, a.name, a.type, COALESCE(SUM(l.debit_paise), 0) dr, COALESCE(SUM(l.credit_paise), 0) cr FROM accounts a
                 LEFT JOIN journal_lines l ON l.account_code = a.code LEFT JOIN journal_entries_fin e ON e.id = l.entry_id AND e.entry_date <= ?
                 WHERE e.id IS NOT NULL OR l.id IS NULL GROUP BY a.code, a.name, a.type ORDER BY a.code', [$to]));
    },
];

function finance_post_expense(array $e): void
{
    finance_post('expense', $e['id'], $e['spent_on'], "{$e['number']} · {$e['description']}", [
        ['account' => '5100', 'debit' => (int)$e['amount_paise']],
        ['account' => $e['paid_from'] === 'cash' ? '1000' : '1010', 'credit' => (int)$e['amount_paise']],
    ]);
}

function finance_expense_view(array $e): array
{
    return ['id' => $e['id'], 'number' => $e['number'], 'category' => $e['category'], 'description' => $e['description'], 'vendor' => $e['vendor'],
        'amountPaise' => (int)$e['amount_paise'], 'spentOn' => $e['spent_on'], 'paidFrom' => $e['paid_from'], 'status' => $e['status'], 'comment' => $e['approver_comment'], 'createdAt' => iso($e['created_at'])];
}
