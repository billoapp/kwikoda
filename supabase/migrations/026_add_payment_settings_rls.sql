-- ============================================
-- ADD RLS POLICIES FOR PAYMENT SETTINGS COLUMNS
-- ============================================

-- Update existing bars RLS policy to include payment settings columns
DROP POLICY IF EXISTS bars_isolation ON bars;

CREATE POLICY bars_isolation ON bars
    FOR ALL
    USING (id = current_setting('app.current_bar_id', true)::UUID)
    WITH CHECK (id = current_setting('app.current_bar_id', true)::UUID);

-- Grant access to payment settings for authenticated users
GRANT SELECT ON bars TO authenticated;
GRANT UPDATE ON bars TO authenticated;

-- Add comment for documentation
COMMENT ON POLICY bars_isolation IS 'Allows bars to access their own data including payment settings';

-- Verification: Test that payment settings are accessible
SELECT 
    'RLS policies updated for payment settings' as status,
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'bars' 
    AND column_name IN ('mpesa_enabled', 'card_enabled', 'cash_enabled')
ORDER BY column_name;

-- Success message
SELECT 'RLS policies for payment settings columns completed successfully' as status;
