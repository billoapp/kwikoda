-- Add notification and payment settings to bars table
-- These settings will control staff app behavior

ALTER TABLE bars 
ADD COLUMN IF NOT EXISTS notification_new_orders BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_pending_approvals BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_payments BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_cash_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS payment_mpesa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_card_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mpesa_till_number TEXT,
ADD COLUMN IF NOT EXISTS mpesa_paybill_number TEXT,
ADD COLUMN IF NOT EXISTS card_provider TEXT; -- 'stripe', 'flutterwave', etc.

-- Add comments for documentation
COMMENT ON COLUMN bars.notification_new_orders IS 'Enable notifications for new orders';
COMMENT ON COLUMN bars.notification_pending_approvals IS 'Enable notifications for orders pending approval';
COMMENT ON COLUMN bars.notification_payments IS 'Enable notifications for received payments';
COMMENT ON COLUMN bars.payment_cash_enabled IS 'Enable cash payments (default: true)';
COMMENT ON COLUMN bars.payment_mpesa_enabled IS 'Enable M-Pesa payments';
COMMENT ON COLUMN bars.payment_card_enabled IS 'Enable card payments';
COMMENT ON COLUMN bars.mpesa_till_number IS 'M-Pesa till number for payments';
COMMENT ON COLUMN bars.mpesa_paybill_number IS 'M-Pesa paybill number for payments';
COMMENT ON COLUMN bars.card_provider IS 'Card payment provider (stripe, flutterwave, etc.)';
