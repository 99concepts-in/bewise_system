<?php
/**
 * @owner HUB · Idempotent seed: runs after every migration batch, only inserts what is missing
 * (never overwrites what the team has edited in the apps).
 */
declare(strict_types=1);

function bw_norm_statement(string $s): string
{
    $s = str_replace(['’', '‘', '“', '”'], ["'", "'", '"', '"'], mb_strtolower($s));
    return trim(preg_replace('/[^a-z0-9]+/', ' ', $s));
}

function bw_seed(): void
{
    // settings — @decision(D-09) fees · D-02 remedy included · D-16 no refunds · D-08 reschedule window (default)
    $defaults = [
        ['business.profile', ['name' => 'BeWise Holistic Wellness', 'legalName' => '', 'gstin' => '', 'phone' => '+91 90542 20952',
            'whatsapp' => '919054220952', 'email' => '', 'website' => 'https://www.jitendrakhimlani.com',
            'studio' => '102, Yogikrupa Apartment, 19/A, Nutan Bharat Society, Alkapuri, Vadodara, Gujarat 390007'], true],
        ['remedy.reorder_price_paise', 80000, true],
        ['policy.reschedule', ['freeHoursBefore' => 24, 'lateReschedulesAllowed' => 1, 'refunds' => false], true],
        ['booking.hold_minutes', 15, true],
        ['booking.pay_later_allowed', true, true],
        ['booking.days_ahead', 45, true],
        ['booking.meeting_url', '', false],
        ['shipping.rates', ['flatPaise' => 0, 'freeAbovePaise' => 0, 'pickupAllowed' => true], true],
        ['tax.rates', ['consultationBp' => 0, 'productBp' => 0, 'pricesIncludeTax' => true], false],   // until GSTIN (D-05)
        ['owner.greeting_name', '', false],                                                              // D-42
        ['integrations.razorpay', ['mode' => 'not_set_up'], false],
    ];
    foreach ($defaults as [$k, $v, $pub]) {
        q('INSERT IGNORE INTO settings (`key`, value, is_public) VALUES (?, ?, ?)', [$k, json_encode($v, JSON_UNESCAPED_UNICODE), (int)$pub]);
    }

    // consultation types — @decision(D-09) ₹1,000 / ₹800 incl. remedy; minutes = calendar block only
    q("INSERT IGNORE INTO consultation_types (id, name, minutes, fee_paise, modes, includes_remedy, sort) VALUES
       ('first', 'First consultation', 60, 100000, '[\"online\",\"in_person\"]', 1, 1),
       ('followup', 'Follow-up', 30, 80000, '[\"online\",\"in_person\"]', 1, 2)");

    // Bach library — D-30: 38 + Rescue, hideable; one-line notes are drafts pending Jitendra Khimlani (D-10)
    $groups = [
        'Fear' => ['Rock Rose', 'Mimulus', 'Cherry Plum', 'Aspen', 'Red Chestnut'],
        'Uncertainty' => ['Cerato', 'Scleranthus', 'Gentian', 'Gorse', 'Hornbeam', 'Wild Oat'],
        'Not enough interest in present circumstances' => ['Clematis', 'Honeysuckle', 'Wild Rose', 'Olive', 'White Chestnut', 'Mustard', 'Chestnut Bud'],
        'Loneliness' => ['Water Violet', 'Impatiens', 'Heather'],
        'Over-sensitivity to influences and ideas' => ['Agrimony', 'Centaury', 'Walnut', 'Holly'],
        'Despondency or despair' => ['Larch', 'Pine', 'Elm', 'Sweet Chestnut', 'Star of Bethlehem', 'Willow', 'Oak', 'Crab Apple'],
        'Over-care for the welfare of others' => ['Chicory', 'Vervain', 'Vine', 'Beech', 'Rock Water'],
        'Combination' => ['Rescue Remedy'],
    ];
    $notes = json_decode((string)file_get_contents(dirname(__DIR__) . '/seed/flower-notes.json'), true) ?: [];
    $i = 0;
    foreach ($groups as $g => $names) foreach ($names as $n) {
        q('INSERT IGNORE INTO bach_remedies (id, name, group_name, note, sort) VALUES (?, ?, ?, ?, ?)',
            [trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($n)), '-'), $n, $g, $notes[$n] ?? null, ++$i]);
    }

    // troubling emotions catalogue (D-27) — editable by the consultant
    $concerns = json_decode((string)file_get_contents(dirname(__DIR__) . '/seed/concerns.json'), true) ?: [];
    $i = 0;
    foreach ($concerns as $label => $flowers) {
        q('INSERT IGNORE INTO concern_catalog (`key`, label, flowers, sort) VALUES (?, ?, ?, ?)',
            [strtolower(preg_replace('/[^a-z0-9]+/i', '_', $label)), $label, json_encode($flowers), ++$i]);
    }

    // intake statement → flower mapping (D-37) — pending Jitendra Khimlani's approval (CONTENT-CHECKLIST #4b)
    $map = json_decode((string)file_get_contents(dirname(__DIR__) . '/seed/intake-mapping.json'), true) ?: [];
    foreach ($map as $statement => $flowers) {
        q('INSERT IGNORE INTO intake_mapping (id, statement, statement_key, flowers) VALUES (?, ?, ?, ?)',
            [uuid(), $statement, bw_norm_statement($statement), json_encode($flowers)]);
    }

    // catalogue (MANAGER edits afterwards in the manager app)
    // adds products whose slug is new; never touches products the team already edited or archived
    $products = json_decode((string)file_get_contents(dirname(__DIR__) . '/seed/products.json'), true) ?: [];
    foreach ($products as $p) {
        if (val('SELECT 1 FROM products WHERE slug = ?', [$p['slug']])) continue;
        {
            $pid = uuid();
            insert('products', ['id' => $pid, 'slug' => $p['slug'], 'name' => $p['name'], 'tagline' => $p['tagline'], 'category' => $p['category'],
                'format' => $p['format'], 'data' => $p['data'], 'sold_out' => $p['sold_out'] ? 1 : 0, 'sort' => $p['sort']]);
            foreach ($p['variants'] as $v) {
                if (val('SELECT 1 FROM product_variants WHERE id = ?', [$v['id']])) continue;
                insert('product_variants', ['id' => $v['id'], 'product_id' => $pid, 'label' => $v['label'], 'price_paise' => $v['price_paise'], 'mrp_paise' => $v['mrp_paise']]);
            }
        }
    }

    // draft chart of accounts — pending accountant (D-13). OWNER chat extends.
    $coa = [
        ['1000', 'Cash in hand', 'asset'], ['1010', 'Bank account', 'asset'], ['1020', 'Razorpay clearing', 'asset'],
        ['1100', 'Accounts receivable', 'asset'], ['1200', 'Inventory', 'asset'],
        ['2000', 'Accounts payable', 'liability'], ['2100', 'GST output — CGST', 'liability'], ['2110', 'GST output — SGST', 'liability'],
        ['2120', 'GST output — IGST', 'liability'], ['2200', 'GST input credit', 'asset'],
        ['3000', 'Owner capital', 'equity'], ['3100', 'Owner drawings', 'equity'],
        ['4000', 'Consultation income (incl. remedy)', 'income'], ['4100', 'Product sales', 'income'], ['4200', 'Remedy reorders', 'income'],
        ['5000', 'Cost of goods sold', 'expense'], ['5100', 'Operating expenses', 'expense'], ['5200', 'Payment gateway fees', 'expense'],
    ];
    foreach ($coa as [$c, $n, $t]) q('INSERT IGNORE INTO accounts (code, name, type) VALUES (?, ?, ?)', [$c, $n, $t]);
}
