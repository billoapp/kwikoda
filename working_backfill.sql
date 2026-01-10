-- Final backfill script using existing functions
-- This uses the functions that already exist in your database

-- First, let's see how many tabs might be affected
SELECT 
    'Current Status' as analysis_type,
    COUNT(*) as total_tabs,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tabs,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as already_overdue,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tabs
FROM tabs;

-- Show tabs with outstanding balances
SELECT 
    'Tabs with Balance' as analysis_type,
    COUNT(*) as tabs_with_balance,
    COUNT(CASE WHEN get_tab_balance(id) > 0 THEN 1 END) as tabs_with_positive_balance
FROM tabs 
WHERE status = 'open';

-- Show which tabs should be overdue (dry run)
SELECT 
    'Overdue Candidates' as analysis_type,
    t.id,
    t.tab_number,
    t.status,
    get_tab_balance(t.id) as balance,
    t.bar_id,
    b.name as bar_name,
    should_tab_be_overdue(t.id) as should_be_overdue
FROM tabs t
JOIN bars b ON t.bar_id = b.id
WHERE t.status = 'open'
  AND get_tab_balance(t.id) > 0
ORDER BY should_be_overdue DESC, balance DESC;

-- Use the existing update_overdue_tabs function to mark overdue tabs
-- This function already exists and handles the logic properly
SELECT 
    'Running Update Function' as analysis_type,
    update_overdue_tabs() as tabs_marked_overdue;

-- Show final results
SELECT 
    'Final Status' as analysis_type,
    COUNT(*) as total_tabs,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tabs,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_tabs,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tabs
FROM tabs;

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

-- Show tabs that are now overdue
SELECT 
    'Newly Overdue Tabs' as analysis_type,
    t.id,
    t.tab_number,
    t.status,
    get_tab_balance(t.id) as balance,
    t.opened_at,
    t.updated_at as marked_overdue_at,
    b.name as bar_name
FROM tabs t
JOIN bars b ON t.bar_id = b.id
WHERE t.status = 'overdue'
ORDER BY t.updated_at DESC
LIMIT 20;

-- Create a log of the backfill operation
CREATE TABLE IF NOT EXISTS overdue_backfill_log (
    id SERIAL PRIMARY KEY,
    backfill_date TIMESTAMP DEFAULT NOW(),
    tabs_updated INTEGER,
    notes TEXT
);

INSERT INTO overdue_backfill_log (tabs_updated, notes)
VALUES (
    (SELECT COUNT(*) FROM tabs WHERE status = 'overdue' AND updated_at = NOW()::DATE),
    'Backfilled overdue status using update_overdue_tabs function'
);

-- Show backfill history
SELECT 
    'Backfill History' as analysis_type,
    backfill_date,
    tabs_updated,
    notes
FROM overdue_backfill_log 
ORDER BY backfill_date DESC;
