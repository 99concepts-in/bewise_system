<?php
/**
 * @owner CLIENT · companion.* — Ask BeWise (D-29). @stub until the CLIENT chat implements it with Claude (load the claude-api skill first).
 * Guardrails: no diagnosis, no remedy changes, confirm before actions; safety words → helplines (Tele-MANAS 14416 / 112).
 */
declare(strict_types=1);

return [
    'sendCompanionMessage' => function (array $in) {
        Auth::clientId();
        $text = mb_strtolower((string)req_str($in, 'text', 2000));
        if (preg_match('/suicid|kill myself|end my life|self.?harm|hurt myself|marna|jeena nahi/u', $text)) {
            return ['reply' => ['text' => 'I\'m really sorry you\'re feeling this way. Please reach out right now: Tele-MANAS 14416 (free, 24×7) or 112 for an emergency. Jitu Bhaiya is here for you too.', 'safety' => true]];
        }
        return ['reply' => ['text' => 'Ask BeWise is being set up. Meanwhile, message us on WhatsApp and the team will help.', 'quickReplies' => ['Book a consultation', 'Shop']], 'stub' => true];
    },
];
