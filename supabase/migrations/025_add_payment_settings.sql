-- ============================================
-- ADD PAYMENT SETTINGS TO BARS TABLE
-- ============================================

-- Add payment method columns to bars table
ALTER TABLE bars 
ADD COLUMN IF NOT EXISTS mpesa_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS card_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cash_enabled BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN bars.mpesa_enabled IS 'Controls whether M-Pesa payment method is available for this bar';
COMMENT ON COLUMN bars.card_enabled IS 'Controls whether credit/debit card payment method is available for this bar';
COMMENT ON COLUMN bars.cash_enabled IS 'Controls whether cash payment method is available for this bar';

-- Create a function to get available payment methods for a bar
CREATE OR REPLACE FUNCTION get_available_payment_methods(p_bar_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_bar_record RECORD;
BEGIN
    -- Get bar payment settings
    SELECT mpesa_enabled, card_enabled, cash_enabled 
    INTO v_bar_record
    FROM bars 
    WHERE id = p_bar_id;
    
    -- Build JSON object of available methods
    SELECT jsonb_build_object(
        'mpesa', COALESCE(v_bar_record.mpesa_enabled, true),
        'card', COALESCE(v_bar_record.card_enabled, true),
        'cash', COALESCE(v_bar_record.cash_enabled, true)
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_available_payment_methods TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_payment_methods TO service_role;

-- Create a function to validate payment method against bar settings
CREATE OR REPLACE FUNCTION validate_payment_method(p_bar_id UUID, p_method TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_available_methods JSONB;
BEGIN
    -- Get available payment methods
    v_available_methods := get_available_payment_methods(p_bar_id);
    
    -- Check if the method is available
    CASE p_method
        WHEN 'mpesa' THEN RETURN (v_available_methods ->> 'mpesa')::BOOLEAN;
        WHEN 'card' THEN RETURN (v_available_methods ->> 'card')::BOOLEAN;
        WHEN 'cash' THEN RETURN (v_available_methods ->> 'cash')::BOOLEAN;
        ELSE RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION validate_payment_method TO authenticated;
GRANT EXECUTE ON FUNCTION validate_payment_method TO service_role;

-- Add check constraint to ensure at least one payment method is enabled
ALTER TABLE bars 
ADD CONSTRAINT bars_at_least_one_payment_enabled 
CHECK (mpesa_enabled = true OR card_enabled = true OR cash_enabled = true);

-- Verification: Check current payment settings for all bars
SELECT 
    id,
    name,
    mpesa_enabled,
    card_enabled,
    cash_enabled,
    CASE 
        WHEN mpesa_enabled = true OR card_enabled = true OR cash_enabled = true THEN 'VALID'
        ELSE 'INVALID - No payment methods enabled'
    END as validation_status
FROM bars 
ORDER BY created_at;

-- Success message
SELECT 'Payment settings migration completed successfully' as status;
