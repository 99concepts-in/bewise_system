<?php
/** @owner HUB · system.* — health and the public config every app loads at start. */
declare(strict_types=1);

return [
    'health' => fn(array $in) => [
        'status' => 'ok', 'version' => BW_API_VERSION, 'db' => (bool)val('SELECT 1'), 'time' => iso(now_utc()),
        'migrations' => (int)val('SELECT COUNT(*) FROM schema_migrations'),
    ],
    /** Public, cache-safe: fees, studio, policies, Razorpay key id (never the secret), signed-in user if any. */
    'publicConfig' => function (array $in) {
        $settings = [];
        foreach (all('SELECT `key`, value FROM settings WHERE is_public = 1') as $r) $settings[$r['key']] = json_decode($r['value'], true);
        return [
            'settings' => $settings,
            'consultationTypes' => scheduling_types(true),
            'payments' => ['razorpay' => bw_config('razorpay.key_id') ? ['keyId' => bw_config('razorpay.key_id'), 'mode' => str_starts_with((string)bw_config('razorpay.key_id'), 'rzp_live') ? 'live' : 'test'] : null],
            'whatsappLogin' => (bool)setting('whatsapp.login_enabled', false) && wa_configured(),
            'me' => Auth::user(),
        ];
    },
];
