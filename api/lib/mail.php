<?php
/**
 * @owner HUB (OWNER extends templates) · Email sending.
 * transport 'smtp' → Hostinger mailbox (smtp.hostinger.com, port 465 SSL), set in the private config by the installer.
 * transport 'mail' → PHP mail() (works on Hostinger for addresses on your own domain).
 * transport 'log'  → writes to storage/mail.log only (local development).
 */
declare(strict_types=1);

function bw_send_mail(string $to, string $subject, string $text, ?string $html = null): bool
{
    $m = bw_config('mail', []);
    $transport = $m['transport'] ?? 'mail';
    $from = $m['from'] ?? ('no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $fromName = $m['from_name'] ?? 'BeWise Holistic Wellness';
    $html ??= '<div style="font-family:Arial,sans-serif;font-size:15px;color:#243D91;line-height:1.5">' . nl2br(htmlspecialchars($text)) . '</div>';

    $boundary = 'bw' . bin2hex(random_bytes(8));
    $headers = [
        'From: ' . mb_encode_mimeheader($fromName) . " <$from>",
        "Reply-To: $from",
        'MIME-Version: 1.0',
        "Content-Type: multipart/alternative; boundary=\"$boundary\"",
    ];
    $body = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text))
          . "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html))
          . "--$boundary--\r\n";
    $subjectEnc = mb_encode_mimeheader($subject, 'UTF-8');

    try {
        if ($transport === 'log') {
            @file_put_contents(bw_storage_dir() . '/mail.log', "[" . gmdate('c') . "] to=$to subject=$subject\n$text\n\n", FILE_APPEND);
            return true;
        }
        if ($transport === 'smtp') return bw_smtp_send($m, $from, $to, $subjectEnc, $headers, $body);
        return mail($to, $subjectEnc, $body, implode("\r\n", $headers), '-f' . $from);
    } catch (Throwable $e) {
        error_log('BeWise mail failed: ' . $e->getMessage());
        return false;
    }
}

function bw_smtp_send(array $m, string $from, string $to, string $subject, array $headers, string $body): bool
{
    $host = $m['host'] ?? 'smtp.hostinger.com';
    $port = (int)($m['port'] ?? 465);
    $secure = $m['secure'] ?? ($port === 465 ? 'ssl' : 'tls');
    $remote = ($secure === 'ssl' ? 'ssl://' : 'tcp://') . "$host:$port";
    $fp = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]));
    if (!$fp) throw new RuntimeException("SMTP connect failed: $errstr");
    stream_set_timeout($fp, 15);
    $read = function () use ($fp): string {
        $out = '';
        while (($line = fgets($fp, 515)) !== false) { $out .= $line; if (isset($line[3]) && $line[3] === ' ') break; }
        return $out;
    };
    $cmd = function (string $c, array $ok) use ($fp, $read): string {
        if ($c !== '') fwrite($fp, $c . "\r\n");
        $r = $read();
        if (!in_array((int)substr($r, 0, 3), $ok, true)) throw new RuntimeException('SMTP error: ' . trim($r));
        return $r;
    };
    $ehlo = 'EHLO ' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
    $cmd('', [220]);
    $cmd($ehlo, [250]);
    if ($secure === 'tls') {
        $cmd('STARTTLS', [220]);
        stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        $cmd($ehlo, [250]);
    }
    $cmd('AUTH LOGIN', [334]);
    $cmd(base64_encode((string)$m['user']), [334]);
    $cmd(base64_encode((string)$m['pass']), [235]);
    $cmd("MAIL FROM:<$from>", [250]);
    $cmd("RCPT TO:<$to>", [250, 251]);
    $cmd('DATA', [354]);
    $msg = implode("\r\n", [...$headers, "To: <$to>", "Subject: $subject", 'Date: ' . date('r'), 'Message-ID: <' . bin2hex(random_bytes(8)) . "@$host>"]) . "\r\n\r\n" . $body;
    $msg = preg_replace('/^\./m', '..', $msg);
    $cmd($msg . "\r\n.", [250]);
    $cmd('QUIT', [221]);
    fclose($fp);
    return true;
}
