<?php
/** @owner HUB · module registry (shared by index.php, cron.php, tools.php). */
declare(strict_types=1);

const BW_MODULES = ['system', 'auth', 'crm', 'scheduling', 'intake', 'remedies', 'consultation', 'journal', 'catalog',
    'commerce', 'fulfilment', 'finance', 'notifications', 'settings', 'staff', 'analytics', 'companion'];

/** Loads every module (each registers its functions + event handlers). */
function bw_registry(): array
{
    static $fns = null;
    if ($fns !== null) return $fns;
    $fns = [];
    foreach (BW_MODULES as $m) {
        $defs = require dirname(__DIR__) . "/modules/$m.php";
        foreach ($defs as $name => $fn) $fns["$m.$name"] = $fn;
    }
    return $fns;
}

