<?php
// @owner HUB · local dev only: php -S 127.0.0.1:8080 -t <site-root> api/tests/router.php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('#^/api/install\.php#', $path)) { require __DIR__ . '/../install.php'; return true; }
if (preg_match('#^/api/sdk/#', $path)) return false;
if (str_starts_with($path, '/api/')) { require __DIR__ . '/../index.php'; return true; }
return false;
