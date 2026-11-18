-- @owner HUB · BeWise core schema for Hostinger MySQL / MariaDB (D-44: replaces Supabase/Postgres from D-01).
-- Conventions (docs/03-CONTRACTS.md §1): ids CHAR(36) uuid · money BIGINT *_paise · times DATETIME in UTC (display Asia/Kolkata)
-- · audit columns · never delete financial / consultation / stock movement rows.
-- Each module's owner chat adds tables/columns in NEW migration files (api/migrations/NNNN_<module>_<desc>.sql). Never edit a shipped file.

-- ───────────── identity & sessions (HUB → OWNER) ─────────────
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(190) NULL UNIQUE,
  phone VARCHAR(20) NULL,
  name VARCHAR(120) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NULL,           -- staff only (owner / consultant / manager / accountant)
  status ENUM('active','invited','disabled') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
  user_id CHAR(36) NOT NULL,
  role ENUM('client','consultant','manager','owner','accountant') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NULL,
  KEY ix_sessions_user (user_id),
  CONSTRAINT fk_sess_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE otp_codes (
  id CHAR(36) PRIMARY KEY,
  identifier VARCHAR(190) NOT NULL,          -- email (phone later, D-04)
  code_hash CHAR(64) NOT NULL,
  attempts TINYINT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_otp_ident (identifier, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rate_limits (
  bucket VARCHAR(190) NOT NULL,
  window_start DATETIME NOT NULL,
  hits INT NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE counters (
  name VARCHAR(60) PRIMARY KEY,               -- e.g. client, appointment, order, invoice:2026-27
  value INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── settings (OWNER, base by HUB) ─────────────
CREATE TABLE settings (
  `key` VARCHAR(100) PRIMARY KEY,
  value JSON NOT NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 0,     -- 1 = readable without login (fees, studio address, Razorpay key id)
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── crm (MANAGER, base by HUB) ─────────────
CREATE TABLE clients (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,            -- BW-C-00001
  user_id CHAR(36) NULL UNIQUE,                -- NULL for walk-ins created by staff
  name VARCHAR(120) NOT NULL DEFAULT '',
  email VARCHAR(190) NULL,
  phone VARCHAR(20) NULL,
  dob DATE NULL,
  gender VARCHAR(30) NULL,
  city VARCHAR(80) NULL,
  allergies JSON NULL,
  share_journal TINYINT(1) NOT NULL DEFAULT 1, -- D-15 default on
  onboarded_at DATETIME NULL,
  source VARCHAR(30) NOT NULL DEFAULT 'app',
  archived_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_clients_phone (phone), KEY ix_clients_email (email),
  CONSTRAINT fk_clients_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE client_addresses (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL, phone VARCHAR(20) NOT NULL,
  line1 VARCHAR(190) NOT NULL, line2 VARCHAR(190) NOT NULL DEFAULT '',
  city VARCHAR(80) NOT NULL, state VARCHAR(80) NOT NULL, pin VARCHAR(10) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  archived_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_addr_client (client_id),
  CONSTRAINT fk_addr_client FOREIGN KEY (client_id) REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE consent_records (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  type VARCHAR(40) NOT NULL,                   -- wellbeing · whatsapp · offers · ai_summary · share_journal
  granted TINYINT(1) NOT NULL,
  source VARCHAR(40) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_consent_client (client_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── scheduling (CONSULTANT) ─────────────
CREATE TABLE consultation_types (
  id VARCHAR(40) PRIMARY KEY,                  -- 'first' · 'followup' (stable keys used by the apps)
  name VARCHAR(120) NOT NULL,
  minutes SMALLINT NOT NULL,
  fee_paise BIGINT NOT NULL,
  modes JSON NOT NULL,                         -- ["online","in_person"]
  includes_remedy TINYINT(1) NOT NULL DEFAULT 1,  -- D-02
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort SMALLINT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE availability_rules (
  id CHAR(36) PRIMARY KEY,
  consultant_id CHAR(36) NOT NULL,
  weekday TINYINT NOT NULL,                    -- 1 = Monday … 7 = Sunday (ISO)
  start_time TIME NOT NULL, end_time TIME NOT NULL,   -- Asia/Kolkata wall clock
  modes JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_avail_consultant (consultant_id, weekday)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE availability_exceptions (
  id CHAR(36) PRIMARY KEY,
  consultant_id CHAR(36) NOT NULL,
  on_date DATE NOT NULL,
  closed TINYINT(1) NOT NULL DEFAULT 1,
  start_time TIME NULL, end_time TIME NULL,    -- when not closed: replaces that day's hours
  note VARCHAR(190) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_exc (consultant_id, on_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE appointments (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,            -- BW-A-00001
  client_id CHAR(36) NOT NULL,
  consultant_id CHAR(36) NOT NULL,
  consultation_type_id VARCHAR(40) NOT NULL,
  mode ENUM('online','in_person') NOT NULL,
  starts_at DATETIME NULL,                     -- NULL = paid, waiting for a time (time_requested)
  ends_at DATETIME NULL,
  status ENUM('pending_payment','confirmed','checked_in','in_session','completed','cancelled','no_show','expired') NOT NULL,
  payment_status ENUM('unpaid','paid','plan') NOT NULL DEFAULT 'unpaid',
  pay_later TINYINT(1) NOT NULL DEFAULT 0,
  hold_expires_at DATETIME NULL,
  amount_paise BIGINT NOT NULL,
  client_note TEXT NULL,                       -- CL-15, consultant-only
  source ENUM('client','consultant','manager','owner') NOT NULL DEFAULT 'client',
  meeting_url VARCHAR(255) NULL,
  reschedule_count TINYINT NOT NULL DEFAULT 0,
  intake_id CHAR(36) NULL,
  paid_at DATETIME NULL,
  checked_in_at DATETIME NULL, completed_at DATETIME NULL, cancelled_at DATETIME NULL,
  cancel_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_appt_client (client_id, starts_at), KEY ix_appt_consultant (consultant_id, starts_at), KEY ix_appt_status (status),
  CONSTRAINT fk_appt_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_appt_type FOREIGN KEY (consultation_type_id) REFERENCES consultation_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE appointment_history (
  id CHAR(36) PRIMARY KEY,
  appointment_id CHAR(36) NOT NULL,
  action VARCHAR(40) NOT NULL,
  from_value VARCHAR(190) NULL, to_value VARCHAR(190) NULL,
  by_user CHAR(36) NULL,
  note VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_ah_appt (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE session_feedback (
  id CHAR(36) PRIMARY KEY,
  appointment_id CHAR(36) NOT NULL UNIQUE,
  client_id CHAR(36) NOT NULL,
  consultant_id CHAR(36) NOT NULL,
  rating TINYINT NOT NULL,
  tags JSON NOT NULL,
  benefits JSON NULL,
  notes_for_consultant TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_fb_consultant (consultant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE calendar_feed_tokens (
  token_hash CHAR(64) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── intake (CONSULTANT data/AI · CLIENT UI) ─────────────
CREATE TABLE intakes (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  kind ENUM('first','followup') NOT NULL,
  status ENUM('draft','submitted') NOT NULL DEFAULT 'draft',
  answers_enc MEDIUMTEXT NOT NULL,             -- 🔒 sodium secretbox (key in private config), never plain text
  step TINYINT NOT NULL DEFAULT 0,
  consent_ai TINYINT(1) NOT NULL DEFAULT 1,
  appointment_id CHAR(36) NULL,
  submitted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_intake_client (client_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE intake_flags (
  id CHAR(36) PRIMARY KEY,
  intake_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  flag ENUM('safety','alcohol_free','pregnancy','allergy','medication','minor','doctor') NOT NULL,
  level VARCHAR(20) NULL,                      -- safety: sometimes | often
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_flags_client (client_id), KEY ix_flags_intake (intake_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE intake_mapping (
  id CHAR(36) PRIMARY KEY,
  statement VARCHAR(255) NOT NULL,             -- client wording (apps/client/src/lib/data.ts NUANCE)
  statement_key VARCHAR(255) NOT NULL UNIQUE,  -- normalised for matching
  flowers JSON NOT NULL,
  approved_by_consultant TINYINT(1) NOT NULL DEFAULT 0,   -- CONTENT-CHECKLIST #4b
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE case_summaries (
  id CHAR(36) PRIMARY KEY,
  intake_id CHAR(36) NOT NULL UNIQUE,
  client_id CHAR(36) NOT NULL,
  summary_enc MEDIUMTEXT NOT NULL,             -- 🔒 consultant only
  source ENUM('ai','rules') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── remedies & consultation (CONSULTANT) ─────────────
CREATE TABLE bach_remedies (
  id VARCHAR(40) PRIMARY KEY,                  -- slug, e.g. 'white-chestnut'
  name VARCHAR(80) NOT NULL UNIQUE,
  group_name VARCHAR(80) NULL,
  note VARCHAR(255) NULL,                      -- one-line description (draft until Jitu Bhaiya approves, D-10)
  hidden TINYINT(1) NOT NULL DEFAULT 0,
  sort SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE formulas (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  consultant_id CHAR(36) NOT NULL,
  appointment_id CHAR(36) NULL,
  version INT NOT NULL,
  status ENUM('draft','given','superseded') NOT NULL,
  name VARCHAR(120) NOT NULL DEFAULT 'Your blend',
  drops TINYINT NOT NULL DEFAULT 4,
  times_per_day TINYINT NOT NULL DEFAULT 4,
  days SMALLINT NOT NULL DEFAULT 25,
  bottle_ml SMALLINT NOT NULL DEFAULT 30,
  form ENUM('dropper','spray') NOT NULL DEFAULT 'dropper',
  alcohol_free TINYINT(1) NOT NULL DEFAULT 0,
  instructions VARCHAR(500) NULL,
  given_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_formula_client (client_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE formula_items (
  id CHAR(36) PRIMARY KEY,
  formula_id CHAR(36) NOT NULL,
  remedy_id VARCHAR(40) NOT NULL,
  rationale TEXT NULL,                         -- 🔒 consultant only (contracts §7.1)
  KEY ix_fi_formula (formula_id),
  CONSTRAINT fk_fi_formula FOREIGN KEY (formula_id) REFERENCES formulas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE remedy_orders (
  id CHAR(36) PRIMARY KEY,
  formula_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  sales_order_id CHAR(36) NULL,
  kind ENUM('included','reorder') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_ro_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE drops_log (
  client_id CHAR(36) NOT NULL,
  on_date DATE NOT NULL,
  taken TINYINT(1) NOT NULL,
  PRIMARY KEY (client_id, on_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE practitioner_notes (
  id CHAR(36) PRIMARY KEY,
  appointment_id CHAR(36) NULL,
  client_id CHAR(36) NOT NULL,
  author_id CHAR(36) NOT NULL,
  body_enc MEDIUMTEXT NOT NULL,                -- 🔒 author only
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_pn_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE client_summaries (
  id CHAR(36) PRIMARY KEY,
  appointment_id CHAR(36) NULL,
  client_id CHAR(36) NOT NULL,
  author_id CHAR(36) NOT NULL,
  body TEXT NOT NULL,
  shared_at DATETIME NULL,                     -- D-26: optional; only shared rows reach the client
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_cs_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE concern_catalog (
  `key` VARCHAR(40) PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  flowers JSON NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE session_concerns (
  appointment_id CHAR(36) NOT NULL,
  concern_key VARCHAR(40) NOT NULL,
  client_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (appointment_id, concern_key),
  KEY ix_sc_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── journal & goals (CLIENT) ─────────────
CREATE TABLE journal_entries (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  emotion VARCHAR(30) NOT NULL,
  note VARCHAR(1000) NULL,
  logged_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_journal_client (client_id, logged_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE client_goals (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  title VARCHAR(190) NOT NULL,
  kind ENUM('daily','once') NOT NULL DEFAULT 'daily',
  days JSON NOT NULL,                          -- ISO dates checked
  done_at DATETIME NULL,
  archived_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_goals_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── catalog (MANAGER) ─────────────
CREATE TABLE products (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  tagline VARCHAR(190) NOT NULL DEFAULT '',
  category VARCHAR(40) NOT NULL,
  format VARCHAR(40) NOT NULL,
  data JSON NOT NULL,                          -- about, feel[], ingredients, howTo, safety, intents[], art, color, tint, personal
  sold_out TINYINT(1) NOT NULL DEFAULT 0,
  sort SMALLINT NOT NULL DEFAULT 0,
  archived_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_variants (
  id VARCHAR(80) PRIMARY KEY,                  -- stable keys used by the apps, e.g. 'sleep-roll-on-15'
  product_id CHAR(36) NOT NULL,
  label VARCHAR(40) NOT NULL,
  price_paise BIGINT NOT NULL,
  mrp_paise BIGINT NULL,
  cost_paise BIGINT NULL,                      -- for profit (D-33); manager/owner only
  sku VARCHAR(60) NULL,
  stock_qty INT NULL,                          -- NULL = not tracked yet
  reorder_level INT NULL,
  archived_at DATETIME NULL,
  KEY ix_var_product (product_id),
  CONSTRAINT fk_var_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_movements (
  id CHAR(36) PRIMARY KEY,
  variant_id VARCHAR(80) NOT NULL,
  type ENUM('purchase_receipt','production_output','sale','adjustment','return','wastage') NOT NULL,
  qty INT NOT NULL,                            -- + in / − out
  ref_type VARCHAR(40) NULL, ref_id CHAR(36) NULL,
  note VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) NULL,
  KEY ix_sm_variant (variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── commerce (CLIENT) ─────────────
CREATE TABLE sales_orders (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,            -- BW-00001
  client_id CHAR(36) NOT NULL,
  kind ENUM('store','remedy','combined') NOT NULL,
  status ENUM('draft','pending_payment','paid','processing','partially_dispatched','dispatched','delivered','cancelled','return_requested','returned','refunded') NOT NULL,
  subtotal_paise BIGINT NOT NULL,
  discount_paise BIGINT NOT NULL DEFAULT 0,
  shipping_paise BIGINT NOT NULL DEFAULT 0,
  total_paise BIGINT NOT NULL,
  pickup TINYINT(1) NOT NULL DEFAULT 0,
  address JSON NULL,                           -- snapshot at order time
  coupon VARCHAR(40) NULL,
  notes VARCHAR(500) NULL,
  review JSON NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_so_client (client_id, created_at), KEY ix_so_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id CHAR(36) PRIMARY KEY,
  sales_order_id CHAR(36) NOT NULL,
  kind ENUM('product','remedy','service') NOT NULL,
  variant_id VARCHAR(80) NULL,
  remedy_order_id CHAR(36) NULL,
  name VARCHAR(190) NOT NULL,
  label VARCHAR(60) NOT NULL DEFAULT '',
  qty INT NOT NULL,
  unit_price_paise BIGINT NOT NULL,
  line_total_paise BIGINT NOT NULL,
  KEY ix_oi_order (sales_order_id),
  CONSTRAINT fk_oi_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE replacement_requests (
  id CHAR(36) PRIMARY KEY,
  sales_order_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  item_ids JSON NOT NULL,
  reason VARCHAR(500) NOT NULL,
  status ENUM('requested','approved','rejected','sent') NOT NULL DEFAULT 'requested',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_rr_order (sales_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── fulfilment (MANAGER) ─────────────
CREATE TABLE fulfilment_tasks (
  id CHAR(36) PRIMARY KEY,
  sales_order_id CHAR(36) NOT NULL,
  type ENUM('remedy_prep','pick_pack') NOT NULL,
  stage ENUM('new','preparing','quality_check','packing','ready_to_dispatch','dispatched','delivered','failed_delivery','rto','cancelled') NOT NULL DEFAULT 'new',
  remedy_order_id CHAR(36) NULL,
  assigned_to CHAR(36) NULL,
  courier VARCHAR(60) NULL, awb VARCHAR(60) NULL, tracking_url VARCHAR(255) NULL,
  dispatched_at DATETIME NULL, delivered_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_ft_stage (stage), KEY ix_ft_order (sales_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── finance (OWNER) ─────────────
CREATE TABLE invoices (
  id CHAR(36) PRIMARY KEY,
  number VARCHAR(30) NOT NULL UNIQUE,          -- INV/2026-27/0001 (FY Apr–Mar)
  client_id CHAR(36) NULL,
  party_name VARCHAR(190) NOT NULL,
  ref_type ENUM('appointment','sales_order','manual') NOT NULL,
  ref_id CHAR(36) NULL,
  status ENUM('draft','issued','partially_paid','paid','disputed','void','credited') NOT NULL,
  subtotal_paise BIGINT NOT NULL,
  tax_paise BIGINT NOT NULL DEFAULT 0,
  total_paise BIGINT NOT NULL,
  paid_paise BIGINT NOT NULL DEFAULT 0,
  issued_on DATE NOT NULL,
  due_on DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_inv_client (client_id), KEY ix_inv_ref (ref_type, ref_id), KEY ix_inv_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoice_lines (
  id CHAR(36) PRIMARY KEY,
  invoice_id CHAR(36) NOT NULL,
  description VARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  unit_price_paise BIGINT NOT NULL,
  tax_rate_bp INT NOT NULL DEFAULT 0,          -- basis points (1800 = 18%)
  line_total_paise BIGINT NOT NULL,
  KEY ix_il_inv (invoice_id),
  CONSTRAINT fk_il_inv FOREIGN KEY (invoice_id) REFERENCES invoices(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY,
  purpose ENUM('appointment','sales_order','invoice') NOT NULL,
  ref_id CHAR(36) NOT NULL,
  client_id CHAR(36) NULL,
  amount_paise BIGINT NOT NULL,
  status ENUM('created','authorized','captured','failed','refunded','partially_refunded') NOT NULL,
  method VARCHAR(30) NULL,                     -- upi · card · netbanking · wallet · cash · bank_transfer · cheque · razorpay_link
  provider ENUM('razorpay','manual') NOT NULL,
  razorpay_order_id VARCHAR(60) NULL UNIQUE,
  razorpay_payment_id VARCHAR(60) NULL UNIQUE,
  reference VARCHAR(120) NULL,
  received_on DATE NULL,
  recorded_by CHAR(36) NULL,
  captured_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_pay_ref (purpose, ref_id), KEY ix_pay_status (status, captured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE expenses (
  id CHAR(36) PRIMARY KEY,
  number VARCHAR(30) NOT NULL UNIQUE,          -- EXP/2026-27/0001
  category VARCHAR(60) NOT NULL,
  description VARCHAR(255) NOT NULL,
  vendor VARCHAR(120) NULL,
  amount_paise BIGINT NOT NULL,
  spent_on DATE NOT NULL,
  paid_from VARCHAR(40) NOT NULL DEFAULT 'bank',   -- bank · cash · upi
  status ENUM('draft','submitted','approved','rejected','paid') NOT NULL DEFAULT 'submitted',
  approver_comment VARCHAR(255) NULL,
  created_by CHAR(36) NULL,
  decided_by CHAR(36) NULL, decided_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_exp_status (status, spent_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE accounts (
  code VARCHAR(10) PRIMARY KEY,                -- draft chart of accounts — pending accountant (D-13)
  name VARCHAR(120) NOT NULL,
  type ENUM('asset','liability','equity','income','expense') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE journal_entries_fin (
  id CHAR(36) PRIMARY KEY,
  entry_date DATE NOT NULL,
  source_type VARCHAR(40) NOT NULL, source_id CHAR(36) NOT NULL,
  memo VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ux_je_source (source_type, source_id)    -- idempotent posting
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE journal_lines (
  id CHAR(36) PRIMARY KEY,
  entry_id CHAR(36) NOT NULL,
  account_code VARCHAR(10) NOT NULL,
  debit_paise BIGINT NOT NULL DEFAULT 0,
  credit_paise BIGINT NOT NULL DEFAULT 0,
  KEY ix_jl_entry (entry_id), KEY ix_jl_account (account_code),
  CONSTRAINT fk_jl_entry FOREIGN KEY (entry_id) REFERENCES journal_entries_fin(id),
  CONSTRAINT fk_jl_account FOREIGN KEY (account_code) REFERENCES accounts(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── notifications (OWNER) · events & audit (HUB) ─────────────
CREATE TABLE notifications_inbox (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(190) NOT NULL,
  body VARCHAR(1000) NOT NULL,
  href VARCHAR(255) NULL,
  priority ENUM('normal','high') NOT NULL DEFAULT 'normal',
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_inbox_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE domain_events (
  id CHAR(36) PRIMARY KEY,
  type VARCHAR(60) NOT NULL,
  payload JSON NOT NULL,
  actor_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_events_type (type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  actor_id CHAR(36) NULL,
  action VARCHAR(60) NOT NULL,                 -- e.g. login · view_sensitive · settings.set · remedy.given
  entity VARCHAR(60) NULL, entity_id VARCHAR(60) NULL,
  detail JSON NULL,
  ip VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_audit_created (created_at), KEY ix_audit_actor (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
