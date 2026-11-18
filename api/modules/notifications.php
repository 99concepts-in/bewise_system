<?php
/** @owner OWNER · notifications.* — in-app inbox for every role (email/WhatsApp delivery: O3). */
declare(strict_types=1);

return [
    'listInbox' => function (array $in) {
        $u = Auth::require();
        $rows = all('SELECT * FROM notifications_inbox WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', [$u['id']]);
        return ['unread' => (int)val('SELECT COUNT(*) FROM notifications_inbox WHERE user_id = ? AND read_at IS NULL', [$u['id']]),
            'items' => array_map(fn($n) => ['id' => $n['id'], 'title' => $n['title'], 'body' => $n['body'], 'href' => $n['href'], 'priority' => $n['priority'], 'read' => (bool)$n['read_at'], 'at' => iso($n['created_at'])], $rows)];
    },
    'markRead' => function (array $in) {
        $u = Auth::require();
        if (!empty($in['all'])) q('UPDATE notifications_inbox SET read_at = UTC_TIMESTAMP() WHERE user_id = ? AND read_at IS NULL', [$u['id']]);
        else q('UPDATE notifications_inbox SET read_at = UTC_TIMESTAMP() WHERE user_id = ? AND id = ?', [$u['id'], req_str($in, 'id', 36)]);
        return ['ok' => true];
    },
];
