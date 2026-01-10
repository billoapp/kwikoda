-- Backfill overdue status for existing tabs
-- This script will update tabs that should be overdue based on business hours and outstanding balance

-- First, let's see how many tabs might be affected
SELECT 
    COUNT(*) as total_tabs,
    COUNT(CASE WHEN status = 'open' AND get_tab_balance(id) > 0 THEN 1 END) as open_tabs_with_balance,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as already_overdue
FROM tabs;

-- Update tabs that should be overdue
-- Logic: Tab is overdue if:
-- 1. Status is 'open'
-- 2. Has outstanding balance > 0 (calculated from orders and payments)
-- 3. Current time is outside business hours for the bar
-- 4. Tab was created during business hours (or business hours logic applies)

UPDATE tabs 
SET 
    status = 'overdue',
    moved_to_overdue_at = NOW(),
    overdue_reason = 'Backfilled: Outstanding balance outside business hours'
WHERE status = 'open'
  AND get_tab_balance(id) > 0
  AND bar_id IN (
    SELECT id FROM bars 
    WHERE NOT is_within_business_hours(id, NOW())
  );

-- Show the results of the backfill
SELECT 
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
    COALESCE(SUM(get_tab_balance(t.id)), 0) as total_outstanding_balance
FROM bars b
LEFT JOIN tabs t ON b.id = t.bar_id
GROUP BY b.id, b.name
ORDER BY total_outstanding_balance DESC;

-- Show tabs that were just marked as overdue
SELECT 
    t.id,
    t.tab_number,
    t.status,
    get_tab_balance(t.id) as balance,
    t.opened_at,
    t.moved_to_overdue_at,
    t.overdue_reason,
    b.name as bar_name
FROM tabs t
JOIN bars b ON t.bar_id = b.id
WHERE t.status = 'overdue' 
  AND t.overdue_reason = 'Backfilled: Outstanding balance outside business hours'
ORDER BY t.moved_to_overdue_at DESC;

-- Optional: Create a log of the backfill operation
CREATE TABLE IF NOT EXISTS overdue_backfill_log (
    id SERIAL PRIMARY KEY,
    backfill_date TIMESTAMP DEFAULT NOW(),
    tabs_updated INTEGER,
    notes TEXT
);

INSERT INTO overdue_backfill_log (tabs_updated, notes)
VALUES (
    (SELECT COUNT(*) FROM tabs WHERE overdue_reason = 'Backfilled: Outstanding balance outside business hours'),
    'Backfilled overdue status for tabs with outstanding balance outside business hours'
);

-- Show backfill history
SELECT * FROM overdue_backfill_log ORDER BY backfill_date DESC;
