-- @owner HUB · optional username login (e.g. the Razorpay review test account "test"), 2026-11-19
ALTER TABLE users ADD COLUMN username VARCHAR(60) NULL UNIQUE AFTER email;
