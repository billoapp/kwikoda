-- Robust backfill script for overdue status
-- This version handles potential function issues and provides better error handling

-- First, let's check if our functions exist and work
DO $$
BEGIN
    -- Test if get_tab_balance function works
    BEGIN
        PERFORM get_tab_balance('00000000-0000-0000-0000-000000000000'::uuid);
        RAISE NOTICE 'get_tab_balance function exists and works';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'get_tab_balance function needs to be fixed: %', SQLERRM;
    END;
END $$;

-- Show current tab status breakdown
SELECT 
    'Current Status' as analysis_type,
    COUNT(*) as total_tabs,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tabs,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_tabs,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tabs
FROM tabs;

-- Alternative approach: Calculate balance manually if function doesn't work
WITH tab_balances AS (
    SELECT 
        t.id as tab_id,
        t.status,
        t.bar_id,
        COALESCE(order_totals.total, 0) as total_orders,
        COALESCE(payment_totals.total, 0) as total_payments,
        COALESCE(order_totals.total, 0) - COALESCE(payment_totals.total, 0) as calculated_balance
    FROM tabs t
    LEFT JOIN (
        SELECT tab_id, SUM(total) as total
        FROM tab_orders 
        WHERE status = 'confirmed'
        GROUP BY tab_id
    ) order_totals ON t.id = order_totals.tab_id
    LEFT JOIN (
        SELECT tab_id, SUM(amount) as total
        FROM tab_payments 
        WHERE status = 'completed'
        GROUP BY tab_id
    ) payment_totals ON t.id = payment_totals.tab_id
),
overdue_candidates AS (
    SELECT 
        tb.tab_id,
        tb.calculated_balance,
        tb.status,
        tb.bar_id,
        -- Check if current time is outside business hours
        CASE 
            WHEN tb.calculated_balance > 0 
                 AND tb.status = 'open'
                 AND NOT is_within_business_hours(tb.bar_id, NOW())
            THEN TRUE
            ELSE FALSE
        END as should_be_overdue
    FROM tab_balances tb
)
-- Show which tabs should be marked overdue
SELECT 
    'Overdue Candidates' as analysis_type,
    COUNT(*) as total_candidates,
    COUNT(CASE WHEN should_be_overdue THEN 1 END) as should_be_overdue,
    COUNT(CASE WHEN calculated_balance > 0 THEN 1 END) as with_balance,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as currently_open
FROM overdue_candidates;

-- Update tabs that should be overdue (using manual calculation)
UPDATE tabs 
SET 
    status = 'overdue',
    moved_to_overdue_at = NOW(),
    overdue_reason = 'Backfilled: Outstanding balance outside business hours'
WHERE id IN (
    SELECT tab_id 
    FROM overdue_candidates 
    WHERE should_be_overdue = TRUE
);

-- Show results
SELECT 
    'Backfill Results' as analysis_type,
    COUNT(*) as tabs_updated_to_overdue
FROM tabs 
WHERE status = 'overdue' 
  AND overdue_reason = 'Backfilled: Outstanding balance outside business hours';

-- Show detailed breakdown by bar
SELECT 
    b.name as bar_name,
    COUNT(t.id) as total_tabs,
    COUNT(CASE WHEN t.status = 'open' THEN 1 END) as open_tabs,
    COUNT(CASE WHEN t.status = 'overdue' THEN 1 END) as overdue_tabs,
    COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as closed_tabs,
    COALESCE(SUM(
        COALESCE(order_totals.total, 0) - COALESCE(payment_totals.total, 0)
    ), 0) as total_outstanding_balance
FROM bars b
LEFT JOIN tabs t ON b.id = t.bar_id
LEFT JOIN (
    SELECT tab_id, SUM(total) as total
    FROM tab_orders 
    WHERE status = 'confirmed'
    GROUP BY tab_id
) order_totals ON t.id = order_totals.tab_id
LEFT JOIN (
    SELECT tab_id, SUM(amount) as total
    FROM tab_payments 
    WHERE status = 'completed'
    GROUP BY tab_id
) payment_totals ON t.id = payment_totals.tab_id
GROUP BY b.id, b.name
ORDER BY total_outstanding_balance DESC;

-- Show tabs that were just marked as overdue
SELECT 
    'Newly Overdue Tabs' as analysis_type,
    t.id,
    t.tab_number,
    t.status,
    t.opened_at,
    t.moved_to_overdue_at,
    t.overdue_reason,
    b.name as bar_name,
    COALESCE(
        COALESCE(order_totals.total, 0) - COALESCE(payment_totals.total, 0), 
        0
    ) as balance
FROM tabs t
JOIN bars b ON t.bar_id = b.id
LEFT JOIN (
    SELECT tab_id, SUM(total) as total
    FROM tab_orders 
    WHERE status = 'confirmed'
    GROUP BY tab_id
) order_totals ON t.id = order_totals.tab_id
LEFT JOIN (
    SELECT tab_id, SUM(amount) as total
    FROM tab_payments 
    WHERE status = 'completed'
    GROUP BY tab_id
) payment_totals ON t.id = payment_totals.tab_id
WHERE t.status = 'overdue' 
  AND t.overdue_reason = 'Backfilled: Outstanding balance outside business hours'
ORDER BY t.moved_to_overdue_at DESC;
