-- Diagnostic script to check current database state
-- This will help us understand what actually exists

-- Check all tables
SELECT 
    'Tables' as object_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check all functions
SELECT 
    'Functions' as object_type,
    routine_name as object_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check specific business-related tables and their columns
SELECT 
    'Table Columns' as object_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name IN ('bars', 'tabs', 'tab_orders', 'tab_payments')
ORDER BY table_name, ordinal_position;

-- Check if bars table has business_hours column
SELECT 
    'Bars Table Check' as object_type,
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'business_hours' THEN 'BUSINESS_HOURS_COLUMN_EXISTS'
        ELSE 'OTHER_COLUMN'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'bars'
  AND column_name = 'business_hours';

-- Check existing business hours functions specifically
SELECT 
    'Business Functions' as object_type,
    proname as function_name,
    proargtypes as argument_types,
    prosrc as function_source
FROM pg_proc 
WHERE proname LIKE '%business%' 
   OR proname LIKE '%overdue%'
   OR proname LIKE '%balance%'
ORDER BY proname;
