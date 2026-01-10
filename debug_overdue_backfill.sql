-- Debug script to see why no tabs are being marked overdue
-- This will help us understand what's happening step by step

-- Check if we have any open tabs with balances
SELECT 
    'Open Tabs with Balance Check' as analysis_type,
    t.id,
    t.tab_number,
    t.status,
    get_tab_balance(t.id) as balance,
    t.bar_id,
    b.name as bar_name,
    b.business_hours
FROM tabs t
JOIN bars b ON t.bar_id = b.id
WHERE t.status = 'open'
  AND get_tab_balance(t.id) > 0
ORDER BY t.id;

-- Test the should_tab_be_overdue function on specific tabs
-- Replace 'your-tab-id-here' with actual tab IDs from the query above
SELECT 
    'Should Be Overdue Test' as analysis_type,
    t.id as tab_id,
    get_tab_balance(t.id) as balance,
    should_tab_be_overdue(t.id) as should_be_overdue,
    is_within_business_hours_for_overdue(t.bar_id, NOW()) as is_within_hours,
    t.bar_id,
    b.name as bar_name,
    b.business_hours
FROM tabs t
JOIN bars b ON t.bar_id = b.id
WHERE t.status = 'open'
  AND get_tab_balance(t.id) > 0
LIMIT 5;

-- Check current time and business hours
SELECT 
    'Business Hours Check' as analysis_type,
    NOW() as current_time,
    b.name as bar_name,
    b.business_hours,
    is_within_business_hours_for_overdue(b.id, NOW()) as is_open_now
FROM bars b
LIMIT 5;

-- Manual check: what should be overdue based on simple logic
SELECT 
    'Manual Overdue Check' as analysis_type,
    t.id,
    t.tab_number,
    get_tab_balance(t.id) as balance,
    t.bar_id,
    b.name as bar_name,
    CASE 
        WHEN get_tab_balance(t.id) > 0 
             AND NOT is_within_business_hours_for_overdue(t.bar_id, NOW())
        THEN 'SHOULD_BE_OVERDUE'
        ELSE 'SHOULD_NOT_BE_OVERDUE'
    END as manual_overdue_check
FROM tabs t
JOIN bars b ON t.bar_id = b.id
WHERE t.status = 'open'
ORDER BY get_tab_balance(t.id) DESC
LIMIT 10;

-- Check if update_overdue_tabs function is working correctly
SELECT 
    'Update Function Test' as analysis_type,
    update_overdue_tabs() as result;
