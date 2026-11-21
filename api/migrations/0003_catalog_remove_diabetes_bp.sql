-- @owner HUB (owner request 2026-11-19) · hide the "Diabetes" and "BP" roll-ons for now (medical-sounding names; Razorpay review).
-- Archived, not deleted: past orders keep their lines; the manager can restore them from the catalogue later.
UPDATE products SET archived_at = UTC_TIMESTAMP() WHERE slug IN ('diabetes-roll-on', 'bp-roll-on') AND archived_at IS NULL;
UPDATE product_variants SET archived_at = UTC_TIMESTAMP() WHERE id IN ('diabetes-roll-on-15', 'bp-roll-on-15') AND archived_at IS NULL;
