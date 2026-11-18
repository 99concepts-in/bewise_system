<?php
/**
 * @owner MANAGER · catalog.* — products & variants. Public read (store), edit by manager/owner (D-11: phone + computer).
 * cost_paise is never returned to clients (profit, D-33).
 */
declare(strict_types=1);

function catalog_product_view(array $p, bool $staff = false): array
{
    $vars = all('SELECT * FROM product_variants WHERE product_id = ? AND archived_at IS NULL ORDER BY price_paise', [$p['id']]);
    $d = jdec($p['data']);
    return ['id' => $p['id'], 'slug' => $p['slug'], 'name' => $p['name'], 'tagline' => $p['tagline'], 'category' => $p['category'], 'format' => $p['format'],
        'soldOut' => (bool)$p['sold_out'], 'archived' => (bool)$p['archived_at'], 'sort' => (int)$p['sort']] + $d + [
        'variants' => array_map(fn($v) => ['id' => $v['id'], 'label' => $v['label'], 'pricePaise' => (int)$v['price_paise'], 'mrpPaise' => $v['mrp_paise'] !== null ? (int)$v['mrp_paise'] : null]
            + ($staff ? ['costPaise' => $v['cost_paise'] !== null ? (int)$v['cost_paise'] : null, 'sku' => $v['sku'], 'stockQty' => $v['stock_qty'] !== null ? (int)$v['stock_qty'] : null, 'reorderLevel' => $v['reorder_level'] !== null ? (int)$v['reorder_level'] : null]
                      : ['inStock' => !$p['sold_out'] && ($v['stock_qty'] === null || (int)$v['stock_qty'] > 0)]), $vars)];
}

function catalog_variant(string $id): array
{
    $v = one('SELECT v.*, p.name AS product_name, p.slug, p.sold_out, p.archived_at AS p_archived, p.data FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.id = ?', [$id]);
    if (!$v || $v['archived_at'] || $v['p_archived']) bw_fail('invalid_input', "Product $id is not available");
    return $v;
}

