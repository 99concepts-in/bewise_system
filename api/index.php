<?php
/**
 * @owner HUB · BeWise API front controller.
 *
 *   POST /api/v1/<module>.<function>   JSON body = input · response { ok: true, data } | { ok: false, error: { code, message } }
 *   GET  /api/v1/system.health          (no body)
 *   POST /api/webhooks/razorpay         Razorpay webhook (signature verified)
 *   GET  /api/calendar/<token>.ics      private calendar feed (D-31)
 *
 * Function names mirror docs/03-CONTRACTS.md §5 so the apps swap demo data for real calls 1:1.
 * Browser calls must send header "X-BeWise: 1" (blocks cross-site form posts; see api/sdk/bewise-api.js).
 */
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/mail.php';
require __DIR__ . '/lib/events.php';
require_once __DIR__ . '/lib/seed.php';
require_once __DIR__ . '/lib/whatsapp.php';
require_once __DIR__ . '/lib/registry.php';
date_default_timezone_set('UTC');

function bw_respond(int $http, array $body): never
{
    http_response_code($http);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}


$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = preg_replace('#^.*?/api/#', '', $path);   // works at the domain root or in a sub-folder

// CORS for BeWise's own websites (bewiseglobal.in calls app.bewiseglobal.in/api). Extra origins: config 'cors_origins'.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = array_merge(['https://bewiseglobal.in', 'https://www.bewiseglobal.in'], (array)bw_config('cors_origins', []));
if ($origin !== '' && in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-BeWise');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Max-Age: 86400');
    header('Vary: Origin');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

try {
    if (!bw_config('db')) bw_fail('not_installed', 'The BeWise server is not set up yet. Open /api/install.php to connect the database.', 503);
    bw_auto_migrate();

    if (preg_match('#^webhooks/razorpay/?$#', $path)) {
        bw_registry();
        $out = finance_razorpay_webhook((string)file_get_contents('php://input'), $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '');
        bw_respond(200, ['ok' => true, 'data' => $out]);
    }
    if (preg_match('#^calendar/([a-f0-9]{48})\.ics$#', $path, $m)) {
        bw_registry();
        header('Content-Type: text/calendar; charset=utf-8');
        echo scheduling_ics_feed($m[1]);
        exit;
    }
    if (!preg_match('#^v1/([a-z]+)\.([A-Za-z]+)$#', $path, $m)) bw_fail('not_found', 'Unknown API path', 404);

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $name = "$m[1].$m[2]";
    $publicGet = ['system.health', 'system.publicConfig', 'catalog.listProducts', 'scheduling.listConsultationTypes'];
    if ($method === 'GET' && !in_array($name, $publicGet, true)) bw_fail('method_not_allowed', 'Use POST', 405);
    if ($method === 'POST' && ($_SERVER['HTTP_X_BEWISE'] ?? '') !== '1') bw_fail('bad_request', 'Missing X-BeWise header', 400);
    if (!in_array($method, ['GET', 'POST'], true)) bw_fail('method_not_allowed', 'Use POST', 405);

    $raw = $method === 'POST' ? (string)file_get_contents('php://input') : '';
    if (strlen($raw) > 2_000_000) bw_fail('too_large', 'Request too large', 413);
    $in = $raw === '' ? $_GET : json_decode($raw, true);
    if (!is_array($in)) bw_fail('invalid_json', 'Body must be a JSON object');

    $fns = bw_registry();
    if (!isset($fns[$name])) bw_fail('not_found', "Unknown function $name", 404);
    $data = tx(fn() => ($fns[$name])($in));
    bw_respond(200, ['ok' => true, 'data' => $data]);
} catch (ApiError $e) {
    bw_respond($e->http, ['ok' => false, 'error' => ['code' => $e->errCode, 'message' => $e->getMessage()]]);
} catch (Throwable $e) {
    error_log('BeWise API error: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    $msg = bw_config('debug') ? $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine() : 'Something went wrong on our side. Please try again.';
    bw_respond(500, ['ok' => false, 'error' => ['code' => 'server_error', 'message' => $msg]]);
}
