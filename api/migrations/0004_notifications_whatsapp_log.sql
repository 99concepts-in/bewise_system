-- @owner OWNER (base by HUB, 2026-11-19) · WhatsApp (Mart2Meta) delivery log — one row per send; dedupe_key makes reminders send once.
CREATE TABLE whatsapp_log (
  id CHAR(36) PRIMARY KEY,
  to_phone VARCHAR(20) NOT NULL,
  template_key VARCHAR(40) NOT NULL,
  template_name VARCHAR(80) NOT NULL,
  status ENUM('sent','failed') NOT NULL,
  http_code SMALLINT NOT NULL DEFAULT 0,
  response JSON NULL,
  vars JSON NULL,
  dedupe_key VARCHAR(120) NULL UNIQUE,
  ref VARCHAR(60) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_wa_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