return [
    'listProducts' => function (array $in) {
        $staff = Auth::has('manager', 'owner');
        $rows = all('SELECT * FROM products' . ($staff && !empty($in['includeArchived']) ? '' : ' WHERE archived_at IS NULL') . ' ORDER BY sort, name');
        return ['items' => array_map(fn($p) => catalog_product_view($p, $staff), $rows)];
    },
    'getProductBySlug' => function (array $in) {
        $p = one('SELECT * FROM products WHERE slug = ?', [req_str($in, 'slug', 80)]);
        return $p ? catalog_product_view($p, Auth::has('manager', 'owner')) : null;
    },
    /** Create or edit a product with its variants. variants = [{ id?, label, pricePaise, mrpPaise?, costPaise?, sku? }] */
    'upsertProduct' => function (array $in) {
        Auth::require('manager', 'owner');
        $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', (string)req_str($in, 'slug', 80)), '-'));
        $existing = one('SELECT * FROM products WHERE ' . (!empty($in['id']) ? 'id = ?' : 'slug = ?'), [!empty($in['id']) ? $in['id'] : $slug]);
        $data = $existing ? jdec($existing['data']) : [];
        foreach (['about', 'feel', 'ingredients', 'howTo', 'safety', 'intents', 'art', 'color', 'tint', 'personal', 'allergens', 'image'] as $k) if (array_key_exists($k, $in)) $data[$k] = $in[$k];
        $row = ['slug' => $slug, 'name' => req_str($in, 'name', 120), 'tagline' => (string)req_str($in, 'tagline', 190, false), 'category' => req_str($in, 'category', 40),
            'format' => req_str($in, 'format', 40), 'data' => $data, 'sold_out' => !empty($in['soldOut']), 'sort' => (int)($in['sort'] ?? ($existing['sort'] ?? 50))];
        if ($existing) { update('products', $row, 'id = ?', [$existing['id']]); $pid = $existing['id']; }
        else { $pid = uuid(); insert('products', $row + ['id' => $pid]); }
        $keep = [];
        foreach (req_arr($in, 'variants', !$existing) as $v) {
            $vid = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', (string)($v['id'] ?? ($slug . '-' . ($v['label'] ?? '')))), '-'));
            $vr = ['label' => req_str($v, 'label', 40), 'price_paise' => req_int($v, 'pricePaise', 0, 100_000_000), 'mrp_paise' => req_int($v, 'mrpPaise', 0, null, false),
                'cost_paise' => req_int($v, 'costPaise', 0, null, false), 'sku' => req_str($v, 'sku', 60, false)];
            $owner = val('SELECT product_id FROM product_variants WHERE id = ?', [$vid]);
            if ($owner && $owner !== $pid) bw_fail('invalid_input', "Variant id $vid belongs to another product");
            if ($owner) update('product_variants', $vr + ['archived_at' => null], 'id = ?', [$vid]); else insert('product_variants', $vr + ['id' => $vid, 'product_id' => $pid]);
            $keep[] = $vid;
        }
        if ($keep) q('UPDATE product_variants SET archived_at = UTC_TIMESTAMP() WHERE product_id = ? AND id NOT IN (' . implode(',', array_fill(0, count($keep), '?')) . ')', [$pid, ...$keep]);
        audit('catalog.upsert', 'product', $pid);
        return catalog_product_view(one('SELECT * FROM products WHERE id = ?', [$pid]), true);
    },
    'archiveProduct' => function (array $in) {
        Auth::require('manager', 'owner');
        q('UPDATE products SET archived_at = ' . (!empty($in['restore']) ? 'NULL' : 'UTC_TIMESTAMP()') . ' WHERE id = ?', [req_str($in, 'id', 36)]);
        return ['saved' => true];
    },
    'setSoldOut' => function (array $in) {
        Auth::require('manager', 'owner');
        q('UPDATE products SET sold_out = ? WHERE id = ?', [(int)!empty($in['soldOut']), req_str($in, 'id', 36)]);
        return ['saved' => true];
    },
    /** Stock: + received / − wastage / set count. Stock tracking is optional per variant (NULL = not tracked). */
    'adjustStock' => function (array $in) {
        Auth::require('manager', 'owner');
        $vid = (string)req_str($in, 'variantId', 80);
        catalog_variant($vid);
        $type = req_enum($in, 'type', ['purchase_receipt', 'production_output', 'adjustment', 'return', 'wastage']);
        $qty = req_int($in, 'qty', -100000, 100000);
        if ($type === 'wastage') $qty = -abs($qty);
        q('UPDATE product_variants SET stock_qty = COALESCE(stock_qty, 0) + ? WHERE id = ?', [$qty, $vid]);
        if (array_key_exists('reorderLevel', $in)) q('UPDATE product_variants SET reorder_level = ? WHERE id = ?', [req_int($in, 'reorderLevel', 0, null, false), $vid]);
        insert('stock_movements', ['id' => uuid(), 'variant_id' => $vid, 'type' => $type, 'qty' => $qty, 'note' => req_str($in, 'note', 255, false), 'created_by' => Auth::userId()]);
        return ['stockQty' => (int)val('SELECT stock_qty FROM product_variants WHERE id = ?', [$vid])];
    },
    'listStockMovements' => function (array $in) {
        Auth::require('manager', 'owner');
        return array_map(fn($m) => ['id' => $m['id'], 'variantId' => $m['variant_id'], 'type' => $m['type'], 'qty' => (int)$m['qty'], 'note' => $m['note'], 'at' => iso($m['created_at'])],
            all('SELECT * FROM stock_movements' . (!empty($in['variantId']) ? ' WHERE variant_id = ?' : '') . ' ORDER BY created_at DESC LIMIT 200', !empty($in['variantId']) ? [$in['variantId']] : []));
    },
];
