-- Check current function definition and fix the ambiguous tab_id issue
-- This will help us understand the actual structure

-- First, let's see what functions exist
SELECT 
    proname as function_name,
    prosrc as function_definition
FROM pg_proc 
WHERE proname LIKE '%tab_balance%' 
   OR proname LIKE '%business_hours%'
   OR proname LIKE '%overdue%';

-- Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('tabs', 'tab_orders', 'tab_payments', 'bars')
ORDER BY table_name, ordinal_position;

-- Test the current get_tab_balance function with a specific tab ID
-- Replace 'your-tab-id-here' with an actual tab ID from your database
-- SELECT get_tab_balance('your-tab-id-here'::uuid) as balance;
