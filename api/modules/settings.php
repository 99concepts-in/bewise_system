<?php
/** @owner OWNER · settings.* — key/value business settings. Secrets (Razorpay secret, SMTP password) never live here: private config only. */
declare(strict_types=1);

const BW_SETTING_KEYS = ['business.profile', 'remedy.reorder_price_paise', 'policy.reschedule', 'booking.hold_minutes', 'booking.pay_later_allowed',
    'booking.days_ahead', 'booking.meeting_url', 'shipping.rates', 'tax.rates', 'owner.greeting_name', 'integrations.razorpay', 'whatsapp.templates', 'whatsapp.login_enabled'];

return [
    'getAll' => function (array $in) {
        Auth::require('owner');
        $out = [];
        foreach (all('SELECT `key`, value, is_public, updated_at FROM settings ORDER BY `key`') as $r) $out[$r['key']] = ['value' => json_decode($r['value'], true), 'public' => (bool)$r['is_public'], 'updatedAt' => iso($r['updated_at'])];
        $out['_integrations'] = ['razorpay' => bw_config('razorpay.key_id') ? (str_starts_with((string)bw_config('razorpay.key_id'), 'rzp_live') ? 'live' : 'test') : 'not_set_up',
            'razorpayWebhook' => bw_config('razorpay.webhook_secret') ? 'set' : 'not_set_up', 'email' => bw_config('mail.transport', 'mail'),
            'whatsapp' => bw_config('whatsapp.token') ? 'connected (Mart2Meta)' : 'not_set_up', 'shiprocket' => 'not_set_up', 'googleCalendar' => 'ics_feed', 'ai' => bw_config('anthropic.api_key') ? 'set' : 'not_set_up'];
        return $out;
    },
    'get' => function (array $in) {
        $key = (string)req_str($in, 'key', 100);
        $row = one('SELECT value, is_public FROM settings WHERE `key` = ?', [$key]);
        if (!$row) return null;
        if (!$row['is_public'] && !Auth::has('owner', 'manager', 'consultant')) bw_fail('forbidden', 'Not available', 403);
        return json_decode($row['value'], true);
    },
    'set' => function (array $in) {
        Auth::require('owner');
        $key = (string)req_str($in, 'key', 100);
        if (!in_array($key, BW_SETTING_KEYS, true)) bw_fail('invalid_input', "Unknown setting $key");
        if (!array_key_exists('value', $in)) bw_fail('invalid_input', 'Missing value');
        set_setting($key, $in['value']);
        audit('settings.set', 'setting', $key);
        return ['saved' => true];
    },
];
