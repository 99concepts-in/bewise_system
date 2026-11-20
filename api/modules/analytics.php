<?php
/** @owner OWNER · analytics.* — read-only dashboards. No intake/notes content ever; counts only. */
declare(strict_types=1);

function analytics_day_bounds(?string $date = null): array
{
    $d = new DateTimeImmutable($date ?? 'today', new DateTimeZone(BW_TZ));
    $s = $d->setTime(0, 0);
    return [$s->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s'), $s->modify('+1 day')->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s')];
}

return [
    /** Today at a glance — consultant, manager, owner. */
    'today' => function (array $in) {
        Auth::require('consultant', 'manager', 'owner');
        [$s, $e] = analytics_day_bounds($in['date'] ?? null);
        $cons = Auth::has('consultant') && !Auth::has('owner', 'manager') ? ' AND consultant_id = ' . db()->quote(Auth::userId()) : '';
        return [
            'appointments' => (int)val("SELECT COUNT(*) FROM appointments WHERE starts_at >= ? AND starts_at < ? AND status IN ('confirmed','checked_in','in_session','completed')$cons", [$s, $e]),
            'checkedIn' => (int)val("SELECT COUNT(*) FROM appointments WHERE starts_at >= ? AND starts_at < ? AND status IN ('checked_in','in_session')$cons", [$s, $e]),
            'completed' => (int)val("SELECT COUNT(*) FROM appointments WHERE starts_at >= ? AND starts_at < ? AND status = 'completed'$cons", [$s, $e]),
            'awaitingPayment' => (int)val("SELECT COUNT(*) FROM appointments WHERE payment_status = 'unpaid' AND status IN ('pending_payment','confirmed','completed')"),
            'remediesToPrepare' => (int)val("SELECT COUNT(*) FROM fulfilment_tasks WHERE type = 'remedy_prep' AND stage NOT IN ('ready_to_dispatch','dispatched','delivered','cancelled')"),
            'ordersToPack' => (int)val("SELECT COUNT(*) FROM fulfilment_tasks WHERE type = 'pick_pack' AND stage NOT IN ('dispatched','delivered','cancelled')"),
            'receivedTodayPaise' => (int)val("SELECT COALESCE(SUM(amount_paise), 0) FROM payments WHERE status = 'captured' AND captured_at >= ? AND captured_at < ?", [$s, $e]),
            'expensesToApprove' => Auth::has('owner') ? (int)val("SELECT COUNT(*) FROM expenses WHERE status = 'submitted'") : null,
            'newClientsThisMonth' => (int)val("SELECT COUNT(*) FROM clients WHERE created_at >= ?", [analytics_day_bounds(now_local()->format('Y-m-01'))[0]]),
            'averageRating' => Auth::has('consultant', 'owner') ? (float)val('SELECT ROUND(AVG(rating), 1) FROM session_feedback WHERE created_at > UTC_TIMESTAMP() - INTERVAL 90 DAY') : null,
        ];
    },
];
