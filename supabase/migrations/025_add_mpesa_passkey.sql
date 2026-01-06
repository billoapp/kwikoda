-- 025_add_mpesa_passkey.sql
ALTER TABLE bars
  ADD COLUMN IF NOT EXISTS mpesa_passkey TEXT;

COMMENT ON COLUMN bars.mpesa_passkey IS 'M-Pesa Lipa na M-Pesa passkey for the business shortcode (per-bar). Keep secret.';
